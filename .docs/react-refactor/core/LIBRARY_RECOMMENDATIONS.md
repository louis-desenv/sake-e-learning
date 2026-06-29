# Library Recommendations for SAke E-Learning V3 Refactoring

## Overview

This document provides detailed justifications for each recommended library in the refactoring plan. All recommendations are chosen for:
- React 19 compatibility
- TypeScript support
- Modern development practices (2025 standards)
- Bundle size efficiency
- Developer experience
- Community support and longevity

---

## 1. Testing Libraries

### 1.1 Vitest

**Install:**
```bash
npm install -D vitest @vitest/ui
```

**Why Vitest over Jest?**

| Feature | Vitest | Jest |
|---------|--------|------|
| Vite Integration | Native | Requires custom config |
| Watch Mode | Instant | Slower |
| ESM Support | First-class | Config required |
| TypeScript | Native | Requires ts-jest |
| UI DevTools | Built-in | Separate package |
| Performance | Faster (native Vite) | Slower |
| Configuration | Simpler | Complex |

**Key Benefits:**
- **Native Vite Integration**: Shares same config as your build tool
- **Faster Execution**: Uses Vite's transformer, runs tests in parallel
- **Better DX**: Watch mode with instant feedback
- **ESM First**: No babel transform overhead
- **UI Mode**: Visual test runner with coverage

**For Your Project:**
- Already using Vite - seamless integration
- React 19 compatible (Jest has some issues with React 19)
- Faster feedback loop for TDD

---

### 1.2 Testing Library

**Install:**
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Why Testing Library?**

**Philosophy:** "The more your tests resemble the way your software is used, the more confidence they can give you."

**Benefits:**
- **User-Centric**: Tests from user's perspective, not implementation
- **Accessibility**: Encourages testing a11y features
- **Framework Agnostic**: Works with React, Vue, Svelte, etc.
- **Best Practices**: Enforces good testing patterns
- **React 19 Ready**: Fully compatible

**Alternatives Considered:**
- **Enzyme**: Deprecated, not maintained, React 19 incompatible
- **React Testing Tools**: Too low-level, more boilerplate

---

### 1.3 MSW (Mock Service Worker)

**Install:**
```bash
npm install -D msw
```

**Why MSW for API Mocking?**

**Traditional Approach (jest.mock):**
```typescript
// Fragile, couples tests to implementation
jest.mock('@/services/api')
api.getData.mockResolvedValue({ data: 'mock' })
```

**MSW Approach:**
```typescript
// Decoupled, realistic, works in browser
import { http, HttpResponse } from 'msw'

const handlers = [
  http.get('/api/data', () => {
    return HttpResponse.json({ data: 'mock' })
  }),
]

// Works in:
// - Unit tests (node)
// - Integration tests (browser)
// - Development (no backend needed)
```

**Benefits:**
- **Realistic Network Interception**: Uses Service Worker API
- **Framework Agnostic**: Works with any fetch library (including axios)
- **Dev Time Mocking**: Use same mocks for development
- **Type Safe**: First-class TypeScript support

---

## 2. State Management

### 2.1 TanStack Query v5

**Install:**
```bash
npm install @tanstack/react-query
```

**Why TanStack Query?**

**Problem It Solves:**
```typescript
// WITHOUT TanStack Query (current pattern)
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  let cancelled = false
  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await api.getData()
      if (!cancelled) setData(result)
    } catch (err) {
      if (!cancelled) setError(err)
    } finally {
      if (!cancelled) setLoading(false)
    }
  }
  fetchData()
  return () => { cancelled = true }
}, [/* deps */])

// WITH TanStack Query
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['data'],
  queryFn: () => api.getData(),
})
```

**Key Features:**

1. **Automatic Caching**
   - Deduplicates requests
   - Fresh/stale data management
   - No stale UI bugs

2. **Background Refetching**
   - Window focus refetch
   - Interval refetch
   - Always show fresh data

3. **Optimistic Updates**
   ```typescript
   const mutation = useMutation({
     mutationFn: updateMessage,
     onMutate: async (newMessage) => {
       // Cancel ongoing queries
       await queryClient.cancelQueries({ queryKey: ['messages'] })

       // Snapshot previous value
       const previous = queryClient.getQueryData(['messages'])

       // Optimistically update
       queryClient.setQueryData(['messages'], (old) => [...old, newMessage])

       return { previous }
     },
     onError: (err, newMessage, context) => {
       // Rollback on error
       queryClient.setQueryData(['messages'], context.previous)
     },
   })
   ```

4. **Pagination & Infinite Scroll**
   - Built-in hooks for paginated data
   - Infinite scroll support

