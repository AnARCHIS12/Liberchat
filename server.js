import express from 'express';
import { createServer } from 'http'; // Remplacer par https avec certificat pour prod
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import xss from 'xss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();

// Helmet pour sécuriser les headers HTTP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        mediaSrc: ["'self'", "data:"], // Autorise data: pour les médias
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "ws://localhost:3000", "wss://liberchat-3-0-1.onrender.com", "wss://liberchat.onrender.com"],
        // ...autres directives selon besoin...
      },
    },
  })
);

// Limiteur de requêtes (anti-DDoS)
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100 });
app.use(limiter);

// CORS : mettre l'URL de ton frontend à la place
app.use(cors({
  origin: [
    'https://liberchat-3-0-1.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://liberchat.onrender.com', // fallback Render
    'capacitor://localhost', // pour mobile
    'http://localhost'
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
      'http://localhost'
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

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const users = new Map();
const usersByName = new Map();
const messages = [];
const MAX_MESSAGES = 100;

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

      socket.emit('init', {
        messages: messages.slice(-50),
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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
