import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WelcomeScreen } from './components/WelcomeScreen';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { UserList } from './components/UserList';
import Header from './components/Header';

interface Message {
  type: 'text' | 'file' | 'system' | 'gif' | 'audio';
  username?: string;
  content?: string;
  fileData?: string;
  fileType?: string;
  gifUrl?: string;
  timestamp: number;
}

interface UserInfo {
  username: string;
  socketId: string;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [callingUser, setCallingUser] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Génération d'une clé symétrique AES-GCM (256 bits)
  async function generateSymmetricKey() {
    return await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Chiffrement d'un message texte
  async function encryptMessage(message: string, key: CryptoKey) {
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
  }

  // Déchiffrement d'un message texte
  async function decryptMessage(encrypted: {iv: number[], content: number[]}, key: CryptoKey) {
    const dec = new TextDecoder();
    const iv = new Uint8Array(encrypted.iv);
    const ciphertext = new Uint8Array(encrypted.content);
    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return dec.decode(plaintext);
  }

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connecté, id:', newSocket.id);
    });
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('chat message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('users', (userList: UserInfo[]) => {
      setUsers(userList);
    });

    newSocket.on('userJoined', (user: string) => {
      setMessages(prev => [...prev, {
        type: 'system',
        content: `${user} a rejoint le chat`,
        timestamp: Date.now()
      }]);
    });

    newSocket.on('userLeft', (user: string) => {
      setMessages(prev => [...prev, {
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

  const handleJoin = (name: string) => {
    setUsername(name);
    socket?.emit('register', name);
  };

  const [symmetricKey, setSymmetricKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    generateSymmetricKey().then(setSymmetricKey);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!symmetricKey) return;
    const encrypted = await encryptMessage(message, symmetricKey);
    const messageData: Message = {
      type: 'text',
      username,
      content: JSON.stringify(encrypted),
      timestamp: Date.now()
    };
    socket?.emit('chat message', messageData);
  };

  const handleSendFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result as string;
        const messageData: Message = {
          type: 'file',
          username,
          fileData,
          fileType: file.type,
          timestamp: Date.now()
        };
        socket?.emit('chat message', messageData);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file');
    }
  };

  // Gestion de l'envoi de message vocal (dummy pour compatibilité)
  const handleSendAudio = async (audioBase64: string) => {
    // À adapter si chiffrement vocal nécessaire
    const messageData: Message = {
      type: 'audio',
      username,
      fileData: audioBase64,
      timestamp: Date.now()
    };
    socket?.emit('chat message', messageData);
  };

  const handleCallUser = (userToCall: string) => {
    setCallingUser(userToCall);
  };

  // Déchiffrement lors de la réception d'un message
  useEffect(() => {
    if (!socket || !symmetricKey) return;
    const handleChatMessage = async (msg: Message) => {
      if (msg.type === 'text' && msg.content) {
        try {
          const encrypted = JSON.parse(msg.content);
          msg.content = await decryptMessage(encrypted, symmetricKey);
        } catch (e) {
          // Si déchiffrement impossible, on affiche le contenu brut
        }
      }
      setMessages((prev: Message[]) => [...prev, msg]);
    };
    socket.on('chat message', handleChatMessage);
    return () => {
      socket.off('chat message', handleChatMessage);
    };
  }, [socket, symmetricKey]);

  if (!username) {
    return <WelcomeScreen onJoin={handleJoin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <UserList 
          users={users} 
          currentUser={username}
          onCallUser={handleCallUser}
        />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: Message, index: number) => (
              <ChatMessage 
                key={index} 
                message={msg} 
                isOwnMessage={msg.username === username}
              />
            ))}
            <div ref={messagesEndRef} />
          </main>
          <ChatInput 
            onSendMessage={handleSendMessage} 
            onSendFile={handleSendFile}
            onSendAudio={handleSendAudio}
            isConnected={isConnected}
            users={users}
            currentUser={username}
          />
        </div>
      </div>
    </div>
  );
}

export default App;