import React, { useState, FormEvent, ChangeEvent } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { UserList } from './UserList';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendFile: (file: File) => Promise<void>;
  isConnected: boolean;
  users: Array<{ username: string; socketId: string }>;
  currentUser: string;
}

interface EmojiData {
  native: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendFile, isConnected, users, currentUser }) => {
  const [message, setMessage] = useState<string>('');
  const [showEmoji, setShowEmoji] = useState<boolean>(false);

  const handleEmojiSelect = (emoji: EmojiData) => {
    setMessage(prev => prev + emoji.native);
    setShowEmoji(false);
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (message.trim() && isConnected) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
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
      await onSendFile(file);
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      alert('Erreur lors du traitement du fichier');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 flex flex-wrap items-end gap-2 bg-black border-t-4 border-red-700 p-2 sm:p-4 relative">
      <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-none">
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className="flex-shrink-0 p-2 h-10 bg-black border-2 border-white rounded-lg hover:bg-red-700/20 transition-colors"
        >
          😀
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
        <div className="block sm:hidden">
          <UserList users={users} currentUser={currentUser} isMobile={true} inChatInput={true} />
        </div>
      </div>

      <div className="flex-1 relative order-3 sm:order-none">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
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
      </div>

      <button
        type="submit"
        disabled={!message.trim() || !isConnected}
        className="flex-shrink-0 px-4 py-2 h-10 bg-red-700 text-white rounded-lg border-2 border-white hover:bg-black hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-none w-full sm:w-auto"
      >
        Envoyer
      </button>
    </form>
  );
};

export default ChatInput;