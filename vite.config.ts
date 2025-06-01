import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173, // Changement du port pour éviter les conflits
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      }
    }
  },
  build: {
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'video-vendor': ['simple-peer'],
          'emoji-vendor': ['@emoji-mart/data', '@emoji-mart/react']
        },
        assetFileNames: (assetInfo: { name?: string }) => {
          const name = assetInfo.name || '';
          if (name.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: ['emoji-mart'],
    exclude: ['lucide-react']
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'simple-peer': 'simple-peer/simplepeer.min.js',
    },
  }
});