# SAke E-Learning V3 - Comprehensive Refactoring Plan

## Executive Summary

This document outlines a systematic refactoring plan to modernize the SAke E-Learning application while maintaining the current tech stack (React 19.2 + TypeScript + Vite + Tailwind CSS v4). The plan addresses code quality, maintainability, performance, and developer experience through best-in-class libraries and modern React patterns.

**Current State Assessment:**
- TextChatUI.tsx: 1,139 lines (violates Single Responsibility Principle)
- Mixed state management patterns (useState, Context, localStorage)
- No design tokens or centralized style guide
- Duplicated UI patterns across components
- util/ and utils/ folder split (confusing structure)
- No testing infrastructure
- Missing performance optimizations

**Target Outcomes:**
- Components < 300 lines with single responsibilities
- Consistent state management with Context API + TanStack Query
- Design tokens with Tailwind CSS v4
- Reusable UI component library
- Comprehensive testing setup
- Improved performance and developer experience

---

## Phase 1: Foundation & Tooling (Week 1-2)

### 1.1 Testing Infrastructure

**Priority: CRITICAL**

Install and configure testing tools:

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Configuration Files:**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

**Justification:**
- Vitest: Native Vite integration, faster than Jest, better DX
- Testing Library: Industry standard for React component testing
- Coverage reporting: Ensures quality metrics

---

### 1.2 Code Quality Tools

**Priority: HIGH**

Install ESLint and Prettier with modern configurations:

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier eslint-plugin-import
```

Create `eslint.config.js`:
```javascript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { browser: true, es2020: true },
    },
    plugins: {
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'import/order': ['error', { alphabetize: { order: 'asc' } }],
    },
  }
)
```

Create `.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Justification:**
- ESLint flat config: Modern, faster configuration
- Prettier: Consistent code formatting
- Import sorting: Better organization

---

### 1.3 Git Hooks

**Priority: MEDIUM**

Install Husky and lint-staged:

```bash
npm install -D husky lint-staged
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run test:unit
```

Update `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

---

## Phase 2: State Management (Week 2-3)

### 2.1 Server State Management - TanStack Query

**Priority: CRITICAL**

Install TanStack Query v5:

```bash
npm install @tanstack/react-query
```

**Why TanStack Query?**
- Automatic caching and revalidation
- Optimistic updates
- Background refetching
- No need for manual useState/useEffect for API calls
- Excellent TypeScript support
- React 19 compatible

**Implementation:**

Create `src/providers/QueryProvider.tsx`:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
```

