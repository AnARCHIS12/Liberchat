import express from 'express';
import { createServer } from 'http'; // Remplacer par https avec certificat pour prod
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import xss from 'xss';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Winston/logging désactivé pour confidentialité totale
const logger = { info: () => {}, error: () => {}, warn: () => {}, debug: () => {} };

const app = express();

// Helmet pour sécuriser les headers HTTP
const allowedDomains = (process.env.ALLOWED_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);
const onionDomains = allowedDomains.filter(d => d.includes('.onion'));
const localDomains = allowedDomains.filter(d => /^(http:\/\/)?(\d+\.\d+\.\d+\.\d+)(:\d+)?$/.test(d));
const defaultCsp = {
  defaultSrc: ["'self'"],
  mediaSrc: ["'self'", "data:", "blob:"],
  imgSrc: ["'self'", "data:", "blob:", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://emoji-cdn.jsdelivr.net", "https://cdn.jsdelivr.net/npm/emoji-picker-react@*"],
  scriptSrc: ["'self'", "'unsafe-eval'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  connectSrc: ["'self'", "ws://localhost:3000", "wss://liberchat-3-0-1.onrender.com", "wss://liberchat.onrender.com"],
  frameSrc: ["*"]
};
defaultCsp.workerSrc = ["'self'"];
if (allowedDomains.length > 0) {
  defaultCsp.connectSrc = defaultCsp.connectSrc.concat(allowedDomains);
  defaultCsp.imgSrc = defaultCsp.imgSrc.concat(allowedDomains);
  defaultCsp.frameSrc = defaultCsp.frameSrc.concat(allowedDomains);
  defaultCsp.workerSrc = defaultCsp.workerSrc.concat(allowedDomains);
}
// Ajout automatique des .onion et IP locales pour union
if (onionDomains.length > 0) {
  defaultCsp.connectSrc = defaultCsp.connectSrc.concat(onionDomains);
  defaultCsp.imgSrc = defaultCsp.imgSrc.concat(onionDomains);
  defaultCsp.frameSrc = defaultCsp.frameSrc.concat(onionDomains);
  defaultCsp.workerSrc = defaultCsp.workerSrc.concat(onionDomains);
}
if (localDomains.length > 0) {
  defaultCsp.connectSrc = defaultCsp.connectSrc.concat(localDomains);
  defaultCsp.imgSrc = defaultCsp.imgSrc.concat(localDomains);
  defaultCsp.frameSrc = defaultCsp.frameSrc.concat(localDomains);
  defaultCsp.workerSrc = defaultCsp.workerSrc.concat(localDomains);
}
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: defaultCsp,
    },
  })
);

// Limiteur de requêtes (anti-DDoS)
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100 });
app.use(limiter);

