/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: '/react-finances/',
    define: {
      GLOBAL_APP_VERSION: JSON.stringify(packageJson.version),
      GLOBAL_NAME: JSON.stringify(packageJson.name),
      GLOBAL_AUTHOR: JSON.stringify(packageJson.author.name),
      GLOBAL_GITHUB_URL: JSON.stringify(packageJson.repository.url),
    },
    plugins: [
      react(),
      VitePWA({
        manifest: {
          name: 'Finances',
          short_name: 'Finances',
          theme_color: '#242424',
          background_color: '#242424',
          icons: [
            {
              src: '/icon-chicken/web/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-chicken/web/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icon-chicken/web/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-chicken/web/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    // NOTE: hmr disabled makes tailwind to not work properly
    // server: {
    // hmr: false,
    // },
    test: {},
  };
});
