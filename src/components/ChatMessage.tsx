import React from 'react';

interface Message {
  type: 'text' | 'file' | 'system';
  username?: string;
  content?: string;
  fileData?: string;
  fileType?: string;
  fileName?: string;
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
      return <p className="break-words text-sm sm:text-base font-mono text-white">{message.content}</p>;
    } else if (message.type === 'file') {
      // Correction : accepter aussi les messages audio encodés en base64 avec data:audio/webm
      if ((message.fileType?.startsWith('image/')) && message.fileData) {
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
      if ((message.fileType === 'audio/webm' || (message.fileData && message.fileData.startsWith('data:audio/webm'))) && message.fileData) {
        return (
          <div className="flex flex-col items-center max-w-xs">
            <audio controls src={message.fileData} className="w-full mt-1 rounded-lg border-2 border-red-700 bg-black">
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
            {/* Pas de lien de téléchargement */}
            <p className="text-xs sm:text-sm text-red-300 mt-1 truncate font-mono">{message.fileName || 'Message vocal'}</p>
          </div>
        );
      }
      return <span className="text-red-400 text-xs sm:text-sm">Fichier non supporté</span>;
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