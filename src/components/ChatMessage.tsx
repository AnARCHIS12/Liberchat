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
          <div className="max-w-[200px] sm:max-w-sm">
            <img 
              src={message.fileData} 
              alt={message.fileName || 'Image'}
              className="w-full rounded-lg shadow-lg"
            />
            <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">{message.fileName}</p>
          </div>
        );
      } else {
        return (
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800/50">
            <svg 
              className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <span className="text-xs sm:text-sm text-gray-300 truncate max-w-[150px] sm:max-w-xs">
              {message.fileName}
            </span>
          </div>
        );
      }
    }
  };

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} mb-3`}>
      <div className={`
        max-w-[90%] sm:max-w-[70%] rounded-none px-3 py-2 border-2
        ${isOwnMessage 
          ? 'bg-red-900/80 border-red-600 text-red-100' 
          : 'bg-black border-red-800 text-red-100'
        }
      `}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm ${isOwnMessage ? 'text-red-300' : 'text-red-400'}`}>
            {message.username}
          </span>
          <span className="text-red-600 text-base">Ⓐ</span>
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