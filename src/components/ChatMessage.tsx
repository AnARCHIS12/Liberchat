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
  edited?: boolean; // Ajout du flag pour afficher (modifié)
}

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  onDeleteMessage?: (id: number) => void;
  onReply?: (msg: Message) => void;
  socket?: any;
  symmetricKey?: CryptoKey | string | null;
  encryptMessageE2EE?: (msg: string, key: CryptoKey | string) => Promise<any>;
  encryptMessageFallback?: (msg: string, key: string) => any;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage, onDeleteMessage, onReply, socket, symmetricKey, encryptMessageE2EE, encryptMessageFallback }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.type === 'text' ? message.content || '' : '');
  const [editFile, setEditFile] = useState<File | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [audioError, setAudioError] = React.useState(false);

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
          {message.edited && (
            <span className="text-xs text-gray-400 ml-2">(modifié)</span>
          )}
        </p>
      );
    } else if (message.type === 'file') {
      if (message.fileType?.startsWith('image/')) {
        return (
          <div className="max-w-[160px] sm:max-w-[220px] flex flex-col items-center">
            <img 
              src={message.fileData} 
              alt={message.fileName || 'Image'}
              className="w-full rounded-lg shadow-lg border-2 border-red-700 bg-black cursor-zoom-in hover:scale-105 transition"
              onClick={handleImageEvent}
              onContextMenu={handleImageEvent}
              onTouchStart={handleImageEvent}
            />
            <p className="text-xs sm:text-sm text-red-300 mt-1 truncate font-mono break-all max-w-full overflow-hidden">{message.fileName}</p>
            {message.edited && (
              <span className="text-xs text-gray-400 mt-1">(modifié)</span>
            )}
            {modalOpen && (
              <ImageModal src={message.fileData!} alt={message.fileName} onClose={() => { setModalOpen(false); setShowMenu(false); }} />
            )}
          </div>
        );
      }
      return <span className="text-red-400 text-xs sm:text-sm">Fichier non supporté</span>;
    } else if (message.type === 'audio' && message.fileData) {
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
          {message.edited && (
            <span className="text-xs text-gray-400 mt-1">(modifié)</span>
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

  const confirmDelete = () => {
    setShowConfirm(false);
    if (onDeleteMessage && typeof message.id === 'number') {
      onDeleteMessage(message.id);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  const handleReplyMenu = () => {
    setShowMenu(false);
    if (onReply) onReply(message);
  };
  const handleCloseMenu = () => {
    setShowMenu(false);
    setMenuPos(null);
  };

  // Empêche le menu contextuel sur clic ou appui long image
  const handleImageEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (e.type === 'click') setModalOpen(true);
  };

  // Ajout de la gestion de la modification
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.type === 'text') {
      if (editValue.trim() && editValue !== message.content && socket) {
        socket.emit('edit message', { id: message.id, content: editValue });
      }
      setIsEditing(false);
    } else if ((message.type === 'file' || message.type === 'audio') && editFile && socket && symmetricKey && encryptMessageE2EE && encryptMessageFallback) {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result as string;
        let encryptedFile;
        if (window.crypto && window.crypto.subtle && typeof symmetricKey !== 'string') {
          encryptedFile = await encryptMessageE2EE(fileData, symmetricKey);
        } else if (typeof symmetricKey === 'string') {
          encryptedFile = encryptMessageFallback(fileData, symmetricKey);
        } else {
          alert('Aucune méthode de chiffrement disponible pour les fichiers.');
          return;
        }
        socket.emit('edit message', {
          id: message.id,
          fileData: JSON.stringify(encryptedFile),
          fileType: editFile.type,
          fileName: editFile.name
        });
        setIsEditing(false);
        setEditFile(null);
      };
      reader.readAsDataURL(editFile);
    } else {
      setIsEditing(false);
    }
  };

  // Gestion appui long mobile pour menu contextuel
  let touchTimer: NodeJS.Timeout;
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((isEditing && message.type === 'audio') || message.type === 'system') return;
    touchTimer = setTimeout(() => {
      if (isMobile()) {
        // Centre le menu sur mobile
        setMenuPos({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      } else {
        setMenuPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
      setShowMenu(true);
    }, 100);
  };
  const handleTouchEnd = () => {
    clearTimeout(touchTimer);
  };

  // Synchronise editValue avec le message courant à chaque ouverture de l'édition
  React.useEffect(() => {
    if (isEditing && message.type === 'text') {
      setEditValue(message.content || '');
    }
  }, [isEditing, message.content, message.type]);

  // Gestion clic droit desktop pour menu contextuel
  const handleContextMenu = (e: React.MouseEvent) => {
    if (isEditing && message.type === 'audio') return;
    e.preventDefault();
    if (isMobile()) {
      setMenuPos({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    } else {
      setMenuPos({ x: e.clientX, y: e.clientY });
    }
    setShowMenu(true);
  };

  return (
    <div
      className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      ref={bubbleRef}
    >
      <div className={`group rounded-xl px-2 sm:px-4 py-1 sm:py-2 mb-0.5 max-w-[90vw] sm:max-w-lg shadow-lg border-2 ${isOwnMessage ? 'bg-red-700/80 border-white text-white' : 'bg-black/80 border-red-700 text-white'} relative overflow-x-auto`}>
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
            ) : message.replyTo.type === 'audio' && message.replyTo.fileData ? (
              <>
                <audio src={message.replyTo.fileData} controls controlsList="nodownload noplaybackrate" className="w-24 h-8 mr-2 align-middle rounded border border-red-700 bg-black" style={{minWidth:80,maxWidth:120}} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-red-400 font-mono mb-0.5 truncate">{message.replyTo.username}</span>
                  <span className="text-xs text-gray-200 font-mono break-words truncate">{message.replyTo.fileName || 'Message vocal'}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-red-400 font-mono mb-0.5 truncate">{message.replyTo.username}</span>
                <span className="text-xs text-gray-200 font-mono break-words truncate">
                  {message.replyTo.type === 'text' ? (message.replyTo.content?.slice(0, 60) || '') : message.replyTo.type === 'gif' ? '[GIF]' : '[Message]'}
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
        {isEditing && message.type === 'text' ? (
          <form onSubmit={handleEditSubmit} className="flex gap-2 items-center">
            <input
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="flex-1 px-2 py-1 rounded border border-red-700 text-black font-mono"
              autoFocus
              maxLength={500}
            />
            <button type="submit" className="bg-red-700 text-white px-2 py-1 rounded font-mono">OK</button>
            <button type="button" onClick={() => { setIsEditing(false); setEditFile(null); }} className="bg-black text-red-400 px-2 py-1 rounded font-mono">Annuler</button>
          </form>
        ) : (
          renderContent()
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
        {/* Menu contextuel pour répondre/modifier/supprimer */}
        {showMenu && (
          isMobile() ? (
            // Menu mobile façon Signal : petit menu flottant centré sous le doigt (plus petit)
            <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>
              <div
                className="absolute bg-black border border-red-700 rounded-xl shadow-xl text-sm text-white font-mono w-40 max-w-[90vw] py-1"
                style={{
                  left: (menuPos?.x ?? window.innerWidth / 2) - 80, // w-40 = 160px
                  top: (menuPos?.y ?? window.innerHeight / 2) + 8,
                  minWidth: 120,
                  pointerEvents: 'auto',
                  transition: 'none',
                  animation: 'none',
                }}
              >
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-red-700/80 hover:text-white"
                  onClick={e => { e.stopPropagation(); handleReplyMenu(); }}
                >
                  ↩️ Répondre
                </button>
                {isOwnMessage && message.type === 'text' && (
                  <button
                    className="block w-full text-left px-3 py-2 text-red-400 font-mono hover:bg-red-700/80 hover:text-white border-t border-red-700 transition-colors"
                    onClick={e => { e.stopPropagation(); setShowMenu(false); setIsEditing(true); setEditValue(message.content || ''); }}
                  >
                    ✏️ Modifier
                  </button>
                )}
                {isOwnMessage && onDeleteMessage && (
                  <button
                    className="block w-full text-left px-3 py-2 text-red-400 font-mono hover:bg-red-700/80 hover:text-white border-t border-red-700 transition-colors"
                    onClick={e => { e.stopPropagation(); onDeleteMessage(message.id); handleCloseMenu(); }}
                  >
                    🗑️ Supprimer
                  </button>
                )}
                <button
                  className="block w-full text-left px-3 py-2 text-gray-400 font-mono hover:bg-gray-800 hover:text-white border-t border-red-700 transition-colors"
                  onClick={e => { e.stopPropagation(); handleCloseMenu(); }}
                >
                  ✖️ Annuler
                </button>
              </div>
            </div>
          ) : (
            // Menu desktop classique
            menuPos && (
              <div
                ref={menuRef}
                className="fixed z-50 bg-black border border-red-700 rounded shadow-lg text-xs text-white font-mono w-64 max-w-[90vw] py-2"
                style={{
                  top: menuPos.y,
                  left: menuPos.x,
                  minWidth: 110,
                  transition: 'none',
                  animation: 'none',
                }}
              >
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-red-700/80 hover:text-white"
                  onClick={e => { e.stopPropagation(); handleReplyMenu(); }}
                >
                  ↩️ Répondre
                </button>
                {isOwnMessage && message.type === 'text' && (
                  <button
                    className="block w-full text-left px-4 py-2 bg-black text-red-400 font-mono hover:bg-red-700/80 hover:text-white border-t border-red-700 transition-colors"
                    onClick={e => { e.stopPropagation(); setShowMenu(false); setIsEditing(true); setEditValue(message.content || ''); }}
                  >
                    ✏️ Modifier
                  </button>
                )}
                {isOwnMessage && onDeleteMessage && (
                  <button
                    className="block w-full text-left px-4 py-2 bg-black text-red-400 font-mono hover:bg-red-700/80 hover:text-white border-t border-red-700 transition-colors"
                    onClick={e => { e.stopPropagation(); onDeleteMessage(message.id); handleCloseMenu(); }}
                  >
                    🗑️ Supprimer
                  </button>
                )}
                <button
                  className="block w-full text-left px-4 py-2 bg-black text-red-400 font-mono hover:bg-gray-800 hover:text-white border-t border-red-700 transition-colors"
                  onClick={e => { e.stopPropagation(); handleCloseMenu(); }}
                >
                  ✖️ Annuler
                </button>
              </div>
            )
          )
        )}
      </div>
      <span className="ml-1 sm:ml-2 mt-0.5 text-[10px] sm:text-xs text-gray-400 font-mono opacity-80">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
};

// Helper mobile
function isMobile() {
  return typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

export default ChatMessage;