**Example Migration - Before:**
```typescript
// Current pattern in components
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await api.getData()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

**After:**
```typescript
// With TanStack Query
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['data'],
  queryFn: () => api.getData(),
})
```

---

### 2.2 Client State Management - Context API + Zustand

**Priority: HIGH**

For complex client state (UI state, modals, themes), add Zustand:

```bash
npm install zustand
```

**Why Zustand?**
- Simpler than Redux
- No providers needed
- TypeScript-first
- React 19 compatible
- Great devtools

**Example Store:**

Create `src/stores/useChatStore.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatState {
  messages: Message[]
  isLoading: boolean
  addMessage: (message: Message) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
```

**Keep Context API for:**
- Authentication state (already using UserContext)
- Theme/preferences
- Feature flags

---

## Phase 3: Design System & UI Components (Week 3-4)

### 3.1 Design Tokens with Tailwind CSS v4

**Priority: CRITICAL**

Tailwind CSS v4 has built-in support for design tokens via CSS custom properties.

Create `src/styles/tokens.css`:
```css
@theme {
  /* Primary Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Brand Colors */
  --color-brand-blue: #4a7cf5;
  --color-brand-blue-dark: #3a6ce5;
  --color-brand-purple: #8b5cf6;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Spacing Scale */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 2.5rem;    /* 40px */
  --spacing-3xl: 3rem;      /* 48px */

  /* Border Radius */
  --radius-sm: 0.25rem;     /* 4px */
  --radius-md: 0.5rem;      /* 8px */
  --radius-lg: 0.75rem;     /* 12px */
  --radius-xl: 1rem;        /* 16px */
  --radius-2xl: 1.5rem;     /* 24px */
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-xs: 0.75rem;       /* 12px */
  --text-sm: 0.875rem;      /* 14px */
  --text-base: 1rem;        /* 16px */
  --text-lg: 1.125rem;      /* 18px */
  --text-xl: 1.25rem;       /* 20px */
  --text-2xl: 1.5rem;       /* 24px */
  --text-3xl: 1.875rem;     /* 30px */

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-Index Scale */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

Update `tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

### 3.2 Component Library Structure

**Priority: CRITICAL**

Create a reusable component library structure:

```
src/
  components/
    ui/                    # Base UI components (headless, primitive)
      button/
        Button.tsx
        Button.test.tsx
        index.ts
      input/
        Input.tsx
        Input.test.tsx
        index.ts
      modal/
        Modal.tsx
        Modal.test.tsx
        index.ts
      dropdown/
        Dropdown.tsx
        Dropdown.test.tsx
        index.ts
      ...
    chat/                  # Chat-specific components
      MessageList.tsx
      MessageBubble.tsx
      ChatInput.tsx
      ...
    audio/                 # Audio-specific components
      AudioVisualizer.tsx
      VoiceRecorder.tsx
      ...
    forms/                 # Form components
      TextField.tsx
      Select.tsx
      Checkbox.tsx
      ...
    layout/                # Layout components
      Container.tsx
      Stack.tsx
      Grid.tsx
      ...
```

---

### 3.3 Headless UI Components

**Priority: HIGH**

Install Radix UI primitives for accessible, unstyled components:

```bash
npm install \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-popover \
  @radix-ui/react-select \
  @radix-ui/react-tabs \
  @radix-ui/react-tooltip \
  @radix-ui/react-switch \
  @radix-ui/react-slider \
  @radix-ui/react-progress \
  @radix-ui/react-separator
```

**Why Radix UI?**
- Fully accessible (ARIA, keyboard navigation)
- Unstyled (full design control)
- TypeScript-first
- React 19 compatible
- Composable primitives

**Example - Dialog Component:**

Create `src/components/ui/modal/Modal.tsx`:
```typescript
import * as Dialog from '@radix-ui/react-dialog'
import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface ModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export const Modal = ({ open, onOpenChange, children }: ModalProps) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    {children}
  </Dialog.Root>
)

export const ModalTrigger = Dialog.Trigger

export const ModalContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(({ className, children, ...props }, ref) => (
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1040] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-[1050] -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  </Dialog.Portal>
))

export const ModalTitle = forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn('text-lg font-semibold text-gray-900', className)}
    {...props}
  />
))

export const ModalDescription = forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
))

export const ModalClose = Dialog.Close
```

---

### 3.4 Form Handling - React Hook Form + Zod

**Priority: HIGH**

Install form handling libraries:

```bash
npm install react-hook-form @hookform/resolvers zod
```

**Why React Hook Form?**
- Performance: Minimal re-renders
- Small bundle size
- Great TypeScript support
- Easy validation with Zod
- React 19 compatible

**Example:**

Create `src/components/forms/Form.tsx`:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    // Submit logic
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Loading...' : 'Sign In'}
      </button>
    </form>
  )
}
```

---

## Phase 4: Component Decomposition (Week 4-5)

### 4.1 TextChatUI Decomposition Strategy

**Priority: CRITICAL**

The 1,139-line TextChatUI.tsx needs to be broken down:

**Current Structure:**
```
TextChatUI.tsx (1,139 lines)
├── TTS state and logic (~300 lines)
├── Recording/transcription logic (~200 lines)
├── Message rendering (~150 lines)
├── Settings modal (~150 lines)
├── Chat input (~100 lines)
└── Main component orchestration (~239 lines)
```

**Target Structure:**
```
pages/chat/TextChatPage.tsx           # Route component (orchestration only)
├── components/chat/
    ├── ChatContainer.tsx             # Main container
    ├── MessageList.tsx               # Message display
    ├── MessageBubble.tsx             # Individual message
    ├── ChatInput.tsx                 # Input field
    ├── VoiceInput.tsx                # Recording controls
    ├── CorrectionTip.tsx             # Grammar correction display
    └── ChatHeader.tsx                # Tutor info + settings
├── components/tts/
    ├── TTSProvider.tsx               # TTS context
    ├── TTSControls.tsx               # Play/pause/replay buttons
    ├── VoiceSelector.tsx             # Voice selection UI
    └── useTTS.ts                     # TTS hook
├── components/recording/
    ├── VoiceRecorder.tsx             # Recording controls
    ├── LiveTranscript.tsx            # Live transcription display
    └── useVoiceRecognition.ts        # Recognition hook
└── hooks/
    ├── useChatMessages.ts            # Message management
    └── useChatHistory.ts             # History tracking
```

