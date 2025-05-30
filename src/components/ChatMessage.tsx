import React from 'react';

interface Message {
  type: 'text' | 'file';
  username: string;
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
      return <p className="break-words text-sm sm:text-base">{message.content}</p>;
    } else if (message.type === 'file') {
      if (message.fileType?.startsWith('image/')) {
        return (
          <div className="max-w-[150px] sm:max-w-sm">
            <img 
              src={message.fileData} 
              alt={message.fileName || 'Image'}
              className="w-full rounded-lg shadow-lg"
            />
            <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">{message.fileName}</p>
          </div>
        );
      }
    }
  };

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} mb-2 sm:mb-3`}>
      <div className={`
        max-w-[85%] sm:max-w-[70%] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border-2
        ${isOwnMessage 
          ? 'bg-red-900/80 border-red-600 text-red-100' 
          : 'bg-black border-red-800 text-red-100'
        }
      `}>
        <div className="flex items-center gap-1 sm:gap-2 mb-1">
          <span className={`text-xs sm:text-sm ${isOwnMessage ? 'text-red-300' : 'text-red-400'}`}>
            {message.username}
          </span>
          <span className="text-red-600 text-sm sm:text-base">Ⓐ</span>
          <span className={`text-xs ${isOwnMessage ? 'text-red-400' : 'text-red-500'}`}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="text-sm sm:text-base break-words">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;