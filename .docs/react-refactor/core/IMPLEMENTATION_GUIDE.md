# Refactoring Implementation Guide - Quick Start

## Overview

This guide provides step-by-step instructions to begin the refactoring process. Start with Phase 1 and work through each phase systematically.

---

## Phase 1: Foundation Setup (Day 1-2)

### Step 1.1: Install Testing Dependencies

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Step 1.2: Configure Vitest

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
      '@': path.resolve(__dirname, './src'),
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

### Step 1.3: Update Package Scripts

```bash
# Edit package.json, add to scripts:
```

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 1.4: Verify Setup

```bash
npm run test:run
```

Should see: "No test files found" (expected, proves it's working).

---

## Phase 2: Code Quality Tools (Day 2-3)

### Step 2.1: Install ESLint & Prettier

```bash
npm install -D typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier prettier-plugin-tailwindcss
```

### Step 2.2: Configure ESLint

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
    },
  }
)
```

### Step 2.3: Configure Prettier

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

Create `.prettierignore`:

```
dist
node_modules
coverage
package-lock.json
```

### Step 2.4: Add Scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

### Step 2.5: Run First Lint

```bash
npm run lint
```

---

## Phase 3: State Management Setup (Day 3-5)

### Step 3.1: Install TanStack Query

```bash
npm install @tanstack/react-query
```

### Step 3.2: Create Query Provider

Create `src/app/providers/QueryProvider.tsx`:

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

### Step 3.3: Update App.tsx

```typescript
// Add to imports
import { QueryProvider } from './app/providers/QueryProvider'

// Wrap existing providers
<QueryProvider>
  <UserProvider value={{ user: activeUser, logout }}>
    {/* ...existing code... */}
  </UserProvider>
</QueryProvider>
```

### Step 3.4: Install Zustand

```bash
npm install zustand
```

### Step 3.5: Create First Store

Create `src/stores/useUIStore.ts`:

```typescript
import { create } from 'zustand'

interface UIState {
  // Modals
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // Audio
  ttsEnabled: boolean
  setTtsEnabled: (enabled: boolean) => void

  // Tutor
  avatarGender: 'male' | 'female'
  setAvatarGender: (gender: 'male' | 'female') => void
}

export const useUIStore = create<UIState>((set) => ({
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  ttsEnabled: true,
  setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),

  avatarGender: 'male',
  setAvatarGender: (avatarGender) => set({ avatarGender }),
}))
```

### Step 3.6: Migrate First Component

In `TextChatUI.tsx`, replace local state with Zustand:

```typescript
// Before
const [settingsOpen, setSettingsOpen] = useState(false)
const [ttsEnabled, setTtsEnabled] = useState(true)
const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male')

// After
const { settingsOpen, setSettingsOpen, ttsEnabled, setTtsEnabled, avatarGender, setAvatarGender } = useUIStore()
```

---

## Phase 4: Design System Setup (Day 5-7)

### Step 4.1: Create Design Tokens

Create `src/styles/tokens.css`:

```css
@theme {
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
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-Index */
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
}
```

### Step 4.2: Update index.html

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Step 4.3: Install Radix UI

```bash
npm install \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs \
  @radix-ui/react-tooltip \
  @radix-ui/react-switch \
  @radix-ui/react-separator
```

### Step 4.4: Create First UI Component

Create `src/components/ui/button/Button.tsx`:

```typescript
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
            'bg-transparent hover:bg-gray-100': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

### Step 4.5: Create Utility Function

Create `src/lib/cn.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install dependencies:
```bash
npm install clsx tailwind-merge
```

---

## Phase 5: Component Decomposition (Day 7-14)

### Step 5.1: Create Feature Directory Structure

```bash
mkdir -p src/features/chat/components
mkdir -p src/features/chat/hooks
mkdir -p src/features/chat/services
mkdir -p src/features/tts/components
mkdir -p src/features/tts/hooks
mkdir -p src/features/recording/components
mkdir -p src/features/recording/hooks
```

### Step 5.2: Extract MessageBubble Component

Create `src/features/chat/components/MessageBubble.tsx`:

```typescript
import { MessageWithCorrections } from '@/types'
import { Volume2 } from 'lucide-react'
import { CorrectionTip } from './CorrectionTip'

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
  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
      {message.sender === 'ai' && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
          <img src={avatarUrl} alt="AI Tutor" className="w-full h-full object-cover" />
        </div>
      )}

      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          message.sender === 'user'
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-base whitespace-pre-wrap flex-1">{message.text}</p>

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