---

### 4.2 Extracted Components

**Priority: HIGH**

**Example - MessageBubble.tsx:**
```typescript
import { MessageWithCorrections } from '@/types'
import { Volume2 } from 'lucide-react'
import { CorrectionTip } from './CorrectionTip'
import { useTTS } from '@/components/tts/useTTS'

interface MessageBubbleProps {
  message: MessageWithCorrections
  isSpeaking: boolean
  onSpeak: () => void
  onStop: () => void
  avatarUrl: string
}

export function MessageBubble({
  message,
  isSpeaking,
  onSpeak,
  onStop,
  avatarUrl,
}: MessageBubbleProps) {
  const { selectedService } = useTTS()

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
      {message.sender === 'ai' && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
          <img src={avatarUrl} alt="AI Tutor" className="w-full h-full object-cover" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[80%] px-4 py-4 sm:px-4 sm:py-3 rounded-2xl ${
          message.sender === 'user'
            ? 'bg-[#4a7cf5] text-white rounded-br-sm'
            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-base sm:text-[15px] whitespace-pre-wrap flex-1">
            {message.text}
          </p>

          {message.sender === 'ai' && (
            <button
              onClick={isSpeaking ? onStop : onSpeak}
              className="shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
              title={isSpeaking ? 'Stop' : 'Listen again'}
            >
              <Volume2 className="h-5 w-5" />
            </button>
          )}
        </div>

        {message.corrections && message.corrections.length > 0 && (
          <CorrectionTip corrections={message.corrections} />
        )}
      </div>
    </div>
  )
}
```

**Example - CorrectionTip.tsx:**
```typescript
import { Correction } from '@/types'
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react'

interface CorrectionTipProps {
  corrections: Correction[]
}

export function CorrectionTip({ corrections }: CorrectionTipProps) {
  return (
    <div className="mt-3 pt-2.5 border-t border-amber-100">
      <div className="text-[11px] font-medium text-amber-600/90 mb-1.5 flex items-center gap-1">
        <Sparkles size={11} />
        <span>Tip</span>
      </div>
      <div className="bg-amber-50 rounded-lg px-3 py-2 space-y-1.5">
        {corrections.map((correction, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-red-500 line-through opacity-80">
                "{correction.original}"
              </span>
              <ArrowRight size={11} className="text-slate-400" />
              <span className="text-emerald-600 font-semibold">
                "{correction.corrected}"
              </span>
            </div>
            <div className="text-slate-600 text-[10px] flex items-start gap-1">
              <Lightbulb size={11} className="shrink-0 mt-0.5 text-amber-500" />
              <span className="leading-snug">{correction.explanation}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### 4.3 Custom Hooks Extraction

**Priority: HIGH**

**useTTS.ts:**
```typescript
import { useCallback, useEffect, useState } from 'react'
import { TTSService, TTSVoice, TTSServiceFactory } from '@/services/tts'

interface UseTTSOptions {
  enabled?: boolean
  autoSpeak?: boolean
}

