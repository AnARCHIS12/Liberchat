import React, { useState } from 'react';
import ImageModal from './ImageModal';

interface Message {
  id: number;
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
  onDeleteMessage?: (id: number) => void; // Correction : id est number
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage, onDeleteMessage }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const mentionRegex = /@([\w-]+)/g;

  const renderContent = () => {
    if (message.type === 'text') {
      const contentStr = typeof message.content === 'string' ? message.content : '';
      const parts = contentStr.split(mentionRegex);
      return (
        <p className="break-words text-sm sm:text-base font-mono text-white">
          {parts.map((part, i) => {
            if (i % 2 === 1) {
              return (
                <span key={i} className="bg-red-700/80 text-white px-1 rounded font-bold hover:underline cursor-pointer transition">
                  @{part}
                </span>
              );
            }
            return part;
          })}
        </p>
      );
    } else if (message.type === 'file') {
      if (message.fileType?.startsWith('image/')) {
        return (
          <div className="max-w-[160px] sm:max-w-[220px]">
            <img 
              src={message.fileData} 
              alt={message.fileName || 'Image'}
              className="w-full rounded-lg shadow-lg border-2 border-red-700 bg-black cursor-zoom-in hover:scale-105 transition"
              onClick={() => setModalOpen(true)}
            />
            <p className="text-xs sm:text-sm text-red-300 mt-1 truncate font-mono">{message.fileName}</p>
            {modalOpen && (
              <ImageModal src={message.fileData!} alt={message.fileName} onClose={() => setModalOpen(false)} />
            )}
          </div>
        );
      }
      return <span className="text-red-400 text-xs sm:text-sm">Fichier non supporté</span>;
    } else if (message.type === 'audio' && message.fileData) {
      const [audioError, setAudioError] = React.useState(false);
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

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    setShowConfirm(false);
    if (onDeleteMessage && typeof message.id === 'number') {
      onDeleteMessage(message.id);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
    >
      <div className={`group rounded-xl px-2 sm:px-4 py-1 sm:py-2 mb-0.5 max-w-[90vw] sm:max-w-lg shadow-lg border-2 ${isOwnMessage ? 'bg-red-700/80 border-white text-white' : 'bg-black/80 border-red-700 text-white'} relative`}>
        {message.username && message.type !== 'system' && (
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-300 mb-1 block font-mono">
            {isOwnMessage ? 'Vous' : message.username}
          </span>
        )}
        {renderContent()}
        {isOwnMessage && (
          <button
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-red-400 border border-red-700 rounded-full p-1 text-xs font-mono shadow hover:bg-red-700 hover:text-white z-50"
            title="Supprimer"
            onClick={handleDelete}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M6.5 4.5A1.5 1.5 0 018 3h4a1.5 1.5 0 011.5 1.5V5h3a.5.5 0 010 1h-1.05l-.45 9.01A2.5 2.5 0 0111.5 17h-3a2.5 2.5 0 01-2.5-2.49L5.55 6H4.5a.5.5 0 010-1h3v-.5zm1 0V5h5v-.5a.5.5 0 00-.5-.5h-4a.5.5 0 00-.5.5zM6.04 6l.45 9.01A1.5 1.5 0 007.5 16h3a1.5 1.5 0 001.5-1.49L13.96 6H6.04z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/90">
            <div className="bg-black border-2 border-red-700 rounded-xl px-6 py-5 shadow-lg flex flex-col items-center max-w-sm w-full">
              <p className="text-white mb-6 font-mono text-center text-base">Supprimer ce message&nbsp;?</p>
              <div className="flex gap-4 w-full justify-center">
                <button onClick={confirmDelete} className="bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-lg font-mono shadow border border-red-900 transition-colors focus:ring-0 focus:outline-none text-sm">Supprimer</button>
                <button onClick={cancelDelete} className="bg-black hover:bg-red-900 active:bg-red-950 text-white px-6 py-2 rounded-lg font-mono shadow border border-red-700 transition-colors focus:ring-0 focus:outline-none text-sm">Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <span className="ml-1 sm:ml-2 mt-0.5 text-[10px] sm:text-xs text-gray-400 font-mono opacity-80">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
};

export default ChatMessage;