/**
 * Vite Configuration
 *
 * Build configuration for the SAke E-Learning Vite application.
 * Configures plugins, CSS processing, development server, and path aliases.
 *
 * @fileoverview This is the main Vite configuration file that sets up the build
 * toolchain including React support, PostCSS/Tailwind processing, development server
 * settings, and module resolution aliases.
 *
 * @dependencies vite, @vitejs/plugin-react, path
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration function.
 *
 * @param {Object} options - Vite configuration options
 * @param {string} mode - Build mode ('development' | 'production')
 * @returns {Object} Vite configuration object
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    /**
     * Base URL for the application.
     * Root path for Render or general hosting deployment.
     *
     * @type {string}
     */
    base: '/',

    /**
     * Vite plugins to use.
     * React plugin enables Fast Refresh and JSX/TSX support.
     *
     * @type {Array}
     */
    plugins: [react()],

    /**
     * CSS configuration.
     * Explicitly configures PostCSS for Tailwind v4 compatibility.
     */
    css: {
      // Path to PostCSS configuration file
      postcss: path.resolve(__dirname, 'postcss.config.js'),
    },

    /**
     * Development server configuration.
     * Sets up port, host, and allowed hosts for development.
     */
    server: {
      /** Development server port */
      port: 3000,
      /** Listen on all network interfaces */
      host: '0.0.0.0',
      /**
       * Allowed hosts for development (ngrok tunnels, etc.).
       * Used for remote development and testing.
       *
       * @type {string[]}
       */
      allowedHosts: [
        'darlena-plankless-ernest.ngrok-free.dev',
        '.ngrok-free.app',
        '.ngrok-free.dev',
        '.ngrok.io'
      ],
    },

    /**
     * Module resolution configuration.
     * Sets up path aliases for cleaner imports.
     */
    resolve: {
      /**
       * Path aliases for module resolution.
       * Allows imports using '@' prefix from project root.
       *
       * @example
       * // Instead of:
       * import { foo } from '../../../utils/foo'
       * // Use:
       * import { foo } from '@/utils/foo'
       */
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
