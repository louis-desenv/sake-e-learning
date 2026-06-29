# Plano de Refatoração - Frontend

## Data: Fevereiro 2026
## Versão: 1.0

---

## 1. Visão Geral

Este documento apresenta um plano de refatoração completo para o frontend do projeto Sakae E-Learning. O objetivo é melhorar a manutenção, performance e qualidade do código.

### Estado Atual

| Aspecto | Status |
|---------|--------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Estilização | Tailwind CSS |
| Estado Global | Context API (mixado) |
| Estado Servidor | TanStack Query (não utilizado) |
| Store Global | Zustand (instalado mas não usado) |

### Problemas Identificados

| Prioridade | Problema | Impacto |
|------------|----------|---------|
| 🔴 CRÍTICO | TextChatUI.tsx com 1.676 linhas | Manutenção impossível |
| 🔴 CRÍTICO | Componentes "god" | Violação SRP |
| 🟠 ALTO | TanStack Query instalado mas não usado | Perda de funcionalidades |
| 🟠 ALTO | Zustand não utilizado | Estado global bagunçado |
| 🟡 MÉDIO | Utils duplicadas (utils/ e util/) | Confusão |
| 🟡 MÉDIO | Pastas inconsistentes | Dificuldade navegação |

---

## 2. Arquitetura Proposta

### Estrutura de Pastas

```
src/
├── app/                          # Configuração principal
│   ├── App.tsx                  # Root component
│   ├── router.tsx               # Rotas centralizadas
│   └── providers.tsx             # Todos os providers
│
├── features/                     # Feature-based modules
│   ├── chat/
│   │   ├── components/          # Componentes específicos do chat
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── VoiceRecorder.tsx
│   │   │   └── ...
│   │   ├── hooks/                # Hooks específicos do chat
│   │   │   ├── useChat.ts
│   │   │   ├── useVoiceInput.ts
│   │   │   └── useConversation.ts
│   │   ├── services/             # Services específicos (se necessário)
│   │   ├── types.ts             # Tipos específicos da feature
│   │   └── index.ts             # Exports
│   │
│   ├── profile/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ...
│   │
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ...
│   │
│   └── learning/
│       ├── components/
│       ├── hooks/
│       └── ...
│
├── shared/                      # Código compartilhado
│   ├── components/              # Componentes reutilizáveis (UI)
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Card/
│   │   └── ...
│   │
│   ├── hooks/                  # Hooks genéricos
│   │   ├── useLocalStorage.ts
│   │   └── ...
│   │
│   ├── utils/                  # Utilitários (SÓ UM!)
│   │   ├── format/
│   │   ├── validation/
│   │   └── ...
│   │
│   ├── types/                  # Tipos globais
│   │   └── index.ts
│   │
│   └── constants/               # Constantes globais
│
├── services/                   # Camada de API
│   ├── api.ts                 # Axios instance
│   ├── auth/
│   │   └── authService.ts
│   ├── ai/
│   │   ├── geminiService.ts
│   │   └── ttsService.ts
│   ├── db/                     # Supabase
│   │   ├── supabase.ts
│   │   ├── conversationService.ts
│   │   └── profileService.ts
│   └── livekit/
│       └── tokenService.ts
│
├── stores/                     # Zustand stores
│   ├── userStore.ts
│   ├── chatStore.ts
│   └── uiStore.ts
│
├── config/                     # Configurações
│   ├── env.ts
│   └── constants.ts
│
└── main.tsx                   # Entry point
```

---

## 3. Plano de Execução

### Fase 1: Infraestrutura (Semanas 1-2)

#### 1.1 Configurar TanStack Query
```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

#### 1.2 Criar Zustand Stores
```typescript
// stores/userStore.ts
import { create } from 'zustand';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

#### 1.3 Limpar Utils
- Unificar `utils/` e `util/` em apenas `shared/utils/`
- Remover código morto

---

### Fase 2: Decomposição do TextChatUI (Semanas 3-5)

#### 2.1 Quebrar em Componentes Menores

| Componente | Responsabilidade | Linhas Esperadas |
|------------|------------------|-------------------|
| `ChatContainer` | Layout principal do chat | ~50 |
| `MessageList` | Lista de mensagens | ~100 |
| `MessageBubble` | Uma mensagem individual | ~80 |
| `ChatInput` | Campo de texto + envio | ~100 |
| `VoiceRecorder` | Gravação de voz | ~150 |
| `VoiceIndicator` | Estado de gravação | ~50 |
| `TTSAudioPlayer` | Reprodução TTS | ~100 |
| `SettingsPanel` | Configurações | ~150 |
| `HistoryPanel` | Histórico de conversas | ~200 |