export function useTTS(options: UseTTSOptions = {}) {
  const { enabled = true, autoSpeak = false } = options

  const [selectedService, setSelectedService] = useState<TTSService>(TTSService.WEB_SPEECH)
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const speak = useCallback(async (text: string) => {
    if (!enabled || !selectedVoice?.id) return

    setIsSpeaking(true)
    setError(null)

    try {
      const service = TTSServiceFactory.create(selectedService)
      await service.speak(text, selectedVoice, {
        service: selectedService,
        voice: selectedVoice,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech failed')
    } finally {
      setIsSpeaking(false)
    }
  }, [enabled, selectedService, selectedVoice])

  const stop = useCallback(() => {
    try {
      const service = TTSServiceFactory.create(selectedService)
      service.stop()
    } catch {}
    setIsSpeaking(false)
  }, [selectedService])

  return {
    selectedService,
    setSelectedService,
    selectedVoice,
    setSelectedVoice,
    isSpeaking,
    isLoading,
    error,
    speak,
    stop,
  }
}
```

**useVoiceRecognition.ts:**
```typescript
import { useState, useCallback, useRef, useEffect } from 'react'

interface UseVoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  silenceTimeout?: number
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    silenceTimeout = 10000,
  } = options

  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition
      || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = language

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += transcript + ' '
          } else {
            interim += transcript
          }
        }

        setInterimTranscript(interim)
        setTranscript(final)

        // Reset silence timer on new results
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }
        silenceTimerRef.current = setTimeout(() => {
          if (final) {
            stopRecording()
          }
        }, silenceTimeout)
      }

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setIsRecording(false)
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      recognitionRef.current?.stop()
    }
  }, [language, continuous, interimResults, silenceTimeout])

  const startRecording = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    recognitionRef.current?.start()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  return {
    isRecording,
    transcript,
    interimTranscript,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
  }
}
```

---

## Phase 5: File Structure Organization (Week 5-6)

### 5.1 Proposed Directory Structure

**Priority: HIGH**

```
sakae-e-learning-v3/
├── public/                          # Static assets
│   ├── avatars/
│   ├── icons/
│   └── ...
├── src/
│   ├── app/                         # App configuration
│   │   ├── providers.tsx            # Provider composition
│   │   └── routes.tsx               # Route configuration
│   ├── components/
│   │   ├── ui/                      # Base UI components
│   │   │   ├── button/
│   │   │   ├── input/
│   │   │   ├── modal/
│   │   │   ├── dropdown/
│   │   │   └── ...
│   │   ├── chat/                    # Chat components
│   │   ├── audio/                   # Audio components
│   │   ├── avatar/                  # Avatar components
│   │   ├── forms/                   # Form components
│   │   └── layout/                  # Layout components
│   ├── composables/                 # Custom hooks (renamed from hooks/)
│   │   ├── useTTS.ts
│   │   ├── useVoiceRecognition.ts
│   │   ├── useChatMessages.ts
│   │   └── ...
│   ├── stores/                      # Zustand stores
│   │   ├── useChatStore.ts
│   │   ├── useUIStore.ts
│   │   └── ...
│   ├── services/                    # API and business logic
│   │   ├── api/
│   │   ├── auth/
│   │   ├── gemini/
│   │   ├── livekit/
│   │   └── tts/
│   ├── contexts/                    # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── UserContext.tsx
│   │   └── ...
│   ├── pages/                       # Route components
│   │   ├── chat/
│   │   ├── profile/
│   │   └── ...
│   ├── features/                    # Feature modules
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types.ts
│   │   ├── tts/
│   │   └── ...
│   ├── lib/                         # Utility libraries (renamed from utils/ & util/)
│   │   ├── cn.ts                    # classNames utility
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── ...
│   ├── styles/                      # Global styles
│   │   ├── tokens.css               # Design tokens
│   │   ├── base.css                 # Base styles
│   │   └── components.css           # Component overrides
│   ├── types/                       # Global types
│   │   ├── chat.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── constants/                   # Constants
│   │   ├── routes.ts
│   │   ├── config.ts
│   │   └── ...
│   ├── test/                        # Test utilities
│   │   ├── setup.ts
│   │   ├── utils.tsx
│   │   └── mocks/
│   └── App.tsx
├── .docs/                           # Documentation
├── server/                          # Backend code
└── configuration files
```

---

### 5.2 Migration Steps

**Priority: MEDIUM**

1. **Consolidate util/ and utils/ into lib/**
2. **Rename hooks/ to composables/** (optional, follows Vue/Nuxt convention)
3. **Create feature-based modules** for complex features
4. **Update all imports** to use new structure

**Batch file rename script:**
```bash
# Create new structure
mkdir -p src/lib
mkdir -p src/composables
mkdir -p src/stores
mkdir -p src/features

