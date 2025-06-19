#!/bin/bash
# Script d'auto-hébergement semi-automatisé : un seul choix, tout le reste automatique
# Usage : sudo ./auto_hebergement.sh

set -e

# Vérification des droits root
if [ "$EUID" -ne 0 ]; then
  echo "Veuillez exécuter ce script en tant que root (sudo)."
  exit 1
fi

default_port=3000
admin_mail="admin@localhost"

# Détection automatique du port de l'application (par défaut 3000)
if lsof -i:$default_port &>/dev/null; then
  app_port=$default_port
else
  app_port=$default_port
fi
read -p "Port de l'application à proxyfier [défaut: $app_port] : " user_port
app_port=${user_port:-$app_port}

# Installation et build de l’application Node.js
if [ -f package.json ]; then
  echo "[Auto] Installation des dépendances Node.js..."
  npm install || { echo "Échec de npm install"; exit 1; }
  if grep -q '"build"' package.json; then
    echo "[Auto] Build de l’application..."
    npm run build || { echo "Échec de npm run build"; exit 1; }
  fi
else
  echo "Aucun package.json trouvé, installation Node.js ignorée."
fi

# Fonctions d'installation
install_nginx() {
  apt update && apt install -y nginx
}

install_apache() {
  apt update && apt install -y apache2
}

install_certbot_nginx() {
  apt install -y certbot python3-certbot-nginx
}

install_certbot_apache() {
  apt install -y certbot python3-certbot-apache
}

install_tor() {
  apt install -y tor
}

# Configuration HTTPS Nginx
auto_https_nginx() {
  DOMAIN=$1
  echo "[Auto] Configuration Nginx pour $DOMAIN..."
  cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://localhost:$app_port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo "[Auto] Obtention du certificat SSL..."
  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $admin_mail || true
}

# Configuration HTTPS Apache
auto_https_apache() {
  DOMAIN=$1
  echo "[Auto] Configuration Apache pour $DOMAIN..."
  cat > /etc/apache2/sites-available/$DOMAIN.conf <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ProxyPreserveHost On
    ProxyPass / http://localhost:$app_port/
    ProxyPassReverse / http://localhost:$app_port/
</VirtualHost>
EOF
  a2ensite $DOMAIN.conf
  a2enmod proxy proxy_http ssl
  systemctl reload apache2
  echo "[Auto] Obtention du certificat SSL..."
  certbot --apache -d $DOMAIN --non-interactive --agree-tos -m $admin_mail || true
}

# Configuration Tor
auto_tor() {
  install_tor
  grep -q HiddenServiceDir /etc/tor/torrc || cat >> /etc/tor/torrc <<EOF
HiddenServiceDir /var/lib/tor/hidden_service/
HiddenServicePort 80 127.0.0.1:$app_port
EOF
  systemctl restart tor
  sleep 3
  ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "Non généré")
  echo "[Auto] Votre service onion est disponible à : $ONION_ADDR"
}

# Configuration Tor avec préfixe personnalisé
custom_tor() {
  read -p "Préfixe souhaité pour l'adresse .onion (ex: Liberchat) : " ONION_PREFIX
  if [ -z "$ONION_PREFIX" ]; then
    echo "Préfixe vide, génération standard."
    auto_tor
    return
  fi
  echo "Installation de mkp224o (générateur d'adresse .onion personnalisée)..."
  if ! command -v mkp224o &>/dev/null; then
    apt update && apt install -y git build-essential
    git clone https://github.com/cathugger/mkp224o.git /tmp/mkp224o
    cd /tmp/mkp224o && make
    export PATH=$PATH:/tmp/mkp224o
  fi
  mkdir -p /var/lib/tor/vanity_keys
  echo "Génération de la clé, cela peut prendre plusieurs minutes/heures selon le préfixe..."
  /tmp/mkp224o/mkp224o -d /var/lib/tor/vanity_keys "$ONION_PREFIX" | tee /tmp/vanity.log
  VANITY_PRIV=$(find /var/lib/tor/vanity_keys -name "hs_ed25519_secret_key" | head -n1)
  if [ -z "$VANITY_PRIV" ]; then
    echo "Erreur lors de la génération de la clé."
    exit 1
  fi
  # Suppression de l'ancien service pour éviter les conflits
  systemctl stop tor
  rm -rf /var/lib/tor/hidden_service/
  mkdir -p /var/lib/tor/hidden_service/
  cp "$VANITY_PRIV" /var/lib/tor/hidden_service/hs_ed25519_secret_key
  PUB=$(dirname "$VANITY_PRIV")/hs_ed25519_public_key
  cp "$PUB" /var/lib/tor/hidden_service/hs_ed25519_public_key
  chown -R debian-tor:debian-tor /var/lib/tor/hidden_service/
  chmod 700 /var/lib/tor/hidden_service/
  grep -q HiddenServiceDir /etc/tor/torrc || cat >> /etc/tor/torrc <<EOF
HiddenServiceDir /var/lib/tor/hidden_service/
HiddenServicePort 80 127.0.0.1:$app_port
EOF
  systemctl restart tor
  # Attente active de la génération du fichier hostname (max 30s)
  for i in {1..30}; do
    if [ -f /var/lib/tor/hidden_service/hostname ]; then
      break
    fi
    sleep 1
  done
  if [ ! -f /var/lib/tor/hidden_service/hostname ]; then
    echo "Erreur : le fichier hostname .onion n'a pas été généré après 30s. Vérifiez les logs de Tor."
    exit 1
  fi
  ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "Non généré")
  echo "Votre service onion personnalisé est disponible à : $ONION_ADDR"
}

