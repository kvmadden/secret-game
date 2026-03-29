import { defineConfig } from 'vite';

export default defineConfig({
  base: '/secret-game/',
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