### Step 5.3: Extract CorrectionTip Component

Create `src/features/chat/components/CorrectionTip.tsx`:

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

### Step 5.4: Extract Chat Hook

Create `src/features/chat/hooks/useChatMessages.ts`:

```typescript
import { useState, useCallback } from 'react'
import { sendChatMessage } from '@/services/geminiService'
import { parseCorrectionsFromResponse } from '@/lib/correctionParser'
import type { ChatScenario, MessageWithCorrections } from '@/types'

export function useChatMessages(scenario?: ChatScenario) {
  const [messages, setMessages] = useState<MessageWithCorrections[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: MessageWithCorrections = { sender: 'user', text }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const conversationHistory = messages.slice(-10).map(
          (m) => `${m.sender === 'user' ? 'User' : 'Tutor'}: ${m.text}`
        )

        const aiResponse = await sendChatMessage(text, conversationHistory, scenario, true)
        const { corrections, cleanedText } = parseCorrectionsFromResponse(aiResponse)

        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: cleanedText, corrections },
        ])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: 'Sorry, there was an error. Please try again.' },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, scenario]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  }
}
```

### Step 5.5: Update TextChatUI to Use New Components

In `components/TextChatUI.tsx`, replace message rendering:

```typescript
// Before (inline rendering)
{messages.map((message, index) => (
  <div key={index} className={`...`}>
    {/* 50+ lines of JSX */}
  </div>
))}

// After (using extracted component)
import { MessageBubble } from '@/features/chat/components/MessageBubble'

{messages.map((message, index) => (
  <MessageBubble
    key={index}
    message={message}
    isSpeaking={currentSpeakingId === index}
    onSpeak={() => speakText(message.text, index)}
    onStop={stopSpeech}
    avatarUrl={avatarGender === 'male' ? LOUIS_AVATAR_URL : SARAH_AVATAR_URL}
  />
))}
```

---

## Phase 6: File Structure Cleanup (Day 14-16)

### Step 6.1: Consolidate Utilities

```bash
# Create lib directory
mkdir -p src/lib

# Move files
mv src/utils/* src/lib/
mv src/util/* src/lib/

# Remove old directories
rmdir src/utils src/util
```

### Step 6.2: Update Imports

Use IDE refactoring or run:

```bash
# Using sed (Git Bash/WSL)
find src -type f \( -name "*.ts" -o -name "*.tsx" \)) -exec sed -i "s|from '@/utils/|from '@/lib/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \)) -exec sed -i "s|from '@/util/|from '@/lib/|g" {} +
```

### Step 6.3: Update tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/hooks/*": ["./src/composables/*"]
    }
  }
}
```

---

## Phase 7: Add First Tests (Day 16-18)

### Step 7.1: Test Button Component

Create `src/components/ui/button/Button.test.tsx`:

```typescript
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

### Step 7.2: Test MessageBubble Component

Create `src/features/chat/components/MessageBubble.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageBubble } from './MessageBubble'

describe('MessageBubble', () => {
  const mockProps = {
    message: {
      sender: 'ai' as const,
      text: 'Hello! How can I help you?',
    },
    isSpeaking: false,
    onSpeak: vi.fn(),
    onStop: vi.fn(),
    avatarUrl: '/avatars/tutor.jpg',
  }

  it('renders AI message correctly', () => {
    render(<MessageBubble {...mockProps} />)

    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/avatars/tutor.jpg')
  })

  it('calls onSpeak when play button clicked', async () => {
    const user = userEvent.setup()
    render(<MessageBubble {...mockProps} />)

    const playButton = screen.getByTitle('Listen again')
    await user.click(playButton)

    expect(mockProps.onSpeak).toHaveBeenCalledTimes(1)
  })

  it('calls onStop when speaking and button clicked', async () => {
    const user = userEvent.setup()
    render(<MessageBubble {...mockProps} isSpeaking={true} />)

    const stopButton = screen.getByTitle('Stop')
    await user.click(stopButton)

    expect(mockProps.onStop).toHaveBeenCalledTimes(1)
  })

  it('displays corrections when present', () => {
    const propsWithCorrections = {
      ...mockProps,
      message: {
        ...mockProps.message,
        corrections: [
          {
            original: 'me',
            corrected: 'I',
            explanation: 'Subject pronoun should be capitalized',
          },
        ],
      },
    }

    render(<MessageBubble {...propsWithCorrections} />)

    expect(screen.getByText('me')).toBeInTheDocument()
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText(/subject pronoun/i)).toBeInTheDocument()
  })
})
```

