import React from 'react';
import icon from '../../icon.png';

interface HeaderProps {
  onLogout?: () => void;
  isLoggedIn?: boolean;
}

const Header: React.FC<HeaderProps & { theme?: 'light' | 'dark', onToggleTheme?: () => void }> = ({ onLogout, isLoggedIn = true, theme, onToggleTheme }) => {
  return (
    <header className="w-full bg-black border-b-4 border-red-700 px-1 sm:px-4 py-1.5 sm:py-3 flex items-center justify-between shadow-lg z-10 sticky top-0 left-0"
      style={{ minHeight: 48 }}>
      <div className="flex items-center gap-1 sm:gap-4 min-w-0">
        <img src={icon} alt="Liberchat Logo" className="h-7 w-7 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-white rounded-full bg-black shadow-md" />
        <h1 className="text-base sm:text-2xl font-extrabold text-white uppercase tracking-widest truncate" style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.15em', maxWidth: '40vw' }}>
          LiberChat
        </h1>
        <span className="ml-1 px-1 py-0.5 bg-red-700 text-white text-[10px] sm:text-xs rounded uppercase tracking-wider font-bold shadow hidden sm:inline">Commune</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {onToggleTheme && theme && (
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1 sm:gap-2 px-1 sm:px-3 py-1 rounded-full shadow border-2 border-red-700 font-bold font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-700
              ${theme === 'dark' ? 'bg-black/80 text-white hover:bg-white hover:text-red-700' : 'bg-white/90 text-black hover:bg-red-700 hover:text-white'} text-xs sm:text-base`}
            style={{ fontSize: undefined }}
            title={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
          >
            {theme === 'dark' ? (
              <span className="inline-flex items-center">☀️ <span className="ml-1 hidden sm:inline">Clair</span></span>
            ) : (
              <span className="inline-flex items-center">🌙 <span className="ml-1 hidden sm:inline">Sombre</span></span>
            )}
          </button>
        )}
        {isLoggedIn && onLogout && (
          <button
            onClick={onLogout}
            className="px-1 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-gradient-to-r from-red-700 to-black text-white font-bold rounded border border-white hover:from-black hover:to-red-700 transition-all uppercase tracking-widest shadow ml-0 sm:ml-4 min-w-0 w-auto"
          >
            Déconnexion
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;


export default Header;
