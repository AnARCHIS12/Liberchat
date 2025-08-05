import { useState, useEffect } from 'react';

export interface CustomTheme {
  id: string;
  name: string;
  css: string;
  isActive: boolean;
}

const DEFAULT_THEMES: CustomTheme[] = [
  {
    id: 'anarchist-red',
    name: '🏴 Rouge Anarchiste',
    css: `
      :root {
        --bg-primary: #1a0000;
        --bg-secondary: #330000;
        --text-primary: #ff4444;
        --accent: #cc0000;
      }
      body { background: var(--bg-primary) !important; color: var(--text-primary) !important; }
      .bg-black, .bg-gray-900, .bg-white { background: var(--bg-secondary) !important; }
      .border-red-700 { border-color: var(--accent) !important; }
      .text-white, .text-black { color: var(--text-primary) !important; }
      .bg-gray-800 { background: var(--bg-secondary) !important; }
    `,
    isActive: false
  },
  {
    id: 'cyberpunk',
    name: '🌆 Cyberpunk',
    css: `
      :root {
        --bg-primary: #0a0a0a;
        --bg-secondary: #1a1a2e;
        --text-primary: #00ff41;
        --accent: #ff0080;
      }
      body { background: linear-gradient(45deg, var(--bg-primary), var(--bg-secondary)) !important; color: var(--text-primary) !important; }
      .bg-black, .bg-gray-900, .bg-white { background: var(--bg-secondary) !important; }
      .border-red-700 { border-color: var(--accent) !important; }
      .text-red-400, .text-red-300 { color: var(--accent) !important; }
      .text-white, .text-black { color: var(--text-primary) !important; }
      .bg-gray-800 { background: var(--bg-secondary) !important; }
    `,
    isActive: false
  },
  {
    id: 'light-blue',
    name: '☀️ Bleu Clair',
    css: `
      :root {
        --bg-primary: #e3f2fd;
        --bg-secondary: #bbdefb;
        --text-primary: #0d47a1;
        --accent: #1976d2;
      }
      body { background: var(--bg-primary) !important; color: var(--text-primary) !important; }
      .bg-black, .bg-gray-900, .bg-white, .bg-gray-800 { background: var(--bg-secondary) !important; }
      .border-red-700 { border-color: var(--accent) !important; }
      .text-white, .text-black, .text-red-400, .text-red-300 { color: var(--text-primary) !important; }
      .bg-red-700 { background: var(--accent) !important; }
    `,
    isActive: false
  }
];

export const useCustomThemes = () => {
  const [themes, setThemes] = useState<CustomTheme[]>(DEFAULT_THEMES);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);


  useEffect(() => {
    const saved = localStorage.getItem('liberchat-custom-themes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThemes(parsed.themes || DEFAULT_THEMES);
        setActiveTheme(parsed.activeTheme || null);
      } catch (e) {
        console.error('Erreur lors du chargement des thèmes:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('liberchat-custom-themes', JSON.stringify({
      themes,
      activeTheme
    }));
  }, [themes, activeTheme]);

  const applyTheme = (themeId: string | null) => {
    // Supprimer l'ancien thème
    const existingStyle = document.getElementById('custom-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (themeId) {
      const theme = themes.find(t => t.id === themeId);
      if (theme) {
        const style = document.createElement('style');
        style.id = 'custom-theme-style';
        style.textContent = theme.css;
        document.head.appendChild(style);
      }
    }

    setActiveTheme(themeId);
    setThemes(prev => prev.map(t => ({ ...t, isActive: t.id === themeId })));
  };

  const addTheme = (theme: Omit<CustomTheme, 'id' | 'isActive'>) => {
    const newTheme: CustomTheme = {
      ...theme,
      id: `custom-${Date.now()}`,
      isActive: false
    };
    setThemes(prev => [...prev, newTheme]);
    return newTheme.id;
  };

  const updateTheme = (id: string, updates: Partial<CustomTheme>) => {
    setThemes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTheme = (id: string) => {
    if (activeTheme === id) {
      applyTheme(null);
    }
    setThemes(prev => prev.filter(t => t.id !== id));
  };

  return {
    themes,
    activeTheme,
    applyTheme,
    addTheme,
    updateTheme,
    deleteTheme
  };
};