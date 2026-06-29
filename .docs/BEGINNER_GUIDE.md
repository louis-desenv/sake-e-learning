# Refatoração React - Guia para Iniciantes

**Para quem só sabe React.js e nunca usou outras tecnologias.**

---

## 🎯 O Que Você Vai Aprender

1. Instalar novas bibliotecas (usando `npm install`)
2. Criar pastas organizadas
3. Separar componentes grandes em pequenos
4. Usar variáveis para cores (design tokens)
5. Reutilizar componentes

**Nada de Next.js, nada de conceitos avançados. Apenas React melhorado.**

---

## 📦 Passo 1: Entender o Que Vamos Instalar

### 1.1 `@tanstack/react-query`
**O que faz:** Guarda respostas da API (cache)
**Por que:** Carrega mais rápido, não fica chamando API toda hora

### 1.2 `zustand`
**O que faz:** Gerencia estado global (como useState, mas global)
**Por que:** Mais simples que Context API

### 1.3 `clsx` + `tailwind-merge`
**O que faz:** Ajuda a organizar classes CSS
**Por que:** Evita conflitos de classes Tailwind

### 1.4 `vitest`
**O que faz:** Roda testes (mais rápido que Jest)
**Por que:** Garante que código funciona

---

## 📦 Passo 2: Instalar Tudo de Uma Vez (5 min)

### Abra o terminal na pasta do projeto e rode:

```bash
npm install @tanstack/react-query zustand clsx tailwind-merge
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**O que vai acontecer:**
- Vai baixar ~10MB de pacotes
- Vai atualizar `package.json`
- Pronto! Nada mais pra configurar.

---

## 🗂️ Passo 3: Organizar Pastas (10 min)

### Estrutura ATUAL:
```
src/
├── components/
│   ├── TextChatUI.tsx
│   ├── GeminiVoiceChat.tsx
│   ├── Card.tsx
│   └── ...
├── hooks/
├── utils/
├── util/
└── context/
```

### Estrutura NOVA:
```
src/
├── components/
│   ├── ui/              ← Componentes reutilizáveis
│   ├── chat/            ← Componentes de chat
│   └── layout/          ← Header, Footer, Nav
├── lib/                ← Funções úteis (unificar utils + util)
├── features/           ← Features completas
│   ├── chat/
│   └── tts/
├── tokens/             ← Cores, espaçamentos
└── providers/          ← Context, QueryClient
```

### Criar as pastas:

```bash
# No terminal
mkdir src/components/ui
mkdir src/components/chat
mkdir src/components/layout
mkdir src/features/chat
mkdir src/features/tts
mkdir src/tokens
mkdir src/providers
```

---

## 🎨 Passo 4: Criar Design Tokens (15 min)

### Criar arquivo: `src/tokens/colors.ts`

```typescript
// src/tokens/colors.ts
// Todas as cores do app em um só lugar

export const colors = {
  // Azul (cor principal)
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',   ← Azul principal
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Roxo (secundário)
  purple: {
    500: '#a855f7',
    600: '#9333ea',
  },

  // Ciano (destaque)
  cyan: {
    500: '#06b6d4',
  },

  // Cinza (texto, fundo)
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
  },

  // Semânticas (sucesso, erro, aviso)
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
};
```

### Criar arquivo: `src/tokens/spacing.ts`

```typescript
// src/tokens/spacing.ts
// Espaçamentos consistentes

export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
};
```

### Criar arquivo: `src/tokens/index.ts`

```typescript
// src/tokens/index.ts
// Exporta tudo de um lugar

export * from './colors';
export * from './spacing';
```

---

## 🔧 Passo 5: Criar Função `cn()` (5 min)

### Criar arquivo: `src/lib/cn.ts`

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes Tailwind sem conflitos
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Como usar:

```tsx
import { cn } from '@/lib/cn';

// Antes (pode dar conflito)
<div className={`px-4 py-2 ${isActive ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-blue-600`} />

// Depois (sem conflitos)
<div className={cn(
  'px-4 py-2 hover:bg-blue-600',
  isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'
)} />
```

---

## 🧩 Passo 6: Criar Componente `Button` (15 min)

### Criar arquivo: `src/components/ui/Button.tsx`

```tsx
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Tipos de botão
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

  // Tamanhos
  size?: 'sm' | 'md' | 'lg';

  // Estado de carregamento
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading}
        className={cn(
          // Classes base (sempre presentes)
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',

          // Variante de cor
          {
            'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500': variant === 'primary',
            'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500': variant === 'secondary',
            'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-500': variant === 'outline',
            'text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500': variant === 'destructive',
          },

          // Tamanho
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },

          // Classes customizadas
          className
        )}
        {...props}
      >
        {/* Spinner quando carregando */}
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}

        {children}
      </button>
    );
  }
);

// Nome para aparecer no React DevTools
Button.displayName = 'Button';
```

### Usar o Button:

```tsx
import { Button } from '@/components/ui/Button';

// Botão primário
<Button variant="primary" onClick={handleClick}>
  Enviar
</Button>