5. **DevTools**
   - Visualize cache state
   - Debug queries/mutations
   - Manual cache manipulation

**For Your Project:**
- **Gemini API Calls**: Cache AI responses, reduce API calls
- **User Profile**: Cache and sync profile data
- **Learning Scenarios**: Preload and cache scenarios
- **LiveKit Tokens**: Cache tokens with proper TTL

**Migration Strategy:**
```typescript
// src/services/queries/chat.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sendChatMessage } from '@/services/geminiService'

export function useChatMessages(scenario?: ChatScenario) {
  return useQuery({
    queryKey: ['chat', 'messages', scenario],
    queryFn: () => fetchChatHistory(scenario),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ text, scenario }: SendMessageParams) =>
      sendChatMessage(text, [], scenario, true),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })
    },
  })
}
```

---

### 2.2 Zustand

**Install:**
```bash
npm install zustand
```

**Why Zustand for Client State?**

**Comparison with Alternatives:**

| Feature | Zustand | Redux Toolkit | Jotai | Recoil |
|---------|---------|---------------|-------|--------|
| Bundle Size | 1KB | 11KB | 3KB | 22KB |
| Boilerplate | Minimal | Moderate | Minimal | High |
| DevTools | Yes | Yes | Yes | Limited |
| TypeScript | Excellent | Good | Good | Complex |
| React 19 | Compatible | Compatible | Compatible | Beta |
| Learning Curve | Low | Medium | Low | High |

**Zustand Benefits:**

1. **No Providers Needed**
   ```typescript
   // Zustand - no provider boilerplate
   import { useChatStore } from '@/stores/useChatStore'

   function Component() {
     const messages = useChatStore((state) => state.messages)
     const addMessage = useChatStore((state) => state.addMessage)
     // ...
   }

   // Redux - requires provider setup
   <Provider store={store}>
     <App />
   </Provider>
   ```

2. **Simple API**
   ```typescript
   import { create } from 'zustand'

   const useStore = create((set) => ({
     count: 0,
     increment: () => set((state) => ({ count: state.count + 1 })),
     decrement: () => set((state) => ({ count: state.count - 1 })),
   }))
   ```

3. **Built-in Persistence**
   ```typescript
   import { persist } from 'zustand/middleware'

   const useStore = create(
     persist(
       (set) => ({
         user: null,
         setUser: (user) => set({ user }),
       }),
       {
         name: 'user-storage', // localStorage key
         partialize: (state) => ({ user: state.user }), // persist only specific fields
       }
     )
   )
   ```

4. **DevTools Integration**
   ```typescript
   import { devtools } from 'zustand/middleware'

   const useStore = create(
     devtools(
       (set) => ({
         // ...
       }),
       { name: 'ChatStore' } // DevTools name
     )
   )
   ```

5. **Computed Values (Derived State)**
   ```typescript
   import { create } from 'zustand'
   import { subscribeWithSelector } from 'zustand/middleware'

   const useStore = create(
     subscribeWithSelector((set, get) => ({
       messages: [],
       get unreadCount() {
         return get().messages.filter(m => !m.read).length
       }
     }))
   )
   ```

**For Your Project:**

**UI State Store:**
```typescript
// src/stores/useUIStore.ts
import { create } from 'zustand'

interface UIState {
  // Modals
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // Layout
  sidebarOpen: boolean
  toggleSidebar: () => void

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

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  ttsEnabled: true,
  setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),

  avatarGender: 'male',
  setAvatarGender: (avatarGender) => set({ avatarGender }),
}))
```

**Chat State Store:**
```typescript
// src/stores/useChatStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message } from '@/types'

interface ChatState {
  messages: Message[]
  addMessage: (message: Message) => void
  clearMessages: () => void
  updateMessage: (id: string, updates: Partial<Message>) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
```

---

## 3. UI Component Libraries

### 3.1 Radix UI

**Install:**
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
  @radix-ui/react-separator \
  @radix-ui/react-scroll-area \
  @radix-ui/react-label
