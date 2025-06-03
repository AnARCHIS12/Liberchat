import React from 'react';
import icon from '../../icon.png';

interface HeaderProps {
  onLogout?: () => void;
  isLoggedIn?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogout, isLoggedIn = true }) => {
  return (
    <header className="w-full bg-black border-b-4 border-red-700 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-lg z-10">
      <div className="flex items-center gap-2 sm:gap-4">
        <img src={icon} alt="Liberchat Logo" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-white rounded-full bg-black shadow-md" />
        <h1 className="text-lg sm:text-2xl font-extrabold text-white uppercase tracking-widest" style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.15em' }}>
          LiberChat
        </h1>
        <span className="ml-2 px-2 py-1 bg-red-700 text-white text-xs rounded uppercase tracking-wider font-bold shadow hidden sm:inline">Commune</span>
        {/* Bouton VOC supprimé du header */}
      </div>
      {isLoggedIn && onLogout && (
        <button
          onClick={onLogout}
          className="px-2 sm:px-3 py-1 sm:py-1 text-xs sm:text-sm bg-gradient-to-r from-red-700 to-black text-white font-bold rounded border border-white hover:from-black hover:to-red-700 transition-all uppercase tracking-widest shadow ml-0 sm:ml-4 min-w-0 w-auto"
        >
          Déconnexion
        </button>
      )}
    </header>
  );
};

export default Header;
