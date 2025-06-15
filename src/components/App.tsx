import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { WelcomeScreen } from './WelcomeScreen';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { UserList } from './UserList';
import Header from './Header';
import CryptoJS from 'crypto-js';

interface Message {
  id: number;
  type: 'text' | 'file' | 'system' | 'gif' | 'audio';
  username?: string;
  content?: string;
  fileData?: string;
  fileType?: string;
  fileName?: string;
  gifUrl?: string;
  timestamp: number;
}

interface UserInfo {
  username: string;
  socketId: string;
}

function App() {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [callingUser, setCallingUser] = useState<string>('');
  // State pour la clé symétrique (CryptoKey ou string selon le backend)
  const [symmetricKey, setSymmetricKey] = useState<CryptoKey | string | null>(null);
  const [keyPrompt, setKeyPrompt] = useState(true);
  const [keyInput, setKeyInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFallbackCrypto, setIsFallbackCrypto] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Utilisation d'une URL dynamique pour le socket selon l'environnement
    let socketUrl = '';
    if (import.meta.env.DEV) {
      socketUrl = 'http://localhost:3000'; // Correction ici : toujours localhost:3000 en dev
    } else if (window.location.hostname.endsWith('onrender.com')) {
      socketUrl = `https://${window.location.hostname}`;
    } else {
      socketUrl = 'http://localhost:3000';
    }
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('connect_error', (err: any) => {
      console.error('Erreur de connexion Socket.IO :', err);
    });

    newSocket.on('users', (userList: UserInfo[]) => {
      setUsers(userList);
    });

    newSocket.on('userJoined', (user: string) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${user} a rejoint le chat`,
        timestamp: Date.now()
      }]);
    });

    newSocket.on('userLeft', (user: string) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${user} a quitté le chat`,
        timestamp: Date.now()
      }]);
      // Si l'utilisateur qui part était en appel, on termine l'appel
      if (user === callingUser) {
        setCallingUser('');
      }
    });

    return () => {
      newSocket.close();
    };
  }, [callingUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Génère la clé symétrique dès que keyPrompt passe à false et que keyInput est non vide
    if (!keyPrompt && keyInput) {
      generateSymmetricKeyFromPassword(keyInput).then(setSymmetricKey);
    }
  }, [keyPrompt, keyInput]);

  const handleJoin = (name: string) => {
    setUsername(name);
    socket?.emit('register', name);
  };

  const handleSendMessage = async (message: string, replyTo?: Message | null) => {
    if (!symmetricKey) return;
    const encrypted = await encryptMessageE2EE(message, symmetricKey);
    const messageData: Omit<Message, 'id'> & { replyTo?: { id: number; username?: string; content?: string; type?: string } } = {
      type: 'text',
      username,
      content: JSON.stringify(encrypted),
      timestamp: Date.now(),
      ...(replyTo ? { replyTo: { id: replyTo.id, username: replyTo.username, content: replyTo.content, type: replyTo.type } } : {})
    };
    socket?.emit('chat message', messageData);
  };

  // Correction du type de la prop onSendFile pour chiffrer les fichiers en E2EE
  const handleSendFile = async (file: File) => {
    if (!socket || !isConnected) {
      alert('Connexion au serveur non établie.');
      return;
    }
    if (!symmetricKey) {
      alert('Clé de chiffrement non initialisée.');
      return;
    }
    // Traitement image (redimensionnement/compression sans perte visible)
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      processedFile = await processImageFile(file, 1280);
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const fileData = reader.result as string;
      // Chiffrement du fichier (base64 ou ArrayBuffer)
      let encryptedFile;
      if (window.crypto && window.crypto.subtle && typeof symmetricKey !== 'string') {
        // Web Crypto : on chiffre le contenu base64 comme un message
        encryptedFile = await encryptMessageE2EE(fileData, symmetricKey);
      } else if (typeof symmetricKey === 'string') {
        encryptedFile = encryptMessageFallback(fileData, symmetricKey);
      } else {
        alert('Aucune méthode de chiffrement disponible pour les fichiers.');
        return;
      }
      const messageData: Message = {
        id: Date.now(),
        type: 'file',
        username,
        fileData: JSON.stringify(encryptedFile),
        fileType: processedFile.type,
        fileName: processedFile.name,
        timestamp: Date.now()
      };
      socket.emit('chat message', messageData);
    };
    reader.readAsDataURL(processedFile); // On lit le fichier en base64 pour compatibilité
  };

  // Ajout de la gestion de l'envoi de messages vocaux
  const handleSendAudio = async (audioBase64: string) => {
    if (!symmetricKey) {
      alert('Clé de chiffrement non initialisée.');
      return;
    }
    const encrypted = await encryptMessageE2EE(audioBase64, symmetricKey);
    const messageData: Message = {
      id: Date.now(),
      type: 'audio',
      username,
      fileData: JSON.stringify(encrypted),
      fileType: 'audio/webm',
      timestamp: Date.now()
    };
    socket?.emit('chat message', messageData);
  };

  // Déchiffrement lors de la réception d'un fichier
  useEffect(() => {
    if (!socket || !symmetricKey) return;
    const handleChatMessage = async (msg: Message) => {
      if (msg.type === 'text' && msg.content) {
        let decrypted = msg.content;
        try {
          // Vérifie que msg.content est bien une chaîne avant d'utiliser trim()
          if (
            typeof msg.content === 'string' &&
            msg.content.length > 0 &&
            msg.content.trim().startsWith('{') &&
            msg.content.trim().endsWith('}')
          ) {
            const encrypted = JSON.parse(msg.content);
            if (encrypted && encrypted.iv && encrypted.content) {
              decrypted = await decryptMessageE2EE(encrypted, symmetricKey);
            }
          }
        } catch (e) {
          // Si déchiffrement impossible, on affiche le contenu brut
        }
        msg.content = decrypted;
      } else if (msg.type === 'file' && msg.fileData) {
        let decryptedFile = msg.fileData;
        try {
          if (
            typeof msg.fileData === 'string' &&
            msg.fileData.trim().startsWith('{') &&
            msg.fileData.trim().endsWith('}')
          ) {
            const encrypted = JSON.parse(msg.fileData);
            if (encrypted && encrypted.iv && encrypted.content) {
              decryptedFile = await decryptMessageE2EE(encrypted, symmetricKey);
            }
          }
        } catch (e) {
          // Si déchiffrement impossible, on affiche le contenu brut
        }
        msg.fileData = decryptedFile;
      } else if (msg.type === 'audio' && msg.fileData) {
        let decryptedAudio = msg.fileData;
        try {
          if (
            typeof msg.fileData === 'string' &&
            msg.fileData.trim().startsWith('{') &&
            msg.fileData.trim().endsWith('}')
          ) {
            const encrypted = JSON.parse(msg.fileData);
            if (encrypted && encrypted.iv && encrypted.content) {
              decryptedAudio = await decryptMessageE2EE(encrypted, symmetricKey);
            }
          }
        } catch (e) {}
        // Correction : s'assurer que le dataURL est bien préfixé
        if (typeof decryptedAudio === 'string' && !decryptedAudio.startsWith('data:audio/')) {
          const mime = msg.fileType && msg.fileType.startsWith('audio/') ? msg.fileType : 'audio/webm';
          decryptedAudio = `data:${mime};base64,${decryptedAudio.replace(/^data:[^,]+,/, '')}`;
        }
        msg.fileData = decryptedAudio;
      }
      setMessages((prev: Message[]) => [...prev, msg]);
    };
    socket.on('chat message', handleChatMessage);
    return () => {
      socket.off('chat message', handleChatMessage);
    };
  }, [socket, symmetricKey]);

  // Gestion du bouton "Déverrouiller le chat"
  const handleUnlock = () => {
    if (!keyInput.trim()) {
      // Générer une clé aléatoire et l'afficher à l'utilisateur
      const randomKey = generateRandomPassword();
      setGeneratedKey(randomKey);
      setKeyInput(randomKey);
      setCopied(false);
    } else {
      setKeyPrompt(false);
    }
  };

  // Nouvelle fonction pour valider l'accès après partage de la clé
  const handleAccessAfterShare = () => {
    setKeyPrompt(false);
    setGeneratedKey(null); // Réinitialise l'état pour éviter tout effet de bord
  };

  // Déconnexion utilisateur
  const handleLogout = () => {
    setUsername('');
    setMessages([]);
    setSymmetricKey(null); // Purge la clé à la déconnexion
    setKeyPrompt(true);    // Réaffiche l'écran de saisie de clé
    setKeyInput('');
    setGeneratedKey(null);
    setCopied(false);
    // Optionnel : socket?.disconnect();
  };

  // Expiration automatique de la clé après 2h30min (9000000 ms)
  useEffect(() => {
    if (!symmetricKey) return;
    const timeout = setTimeout(() => {
      setSymmetricKey(null); // Purge la clé
      setKeyPrompt(true);    // Réaffiche l'écran de saisie de clé
      setKeyInput('');
      setGeneratedKey(null);
      setCopied(false);
    }, 9000000); // 2h30min
    return () => clearTimeout(timeout);
  }, [symmetricKey]);

  // Génération d'une "clé" utilisable par crypto-js (string hex) à partir du mot de passe
  function deriveKeyFallback(password: string) {
    return CryptoJS.PBKDF2(password, 'liberchat-salt', {
      keySize: 256 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    }).toString(CryptoJS.enc.Hex);
  }

  // Chiffrement fallback (AES-GCM simulé par AES + IV concaténé)
  function encryptMessageFallback(message: string, keyHex: string) {
    const iv = CryptoJS.lib.WordArray.random(12);
    const encrypted = CryptoJS.AES.encrypt(message, CryptoJS.enc.Hex.parse(keyHex), {
      iv,
      mode: CryptoJS.mode.CBC, // GCM non supporté, CBC par défaut
      padding: CryptoJS.pad.Pkcs7
    });
    return {
      iv: Array.from(CryptoJS.enc.Hex.parse(iv.toString()).words, (w: number) => w >>> 0),
      content: encrypted.ciphertext.toString(CryptoJS.enc.Base64)
    };
  }

  function decryptMessageFallback(encrypted: {iv: number[], content: string}, keyHex: string) {
    try {
      const ivWordArray = CryptoJS.lib.WordArray.create(new Uint8Array(new Uint32Array(encrypted.iv).buffer));
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(encrypted.content),
        iv: ivWordArray,
        key: CryptoJS.enc.Hex.parse(keyHex),
        algorithm: CryptoJS.algo.AES
      });
      const decrypted = CryptoJS.AES.decrypt(cipherParams, CryptoJS.enc.Hex.parse(keyHex), {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return encrypted.content;
    }
  }

  // Génération d'une clé symétrique (Web Crypto ou fallback)
  async function generateSymmetricKeyFromPassword(password: string) {
    if (window.crypto && window.crypto.subtle) {
      setIsFallbackCrypto(false);
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      return await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: enc.encode('liberchat-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } else {
      setIsFallbackCrypto(true);
      // Retourne la clé dérivée (string hex) pour crypto-js
      return deriveKeyFallback(password);
    }
  }

  // Chiffrement d'un message (Web Crypto ou fallback)
  async function encryptMessageE2EE(message: string, key: CryptoKey | string) {
    if (window.crypto && window.crypto.subtle && typeof key !== 'string') {
      const enc = new TextEncoder();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(message)
      );
      return {
        iv: Array.from(iv),
        content: Array.from(new Uint8Array(ciphertext))
      };
    } else if (typeof key === 'string') {
      return encryptMessageFallback(message, key);
    } else {
      throw new Error('Aucune méthode de chiffrement disponible');
    }
  }

  // Déchiffrement d'un message (Web Crypto ou fallback)
  async function decryptMessageE2EE(encrypted: {iv: number[], content: any}, key: CryptoKey | string) {
    if (window.crypto && window.crypto.subtle && typeof key !== 'string') {
      try {
        const dec = new TextDecoder();
        const iv = new Uint8Array(encrypted.iv);
        const ciphertext = new Uint8Array(encrypted.content);
        const plaintext = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          ciphertext
        );
        return dec.decode(plaintext);
      } catch {
        return encrypted.content;
      }
    } else if (typeof key === 'string') {
      return decryptMessageFallback(encrypted, key);
    } else {
      return encrypted.content;
    }
  }

  // Génère une clé aléatoire forte (32 caractères alphanumériques + symboles)
  function generateRandomPassword(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>?';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, x => charset[x % charset.length]).join('');
  }

  // Ajout de la fonction handleDeleteMessage si manquante
  const handleDeleteMessage = (id: number) => {
    if (socket) {
      socket.emit('delete message', { id });
    }
  };

  useEffect(() => {
    if (!socket) return;
    // Suppression d'un message côté client
    const handleMessageDeleted = ({ id }: { id: number }) => {
      console.log('[CLIENT] Message supprimé reçu id:', id, typeof id);
      setMessages(prev => prev.filter(msg => msg.id !== id));
    };
    socket.on('message deleted', handleMessageDeleted);
    return () => {
      socket.off('message deleted', handleMessageDeleted);
    };
  }, [socket]);

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
  };

  // Fonction utilitaire pour redimensionner/comprimer une image sans perte visible
  async function processImageFile(file: File, maxWidth = 1280): Promise<File> {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Format d'origine
        let mime = file.type;
        let quality = 1.0;
        // Si JPEG ou WebP, on peut ajuster la qualité (ici max)
        if (mime === 'image/jpeg' || mime === 'image/webp') {
          quality = 0.98;
        }
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { type: mime });
            resolve(processedFile);
          } else {
            resolve(file); // fallback
          }
          URL.revokeObjectURL(url);
        }, mime, quality);
      };
      img.onerror = () => {
        resolve(file); // fallback si erreur
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  if (keyPrompt) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-black via-red-950 to-black text-white font-sans flex flex-col">
        <div className="fixed top-0 left-0 w-full z-20">
          <Header />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 w-full pt-20 px-2 sm:px-0">
          <div className="p-4 sm:p-8 bg-black/90 rounded-2xl shadow-2xl flex flex-col items-center border-4 border-red-700 w-full max-w-xs sm:max-w-md animate-fade-in">
            <div className="flex flex-col items-center mb-3 sm:mb-4 w-full">
              <img src="/images/liberchat-logo.svg" alt="Logo LiberChat" className="w-16 h-16 sm:w-20 sm:h-20 mb-2 sm:mb-3 drop-shadow-lg border-4 border-white rounded-full bg-black" />
              <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-red-400 font-mono tracking-wider text-center">Clé de chiffrement</h2>
              <p className="text-xs sm:text-sm text-gray-300 mb-2 text-center font-mono leading-tight">Pour garantir la confidentialité, entrez un mot de passe partagé avec vos camarades.<br/>Il sera utilisé pour chiffrer/déchiffrer tous vos messages.</p>
            </div>
            <input
              type="text"
              className="p-2 sm:p-3 rounded-lg bg-gray-900 border-2 border-red-700 text-white mb-3 sm:mb-4 w-full text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-700 transition text-base sm:text-lg"
              placeholder="Mot de passe/chiffre partagé..."
              value={keyInput}
              onChange={e => { setKeyInput(e.target.value); setGeneratedKey(null); setCopied(false); }}
              autoFocus
            />
            <button
              className="bg-gradient-to-r from-red-700 to-red-500 px-4 sm:px-6 py-2 rounded-lg text-white font-bold shadow-lg hover:from-black hover:to-red-700 transition mb-2 w-full text-base sm:text-lg font-mono disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleUnlock}
              disabled={!!generatedKey}
            >
              Déverrouiller le chat
            </button>
            {generatedKey && (
              <div className="w-full flex flex-col items-center mt-2">
                <div className="text-xs text-gray-300 mb-1 text-center font-mono">Clé générée à partager avec vos camarades :</div>
                <div className="bg-gray-800 text-red-300 font-mono text-xs break-all rounded p-2 mb-2 w-full text-center select-all">{generatedKey}</div>
                <button
                  className="bg-red-700 hover:bg-red-800 text-white font-mono px-3 py-1 rounded mb-1 text-xs"
                  onClick={() => { navigator.clipboard.writeText(generatedKey); setCopied(true); }}
                >
                  {copied ? 'Clé copiée !' : 'Copier la clé'}
                </button>
                <button
                  className="mt-1 text-xs underline text-gray-400 hover:text-red-400"
                  onClick={handleAccessAfterShare}
                >
                  J'ai partagé la clé, accéder au chat
                </button>
                <div className="text-[10px] text-yellow-400 mt-2 text-center font-mono">Partage cette clé avec tes camarades puis clique sur « J'ai partagé la clé, accéder au chat ».</div>
              </div>
            )}
            <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center font-mono leading-tight">Ce mot de passe doit être identique pour tous les membres du salon.<br/>Il n'est jamais transmis au serveur.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!username) {
    return (
      <>
        <Header />
        <WelcomeScreen onJoin={handleJoin} />
      </>
    );
  }

  // Suppression de l'écran "Initialisation du chiffrement..." :
  // Si la clé n'est pas prête, on ne rend rien (ou on peut afficher un fallback minimal si besoin)
  if (!symmetricKey) {
    return null;
  }

  return (
    <div className="h-screen min-h-0 flex flex-col bg-gradient-to-br from-black via-red-950 to-black text-white font-sans" style={{height:'100dvh', minHeight:'0'}}>
      <Header onLogout={handleLogout} isLoggedIn={!!username} />
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
        <aside className="hidden sm:block w-full sm:w-64 bg-black border-r-4 border-red-700 flex-shrink-0 z-0">
          <UserList users={users} currentUser={username} />
        </aside>
        <div className="flex-1 flex flex-col bg-black/80 border-l-0 sm:border-l-4 border-red-700 min-h-0">
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 min-h-0" style={{WebkitOverflowScrolling:'touch'}}>
            {messages.filter(msg => typeof msg.id === 'number').map((msg: Message, index: number) => (
              <ChatMessage 
                key={msg.id || index} 
                message={msg} 
                isOwnMessage={msg.username === username}
                onDeleteMessage={handleDeleteMessage}
                onReply={() => handleReply(msg)}
              />
            ))}
            <div ref={messagesEndRef} />
          </main>
          <div className="flex-shrink-0 sticky bottom-0 z-10 bg-black/95 border-t-2 border-red-700">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              onSendFile={handleSendFile}
              onSendAudio={handleSendAudio}
              isConnected={isConnected}
              users={users}
              currentUser={username}
              replyTo={replyTo}
              onReplyHandled={() => setReplyTo(null)}
            />
          </div>
        </div>
      </div>
      {/* Affichage de l'avertissement si fallback JS */}
      {isFallbackCrypto && (
        <div className="fixed top-0 left-0 w-full bg-yellow-900 text-yellow-200 text-center py-2 z-50 font-mono text-xs shadow-lg">
          ⚠️ Chiffrement fallback JS (crypto-js) utilisé : sécurité réduite, changez de navigateur si possible.
        </div>
      )}
    </div>
  );
}

export default App;