import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 80,
    strictPort: true,
<<<<<<< HEAD
    origin: 'https://q8znls9b-8443.uks1.devtunnels.ms',
    proxy: {
      '/api': {
        target: 'https://q8znls9b-8443.uks1.devtunnels.ms',
=======
    origin: 'https://q8znls9b-8443.uks1.devtunnels.ms/',
    proxy: {
      '/api': {
        target: 'https://q8znls9b-8443.uks1.devtunnels.ms/',
>>>>>>> 5a4f62be21b7cbf35a256767916ff84e0ba9e961
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      clientPort: 8443,
    },
  },
})