// CORS : autorise tous les domaines déclarés, .onion, IP locales, union
app.use(cors({
  origin: [
    'https://liberchat-3-0-1.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://liberchat.onrender.com',
    'capacitor://localhost',
    'http://localhost',
    ...allowedDomains,
    ...onionDomains,
    ...localDomains
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'https://liberchat-3-0-1.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://liberchat.onrender.com',
      'capacitor://localhost',
      'http://localhost',
      ...allowedDomains,
      ...onionDomains,
      ...localDomains
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 50 * 1024 * 1024,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

app.use(express.static(join(__dirname, 'dist')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Route pour récupérer les métadonnées d'un lien (titre, description, image)
app.get('/api/link-preview', async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL manquante' });
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': url
      },
      redirect: 'follow'
    });
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const title = doc.querySelector('title')?.textContent || url;
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    let imageRaw = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    // Si pas d'og:image, chercher la première image significative de la page
    if (!imageRaw) {
      const imgs = Array.from(doc.querySelectorAll('img'));
      // Filtrer les images trop petites ou typiquement des logos/icônes
      const imgCandidate = imgs.find(img => {
        const src = img.getAttribute('src') || '';
        if (!src) return false;
        if (/logo|icon|favicon|sprite|blank|pixel/i.test(src)) return false;
        // Optionnel : ignorer les images trop petites (si width/height dispo)
        const w = parseInt(img.getAttribute('width') || '0', 10);
        const h = parseInt(img.getAttribute('height') || '0', 10);
        if ((w && w < 64) || (h && h < 64)) return false;
        return true;
      });
      if (imgCandidate) imageRaw = imgCandidate.getAttribute('src') || '';
    }
    let image = imageRaw;
    try {
      if (imageRaw && !/^https?:\/\//i.test(imageRaw)) {
        const u = new URL(url);
        image = u.origin + (imageRaw.startsWith('/') ? imageRaw : '/' + imageRaw);
      }
    } catch {}
    // Image par défaut si rien trouvé
    if (!image) image = '/liberchat-logo.svg';
    res.json({ title, description, image });
  } catch (e) {
    res.status(500).json({ error: 'Impossible de récupérer le lien' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const users = new Map();
const usersByName = new Map();
const messages = [];
const MAX_MESSAGES = 100;
let nextMessageId = 1;

const cleanOldMessages = () => {
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
};
setInterval(cleanOldMessages, 300000);

const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 20) {
    throw new Error('Username must be between 3 and 20 characters');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }
};

io.engine.on("connection_error", (err) => {
  console.error('Erreur de connexion Socket.IO:', err);
  logger.error('Erreur de connexion Socket.IO:', err);
});

io.on('connection', (socket) => {
  console.log('Nouvelle connexion socket:', socket.id);
  logger.info('Nouvelle connexion:', socket.id);

  socket.on('reconnect_attempt', () => {
    console.log('Tentative de reconnexion:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Erreur socket:', error);
    logger.error('Socket error:', error);
  });

  socket.on('register', (username) => {
    try {
      validateUsername(username);

      if (usersByName.has(username)) {
        socket.emit('registrationError', 'Ce nom est déjà pris');
        return;
      }

      const user = { username, socketId: socket.id, isInCall: false };
      users.set(socket.id, user);
      usersByName.set(username, socket.id);

      // Correction : inclure les réactions dans les messages envoyés à l'init
      socket.emit('init', {
        messages: messages.slice(-50).map(m => ({ ...m, reactions: m.reactions || {} })),
        users: Array.from(users.values())
      });

      socket.broadcast.emit('userJoined', username);
      io.emit('users', Array.from(users.values()));

      logger.info(`Utilisateur enregistré: ${username}`);
    } catch (error) {
      logger.error(`Erreur d'enregistrement pour ${username}:`, error);
      socket.emit('registrationError', error.message);
    }
  });

  socket.on('disconnect', (reason) => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      usersByName.delete(user.username);
      io.emit('userLeft', user.username);
      io.emit('users', Array.from(users.values()));
      console.log('Utilisateur déconnecté:', user.username);
    }
  });

  // Gestion des messages texte avec nettoyage XSS
  socket.on('chat message', (message) => {
    const user = users.get(socket.id);
    if (!user) return;

    console.log('Message reçu:', { type: typeof message, content: message });

    // Si le message est une chaîne JSON, on le parse
    if (typeof message === 'string') {
      try {
        message = JSON.parse(message);
        console.log('Message parsé:', message);
      } catch (e) {
        logger.error('Erreur de parsing JSON:', e);
        console.error('Erreur de parsing JSON:', e, 'Message reçu:', message);
        return;
      }
    }

    message.username = user.username;
    message.id = nextMessageId++;

    if (message.type === 'text') {
      message.content = xss(message.content); // Nettoyage XSS pour les messages texte
    } else if (message.type === 'file') {
      // Vérification de la taille du fichier
      if (message.fileData.length > 50 * 1024 * 1024) {
        socket.emit('error', 'Fichier trop volumineux (max 50MB)');
        return;
      }
      // Vérification du type de fichier
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
      if (!allowedTypes.includes(message.fileType)) {
        socket.emit('error', 'Type de fichier non autorisé');
        return;
      }
      // Nettoyage XSS du nom de fichier
      message.fileName = message.fileName ? xss(message.fileName) : undefined;
    }

    messages.push(message);
    io.emit('chat message', message);
    console.log('Message envoyé à tous les clients:', message);
    logger.info(`Message ${message.type} reçu de ${user.username}`);
  });

  // Suppression sécurisée d'un message
  socket.on('delete message', ({ id }) => {
    const user = users.get(socket.id);
    console.log('[SUPPRESSION] Demande de suppression id:', id, 'par', user?.username);
    if (!user || !id) return;
    const msgIndex = messages.findIndex(m => m.id === id);
    if (msgIndex === -1) {
      console.log('[SUPPRESSION] Message non trouvé pour id:', id);
      return;
    }
    if (messages[msgIndex].username !== user.username) {
      console.log('[SUPPRESSION] Refusé :', user.username, 'n\'est pas l\'auteur du message', id);
      return;
    }
    messages.splice(msgIndex, 1);
    io.emit('message deleted', { id });
    logger.info(`Message supprimé par ${user.username}: ${id}`);
    console.log('[SUPPRESSION] Message supprimé id:', id);
  });

  // Modification d'un message
  socket.on('edit message', ({ id, content }) => {
    const user = users.get(socket.id);
    if (!user || !id) return;
    const msgIndex = messages.findIndex(m => m.id === id);
    if (msgIndex === -1) return;
    if (messages[msgIndex].username !== user.username) return;
    // Stocke le contenu tel quel, sans aucun traitement
    messages[msgIndex].content = content;
    messages[msgIndex].edited = true;
    io.emit('message edited', { id, content: messages[msgIndex].content });
    logger.info(`Message modifié par ${user.username}: ${id}`);
  });

  // Réactions emoji sur les messages
  socket.on('react message', ({ messageId, encrypted }) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    const msg = messages[msgIndex];
    if (!msg.reactions) msg.reactions = [];
    // Ajoute la réaction chiffrée (pas de déchiffrement côté serveur)
    msg.reactions.push(encrypted);
    // Diffuse l'état complet des réactions chiffrées
    io.emit('react message', { messageId, reactions: [...msg.reactions] });
  });

  // Indicateur "en train d'écrire"
  socket.on('typing', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('typing', user.username);
    }
  });
  socket.on('stop typing', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('stop typing', user.username);
    }
  });

  socket.on('userJoined', (username) => {
    const systemMessage = {
      id: nextMessageId++,
      type: 'system',
      content: `${username} a rejoint le chat`,
      timestamp: Date.now()
    };
    messages.push(systemMessage);
    io.emit('chat message', systemMessage);
  });

  socket.on('userLeft', (username) => {
    const systemMessage = {
      id: nextMessageId++,
      type: 'system',
      content: `${username} a quitté le chat`,
      timestamp: Date.now()
    };
    messages.push(systemMessage);
    io.emit('chat message', systemMessage);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
