import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: '/', // ✅ Root for Render or general hosting
    plugins: [react()],

    css: {
      // ✅ Explicitly tell Vite to use PostCSS (Tailwind v4 requires this)
      postcss: path.resolve(__dirname, 'postcss.config.js'),
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'darlena-plankless-ernest.ngrok-free.dev',
        '.ngrok-free.app',
        '.ngrok.io'
      ],
    },

    define: {
      'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
