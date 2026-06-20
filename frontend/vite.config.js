import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
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
        origin: 'https://localhost:8443',
        proxy: {
            '/api': {
                target: 'https://localhost:8443',
                changeOrigin: true,
                ws: true,
                secure: false,
            },
        },
        hmr: {
            protocol: 'wss',
            host: 'localhost:8443',
            clientPort: 443,
        },
    },
});
