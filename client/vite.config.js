import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://16.178.179.217:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://16.178.179.217:5000',
        changeOrigin: true
      }
    }
  }
});
