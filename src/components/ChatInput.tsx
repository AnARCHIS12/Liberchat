import React, { useState, useEffect, useCallback } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import debounce from 'lodash/debounce';
import { searchGifs, getTrendingGifs } from '../config/giphy';

// Cache pour les GIFs
const gifCache = new Map<string, any[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendFile: (file: File) => void;
  onSendGif: (gifMessage: string) => void;
  isConnected: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendFile, onSendGif, isConnected }) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [gifQuery, setGifQuery] = useState('');
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const GIFS_PER_PAGE = 12;

  // Nettoyage du cache des GIFs
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now();
      for (const [key, [timestamp]] of gifCache.entries()) {
        if (now - timestamp > CACHE_DURATION) {
          gifCache.delete(key);
        }
      }
    };
    
    const interval = setInterval(cleanupCache, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  // Recherche de GIFs avec debounce
  const debouncedGifSearch = useCallback(
    debounce(async (query: string, pageNum: number) => {
      if (!query.trim()) {
        setGifResults([]);
        setGifError(null);
        return;
      }

      setIsLoadingGifs(true);
      setGifError(null);

      try {
        if (!import.meta.env.VITE_GIPHY_API_KEY) {
          throw new Error('Clé API Giphy non configurée');
        }

        const cacheKey = `${query}-${pageNum}`;
        if (gifCache.has(cacheKey)) {
          const [timestamp, cachedResults] = gifCache.get(cacheKey)!;
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log('Utilisation du cache pour la recherche:', query);
            setGifResults(prev => pageNum === 0 ? cachedResults : [...prev, ...cachedResults]);
            return;
          }
          gifCache.delete(cacheKey);
        }

        const results = await searchGifs(query, GIFS_PER_PAGE, pageNum * GIFS_PER_PAGE);
        
        if (results.length === 0) {
          console.log('Aucun résultat trouvé pour la recherche:', query);
          setGifError('Aucun GIF trouvé pour cette recherche');
          return;
        }

        console.log(`${results.length} GIFs trouvés pour la recherche:`, query);
        gifCache.set(cacheKey, [Date.now(), results]);
        setGifResults(prev => pageNum === 0 ? results : [...prev, ...results]);
      } catch (error: any) {
        console.error('Erreur détaillée lors de la recherche de GIFs:', {
          message: error.message,
          stack: error.stack,
          query: query
        });
        
        let errorMessage = 'Erreur lors de la recherche de GIFs.';
        if (error.message.includes('API Giphy non configurée')) {
          errorMessage = 'Configuration Giphy manquante.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Trop de requêtes, veuillez réessayer plus tard.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Problème d\'authentification Giphy.';
        }

        setGifError(errorMessage);
        setGifResults([]);
      } finally {
        setIsLoadingGifs(false);
      }
    }, 300),
    []
  );

  // Effet pour la recherche de GIFs
  useEffect(() => {
    if (showGif) {
      if (gifQuery) {
        debouncedGifSearch(gifQuery, page);
      } else {
        // Charger les GIFs tendance si aucune recherche n'est en cours
        const loadTrending = async () => {
          try {
            setIsLoadingGifs(true);
            const results = await getTrendingGifs(GIFS_PER_PAGE, page * GIFS_PER_PAGE);
            setGifResults(prev => page === 0 ? results : [...prev, ...results]);
          } catch (error) {
            console.error('Erreur lors du chargement des GIFs tendance:', error);
            setGifError('Erreur lors du chargement des GIFs');
          } finally {
            setIsLoadingGifs(false);
          }
        };
        loadTrending();
      }
    }
    return () => debouncedGifSearch.cancel();
  }, [gifQuery, page, showGif]);

  // Gestion du scroll infini
  const handleGifScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop === clientHeight && !isLoadingGifs && !gifError) {
      setPage(prev => prev + 1);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && isConnected) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 50 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 50MB)');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Seules les images sont acceptées');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = e.target?.result as string;
        if (!fileData) {
          alert('Erreur lors de la lecture du fichier');
          return;
        }
        onSendFile(file);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Erreur lors de la lecture du fichier');
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
    setShowEmoji(false);
  };


  const handleGifSelect = (gif: any) => {
    if (!isConnected) {
      console.error('Non connecté au serveur');
      return;
    }

    alert('GIF sélectionné, tentative d’envoi !');
    console.log('GIF sélectionné:', gif);

    if (!gif || !gif.images || !gif.images.original || !gif.images.original.url) {
      console.error('Format de GIF invalide:', gif);
      return;
    }

    const messageData = {
      type: 'gif',
      gifUrl: gif.images.original.url,
      content: '',
      timestamp: Date.now()
    };
    
    console.log('Envoi du message GIF:', messageData);
    if (typeof onSendGif === 'function') {
      onSendGif(JSON.stringify(messageData));
    } else {
      alert('Erreur : la fonction onSendGif n’est pas définie !');
      console.error('onSendGif n’est pas une fonction', onSendGif);
    }
    setShowGif(false);
    setGifQuery('');
    setGifResults([]);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 bg-black border-t-4 border-red-700 p-2 sm:p-4 relative">
      <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-none">
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className="flex-shrink-0 p-2 h-10 bg-black border-2 border-white rounded-lg hover:bg-red-700/20 transition-colors"
        >
          😀
        </button>
        <button
          type="button"
          onClick={() => {
            setShowGif(v => !v);
            if (!showGif) {
              setPage(0);
              setGifResults([]);
              setGifError(null);
            }
          }}
          className="flex-shrink-0 p-2 h-10 bg-black border-2 border-white rounded-lg hover:bg-red-700/20 transition-colors"
        >
          GIF
        </button>
        <label className="flex-shrink-0 cursor-pointer p-2 h-10 bg-red-700 text-white rounded-lg border-2 border-white hover:bg-black hover:text-red-700 transition-colors">
          📎
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={!isConnected}
          />
        </label>
      </div>

      <div className="flex-1 relative order-3 sm:order-none">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 bg-black border-2 border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 text-sm sm:text-base font-mono shadow"
          placeholder={isConnected ? "Écrivez un message révolutionnaire..." : "Connexion au serveur..."}
          maxLength={500}
          autoComplete="off"
          disabled={!isConnected}
        />

        {showEmoji && (
          <div className="absolute bottom-full left-0 mb-2 z-50">
            <Picker 
              data={data} 
              onEmojiSelect={handleEmojiSelect}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>
        )}

        {showGif && (
          <div className="absolute bottom-full left-0 mb-2 z-50 bg-black p-2 rounded-lg border-2 border-red-700 w-full sm:w-96">
            <input
              value={gifQuery}
              onChange={e => {
                setGifQuery(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 rounded bg-black border border-red-700 text-white mb-2"
              placeholder="Rechercher un GIF..."
            />
            <div 
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 sm:max-h-64 overflow-y-auto" 
              onScroll={handleGifScroll}
            >
              {gifResults.map(gif => (
                <img
                  key={gif.id}
                  src={gif.images.fixed_height_small.url}
                  alt="gif"
                  className="w-full h-24 object-cover cursor-pointer rounded hover:opacity-80 transition-opacity"
                  onClick={() => handleGifSelect(gif)}
                  loading="lazy"
                />
              ))}
              {isLoadingGifs && (
                <div className="col-span-2 sm:col-span-3 text-center py-2 text-white">
                  Chargement...
                </div>
              )}
              {gifError && (
                <div className="col-span-2 sm:col-span-3 text-center py-2 text-red-500">
                  {gifError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-red-700 to-black text-white font-bold rounded-lg border-2 border-white hover:from-black hover:to-red-700 transition-all text-sm sm:text-base uppercase tracking-widest shadow order-2 sm:order-none"
        disabled={!isConnected || !message.trim()}
      >
        {isConnected ? 'Envoyer' : '...'}
      </button>
    </form>
  );
};

export default ChatInput;