#### 2.2 Criar Hooks Especializados

```typescript
// features/chat/hooks/useChat.ts
export function useChat(scenario?: string) {
  const { messages, sendMessage, isLoading } = useConversation(scenario);
  const { startRecording, stopRecording, transcript } = useVoiceInput();
  
  return {
    messages,
    sendMessage,
    isLoading,
    startRecording,
    stopRecording,
    transcript,
  };
}
```

---

### Fase 3: Componentes UI (Semanas 6-7)

#### 3.1 Criar Biblioteca de Componentes

```
shared/components/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   └── index.ts
├── Input/
│   ├── Input.tsx
│   └── index.ts
├── Modal/
│   ├── Modal.tsx
│   └── index.ts
└── ...
```

#### 3.2 Implementar Design Tokens
```typescript
// shared/constants/theme.ts
export const theme = {
  colors: {
    primary: '#4a7cf5',
    secondary: '#6c5ce7',
    // ...
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    // ...
  },
};
```

---

### Fase 4: Limpeza e Refinamento (Semanas 8-10)

#### 4.1 Remover Código Legacy
- Eliminar rotas duplicadas
- Remover componentes não utilizados
- Limitar dependências

#### 4.2 Implementar testes
- Setup Vitest
- Criar testes unitários para hooks
- Criar testes de integração para componentes

---

## 4. Checklist de Refatoração

### Fase 1: Infraestrutura
- [ ] Configurar TanStack Query Provider
- [ ] Criar userStore (Zustand)
- [ ] Criar chatStore (Zustand)
- [ ] Unificar pastas utils/util

### Fase 2: TextChatUI
- [ ] Extrair ChatContainer
- [ ] Extrair MessageList
- [ ] Extrair MessageBubble
- [ ] Extrair ChatInput
- [ ] Extrair VoiceRecorder
- [ ] Extrair TTSControls
- [ ] Extrair SettingsPanel
- [ ] Extrair HistoryPanel
- [ ] Criar hooks: useChat, useVoiceInput, useConversation

### Fase 3: UI Components
- [ ] Criar componente Button
- [ ] Criar componente Input
- [ ] Criar componente Modal
- [ ] Criar componente Card
- [ ] Implementar Design Tokens
- [ ] Aplicar em toda a aplicação

### Fase 4: Limpeza
- [ ] Remover rotas legacy duplicadas
- [ ] Remover componentes não utilizados
- [ ] Configurar ESLint/Prettier
- [ ] Configurar Vitest
- [ ] Criar testes básicos

---

## 5. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebrar funcionalidade existente | Alta | Alto | Testes E2E antes e depois |
| Tempo maior que o esperado | Média | Médio | Priorizar componentes críticos |
| Conflitos de merge | Alta | Médio | Branch específico para refatoração |
| Perda de produtividade temporária | Alta | Médio | Planejar em sprints curtos |

---

## 6. Métricas de Sucesso

| Métrica | Atual | Meta |
|---------|-------|------|
| Linhas em TextChatUI.tsx | 1.676 | < 300 |
| Cobertura de testes | 0% | > 60% |
| Tamanho bundle | ? MB | < 2 MB |
| Lighthouse Performance | ? | > 90 |

---

## 7. Ordem de Prioridade

### Must Have (Primeiro)
1. ✅ Configurar TanStack Query
2. ✅ Criar Zustand stores
3. ✅ Decompor TextChatUI.tsx
4. ✅ Extrair hooks especializados

### Should Have (Segundo)
5. ✅ Criar biblioteca de componentes
6. ✅ Implementar design tokens
7. ✅ Limpar código legacy

### Nice to Have (Terceiro)
8. ✅ Setup de testes
9. ✅ ESLint/Prettier
10. ✅ Documentação de componentes

---

## 8. Referências

- [SolidJS React Patterns](https://github.com/ryan Carnioto/react-solid-patterns)
- [TanStack Query Best Practices](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Zustand Middleware](https://github.com/pmndrs/zustand#middleware)
- [Component-Driven Development](https://componentdriven.org/)

---

## Próximos Passos

1. Revisar e aprovar plano
2. Criar branch `refactor/frontend`
3. Executar Fase 1
4. Testar funcionalidades existentes
5. Executar Fase 2

---

**Documento criado para planejamento de refatoração do frontend**
**Versão: 1.0**