### Step 7.3: Run Tests

```bash
npm run test:run
```

---

## Phase 8: Git Hooks Setup (Day 18-19)

### Step 8.1: Install Husky & lint-staged

```bash
npm install -D husky lint-staged
npx husky init
```

### Step 8.2: Configure Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Step 8.3: Add lint-staged Config

In `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

---

## Phase 9: Performance Optimizations (Day 19-21)

### Step 9.1: Add Code Splitting

Create `src/app/routes.tsx`:

```typescript
import { lazy } from 'react'

export const TextChatDirect = lazy(() =>
  import('@/pages/chat/TextChatDirect').then((m) => ({ default: m.TextChatDirect }))
)

export const VoiceOnlyChat = lazy(() =>
  import('@/pages/chat/VoiceOnlyChat').then((m) => ({ default: m.VoiceOnlyChat }))
)

export const WithAvatarChat = lazy(() =>
  import('@/pages/chat/WithAvatarChat').then((m) => ({ default: m.WithAvatarChat }))
)
```

Update `App.tsx`:

```typescript
import { Suspense } from 'react'

// ...

<Suspense fallback={<LoadingScreen />}>
  <Route path="/chat/text" element={<TextChatDirect />} />
  <Route path="/chat/voice-only" element={<VoiceOnlyChat />} />
  <Route path="/chat/with-avatar" element={<WithAvatarChat />} />
</Suspense>
```

### Step 9.2: Add Memoization

In `MessageBubble.tsx`:

```typescript
import { memo } from 'react'

export const MessageBubble = memo(function MessageBubble({ /* ... */ }) {
  // Component code
})
```

---

## Phase 10: Documentation & Final Polish (Day 21-25)

### Step 10.1: Add Component Documentation

Ensure all components have JSDoc:

```typescript
/**
 * MessageBubble component displays a single chat message with optional
 * text-to-speech controls and grammar corrections.
 *
 * @example
 * ```tsx
 * <MessageBubble
 *   message={message}
 *   isSpeaking={false}
 *   onSpeak={() => speak(message.text)}
 *   onStop={stopSpeech}
 *   avatarUrl="/avatars/tutor.jpg"
 * />
 * ```
 */
export function MessageBubble(/* ... */) {
  // ...
}
```

### Step 10.2: Update README

Create comprehensive README with:
- Setup instructions
- Development workflow
- Testing guidelines
- Component library documentation

### Step 10.3: Create Migration Checklist

Track progress:

- [ ] All tests passing
- [ ] Zero ESLint errors
- [ ] All components < 300 lines
- [ ] 80%+ test coverage
- [ ] Performance metrics improved
- [ ] Documentation complete

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production

# Testing
npm run test                   # Run tests in watch mode
npm run test:run               # Run tests once
npm run test:ui                # Run tests with UI
npm run test:coverage          # Generate coverage report

# Code Quality
npm run lint                   # Check for issues
npm run lint:fix               # Fix auto-fixable issues
npm run format                 # Format code
npm run typecheck              # Check TypeScript types

# Git Hooks
npx husky install              # Reinstall hooks
```

---

## Troubleshooting

### Issue: Tests fail with "Cannot find module"

**Solution:** Check `vitest.config.ts` resolve.alias matches `tsconfig.json` paths.

### Issue: Tailwind classes not working

**Solution:** Ensure `tailwind.config.js` content array includes all source files.

### Issue: Import errors after file move

**Solution:** Update `tsconfig.json` paths and restart IDE/language server.

---

## Next Steps

After completing Phase 1-10:

1. **Measure Impact**: Compare bundle size, performance scores
2. **Team Training**: Share patterns with team
3. **Iterate**: Continue refactoring other components
4. **Monitor**: Watch for issues in production

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Author:** SAke E-Learning Team
