# Refatoração Front-End - Guia Rápido

**Objetivo:** Melhorar código mantendo 100% a aparência atual
**Tempo:** Comece hoje
**Dificuldade:** Fácil

---

## 🎯 O Que Vamos Fazer

1. ✅ Instalar bibliotecas essenciais
2. ✅ Criar sistema de grid simples
3. ✅ Padronizar nomes de classes
4. ✅ Separar componentes grandes
5. ✅ Adicionar design tokens

---

## 📦 Passo 1: Instalar Bibliotecas (5 min)

```bash
npm install @tanstack/react-query zustand
npm install clsx tailwind-merge
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**O que cada um faz:**
- `@tanstack/react-query`: Cache de API (carrega mais rápido)
- `zustand`: Estado global (mais simples que Context)
- `clsx` + `tailwind-merge`: Classes CSS mais organizadas
- `vitest`: Testes (mais rápido que Jest)

---

## 🎨 Passo 2: Criar Design Tokens (10 min)

### Criar arquivo: `src/tokens/index.ts`

```typescript
// Cores atuais do app
export const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',  // Azul principal
    600: '#2563eb',
  },
  secondary: {
    500: '#a855f7', // Roxo
    600: '#9333ea',
  },
  accent: {
    500: '#06b6d4',  // Ciano
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937',
  },
  semantic: {
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
  }
};

// Espaçamento
export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
};

// Border radius
export const radius = {
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
};
```

---

## 🔧 Passo 3: Atualizar Tailwind Config (5 min)

### Arquivo: `tailwind.config.js`

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
        secondary: {
          500: '#a855f7',
          600: '#9333ea',
        },
        accent: {
          500: '#06b6d4',
        }
      },
      borderRadius: {
        '2xl': '1.5rem',
      }
    }
  },
  plugins: [],
};
```

---

## 🧩 Passo 4: Criar Utilitário de Classes (5 min)

### Arquivo: `src/lib/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combina classes Tailwind sem conflitos
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Como usar:**
```tsx
import { cn } from '@/lib/cn';

<div className={cn(
  "px-4 py-2 rounded-lg",
  isActive && "bg-primary-500 text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />
```

---

## 📦 Passo 5: Separar TextChatUI (30 min)

### Arquivo atual: `components/TextChatUI.tsx` (1,139 linhas)

### Separar em:

```tsx
// components/chat/MessageList.tsx
export function MessageList({ messages }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}

// components/chat/MessageBubble.tsx
export function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] px-4 py-3 rounded-2xl",
        isUser
          ? "bg-primary-500 text-white rounded-tr-sm"
          : "bg-gray-100 text-gray-800 rounded-tl-sm"
      )}>
        <p className="text-base">{message.content}</p>
      </div>
    </div>
  );
}

// components/chat/ChatInput.tsx
export function ChatInput({ onSend }) {
  const [text, setText] = useState('');

  return (
    <div className="flex gap-2 p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Digite sua mensagem..."
      />
      <button
        onClick={() => { onSend(text); setText(''); }}
        className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
      >
        Enviar
      </button>
    </div>
  );
}
```

### TextChatUI simplificado:

```tsx
// components/TextChatUI.tsx
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { TTSControls } from './chat/TTSControls';

export function TextChatUI({ scenarioId }) {
  const { messages, sendMessage } = useChat(scenarioId);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
      </div>

      <MessageList messages={messages} />

      <TTSControls />
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

---

## 🗂️ Passo 6: Reorganizar Pastas (15 min)

### Estrutura atual para nova estrutura:

```bash
# Antes
components/
  TextChatUI.tsx
  GeminiVoiceChat.tsx
  AudioOnlyChat.tsx
  Card.tsx
  BottomNav.tsx

utils/
  ...
util/
  ...

# Depois
src/
  components/
    ui/                 # Componentes reutilizáveis
      Button.tsx
      Input.tsx
      Card.tsx
      Modal.tsx
    chat/               # Componentes de chat
      MessageList.tsx
      MessageBubble.tsx
      ChatInput.tsx
      VoiceInput.tsx
      TTSControls.tsx
    layout/             # Layout
      BottomNav.tsx
      Header.tsx
  lib/                 # Utilitários (unificar utils + util)
    cn.ts
    format.ts
  features/            # Features completas
    chat/
      hooks/useChat.ts
      services/chatService.ts
    tts/
      hooks/useTTS.ts
      services/ttsService.ts
```

---

## 🧪 Passo 7: Adicionar Teste Simples (10 min)

### Criar: `src/components/ui/Button.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Criar: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

### Criar: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

---

## 🚀 Passo 8: Configurar TanStack Query (10 min)

### Criar: `src/providers/QueryProvider.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
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

### Usar no App:

```tsx
// main.tsx
import { QueryProvider } from './providers/QueryProvider';
import { BrowserRouter } from 'react-router-dom';

<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</QueryClientProvider>
```

---

## 📋 Checklist de Implementação

### Hoje (Day 1)
- [ ] Instalar dependências
- [ ] Criar design tokens
- [ ] Criar util `cn()`
- [ ] Atualizar Tailwind config

### Dia 2
- [ ] Separar TextChatUI em 3 componentes
- [ ] Mover utils/ para lib/
- [ ] Adicionar QueryProvider

### Dia 3
- [ ] Criar componentes UI (Button, Input, Card)
- [ ] Substituir classes hardcoded por tokens
- [ ] Adicionar 1 teste simples

### Dia 4
- [ ] Criar estrutura features/
- [ ] Mover hooks para features/
- [ ] Atualizar imports

### Dia 5
- [ ] Testar tudo
- [ ] Ajustes finos
- [ ] Commit das mudanças

---

## 🎯 Resultado Esperado

**Antes:**
```tsx
// 1,139 linhas em um arquivo
// Classes hardcoded
// Sem testes
// Sem organização
```

**Depois:**
```tsx
// Componentes de ~100 linhas
// Design tokens
// Testes básicos
// Pastas organizadas
```

---

## 📝 Exemplo Prático: Botão Padrão

### Criar: `src/components/ui/Button.tsx`

```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          // Variants
          {
            'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500': variant === 'primary',
            'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500': variant === 'secondary',
            'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500': variant === 'outline',
            'text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
            'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500': variant === 'destructive',
          },
          // Sizes
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

**Usar:**
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Enviar Mensagem
</Button>

<Button variant="outline" size="sm">
  Cancelar
</Button>
```

---

## ⚡ Comandos Úteis

```bash
# Rodar testes
npm test

# Rodar em watch mode
npm test -- --watch

# Ver cobertura
npm run test:coverage

# Format código
npm run format

# Lint
npm run lint
```

---

## ✅ Sucesso!

Quando terminar:
- ✅ Código mais organizado
- ✅ Componentes menores (mais fáceis de manter)
- ✅ Design consistente
- ✅ Pronto para crescer

---

**Tempo total:** ~3-4 horas
**Dificuldade:** Fácil
**Resultado:** Código muito melhor, mesma aparência