# Fonction pour ajouter un domaine à la variable ALLOWED_DOMAINS dans .env
add_domain_to_env() {
  local domain="$1"
  local env_file=".env"
  if [ ! -f "$env_file" ]; then
    echo "ALLOWED_DOMAINS=$domain" > "$env_file"
    echo "[Auto] Fichier .env créé avec $domain."
  else
    if grep -q '^ALLOWED_DOMAINS=' "$env_file"; then
      # Ajoute le domaine s'il n'est pas déjà présent
      if ! grep -q "$domain" "$env_file"; then
        sed -i "s|^ALLOWED_DOMAINS=|ALLOWED_DOMAINS=$domain,|" "$env_file"
        echo "[Auto] Domaine $domain ajouté à ALLOWED_DOMAINS."
      fi
    else
      echo "ALLOWED_DOMAINS=$domain" >> "$env_file"
      echo "[Auto] Variable ALLOWED_DOMAINS ajoutée à .env."
    fi
  fi
}

# Couleurs et style
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
  echo -e "${RED}${BOLD}✊ LIBERCHAT — La Commune Numérique ✊${NC}"
  echo -e "${CYAN}Pour l'autogestion, la solidarité et la liberté numérique !${NC}"
  echo -e "${YELLOW}Aucun chef, pas de patron, juste du code libre et du chaos organisé.${NC}\n"
}

banner

# Menu principal
clear
echo -e "${RED}${BOLD}Menu d'auto-hébergement anarchiste :${NC}"
echo -e "${GREEN}1) Héberger sur un domaine personnalisé (HTTPS)${NC}"
echo -e "${GREEN}2) Héberger sur un sous-domaine (HTTPS)${NC}"
echo -e "${YELLOW}3) Héberger en service onion (Tor)${NC}"
echo -e "${YELLOW}4) Héberger en service onion (Tor) avec préfixe personnalisé${NC}"
echo -e "${CYAN}5) Héberger en local (192.168.x.x ou 127.0.0.1)${NC}"
echo -e "${RED}6) Quitter${NC}"
read -p "${BOLD}Choisissez une option [1-6] : ${NC}" CHOICE

if [[ "$CHOICE" == "1" || "$CHOICE" == "2" ]]; then
  read -p "Entrez votre (sous-)domaine (ex: monsite.fr ou sub.monsite.fr) : " DOMAIN
  add_domain_to_env "$DOMAIN"
  echo "Choix du serveur web :"
  echo "1) Nginx (recommandé)"
  echo "2) Apache"
  read -p "Votre choix [1-2, défaut: 1] : " WEBCHOICE
  WEBCHOICE=${WEBCHOICE:-1}
  if [ "$WEBCHOICE" == "1" ]; then
    install_nginx
    install_certbot_nginx
    auto_https_nginx "$DOMAIN"
  elif [ "$WEBCHOICE" == "2" ]; then
    install_apache
    install_certbot_apache
    auto_https_apache "$DOMAIN"
  else
    echo "Option serveur web invalide."
    exit 1
  fi
elif [ "$CHOICE" == "3" ]; then
  auto_tor
  ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "")
  if [ -n "$ONION_ADDR" ]; then
    add_domain_to_env "$ONION_ADDR"
    echo -e "\n\033[1;32mVotre adresse Liberchat .onion (union) :\033[0m $ONION_ADDR"
    echo -e "\033[1;33mOuvrez cette adresse dans Tor Browser pour accéder à votre chat en union !\033[0m\n"
  fi
elif [ "$CHOICE" == "4" ]; then
  custom_tor
  ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "")
  if [ -n "$ONION_ADDR" ]; then
    add_domain_to_env "$ONION_ADDR"
    echo -e "\n\033[1;32mVotre adresse Liberchat .onion personnalisée (union) :\033[0m $ONION_ADDR"
    echo -e "\033[1;33mOuvrez cette adresse dans Tor Browser pour accéder à votre chat en union !\033[0m\n"
  fi
elif [ "$CHOICE" == "5" ]; then
  echo "Configuration pour un accès local (LAN ou localhost) en cours..."
  LOCAL_IP=$(hostname -I | awk '{print $1}')
  echo -e "\n\033[1;32mVotre adresse locale :\033[0m http://$LOCAL_IP:$app_port"
  echo -e "\033[1;33mOuvrez cette adresse sur vos appareils du réseau local.\033[0m\n"
  add_domain_to_env "$LOCAL_IP"
  add_domain_to_env "127.0.0.1"
  add_domain_to_env "localhost"
elif [ "$CHOICE" == "6" ]; then
  echo "Abandon."
  exit 0
else
  echo "Option invalide."
  exit 1
fi

echo -e "${GREEN}Configuration terminée ! Vive la Commune numérique !${NC}"
echo "Voulez-vous lancer automatiquement l'application en mode production ? (npm run build + npm start) [O/n] : "
read AUTOLAUNCH
if [[ "$AUTOLAUNCH" =~ ^[oO]$ || -z "$AUTOLAUNCH" ]]; then
  echo "Build du frontend (npm run build)..."
  npm run build || { echo "Échec du build frontend."; exit 1; }
  echo "Lancement du backend (npm start)..."
  nohup npm start > prod.log 2>&1 &
  echo $! > app.pid
  echo "Application Liberchat (production) démarrée en arrière-plan (PID $(cat app.pid))."
  echo "Consultez prod.log pour les logs."
fi
