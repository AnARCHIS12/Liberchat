const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const sudo = require('sudo-prompt');
const net = require('net');
const fs = require('fs');

function createWindow () {
  const win = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Liberchat – Outils décentralisés'
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function execSudo(cmd) {
  return new Promise((resolve, reject) => {
    sudo.exec(cmd, { name: 'Liberchat GUI' }, (error, stdout, stderr) => {
      if (error) reject(stderr || error);
      else resolve(stdout || stderr || '');
    });
  });
}

// Handler pour installation complète
ipcMain.handle('install-app', async (event, opts) => {
  const { server, domain, port, tor, onionprefix } = opts;
  let steps = [];
  // Installation serveur web
  if (server === 'nginx') {
    steps.push('apt update && apt install -y nginx certbot python3-certbot-nginx');
    steps.push(`echo "server {\n    listen 80;\n    server_name ${domain};\n    location / {\n        proxy_pass http://localhost:${port};\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }\n}" | tee /etc/nginx/sites-available/${domain}`);
    steps.push(`ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/`);
    steps.push('nginx -t && systemctl reload nginx');
    steps.push(`certbot --nginx -d ${domain} --non-interactive --agree-tos -m admin@${domain} || true`);
  } else {
    steps.push('apt update && apt install -y apache2 certbot python3-certbot-apache');
    steps.push(`echo "<VirtualHost *:80>\n    ServerName ${domain}\n    ProxyPreserveHost On\n    ProxyPass / http://localhost:${port}/\n    ProxyPassReverse / http://localhost:${port}/\n</VirtualHost>" | tee /etc/apache2/sites-available/${domain}.conf`);
    steps.push(`a2ensite ${domain}.conf`);
    steps.push('a2enmod proxy proxy_http ssl');
    steps.push('systemctl reload apache2');
    steps.push(`certbot --apache -d ${domain} --non-interactive --agree-tos -m admin@${domain} || true`);
  }
  // Option Tor
  if (tor === 'oui') {
    steps.push('apt install -y tor');
    if (onionprefix && onionprefix.length > 0) {
      // Génération d'un .onion personnalisé avec mkp224o
      steps.push('apt install -y git build-essential');
      steps.push('if [ ! -d /tmp/mkp224o ]; then git clone https://github.com/cathugger/mkp224o.git /tmp/mkp224o && cd /tmp/mkp224o && make; fi');
      steps.push('mkdir -p /var/lib/tor/vanity_keys');
      steps.push(`/tmp/mkp224o/mkp224o -d /var/lib/tor/vanity_keys "${onionprefix}" | tee /tmp/vanity.log`);
      steps.push('VANITY_PRIV=$(find /var/lib/tor/vanity_keys -name "hs_ed25519_secret_key" | head -n1) && '
        + 'mkdir -p /var/lib/tor/hidden_service/ && '
        + 'cp "$VANITY_PRIV" /var/lib/tor/hidden_service/hs_ed25519_secret_key && '
        + 'PUB=$(dirname "$VANITY_PRIV")/hs_ed25519_public_key && '
        + 'cp "$PUB" /var/lib/tor/hidden_service/hs_ed25519_public_key && '
        + 'chown -R debian-tor:debian-tor /var/lib/tor/hidden_service/ && '
        + 'chmod 700 /var/lib/tor/hidden_service/');
    }
    steps.push(`echo -e "HiddenServiceDir /var/lib/tor/hidden_service/\nHiddenServicePort 80 127.0.0.1:${port}" | tee -a /etc/tor/torrc`);
    steps.push('systemctl restart tor');
    steps.push('ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "Non généré") && echo "Adresse .onion : $ONION_ADDR"');
  }
  // Exécution séquentielle avec sudo-prompt
  let onionResult = '';
  for (const cmd of steps) {
    try {
      const out = await execSudo(cmd);
      if (cmd.includes('Adresse .onion')) onionResult = out;
    } catch (e) {
      return `Erreur lors de l'étape : ${cmd}\n${e}`;
    }
  }
  return 'Installation et configuration terminées !' + (onionResult ? ('\n' + onionResult) : '');
});

// Handler pour gestion avancée (statut, logs, restart)
ipcMain.handle('manage-app', async () => {
  let result = '';
  await new Promise((resolve) => {
    execSudo('systemctl is-active nginx').then((out) => {
      result += 'Nginx : ' + (out.trim() === 'active' ? 'actif' : 'inactif') + '\n';
      execSudo('systemctl is-active apache2').then((out2) => {
        result += 'Apache : ' + (out2.trim() === 'active' ? 'actif' : 'inactif') + '\n';
        execSudo('systemctl is-active tor').then((out3) => {
          result += 'Tor : ' + (out3.trim() === 'active' ? 'actif' : 'inactif') + '\n';
          execSudo('tail -n 10 /var/log/nginx/error.log').then((out4) => {
            if (out4) result += '\nLogs Nginx :\n' + out4;
            execSudo('tail -n 10 /var/log/apache2/error.log').then((out5) => {
              if (out5) result += '\nLogs Apache :\n' + out5;
              execSudo('tail -n 10 /var/log/tor/log').then((out6) => {
                if (out6) result += '\nLogs Tor :\n' + out6;
                resolve();
              });
            });
          });
        });
      });
    });
  });
  return result;
});

// Handler pour désinstallation complète
ipcMain.handle('uninstall-app', async () => {
  let steps = [
    'rm -f /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*',
    'rm -f /etc/apache2/sites-available/*.conf',
    'a2dissite * || true',
    'systemctl reload nginx || true',
    'systemctl reload apache2 || true',
    'rm -rf /var/lib/tor/hidden_service',
    'sed -i "/HiddenServiceDir/d;/HiddenServicePort/d" /etc/tor/torrc',
    'systemctl restart tor || true',
    'apt remove --purge -y nginx apache2 tor certbot python3-certbot-nginx python3-certbot-apache || true'
  ];
  for (const cmd of steps) {
    try {
      await execSudo(cmd);
    } catch (e) {
      return `Erreur lors de l'étape : ${cmd}\n${e}`;
    }
  }
  return 'Désinstallation complète terminée.';
});

// Handler pour détection automatique du backend Liberchat
ipcMain.handle('detect-backend', async () => {
  // Ports courants à tester
  const ports = [3000, 8080, 5000, 4000, 8000];
  for (const port of ports) {
    const isOpen = await new Promise((resolve) => {
      const socket = net.createConnection(port, '127.0.0.1');
      socket.on('connect', () => { socket.destroy(); resolve(true); });
      socket.on('error', () => resolve(false));
    });
    if (isOpen) return `Backend détecté sur le port ${port}`;
  }
  // Si aucun backend détecté, tenter de lancer app.js si présent
  const appPath = path.join(process.cwd(), '../app.js');
  if (fs.existsSync(appPath)) {
    exec(`node "${appPath}" &`, (err) => {});
    return 'Backend Liberchat lancé sur le port 3000 (par défaut).';
  }
  return 'Aucun backend détecté ni app.js trouvé.';
});

// Gestion globale des promesses non gérées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejection non gérée:', reason);
  // Optionnel : envoyer l’erreur à la fenêtre principale
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('error-message', reason?.toString?.() || 'Erreur inconnue');
  }
});