# Move utilities
mv src/utils/* src/lib/
mv src/util/* src/lib/
rmdir src/utils src/util

# Update imports (use sed or IDE refactoring)
find src -type f \( -name "*.ts" -o -name "*.tsx" \)) -exec sed -i "s|from '@/utils/|from '@/lib/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \)) -exec sed -i "s|from '@/util/|from '@/lib/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \)) -exec sed -i "s|from '@/hooks/|from '@/composables/|g" {} +
```

---

## Phase 6: Performance Optimization (Week 6-7)

### 6.1 Code Splitting

**Priority: HIGH**

Implement route-based code splitting with React.lazy:

```typescript
// src/app/routes.tsx
import { lazy } from 'react'

export const TextChatDirect = lazy(() =>
  import('@/pages/chat/TextChatDirect').then(m => ({ default: m.TextChatDirect }))
)

export const VoiceOnlyChat = lazy(() =>
  import('@/pages/chat/VoiceOnlyChat').then(m => ({ default: m.VoiceOnlyChat }))
)

export const WithAvatarChat = lazy(() =>
  import('@/pages/chat/WithAvatarChat').then(m => ({ default: m.WithAvatarChat }))
)
```

Update App.tsx:
```typescript
import { Suspense } from 'react'

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/chat/text" element={<TextChatDirect />} />
        <Route path="/chat/voice-only" element={<VoiceOnlyChat />} />
        <Route path="/chat/with-avatar" element={<WithAvatarChat />} />
      </Routes>
    </Suspense>
  )
}
```

---

### 6.2 Memoization

**Priority: MEDIUM**

Add React.memo and useMemo/useCallback where appropriate:

```typescript
import { memo, useMemo, useCallback } from 'react'

export const MessageBubble = memo(function MessageBubble({ message, onSpeak }: MessageBubbleProps) {
  const handleSpeak = useCallback(() => {
    onSpeak(message.id)
  }, [message.id, onSpeak])

  const formattedTime = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString()
  }, [message.timestamp])

  return (
    <div className="message-bubble">
      {/* ... */}
    </div>
  )
})
```

---

### 6.3 Virtual Scrolling

**Priority: MEDIUM**

For long message lists, use virtual scrolling:

```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

export function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageBubble message={message} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

### 6.4 Image Optimization

**Priority: MEDIUM**

For avatar images, use lazy loading and proper sizing:

```typescript
export function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${sizeClasses[size]} rounded-full object-cover`}
      width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
      height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
    />
  )
}
```

---

## Phase 7: Testing Strategy (Week 7-8)

### 7.1 Unit Tests

**Priority: HIGH**

**Component Test Example:**

```typescript
// src/components/ui/button/Button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200')
  })
})
```

**Hook Test Example:**

```typescript
// src/composables/useTTS.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTTS } from './useTTS'

describe('useTTS', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with default state', () => {
    const { result } = renderHook(() => useTTS())

    expect(result.current.isSpeaking).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('speaks text when enabled', async () => {
    const speakMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(TTSServiceFactory.create).mockReturnValue({
      speak: speakMock,
    } as any)

    const { result } = renderHook(() => useTTS({ enabled: true }))
    await act(async () => {
      await result.current.speak('Hello world')
    })

    expect(speakMock).toHaveBeenCalledWith('Hello world', expect.any(Object), expect.any(Object))
  })

  it('does not speak when disabled', async () => {
    const { result } = renderHook(() => useTTS({ enabled: false }))

    await act(async () => {
      await result.current.speak('Hello world')
    })

    expect(result.current.isSpeaking).toBe(false)
  })
})
```

---

### 7.2 Integration Tests

**Priority: MEDIUM**

```typescript
// src/features/chat/ChatFlow.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChatContainer } from './ChatContainer'

