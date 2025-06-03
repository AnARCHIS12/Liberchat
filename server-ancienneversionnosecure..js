import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration du logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();
const server = createServer(app);

// Configuration CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Configuration Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB pour les images
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'], // Autoriser le fallback en polling
  allowEIO3: true
});

// Middleware Express pour servir les fichiers statiques
app.use(express.static(join(__dirname, 'dist')));

// Middleware Express pour parser les requêtes JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Route par défaut
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Stockage en mémoire
const users = new Map();
const usersByName = new Map();
const messages = [];
const MAX_MESSAGES = 100;

// Nettoyage périodique des messages
const cleanOldMessages = () => {
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
};

setInterval(cleanOldMessages, 300000); // Toutes les 5 minutes

// Ajout de validations supplémentaires
const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 20) {
    throw new Error('Username must be between 3 and 20 characters');
  }
  // Empêcher les caractères spéciaux
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

  // Gérer la reconnexion
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
      
      // Vérifier si le nom d'utilisateur est déjà pris
      if (usersByName.has(username)) {
        socket.emit('registrationError', 'Ce nom est déjà pris');
        return;
      }

      // Créer et enregistrer l'utilisateur
      const user = { username, socketId: socket.id, isInCall: false };
      users.set(socket.id, user);
      usersByName.set(username, socket.id);

      // Envoyer les données initiales au nouvel utilisateur
      socket.emit('init', {
        messages: messages.slice(-50),
        users: Array.from(users.values())
      });

      // Informer les autres utilisateurs
      socket.broadcast.emit('userJoined', username);
      io.emit('users', Array.from(users.values()));

      logger.info(`Utilisateur enregistré: ${username}`);
    } catch (error) {
      logger.error(`Erreur d'enregistrement pour ${username}:`, error);
      socket.emit('registrationError', error.message);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Déconnexion socket:', socket.id, 'Raison:', reason);
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      usersByName.delete(user.username);
      io.emit('userLeft', user.username);
      io.emit('users', Array.from(users.values()));
      console.log('Utilisateur déconnecté:', user.username);
    }
  });

  // Gestion des messages texte
  socket.on('chat message', (message) => {
    const user = users.get(socket.id);
    if (!user) return;

    message.username = user.username;
    message.timestamp = Date.now();
    
    messages.push(message);
    io.emit('chat message', message);
    logger.info(`Message reçu de ${user.username}`);
  });

  // Gestion des fichiers
  socket.on('file message', (fileData) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      // Vérifier la taille du fichier
      if (fileData.fileData.length > 50 * 1024 * 1024) { // 50MB max
        socket.emit('error', 'Fichier trop volumineux (max 50MB)');
        return;
      }

      const message = {
        type: 'file',
        username: user.username,
        fileData: fileData.fileData,
        fileType: fileData.fileType,
        fileName: fileData.fileName,
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

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
