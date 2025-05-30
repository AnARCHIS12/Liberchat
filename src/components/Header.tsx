import React from 'react';
import icon from '../../icon.png';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-black border-b-2 border-red-900 px-4 py-3 flex items-center justify-center gap-4">
      <img src={icon} alt="Liberchat Logo" className="h-10 w-10" />
      <h1 className="text-2xl font-bold text-red-600 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
        LiberChat
      </h1>
    </header>
  );
};

export default Header;
