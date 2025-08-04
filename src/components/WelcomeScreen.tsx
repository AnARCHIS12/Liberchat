import React, { useState } from 'react';
import icon from '../../icon.png';

interface WelcomeScreenProps {
  onJoin: (username: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onJoin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin(username.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-black via-red-900 to-black flex items-center justify-center p-2 sm:p-4"
      role="main"
      aria-label="Écran d'accueil LiberChat"
    >
      <div 
        className="w-full max-w-md bg-black/90 rounded-xl shadow-2xl p-4 sm:p-8 border-4 border-red-700 relative flex flex-col items-center"
        role="dialog"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-description"
      >
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <img src={icon} alt="Logo LiberChat" className="w-20 h-20 sm:w-24 sm:h-24 mb-3 sm:mb-4 drop-shadow-lg border-4 border-white rounded-full bg-black" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 tracking-widest uppercase text-center" style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.15em' }}>
            LiberChat
          </h1>
          <p className="text-red-400 text-center text-base sm:text-lg font-semibold mb-1 uppercase tracking-wider">
            Ni dieu, ni maître, ni patron, ni État
          </p>
          <p className="text-gray-300 text-center text-xs sm:text-sm italic">
            La communication libre, par et pour le peuple
          </p>
        </div>
        <form 
          onSubmit={handleSubmit} 
          className="space-y-3 sm:space-y-4 w-full"
          role="form"
          aria-label="Formulaire de connexion au chat"
        >
          <div>
            <label 
              htmlFor="username" 
              className="block text-xs sm:text-sm font-bold text-red-200 mb-2 uppercase tracking-wider"
            >
              Nom de camarade
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-black border-2 border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 text-base sm:text-lg font-mono"
              placeholder="Entrez votre nom révolutionnaire"
              required
              maxLength={24}
              autoFocus
              aria-describedby="username-help"
              aria-invalid={username.length > 0 && username.length < 3 ? 'true' : 'false'}
            />
            <div 
              id="username-help" 
              className="sr-only"
            >
              Entrez un nom d'utilisateur entre 3 et 24 caractères pour rejoindre le chat
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-red-700 to-black text-white font-bold rounded-lg shadow-lg hover:from-black hover:to-red-700 transition-all text-base sm:text-lg uppercase tracking-widest border-2 border-white focus:ring-2 focus:ring-red-600"
            disabled={username.length < 3}
            aria-describedby="join-button-help"
          >
            Rejoindre la Commune !
          </button>
          <div 
            id="join-button-help" 
            className="sr-only"
          >
            Cliquez pour rejoindre le chat avec le nom d'utilisateur saisi
          </div>
        </form>
      </div>
      <div className="pointer-events-none select-none fixed bottom-2 left-0 w-full flex justify-center z-50">
        <span className="text-xs sm:text-xs text-gray-400 italic text-center block bg-black/70 px-2 sm:px-3 py-1 rounded-full">
          © 2025 – Vive l’entraide, vive la solidarité !
        </span>
      </div>
    </div>
  );
};