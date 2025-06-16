import React, { useState, useRef } from 'react';
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
  replyTo?: Message; // Ajout de la propriété replyTo
}

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  onDeleteMessage?: (id: number) => void;
  onReply?: (username: string) => void; // Ajout pour la réponse
}

// Verrou global pour bloquer le menu contextuel après une prévisualisation image
let blockMenu = false;

const ChatMessage: React.FC<ChatMessageProps & { onReply?: (msg: Message) => void }> = ({ message, isOwnMessage, onDeleteMessage, onReply }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

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
              onClick={handleImageEvent}
              onContextMenu={handleImageEvent}
              onTouchStart={handleImageEvent}
            />
            <p className="text-xs sm:text-sm text-red-300 mt-1 truncate font-mono">{message.fileName}</p>
            {modalOpen && (
              <ImageModal src={message.fileData!} alt={message.fileName} onClose={() => { setModalOpen(false); setShowMenu(false); blockMenu = true; setTimeout(() => { blockMenu = false; }, 500); }} />
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

  const handleReplyClick = () => {
    if (message.username && message.type !== 'system' && onReply) {
      onReply(message);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (blockMenu) {
      e.preventDefault();
      blockMenu = false;
      return;
    }
    if (message.type === 'system') return;
    e.preventDefault();
    setShowMenu(true);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Pour mobile : appui long uniquement (pas de menu sur simple tap)
  let touchTimer: NodeJS.Timeout;
  const handleTouchStart = (e: React.TouchEvent) => {
    if (message.type === 'system') return;
    touchTimer = setTimeout(() => {
      if (!blockMenu) {
        setShowMenu(true);
        setMenuPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    }, 250); // délai réduit à 250ms
  };
  const handleTouchEnd = () => clearTimeout(touchTimer);

  // Détection mobile
  const isMobile = typeof window !== 'undefined' && /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);

  const handleClick = (e: React.MouseEvent) => {
    if (!isMobile) return;
    if (message.type === 'system') return;
    e.preventDefault();
    setShowMenu(true);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleReplyMenu = () => {
    setShowMenu(false);
    if (onReply) onReply(message);
  };
  const handleCloseMenu = () => setShowMenu(false);

  // Affichage du menu contextuel toujours en bas de la bulle
  React.useEffect(() => {
    if (showMenu && bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      if (isOwnMessage) {
        setMenuPos({ x: rect.right, y: rect.bottom }); // à droite pour ses propres messages
      } else {
        setMenuPos({ x: rect.left, y: rect.bottom }); // à gauche pour les autres
      }
    }
  }, [showMenu, isOwnMessage]);

  // Empêche le menu contextuel sur clic ou appui long image
  const handleImageEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    blockMenu = true;
    if (e.type === 'click') setModalOpen(true);
  };

  return (
    <div
      className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={bubbleRef}
    >
      <div className={`group rounded-xl px-2 sm:px-4 py-1 sm:py-2 mb-0.5 max-w-[90vw] sm:max-w-lg shadow-lg border-2 ${isOwnMessage ? 'bg-red-700/80 border-white text-white' : 'bg-black/80 border-red-700 text-white'} relative`}>
        {/* Affichage de la citation si replyTo existe */}
        {message.replyTo && (
          <div className="mb-2 px-3 py-1 bg-black/95 border-l-4 border-red-700 rounded-lg shadow-inner max-w-[260px] sm:max-w-[360px] flex items-center gap-2">
            {message.replyTo.type === 'file' && message.replyTo.fileData && message.replyTo.fileType && message.replyTo.fileType.startsWith('image/') ? (
              <>
                <img src={message.replyTo.fileData} alt="miniature" className="w-16 h-16 object-cover rounded border-2 border-white bg-black" style={{maxWidth:64,maxHeight:64}} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-red-400 font-mono mb-0.5 truncate">{message.replyTo.username}</span>
                  {message.replyTo.fileName && (
                    <span className="text-xs text-gray-200 font-mono break-words truncate">{message.replyTo.fileName}</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-red-400 font-mono mb-0.5 truncate">{message.replyTo.username}</span>
                <span className="text-xs text-gray-200 font-mono break-words truncate">
                  {message.replyTo.type === 'text' ? (message.replyTo.content?.slice(0, 60) || '') : message.replyTo.type === 'audio' ? '[Vocal]' : message.replyTo.type === 'gif' ? '[GIF]' : '[Message]'}
                </span>
              </div>
            )}
          </div>
        )}
        {message.username && message.type !== 'system' && (
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-300 mb-1 block font-mono flex items-center gap-2">
            {isOwnMessage ? 'Vous' : message.username}
          </span>
        )}
        {renderContent()}
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
        {/* Menu contextuel pour répondre */}
        {showMenu && menuPos && (
          <div
            className="fixed z-50 bg-black border border-red-700 rounded shadow-lg text-xs text-white font-mono animate-fade-in"
            style={{ top: menuPos.y, left: isOwnMessage ? undefined : menuPos.x, right: isOwnMessage ? `calc(100vw - ${menuPos.x}px)` : 'auto', minWidth: 110 }}
            onClick={handleCloseMenu}
          >
            <button
              className="block w-full text-left px-4 py-2 hover:bg-red-700/80 hover:text-white"
              onClick={e => { e.stopPropagation(); handleReplyMenu(); }}
            >
              ↩️ Répondre
            </button>
            {isOwnMessage && onDeleteMessage && (
              <button
                className="block w-full text-left px-4 py-2 bg-black text-red-400 font-mono hover:bg-red-700/80 hover:text-white border-t border-red-700 transition-colors"
                onClick={e => { e.stopPropagation(); onDeleteMessage(message.id); handleCloseMenu(); }}
              >
                🗑️ Supprimer
              </button>
            )}
            <button
              className="block w-full text-left px-4 py-2 bg-black text-red-400 font-mono hover:bg-gray-800 hover:text-red-400 border-t border-red-700 transition-colors"
              onClick={e => { e.stopPropagation(); handleCloseMenu(); }}
            >
              ✖️ Annuler
            </button>
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