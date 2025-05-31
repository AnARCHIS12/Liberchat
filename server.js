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
app.use(helmet());

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

    message.username = user.username;
    message.timestamp = Date.now();
    message.text = xss(message.text); // Nettoyage XSS

    messages.push(message);
    io.emit('chat message', message);
    logger.info(`Message reçu de ${user.username}`);
  });

  // Gestion des fichiers
  socket.on('file message', (fileData) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      // Vérif taille max
      if (fileData.fileData.length > 50 * 1024 * 1024) {
        socket.emit('error', 'Fichier trop volumineux (max 50MB)');
        return;
      }
      // Vérif du type MIME (exemple: images/pdf/doc uniquement)
      const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'application/msword'];
      if (!allowedTypes.includes(fileData.fileType)) {
        socket.emit('error', 'Type de fichier non autorisé');
        return;
      }

      const message = {
        type: 'file',
        username: user.username,
        fileData: fileData.fileData,
        fileType: fileData.fileType,
        fileName: xss(fileData.fileName),
        timestamp: Date.now()
      };

      messages.push(message);
      io.emit('chat message', message);
      console.log(`Fichier reçu de ${user.username} (${fileData.fileType})`);
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      socket.emit('error', 'Erreur lors du traitement du fichier');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