```

**Why Radix UI?**

**Headless vs Styled Libraries:**

| Library | Type | Size | Customization | A11y | React 19 |
|---------|------|------|---------------|------|----------|
| Radix UI | Headless | Tiny (per pkg) | Full | Excellent | Yes |
| MUI | Styled | Large | Limited | Good | Yes |
| Chakra UI | Styled | Medium | Good | Good | Yes |
| shadcn/ui | Headless | Tiny | Full | Excellent | Yes |

**Radix UI Benefits:**

1. **Accessibility First**
   - Full keyboard navigation
   - ARIA attributes built-in
   - Screen reader support
   - Focus management

2. **Unstyled Components**
   - Full design control
   - Use Tailwind for styling
   - No fighting library styles
   - Smaller bundle (tree-shakeable)

3. **Composable Primitives**
   ```typescript
   import * as Dialog from '@radix-ui/react-dialog'

   export function Modal({ children, open, onOpenChange }) {
     return (
       <Dialog.Root open={open} onOpenChange={onOpenChange}>
         <Dialog.Portal>
           <Dialog.Overlay className="fixed inset-0 bg-black/50" />
           <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
             {children}
           </Dialog.Content>
         </Dialog.Portal>
       </Dialog.Root>
     )
   }
   ```

4. **TypeScript Support**
   - All props typed
   - Generic components for custom data
   - Exposed ref types

5. **Small Bundle Size**
   - Each component is a separate package
   - Tree-shake unused parts
   - No CSS bundle (you provide styles)

**Alternatives Considered:**

- **MUI**: Too heavy (150KB+), hard to customize, fights with Tailwind
- **Chakra UI**: Medium bundle, less flexible styling
- **Headless UI (Tailwind Labs)**: Good but Radix has more components
- **shadcn/ui**: Actually uses Radix under the hood

**For Your Project:**

Replace custom modal/dropdown implementations:
```typescript
// Current: Custom modal with a11y issues
// After: Radix Dialog with full a11y

<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open Settings</button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Settings</Dialog.Title>
    <Dialog.Description>Configure your preferences</Dialog.Description>
    {/* Settings form */}
  </Dialog.Content>
</Dialog.Root>
```

---

### 3.2 React Hook Form

**Install:**
```bash
npm install react-hook-form @hookform/resolvers
```

**Why React Hook Form?**

**Performance Comparison:**

| Library | Re-renders | Mount Time | Bundle Size |
|---------|------------|------------|-------------|
| React Hook Form | Minimal (only touched fields) | Fast | 13KB |
| Formik | All fields on change | Medium | 28KB |
| Controlled Inputs | All fields on change | Slow | 0KB (but more code) |

**Key Benefits:**

1. **Performance**
   ```typescript
   // Only re-renders touched fields
   const { register, handleSubmit } = useForm()
   // vs
   const [values, setValues] = useState({}) // Re-renders entire form
   ```

2. **Less Code**
   ```typescript
   // React Hook Form
   <input {...register('name')} />

   // Controlled
   <input
     value={values.name}
     onChange={e => setValues({...values, name: e.target.value})}
   />
   ```

3. **Validation with Zod**
   ```typescript
   import { z } from 'zod'
   import { zodResolver } from '@hookform/resolvers/zod'

   const schema = z.object({
     email: z.string().email(),
     age: z.number().min(18),
   })

   const { register, handleSubmit } = useForm({
     resolver: zodResolver(schema),
   })
   ```

4. **DevTools**
   - Visualize form state
   - Debug validation
   - Test form interactions

**For Your Project:**

Profile/Onboarding forms:
```typescript
// src/components/forms/ProfileForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  learningLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  interests: z.array(z.string()).min(1, 'Select at least one'),
})

export function ProfileForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
  })

  const onSubmit = (data) => {
    // Type-safe: data is z.infer<typeof profileSchema>
    updateProfile(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... */}
    </form>
  )
}
```

---

## 4. Validation & Schema

### 4.1 Zod

**Install:**
```bash
npm install zod
```

**Why Zod?**

**Comparison:**

| Feature | Zod | Yup | Joi |
|---------|-----|-----|-----|
| TypeScript Inference | Native | Requires plugin | Limited |
| Bundle Size | 9KB | 12KB | 25KB |
| Performance | Fast | Medium | Slow |
| API | Modern | Older | Older |
| React 19 | Yes | Yes | Yes |

**Zod Benefits:**

1. **TypeScript-First**
   ```typescript
   const schema = z.object({
     name: z.string(),
     age: z.number(),
   })

   // Type automatically inferred!
   type User = z.infer<typeof schema>
   // { name: string; age: number }
   ```

2. **Runtime Validation**
   ```typescript
   const result = schema.safeParse(data)
   if (result.success) {
     // data is validated and type-safe
   } else {
     // result.error contains detailed issues
   }
   ```

3. **Composable Schemas**
   ```typescript
   const messageSchema = z.object({
     id: z.string().uuid(),
     text: z.string().min(1),
     sender: z.enum(['user', 'ai']),
     timestamp: z.date(),
     corrections: z.array(correctionSchema).optional(),
   })

   const chatSchema = z.object({
     messages: z.array(messageSchema),
     scenario: z.enum(['ordering-food', 'job-interview']).optional(),
   })
   ```

4. **API Response Validation**
   ```typescript
   // src/lib/api/validation.ts
   import { z } from 'zod'

   const geminiResponseSchema = z.object({
     text: z.string(),
     corrections: z.array(z.object({
       original: z.string(),
       corrected: z.string(),
       explanation: z.string(),
     })).optional(),
   })

   // Validate at runtime
   async function fetchGeminiResponse(prompt: string) {
     const response = await fetch('/api/gemini', { /* ... */ })
     const data = await response.json()
     return geminiResponseSchema.parse(data) // Throws if invalid
   }
   ```

---

## 5. Utilities

### 5.1 date-fns

**Install:**
```bash
npm install date-fns
```

**Why date-fns?**

| Feature | date-fns | Day.js | Luxon | Moment |
|---------|----------|--------|-------|--------|
| Bundle Size | Tree-shakeable | Small | Medium | Large |
| Immutable | Yes | Yes | Yes | No |
| TypeScript | Yes | Yes | Yes | Limited |
| API | Functional | Chaining | Class-based | Chaining |

**date-fns Benefits:**

```typescript
import { format, formatDistanceToNow } from 'date-fns'

