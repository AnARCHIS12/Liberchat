import React, { useState, useEffect } from 'react';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'xlarge';
  dyslexiaFont: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
}

const AccessibilitySettingsModal: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<AccessibilitySettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (key: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="accessibility-title"
      aria-modal="true"
    >
      <div 
        className={`bg-black border-4 border-red-700 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto
          ${localSettings.highContrast ? 'bg-black text-white border-yellow-400' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            id="accessibility-title"
            className={`text-xl font-bold ${localSettings.highContrast ? 'text-yellow-400' : 'text-red-400'}`}
          >
            ♿ Accessibilité
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl hover:bg-red-700 rounded p-1 transition-colors
              ${localSettings.highContrast ? 'text-yellow-400 hover:bg-yellow-600' : 'text-white hover:bg-red-700'}`}
            aria-label="Fermer les paramètres d'accessibilité"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Contraste élevé */}
          <div className="flex items-center justify-between">
            <label 
              htmlFor="high-contrast"
              className={`font-semibold ${localSettings.highContrast ? 'text-yellow-400' : 'text-white'}`}
            >
              🔆 Contraste élevé
            </label>
            <button
              id="high-contrast"
              onClick={() => handleSettingChange('highContrast', !localSettings.highContrast)}
              className={`w-12 h-6 rounded-full transition-colors relative
                ${localSettings.highContrast ? 'bg-yellow-400' : 'bg-gray-600'}`}
              aria-pressed={localSettings.highContrast}
              role="switch"
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                ${localSettings.highContrast ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Taille de police */}
          <div>
            <label 
              className={`block font-semibold mb-2 ${localSettings.highContrast ? 'text-yellow-400' : 'text-white'}`}
            >
              📏 Taille de police
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['small', 'normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => handleSettingChange('fontSize', size)}
                  className={`p-2 rounded border-2 transition-colors
                    ${localSettings.fontSize === size 
                      ? (localSettings.highContrast ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-red-700 text-white border-red-700')
                      : (localSettings.highContrast ? 'border-yellow-400 text-yellow-400' : 'border-red-700 text-white')
                    }`}
                  aria-pressed={localSettings.fontSize === size}
                >
                  {size === 'small' && 'Petit'}
                  {size === 'normal' && 'Normal'}
                  {size === 'large' && 'Grand'}
                  {size === 'xlarge' && 'Très grand'}
                </button>
              ))}
            </div>
          </div>

          {/* Police dyslexie */}
          <div className="flex items-center justify-between">
            <label 
              htmlFor="dyslexia-font"
              className={`font-semibold ${localSettings.highContrast ? 'text-yellow-400' : 'text-white'}`}
            >
              📖 Police dyslexie
            </label>
            <button
              id="dyslexia-font"
              onClick={() => handleSettingChange('dyslexiaFont', !localSettings.dyslexiaFont)}
              className={`w-12 h-6 rounded-full transition-colors relative
                ${localSettings.dyslexiaFont ? (localSettings.highContrast ? 'bg-yellow-400' : 'bg-red-700') : 'bg-gray-600'}`}
              aria-pressed={localSettings.dyslexiaFont}
              role="switch"
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                ${localSettings.dyslexiaFont ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Réduction des animations */}
          <div className="flex items-center justify-between">
            <label 
              htmlFor="reduce-motion"
              className={`font-semibold ${localSettings.highContrast ? 'text-yellow-400' : 'text-white'}`}
            >
              🎭 Réduire les animations
            </label>
            <button
              id="reduce-motion"
              onClick={() => handleSettingChange('reduceMotion', !localSettings.reduceMotion)}
              className={`w-12 h-6 rounded-full transition-colors relative
                ${localSettings.reduceMotion ? (localSettings.highContrast ? 'bg-yellow-400' : 'bg-red-700') : 'bg-gray-600'}`}
              aria-pressed={localSettings.reduceMotion}
              role="switch"
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                ${localSettings.reduceMotion ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Support lecteur d'écran */}
          <div className="flex items-center justify-between">
            <label 
              htmlFor="screen-reader"
              className={`font-semibold ${localSettings.highContrast ? 'text-yellow-400' : 'text-white'}`}
            >
              🔊 Mode lecteur d'écran
            </label>
            <button
              id="screen-reader"
              onClick={() => handleSettingChange('screenReader', !localSettings.screenReader)}
              className={`w-12 h-6 rounded-full transition-colors relative
                ${localSettings.screenReader ? (localSettings.highContrast ? 'bg-yellow-400' : 'bg-red-700') : 'bg-gray-600'}`}
              aria-pressed={localSettings.screenReader}
              role="switch"
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                ${localSettings.screenReader ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Navigation clavier */}
          <div className="flex items-center justify-between">
            <label 
              htmlFor="keyboard-nav"
              className={`font-semibold ${localSettings.highContrast ? 'text-yellow-400' : 'text-white'}`}
            >
              ⌨️ Navigation clavier améliorée
            </label>
            <button
              id="keyboard-nav"
              onClick={() => handleSettingChange('keyboardNavigation', !localSettings.keyboardNavigation)}
              className={`w-12 h-6 rounded-full transition-colors relative
                ${localSettings.keyboardNavigation ? (localSettings.highContrast ? 'bg-yellow-400' : 'bg-red-700') : 'bg-gray-600'}`}
              aria-pressed={localSettings.keyboardNavigation}
              role="switch"
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                ${localSettings.keyboardNavigation ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className={`mt-6 p-3 rounded border-2 ${localSettings.highContrast ? 'border-yellow-400 bg-yellow-900/20' : 'border-red-700 bg-red-900/20'}`}>
          <p className={`text-sm ${localSettings.highContrast ? 'text-yellow-200' : 'text-gray-300'}`}>
            💡 <strong>Astuce :</strong> Ces paramètres sont sauvegardés localement et s'appliquent immédiatement.
          </p>
        </div>

        <button
          onClick={onClose}
          className={`w-full mt-4 py-2 px-4 rounded font-bold transition-colors
            ${localSettings.highContrast 
              ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
              : 'bg-red-700 text-white hover:bg-red-800'}`}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default AccessibilitySettingsModal;