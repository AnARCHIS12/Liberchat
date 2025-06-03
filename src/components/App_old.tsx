import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WelcomeScreen } from './WelcomeScreen';
import ChatMessage from './ChatMessage';
import { UserList } from './UserList';
import Header from './Header';

interface Message {
  type: 'text' | 'file' | 'system';
  username?: string;
  content?: string;
  fileData?: string;
  fileType?: string;
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

  useEffect(() => {
    // Utilisation d'une URL dynamique pour le socket selon l'environnement
    let socketUrl = '';
    if (import.meta.env.DEV) {
      socketUrl = '';
    } else if (window.location.hostname.endsWith('onrender.com')) {
      socketUrl = `https://${window.location.hostname}`;
    } else {
      socketUrl = 'http://localhost:3000';
    }
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('connect_error', (err) => {
      console.error('Erreur de connexion Socket.IO :', err);
    });

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

  const handleSendMessage = (message: string) => {
    if (!socket || !isConnected) {
      alert('Connexion au serveur non établie.');
      return;
    }
    const messageData: Message = {
      type: 'text',
      username,
      content: message,
      timestamp: Date.now()
    };
    socket.emit('chat message', messageData);
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

  const handleLogout = () => {
    setUsername('');
    setMessages([]);
    // Optionnel : socket?.disconnect();
  };

  if (!username) {
    return (
      <>
        <Header />
        <WelcomeScreen onJoin={handleJoin} />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-black via-red-950 to-black text-white font-sans">
      <Header onLogout={handleLogout} isLoggedIn={!!username} />
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        <aside className="hidden sm:block w-full sm:w-64 bg-black border-r-4 border-red-700 flex-shrink-0 z-0">
          <UserList users={users} currentUser={username} />
        </aside>
        <div className="flex-1 flex flex-col bg-black/80 border-l-0 sm:border-l-4 border-red-700">
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 bg-black/60">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} isOwnMessage={msg.username === username} />
            ))}
            <div ref={messagesEndRef} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;