// Format message timestamp
format(new Date(message.timestamp), 'h:mm a') // "2:30 PM"

// Relative time
formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
// "5 minutes ago"

// Tree-shakeable - only import what you use
```

---

### 5.2 clsx / tailwind-merge

**Install:**
```bash
npm install clsx tailwind-merge
```

**Why These?**

```typescript
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage:
// cn('px-4 py-2', isActive && 'bg-blue-500', className)
// Handles conflicts, removes duplicates, etc.
```

**Benefits:**
- **Conditional Classes**: Easy conditional styling
- **Conflict Resolution**: tailwind-merge handles Tailwind conflicts
- **Type Safe**: TypeScript support

---

## 6. Performance Libraries

### 6.1 @tanstack/react-virtual

**Install:**
```bash
npm install @tanstack/react-virtual
```

**Why Virtual Scrolling?**

**Problem:**
```typescript
// Rendering 1000 messages = 1000 DOM nodes
{messages.map(m => <MessageBubble key={m.id} message={m} />)}
// Slow memory usage, janky scrolling
```

**Solution:**
```typescript
// Only render visible messages
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
})
// Only 10-20 DOM nodes regardless of total messages
```

**For Your Project:**
- Long chat histories
- Learning scenario lists
- Profile/course lists

---

### 6.2 React Idle Task

**Install:**
```bash
npm install react-idle-task
```

**Why?**

Defer non-critical work:
```typescript
import { useIdleCallback } from 'react-idle-task'

function ChatList() {
  const scheduleIdle = useIdleCallback()

  useEffect(() => {
    // Load analytics when browser is idle
    scheduleIdle(() => {
      loadChatAnalytics()
    })
  }, [])

  return <div>{/* ... */}</div>
}
```

---

## 7. Developer Experience

### 7.1 TypeScript ESLint

**Install:**
```bash
npm install -D typescript-eslint eslint-plugin-react-hooks
```

**Why Flat Config?**

ESLint's new flat config:
- Faster startup
- Simpler configuration
- Better TypeScript integration
- React 19 compatible

---

### 7.2 Prettier

**Install:**
```bash
npm install -D prettier eslint-config-prettier prettier-plugin-tailwindcss
```

**Why Prettier?**

- Consistent formatting
- No style debates
- Tailwind class sorting (via plugin)

---

## Summary

### Installation Command (All at Once)

```bash
# Testing
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw @playwright/test

# State Management
npm install @tanstack/react-query zustand

# UI Components
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
  @radix-ui/react-separator \
  @radix-ui/react-scroll-area \
  @radix-ui/react-label

# Forms
npm install react-hook-form @hookform/resolvers zod

# Utilities
npm install date-fns clsx tailwind-merge

# Performance
npm install @tanstack/react-virtual

# Code Quality
npm install -D typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier prettier-plugin-tailwindcss

# Git Hooks
npm install -D husky lint-staged
```

### Bundle Size Impact

| Library | Size | Impact |
|---------|------|--------|
| TanStack Query | 13KB | Medium |
| Zustand | 1KB | Negligible |
| Radix UI (avg 2-3 comps) | ~5KB | Low |
| React Hook Form | 13KB | Medium |
| Zod | 9KB | Low |
| date-fns (tree-shaken) | ~3KB | Low |
| **Total** | **~44KB** | **Low** |

**Note:** Most libraries are tree-shakeable or code-split, actual impact is lower.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Author:** SAke E-Learning Team
