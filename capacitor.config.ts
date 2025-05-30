import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '.liberchat',
  appName: 'Liberchat',
  webDir: 'dist',
  server: {
    url: 'https://liberchat-3-0-1.onrender.com',
    cleartext: true,
    allowNavigation: ['liberchat-3-0-1.onrender.com'],
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    backgroundColor: '#1a1a1a',
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    iconPath: 'public/images/liberchat-logo.svg'
  }
};

export default config;
