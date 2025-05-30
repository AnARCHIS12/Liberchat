import React from 'react';
import icon from '../../icon.png';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-black border-b-2 border-red-900 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto">
      <img src={icon} alt="Liberchat Logo" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
      <h1 className="text-lg sm:text-2xl font-bold text-red-600 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Impact, sans-serif' }}>
        LiberChat
      </h1>
    </header>
  );
};

export default Header;
