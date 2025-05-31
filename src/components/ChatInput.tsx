import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendFile: (file: File) => void;
  isConnected: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendFile, isConnected }) => {
  const [message, setMessage] = useState('');

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

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 sm:gap-2 bg-black border-t-4 border-red-700 px-2 sm:px-4 py-2 sm:py-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 px-2 sm:px-4 py-2 bg-black border-2 border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 text-sm sm:text-base font-mono shadow"
        placeholder={isConnected ? "Écrivez un message révolutionnaire..." : "Connexion au serveur..."}
        maxLength={500}
        autoComplete="off"
        disabled={!isConnected}
      />
      <label className={`cursor-pointer px-1 sm:px-2 py-1 bg-red-700 text-white rounded-lg border-2 border-white font-bold uppercase text-xs hover:bg-black hover:text-red-700 transition-all shadow ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
        📎
        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={!isConnected} />
      </label>
      <button
        type="submit"
        className="px-2 sm:px-4 py-2 bg-gradient-to-r from-red-700 to-black text-white font-bold rounded-lg border-2 border-white hover:from-black hover:to-red-700 transition-all text-sm sm:text-base uppercase tracking-widest shadow"
        disabled={!isConnected || !message.trim()}
      >
        {isConnected ? 'Envoyer' : '...'}
      </button>
    </form>
  );
};

export default ChatInput;