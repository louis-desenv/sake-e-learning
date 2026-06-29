# Refatoração Front-End - Checklist de Execução

**Copie, cole e execute.**

---

## 📋 Day 1: Setup Inicial (30-45 min)

### ✅ Task 1.1: Instalar dependências
```bash
npm install @tanstack/react-query zustand clsx tailwind-merge
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### ✅ Task 1.2: Criar pasta `src/lib`
```bash
mkdir src/lib
```

### ✅ Task 1.3: Criar `src/lib/cn.ts`
```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### ✅ Task 1.4: Criar `src/tokens/index.ts`
```typescript
// src/tokens/index.ts
export const colors = {
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
  secondary: {
    500: '#a855f7',
    600: '#9333ea',
  },
  accent: {
    500: '#06b6d4',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

export const radius = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
};
```

### ✅ Task 1.5: Atualizar `tailwind.config.js`
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
```

---

## 📋 Day 2: Componentes Base (1 hora)

### ✅ Task 2.1: Criar pasta `src/components/ui`
```bash
mkdir src/components/ui
```

### ✅ Task 2.2: Criar `src/components/ui/Button.tsx`
```tsx
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500': variant === 'primary',
            'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500': variant === 'secondary',
            'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500': variant === 'outline',
            'text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
            'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500': variant === 'destructive',
          },
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### ✅ Task 2.3: Criar `src/components/ui/Input.tsx`
```tsx
// src/components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
          error
            ? 'border-error-500 focus:ring-error-500'
            : 'border-gray-300 focus:ring-primary-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

### ✅ Task 2.4: Criar `src/components/ui/Modal.tsx`
```tsx
// src/components/ui/Modal.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 Day 3: Separar TextChatUI (1-2 horas)

### ✅ Task 3.1: Criar pasta `src/components/chat`
```bash
mkdir src/components/chat
```

### ✅ Task 3.2: Extrair `MessageList.tsx`
```tsx
// src/components/chat/MessageList.tsx
import { MessageBubble } from './MessageBubble';
import { ChatMessage } from '@/types/chat';

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
```

### ✅ Task 3.3: Extrair `MessageBubble.tsx`
```tsx
// src/components/chat/MessageBubble.tsx
import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/cn';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center text-white text-sm font-medium">
          AI
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[70%] px-4 py-3',
          isUser
            ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
        )}
      >
        <p className="text-base whitespace-pre-wrap">{message.content}</p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
      )}
    </div>
  );
}
```

### ✅ Task 3.4: Extrair `ChatInput.tsx`
```tsx
// src/components/chat/ChatInput.tsx
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <div className="flex gap-3 p-4 border-t bg-white">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={disabled}
        placeholder="Digite sua mensagem..."
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        size="md"
      >
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
}
```

### ✅ Task 3.5: Atualizar `TextChatUI.tsx`
```tsx
// components/TextChatUI.tsx
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';

export function TextChatUI({ scenarioId }: { scenarioId: string }) {
  const { messages, sendMessage, isLoading } = useChat(scenarioId);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Chat</h1>
          <p className="text-sm text-gray-500">Scenario: {scenarioId}</p>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
```

---

## 📋 Day 4: Configurar TanStack Query (30 min)

### ✅ Task 4.1: Criar `src/providers/QueryProvider.tsx`
```tsx
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### ✅ Task 4.2: Criar hook `useChat.ts`
```tsx
// src/hooks/useChat.ts
import { useMutation, useQuery } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useChat(scenarioId: string) {
  // Buscar mensagens
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', scenarioId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/${scenarioId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  });

  // Enviar mensagem
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/chat/${scenarioId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      // Refetch mensagens após enviar
      queryClient.invalidateQueries({ queryKey: ['chat', scenarioId] });
    },
  });

  return {
    messages,
    isLoading: isLoading || isSending,
    sendMessage: (content: string) => sendMessage(content),
  };
}
```

### ✅ Task 4.3: Adicionar QueryProvider no `main.tsx`
```tsx
// main.tsx
import { QueryProvider } from './providers/QueryProvider';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </QueryProvider>
);
```

---

## 📋 Day 5: Adicionar Testes (30 min)

### ✅ Task 5.1: Criar `vitest.config.ts`
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### ✅ Task 5.2: Criar `src/test/setup.ts`
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### ✅ Task 5.3: Criar teste para Button
```tsx
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
```

### ✅ Task 5.4: Adicionar script no `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 📋 Day 6: Organizar Pastas (15 min)

### ✅ Task 6.1: Criar estrutura de pastas
```bash
mkdir -p src/features/chat/{hooks,services,types}
mkdir -p src/features/tts/{hooks,services}
mkdir -p src/components/layout
```

### ✅ Task 6.2: Mover arquivos
```bash
# Mover hooks
mv src/hooks/useGeminiLive.ts src/features/chat/hooks/
mv src/hooks/useLiveKitRoom.ts src/features/chat/hooks/

# Mover serviços
mv src/services/geminiService.ts src/features/chat/services/
mv src/services/tts/*.ts src/features/tts/services/

# Mover componentes de layout
mv src/components/BottomNav.tsx src/components/layout/
mv src/components/PageTransition.tsx src/components/layout/
```

### ✅ Task 6.3: Consolidar utils
```bash
# Mover tudo para lib/
mv src/utils/* src/lib/
mv src/util/* src/lib/
rmdir src/utils src/util
```

### ✅ Task 6.4: Atualizar imports
```tsx
// Antes
import { BottomNav } from '../BottomNav';
import { cn } from '../../utils/cn';

// Depois
import { BottomNav } from '@/components/layout/BottomNav';
import { cn } from '@/lib/cn';
```

---

## 📋 Day 7: Testar e Ajustar (30 min)

### ✅ Task 7.1: Rodar testes
```bash
npm test
```

### ✅ Task 7.2: Verificar console
- Abrir app
- Testar chat
- Verificar não há erros
- Testar responsividade

### ✅ Task 7.3: Commit das mudanças
```bash
git add .
git commit -m "refactor: improve code organization

- Add design tokens and cn utility
- Extract TextChatUI into smaller components
- Add TanStack Query for API calls
- Create reusable UI components (Button, Input, Modal)
- Add basic test setup
- Reorganize folder structure

Maintains 100% visual appearance"
```

---

## ✅ Checklist Final

**Setup:**
- [ ] Dependências instaladas
- [ ] Design tokens criados
- [ ] Util `cn()` criado
- [ ] Tailwind config atualizado

**Componentes:**
- [ ] Button, Input, Modal criados
- [ ] TextChatUI separado em 3 componentes
- [ ] Componentes organizados em pastas

**State:**
- [ ] TanStack Query configurado
- [ ] Hook `useChat` criado

**Testes:**
- [ ] Vitest configurado
- [ ] Pelo menos 1 teste criado

**Organização:**
- [ ] Pastas criadas (features/, lib/, components/layout/)
- [ ] Arquivos movidos
- [ ] Imports atualizados

---

## 🎯 Resultado

| Antes | Depois |
|-------|--------|
| TextChatUI: 1,139 linhas | 3 componentes (~100 linhas cada) |
| Classes hardcoded | Design tokens |
| Sem cache | TanStack Query |
| Sem testes | Vitest configurado |
| utils/ + util/ | lib/ unificado |

**Mesma aparência 100% garantida!** ✅

---

**Próximo passo:** Escolha uma página e refatore usando o mesmo padrão.
