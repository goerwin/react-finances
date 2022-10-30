/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const base = isDev ? '/' : `${packageJson.homepage}/`;

  return {
    base,
    plugins: [react()],
    server: {
      hmr: false,
    },
    test: {},
  };
});
