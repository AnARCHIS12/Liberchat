import React from 'react';
import DOMPurify from 'dompurify';

interface Message {
  type: 'text' | 'file' | 'system' | 'audio' | 'gif';
  username?: string;
  content?: string;
  fileData?: string;
  fileType?: string;
  fileName?: string;
  gifUrl?: string;
  timestamp: number;
}

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderContent = () => {
    if (message.type === 'text') {
      // Sanitize le contenu texte (HTML potentiellement dangereux)
      return (
        <p
          className="break-words text-sm sm:text-base font-mono text-white"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content || '') }}
        />
      );
    } else if (message.type === 'file') {
      if (message.fileType?.startsWith('image/')) {
        return (
          <div className="max-w-[160px] sm:max-w-[220px]">
            <img 
              src={message.fileData} 
              alt={message.fileName || 'Image'}
              className="w-full rounded-lg shadow-lg border-2 border-red-700 bg-black"
            />
            <p className="text-xs sm:text-sm text-red-300 mt-1 truncate font-mono">{message.fileName}</p>
          </div>
        );
      }
      return <span className="text-red-400 text-xs sm:text-sm">Fichier non supporté</span>;
    } else if (message.type === 'audio' && message.fileData) {
      const [audioError, setAudioError] = React.useState(false);
      // Empêche le menu contextuel (clic droit) sur l'audio
      const preventContextMenu = (e: React.MouseEvent<HTMLAudioElement>) => e.preventDefault();
      return (
        <div className="flex flex-col items-center w-full">
          <audio
            controls
            src={message.fileData}
            className="w-full mt-1 rounded-lg border-2 border-red-700 bg-black shadow"
            style={{ minWidth: 180, maxWidth: 320 }}
            onError={() => setAudioError(true)}
            onContextMenu={preventContextMenu}
            controlsList="nodownload noplaybackrate"
          />
          {audioError ? (
            <span className="text-xs text-red-400 mt-1 font-mono">
              ⚠️ Lecture vocale non supportée sur ce navigateur/appareil.
            </span>
          ) : (
            <span className="text-xs text-gray-400 mt-1 font-mono">Message vocal</span>
          )}
        </div>
      );
    } else if (message.type === 'gif') {
      return (
        <div className="max-w-[160px] sm:max-w-[220px]">
          <img 
            src={message.gifUrl} 
            alt="GIF"
            className="w-full rounded-lg shadow-lg border-2 border-red-700 bg-black"
          />
        </div>
      );
    } else if (message.type === 'system') {
      return <span className="italic text-xs sm:text-sm text-red-400">{message.content}</span>;
    }
    return null;
  };

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      <div className={`rounded-xl px-2 sm:px-4 py-1 sm:py-2 mb-0.5 max-w-[90vw] sm:max-w-lg shadow-lg border-2 ${isOwnMessage ? 'bg-red-700/80 border-white text-white' : 'bg-black/80 border-red-700 text-white'} relative`}>
        {message.username && message.type !== 'system' && (
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-300 mb-1 block font-mono">
            {isOwnMessage ? 'Vous' : message.username}
          </span>
        )}
        {renderContent()}
      </div>
      <span className="ml-1 sm:ml-2 mt-0.5 text-[10px] sm:text-xs text-gray-400 font-mono opacity-80">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
};

export default ChatMessage;