describe('Chat Flow', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('sends message and displays response', async () => {
    vi.mock('@/services/geminiService', () => ({
      sendChatMessage: vi.fn().mockResolvedValue('Response message'),
    }))

    render(<ChatContainer />, { wrapper })

    const input = screen.getByPlaceholderText(/enter your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })

    await userEvent.type(input, 'Hello')
    await userEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Response message')).toBeInTheDocument()
    })
  })
})
```

---

### 7.3 E2E Tests with Playwright

**Priority: LOW**

```bash
npm install -D @playwright/test
```

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test('user can send and receive messages', async ({ page }) => {
    await page.goto('/chat/text')

    // Fill input and send
    await page.fill('input[placeholder*="enter your message"]', 'Hello AI')
    await page.click('button[aria-label="Send"]')

    // Wait for response
    await expect(page.locator('text=Hello AI')).toBeVisible()
    await expect(page.locator('text=AI response')).toBeVisible({ timeout: 10000 })
  })

  test('user can record voice message', async ({ page }) => {
    await page.goto('/chat/voice-only')

    // Start recording
    await page.click('button[aria-label="Start recording"]')
    await expect(page.locator('text=Listening...')).toBeVisible()

    // Stop recording
    await page.click('button[aria-label="Stop recording"]')
    await expect(page.locator('text=Processing')).toBeVisible()
  })
})
```

---

## Phase 8: Documentation & Developer Experience (Week 8)

### 8.1 Component Documentation

**Priority: MEDIUM**

Use JSDoc comments for all components:

```typescript
/**
 * Button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant style
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Shows loading state with spinner
   */
  loading?: boolean
  /**
   * Icon to display before text
   */
  leftIcon?: React.ReactNode
  /**
   * Icon to display after text
   */
  rightIcon?: React.ReactNode
}
```

---

### 8.2 Storybook for Component Development

**Priority: LOW**

```bash
npm install -D @storybook/react @storybook/addon-essentials
```

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}

export default config
```

```typescript
// src/components/ui/button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    leftIcon: <span>★</span>,
    children: 'Star Button',
  },
}
```

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Testing infrastructure (Vitest, Testing Library)
- [ ] Code quality tools (ESLint, Prettier)
- [ ] Git hooks (Husky, lint-staged)
- [ ] TanStack Query setup
- [ ] Zustand setup

### Week 2-3: State Management
- [ ] Migrate API calls to TanStack Query
- [ ] Create Zustand stores for UI state
- [ ] Refactor Context API usage

### Week 3-4: Design System
- [ ] Design tokens with Tailwind v4
- [ ] Base UI components (Button, Input, Modal, etc.)
- [ ] Radix UI primitives
- [ ] Form handling with React Hook Form

### Week 4-5: Component Decomposition
- [ ] Decompose TextChatUI (1,139 lines)
- [ ] Extract chat components
- [ ] Extract TTS components
- [ ] Extract recording components

### Week 5-6: File Structure
- [ ] Consolidate util/ and utils/
- [ ] Create feature modules
- [ ] Update all imports
- [ ] Update path aliases

### Week 6-7: Performance
- [ ] Code splitting with React.lazy
- [ ] Memoization optimizations
- [ ] Virtual scrolling for long lists
- [ ] Image optimization

### Week 7-8: Testing
- [ ] Unit tests for components
- [ ] Unit tests for hooks
- [ ] Integration tests
- [ ] E2E tests with Playwright

### Week 8: Documentation
- [ ] Component documentation
- [ ] Storybook setup (optional)
- [ ] Migration guide
- [ ] Contributing guidelines

---

## Success Metrics

### Code Quality
- [ ] All components < 300 lines
- [ ] 80%+ test coverage
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size reduced by 20%
- [ ] Lighthouse score > 90

### Developer Experience
- [ ] Build time < 10s
- [ ] Hot reload < 100ms
- [ ] Clear component documentation
- [ ] Consistent coding patterns

---

## Risk Mitigation

### Potential Issues
1. **Breaking Changes**: Refactoring may introduce bugs
   - Mitigation: Comprehensive testing, gradual migration

2. **Learning Curve**: New libraries and patterns
   - Mitigation: Documentation, pair programming, gradual adoption

3. **Time Constraints**: May take longer than estimated
   - Mitigation: Prioritize high-impact changes, defer nice-to-haves

4. **State Migration**: Complex state management migration
   - Mitigation: Keep old and new systems running in parallel, migrate incrementally

---

## Conclusion

This refactoring plan provides a structured approach to modernizing the SAke E-Learning application while maintaining the current tech stack. By following this plan, the codebase will become more maintainable, testable, and performant, leading to better developer experience and product quality.

The key to success is **gradual, incremental migration** rather than a complete rewrite. Each phase can be implemented independently, allowing the team to deliver value while refactoring.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Author:** SAke E-Learning Team
