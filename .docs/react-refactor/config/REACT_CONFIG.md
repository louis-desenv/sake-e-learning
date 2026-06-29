# Configuration Files - React + Vite Refactoring

Complete configuration files for modernizing the SAke E-Learning application with React + Vite + TypeScript + Tailwind CSS v4.

---

## 📦 Package.json

### Updated Dependencies

```json
{
  "name": "sake-e-learning",
  "private": true,
  "version": "3.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@elevenlabs/elevenlabs-js": "^2.33.0",
    "@google/genai": "^1.27.0",
    "@google/generative-ai": "^0.24.1",
    "@livekit/agents": "^1.0.38",
    "@livekit/agents-plugin-bey": "^1.0.38",
    "@livekit/agents-plugin-deepgram": "^1.0.38",
    "@livekit/agents-plugin-google": "^1.0.38",
    "@livekit/agents-plugin-openai": "^1.0.38",
    "@livekit/agents-plugin-silero": "^1.0.38",
    "@livekit/components-styles": "^1.2.0",
    "@livekit/rtc-node": "^0.13.24",
    "@tanstack/react-query": "^5.17.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "axios": "^1.13.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^3.0.0",
    "dotenv": "^17.2.3",
    "express": "^4.18.0",
    "jose": "^6.1.2",
    "livekit-client": "^2.17.0",
    "lucide-react": "^0.562.0",
    "openai": "^6.14.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.49.0",
    "react-is": "^19.2.3",
    "react-router-dom": "^7.9.4",
    "recharts": "^3.3.0",
    "tailwind-merge": "^2.2.0",
    "zod": "^4.3.6",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@tailwindcss/postcss": "^4.1.18",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.1.2",
    "@vitest/ui": "^1.1.0",
    "autoprefixer": "^10.4.23",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "gh-pages": "^6.3.0",
    "husky": "^8.0.3",
    "jsdom": "^23.0.1",
    "lint-staged": "^15.2.0",
    "msw": "^2.0.0",
    "postcss": "^8.5.6",
    "prettier": "^3.1.1",
    "prettier-plugin-tailwindcss": "^0.5.9",
    "tailwindcss": "^4.1.18",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "typescript-eslint": "^6.17.0",
    "vite": "^6.4.1",
    "vitest": "^1.1.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,md}": [
      "prettier --write"
    ]
  }
}
```

---

## ⚙️ Vite Configuration

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/tokens': path.resolve(__dirname, './src/tokens'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'livekit': ['livekit-client', '@livekit/components-styles'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
});
```

---

## 🎨 Tailwind Configuration

### tailwind.config.js

```javascript
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary (Blue)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Secondary (Purple)
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Accent (Cyan)
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Semantic colors
        semantic: {
          success: '#22c55e',
          warning: '#eab308',
          error: '#ef4444',
          info: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 1s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## 📘 TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting - Strict mode */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/contexts/*": ["./src/contexts/*"],
      "@/services/*": ["./src/services/*"],
      "@/tokens/*": ["./src/tokens/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.app.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

---

## 🧪 Vitest Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/dist/**',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/tokens': path.resolve(__dirname, './src/tokens'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
});
```

---

## 📋 Test Setup

### src/test/setup.ts

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## 🔍 ESLint Configuration

### eslint.config.js

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist', '.eslintrc.cjs', 'node_modules'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        browser: true,
        es2021: true,
        node: true,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  eslintConfigPrettier,
];
```

---

## 🎨 Prettier Configuration

### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### .prettierignore

```
# Dependencies
node_modules/

# Production
dist/
build/

# Cache
.vite/
.turbo/

# Misc
.DS_Store
*.pem

# Logs
logs/
*.log

# Coverage
coverage/
```

---

## 🎭 PostCSS Configuration

### postcss.config.js

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

---

## 📝 Environment Variables

### .env.example

```bash
# API
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080

# LiveKit
VITE_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
VITE_LIVEKIT_TOKEN=your-livekit-token

# Gemini API
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GEMINI_MODEL=gemini-2.0-flash-exp

# ElevenLabs TTS
VITE_ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Google Cloud
VITE_GOOGLE_CLOUD_PROJECT=your-project-id
VITE_GOOGLE_CLOUD_KEY=your-google-cloud-key

# Beyond Presence (Avatar)
VITE_BEYOND_AVATAR_ID=your-avatar-id
VITE_BEYOND_API_KEY=your-beyond-api-key

# Authentication
VITE_AUTH_SECRET=your-auth-secret

# Analytics (Optional)
VITE_GA_TRACKING_ID=your-ga-tracking-id
```

---

## 🎯 Git Hooks

### .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### .husky/pre-push

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check && npm run test
```

---

## 🎭 Playwright Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📦 MSW Configuration

### src/test/mocks/handlers.ts

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: { id: '1', email, name: 'Test User' },
        token: 'mock-token',
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  // User profile
  http.get('/api/user/profile', () => {
    return HttpResponse.json({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      level: 'Intermediate',
      progress: 75,
    });
  }),

  // Chat scenarios
  http.get('/api/scenarios', () => {
    return HttpResponse.json([
      { id: '1', title: 'Restaurant', difficulty: 'Beginner' },
      { id: '2', title: 'Airport', difficulty: 'Intermediate' },
    ]);
  }),
];
```

### src/test/mocks/browser.ts

```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

---

## 🎯 Summary

All configuration files are ready for:

✅ **React 19** + **TypeScript 5.8** + **Vite 6**
✅ **Tailwind CSS v4** with design tokens
✅ **Vitest** for unit testing
✅ **Playwright** for E2E testing
✅ **ESLint** + **Prettier** for code quality
✅ **Husky** + **lint-staged** for git hooks
✅ **MSW** for API mocking

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Authors:** SAke E-Learning Team
