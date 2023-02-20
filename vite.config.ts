/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const base = isDev ? '/' : `/react-finances/`;

  return {
    base,
    define: {
      APP_VERSION: JSON.stringify(packageJson.version),
    },
    plugins: [
      react(),
      VitePWA({
        manifest: {
          theme_color: '#242424',
          background_color: '#242424',
          icons: [
            {
              src: `${base}android-chrome-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: `${base}android-chrome-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: `${base}android-chrome-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
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