// Botão secundário
<Button variant="secondary" size="sm">
  Cancelar
</Button>

// Botão com carregamento
<Button isLoading={isSending}>
  Enviando...
</Button>

// Botão outline
<Button variant="outline" size="lg">
  Voltar
</Button>
```

---

## 🧩 Passo 7: Criar Componente `Input` (10 min)

### Criar arquivo: `src/components/ui/Input.tsx`

```tsx
// src/components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Mostra erro
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // Classes base
          'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',

          // Estado de erro
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent',

          // Desabilitado
          'disabled:bg-gray-100 disabled:cursor-not-allowed',

          // Classes customizadas
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

### Usar o Input:

```tsx
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <form>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        error={error}
      />

      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="******"
      />
    </form>
  );
}
```

---

## 🧩 Passo 8: Separar TextChatUI em Componentes (1 hora)

### Problema atual:
```tsx
// components/TextChatUI.tsx
// 1,139 linhas em um arquivo! Muito grande.
```

### Solução: Separar em 3 componentes

#### 8.1 Criar `MessageList.tsx`

```tsx
// src/components/chat/MessageList.tsx
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
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

#### 8.2 Criar `MessageBubble.tsx`

```tsx
// src/components/chat/MessageBubble.tsx
import { Message } from '@/types/chat';
import { cn } from '@/lib/cn';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // É mensagem do usuário?
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>

      {/* Avatar da AI (apenas se não for usuário) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          AI
        </div>
      )}

      {/* Bubble da mensagem */}
      <div
        className={cn(
          'max-w-[70%] px-4 py-3',
          isUser
            ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
        )}
      >
        <p className="text-base whitespace-pre-wrap">{message.content}</p>
      </div>

      {/* Avatar do usuário (apenas se for usuário) */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          U
        </div>
      )}
    </div>
  );
}
```

#### 8.3 Criar `ChatInput.tsx`

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
    // Não enviar vazio
    if (!text.trim() || disabled) return;

    // Enviar mensagem
    onSend(text.trim());

    // Limpar input
    setText('');
  };

  // Enviar com Enter ( Shift+Enter para nova linha)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-3 p-4 border-t bg-white">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Digite sua mensagem..."
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows={1}
      />

      <Button onClick={handleSubmit} disabled={disabled || !text.trim()}>
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
}
```

#### 8.4 Atualizar `TextChatUI.tsx`

```tsx
// components/TextChatUI.tsx
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';

interface TextChatUIProps {
  scenarioId: string;
}

export function TextChatUI({ scenarioId }: TextChatUIProps) {
  // Estado das mensagens (pode vir de API depois)
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Enviar mensagem
  const handleSendMessage = async (content: string) => {
    setIsLoading(true);

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // TODO: Chamar API aqui
    // const response = await fetch('/api/chat/send', { ... });

    // Simular resposta da AI (remover depois)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Você disse: ${content}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Chat</h1>
          <p className="text-sm text-gray-500">Scenario: {scenarioId}</p>
        </div>
      </div>

      {/* Lista de mensagens */}
      <MessageList messages={messages} />

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
```

---

## 🎯 Passo 9: Testar (10 min)

### 9.1 Rodar o app

```bash
npm run dev
```

### 9.2 Verificar:

- [ ] App carrega sem erros?
- [ ] Chat funciona?
- [ ] Mensagens aparecem?
- [ ] Estilo igual ao antes?

### 9.3 Se tiver erro:

1. **Erro de import:**
   - Verifique se o caminho está certo
   - Ex: `@/components/ui/Button` → `./components/ui/Button`

2. **Erro de compilação:**
   - Verifique se fechou todas as chaves `}`
   - Verifique se importou tudo necessário

3. **Estilo diferente:**
   - Verifique se copiou todas as classes Tailwind
   - Use o inspetor do navegador para comparar

---

## 📋 Checklist de Conclusão

Copie e marque o que fez:

**Setup:**
- [ ] Instalei as dependências
- [ ] Criei as pastas
- [ ] Criei design tokens
- [ ] Criei a função `cn()`

**Componentes:**
- [ ] Criei Button.tsx
- [ ] Criei Input.tsx
- [ ] Separei TextChatUI em 3 componentes
- [ ] Testei tudo

**Organização:**
- [ ] Movei arquivos para pastas certas
- [ ] Atualizei imports

---

## 🎉 Parabéns!

Se você completou tudo, agora você tem:

✅ Código mais organizado
✅ Componentes reutilizáveis
✅ Design tokens (cores centralizadas)
✅ Componentes menores (mais fáceis de entender)
✅ Pronto para crescer

**E o melhor:** Aparência 100% igual! 🎨

---

## 🚀 Próximos Passos

Agora que você sabe o padrão:

1. Escolha outro componente grande (ex: `GeminiVoiceChat.tsx`)
2. Separe em componentes menores
3. Use Button e Input onde fizer sentido
4. Use design tokens para cores

**O segredo:** Pequenos componentes + reaproveitamento = código melhor

---

**Qualquer dúvida, é só me chamar!** 🚀
