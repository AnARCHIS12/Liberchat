import React from 'react';
import icon from '../../icon.png';

interface HeaderProps {
  onLogout?: () => void;
  isLoggedIn?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogout, isLoggedIn }) => {
  return (
    <header className="w-full bg-black border-b-2 border-red-900 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4">
        <img src={icon} alt="Liberchat Logo" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
        <h1 className="text-lg sm:text-2xl font-bold text-red-600 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Impact, sans-serif' }}>
          LiberChat
        </h1>
      </div>
      {isLoggedIn && onLogout && (
        <button
          onClick={onLogout}
          className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-medium rounded transition-colors"
        >
          Déconnexion
        </button>
      )}
    </header>
  );
};

export default Header;
