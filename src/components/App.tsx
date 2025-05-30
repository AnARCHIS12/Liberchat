import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { VideoCall } from './components/VideoCall';
import { UserList } from './components/UserList';
import { Maximize2, MessageSquare } from 'lucide-react';

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
  const [isInCall, setIsInCall] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [callingUser, setCallingUser] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
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
        setIsInCall(false);
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
    const messageData: Message = {
      type: 'text',
      username,
      content: message,
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

  const handleCallUser = (userToCall: string) => {
    setCallingUser(userToCall);
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallingUser('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!username) {
    return <WelcomeScreen onJoin={handleJoin} />;
  }

  return (
    <>
      {isInCall && socket && (
        <VideoCall
          socket={socket}
          username={username}
          callingUser={callingUser}
          onClose={handleEndCall}
        />
      )}
      
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        <header className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold">LiberChat</h1>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Maximize2 className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <UserList 
            users={users} 
            currentUser={username}
            onCallUser={handleCallUser}
          />
          
          <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </main>

            <ChatInput onSendMessage={handleSendMessage} onSendFile={handleSendFile} />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;