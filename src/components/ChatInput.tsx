import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendFile: (file: File) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendFile }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Vérifier la taille du fichier
      if (file.size > 50 * 1024 * 1024) { // 50MB
        alert('Le fichier est trop volumineux (max 50MB)');
        return;
      }

      // Vérifier le type de fichier
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
      reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      alert('Erreur lors du traitement du fichier');
    }
  };

  return (
    <div className="p-4 bg-black">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
          placeholder="MESSAGE AUX CAMARADES..."
          className="flex-1 px-4 py-2 bg-black border-2 border-red-900 text-red-100 placeholder-red-800 focus:outline-none focus:border-red-600"
        />
        <label className="cursor-pointer px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-100 border border-red-700 transition-colors flex items-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <span>📷</span>
        </label>
        <button
          onClick={(e) => handleSubmit(e)}
          className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-100 border border-red-700 transition-colors"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatInput;