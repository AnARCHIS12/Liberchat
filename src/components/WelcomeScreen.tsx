import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

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
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <MessageSquare className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">LiberChat</h1>
          <p className="text-gray-400 text-center">
            Communiquez librement et en toute sécurité
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              placeholder="Entrez votre nom"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Rejoindre le chat
          </button>
        </form>
      </div>
    </div>
  );
};