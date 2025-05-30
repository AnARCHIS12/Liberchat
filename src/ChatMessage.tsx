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
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} mb-2 px-1 w-full`}>
      <div className={`
        max-w-[80%] sm:max-w-[70%] rounded-lg px-2.5 py-1.5 sm:py-2 border-2
        ${isOwnMessage 
          ? 'bg-red-900/80 border-red-600 text-red-100 ml-auto rounded-tr-none' 
          : 'bg-black border-red-800 text-red-100 mr-auto rounded-tl-none'
        }
      `}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-xs ${isOwnMessage ? 'text-red-300' : 'text-red-400'}`}>
            {message.username}
          </span>
          <span className="text-red-600 text-sm">Ⓐ</span>
          <span className={`text-[10px] sm:text-xs ml-auto ${isOwnMessage ? 'text-red-400' : 'text-red-500'}`}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="text-sm break-words">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;