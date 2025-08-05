import React, { useState } from 'react';
import { CustomTheme } from '../hooks/useCustomThemes';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  themes: CustomTheme[];
  activeTheme: string | null;
  onApplyTheme: (themeId: string | null) => void;
  onAddTheme: (theme: Omit<CustomTheme, 'id' | 'isActive'>) => string;
  onUpdateTheme: (id: string, updates: Partial<CustomTheme>) => void;
  onDeleteTheme: (id: string) => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen,
  onClose,
  themes,
  activeTheme,
  onApplyTheme,
  onAddTheme,
  onUpdateTheme,
  onDeleteTheme
}) => {
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeCSS, setNewThemeCSS] = useState('');

  if (!isOpen) return null;

  const handleSaveTheme = () => {
    if (editingTheme) {
      onUpdateTheme(editingTheme.id, { name: newThemeName, css: newThemeCSS });
      setEditingTheme(null);
    } else {
      onAddTheme({ name: newThemeName, css: newThemeCSS });
    }
    setNewThemeName('');
    setNewThemeCSS('');
  };

  const startEditing = (theme: CustomTheme) => {
    setEditingTheme(theme);
    setNewThemeName(theme.name);
    setNewThemeCSS(theme.css);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-4 border-red-700 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-red-400 font-mono">🖍️ Thèmes Personnalisables</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 text-2xl font-bold"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Thèmes existants */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Thèmes disponibles</h3>
          <div className="grid gap-3">
            <button
              onClick={() => onApplyTheme(null)}
              className={`p-3 rounded-lg border-2 text-left transition ${
                !activeTheme 
                  ? 'border-red-700 bg-red-700/20 text-red-400' 
                  : 'border-gray-600 bg-gray-800 text-white hover:border-red-700'
              }`}
            >
              <div className="font-bold">🌙 Thème par défaut</div>
              <div className="text-sm text-gray-400">Thème original de LiberChat (s'adapte au mode light/dark)</div>
            </button>
            
            {themes.map(theme => (
              <div key={theme.id} className={`p-3 rounded-lg border-2 transition ${
                theme.id === activeTheme 
                  ? 'border-red-700 bg-red-700/20' 
                  : 'border-gray-600 bg-gray-800'
              }`}>
                <div className="flex justify-between items-start">
                  <button
                    onClick={() => onApplyTheme(theme.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-bold text-white">{theme.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {theme.css.length > 100 ? `${theme.css.substring(0, 100)}...` : theme.css}
                    </div>
                  </button>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEditing(theme)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    {!theme.id.startsWith('anarchist-') && !theme.id.startsWith('cyberpunk') && (
                      <button
                        onClick={() => onDeleteTheme(theme.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Créer/Modifier un thème */}
        <div className="border-t-2 border-gray-700 pt-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingTheme ? 'Modifier le thème' : 'Créer un nouveau thème'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white font-bold mb-2">Nom du thème</label>
              <input
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                className="w-full p-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:border-red-700 focus:outline-none"
                placeholder="Ex: Mon thème personnalisé"
              />
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">CSS personnalisé</label>
              <textarea
                value={newThemeCSS}
                onChange={(e) => setNewThemeCSS(e.target.value)}
                className="w-full h-40 p-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white font-mono text-sm focus:border-red-700 focus:outline-none"
                placeholder={`:root {
  --bg-primary: #000000;
  --text-primary: #ffffff;
}
body { background: var(--bg-primary) !important; }
.text-white, .text-black { color: var(--text-primary) !important; }
.bg-white, .bg-black, .bg-gray-900 { background: var(--bg-primary) !important; }`}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSaveTheme}
                disabled={!newThemeName.trim() || !newThemeCSS.trim()}
                className="bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition"
              >
                {editingTheme ? 'Mettre à jour' : 'Créer le thème'}
              </button>
              
              {editingTheme && (
                <button
                  onClick={() => {
                    setEditingTheme(null);
                    setNewThemeName('');
                    setNewThemeCSS('');
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-bold transition"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Aide CSS */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <h4 className="text-white font-bold mb-2">💡 Aide CSS</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p><code className="bg-gray-700 px-1 rounded">body</code> - Arrière-plan principal</p>
            <p><code className="bg-gray-700 px-1 rounded">.bg-black, .bg-gray-900, .bg-white</code> - Zones de fond (modes light/dark)</p>
            <p><code className="bg-gray-700 px-1 rounded">.text-white, .text-black</code> - Texte principal (modes light/dark)</p>
            <p><code className="bg-gray-700 px-1 rounded">.border-red-700</code> - Bordures rouges</p>
            <p><code className="bg-gray-700 px-1 rounded">.text-red-400</code> - Texte rouge</p>
            <p><code className="bg-gray-700 px-1 rounded">:root</code> - Variables CSS personnalisées</p>
            <p className="text-yellow-400 font-bold">💡 Les thèmes fonctionnent en mode dark uniquement !</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;