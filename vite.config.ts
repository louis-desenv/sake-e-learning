import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/sake-e-learning/', // 👈 replace with your GitHub repo name
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'darlena-plankless-ernest.ngrok-free.dev',
        '.ngrok-free.app',
        '.ngrok.io'
      ]
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
