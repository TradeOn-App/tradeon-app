import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'TradeOn',
        short_name: 'TradeOn',
        description: 'Plataforma de gestao de investimentos',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#003333',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Dados estáticos (moedas, redes) — cache mais longo
            urlPattern: /^https?:\/\/.*\/api\/(currencies|networks)/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-static-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 600,
              },
            },
          },
          {
            // Dados financeiros (dashboard, reports, transactions) — sempre busca da rede
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
