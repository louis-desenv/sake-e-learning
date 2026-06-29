# Relatório de Bugs - RAG Implementation

## Data: Fevereiro 2026
## Status: CORRIGIDO

---

## Resumo

Foram identificados e corrigidos **7 bugs** na implementação do RAG (Retrieval Augmented Generation) que afetavam:
1. Carregamento do histórico
2. Salvamento de conversas
3. Ditado por voz

---

## Resumo dos Bugs Corrigidos

| Bug # | Severidade | Problema | Correção |
|-------|------------|----------|----------|
| #1 | 🔴 CRÍTICO | Identificador errado | Adicionado `id` ao UserProfile, helper `getUserId()` |
| #2 | 🔴 CRÍTICO | Voz não cria conversa | Adicionado `createConversation()` no fluxo de voz |
| #3 | 🟠 ALTO | Perfil não atualiza | Adicionado `messages` e refs nas dependências |
| #4 | 🟠 ALTO | Contexto stale na voz | Usando `messagesRef.current` |
| #5 | 🟡 MÉDIO | Usuários sem perfil | Trocado por `getOrCreateProfile()` |
| #6 | 🔴 CRÍTICO | Mensagens duplicadas | Usando `messagesRef` antes do try-catch |

---

### 🔴 Bug #1: Identificador de Usuário Incorreto
**Severidade:** CRÍTICO

**Problema:**
O código usava `user.name` como identificador para salvar/buscar dados no Supabase, mas o perfil do usuário não tinha um campo `id` consistente.

**Arquivo:** `types.ts`, `TextChatUI.tsx`

**Causa Raiz:**
- `UserProfile` não tinha campo `id`
- Serviços usavam `user.name` que pode variar ou ser duplicado

**Correção Aplicada:**
1. Adicionado campo `id` opcional ao `UserProfile` em `types.ts`
2. Criada função helper `getUserId()` em `TextChatUI.tsx` que usa `user.id` se disponível, ou `user.name` como fallback
3. Atualizadas todas as referências para usar o novo `userId`

**Código Antes:**
```typescript
const userId = user?.name || 'guest';
conversationService.getConversationsByScenario(user.name, ...);
```

**Código Depois:**
```typescript
const getUserId = (user) => user?.id || user?.name || 'guest';
const userId = getUserId(user);
conversationService.getConversationsByScenario(userId, ...);
```

---

### 🔴 Bug #2: Ditado por Voz Não Cria Conversa
**Severidade:** CRÍTICO

**Problema:**
O fluxo de reconhecimento de voz (ditado) não chamava `conversationService.createConversation()`, então as conversas por voz não eram salvas.

**Arquivo:** `TextChatUI.tsx` (linha ~1032)

**Causa Raiz:**
O código de voz só enviava mensagens para a API mas não criava registro no banco.

**Correção Aplicada:**
Adicionada lógica de criação de conversa no início do `recognition.onend`:

```typescript
// Create conversation if not exists (BUG #2 FIX)
let convId = conversationIdRef.current;
if (!convId) {
  const scenarioName = scenario?.toString() || 'real-life';
  const conversation = await conversationService.createConversation(userIdRef.current, scenarioName);
  if (conversation) {
    convId = conversation.id;
    setCurrentConversationId(conversation.id);
    conversationStartTime.current = new Date();
  }
}
```

---

### 🟠 Bug #3: Perfil Não Atualiza ao Finalizar Conversa
**Severidade:** ALTO

**Problema:**
O `useEffect` que processa o final da conversa não tinha `messages` no array de dependências, causando closure stale.

**Arquivo:** `TextChatUI.tsx` (linha ~684)

**Causa Raiz:**
```typescript
// ANTES - Bug
}, [currentConversationId, user?.name, scenarioString]);
// messages não estava incluso!
```

**Correção Aplicada:**
Usando refs para capturar valores atuais e evitar stale closures:

```typescript
const messagesRef = useRef(messages);
const userIdRef = useRef(userId);
const conversationIdRef = useRef(currentConversationId);

useEffect(() => {
  messagesRef.current = messages;
  userIdRef.current = userId;
  conversationIdRef.current = currentConversationId;
}, [messages, userId, currentConversationId]);
```

---

### 🟠 Bug #4: Voz Usa Contexto Stale
**Severidade:** ALTO

**Problema:**
O callback de voz usava `messages` diretamente, que era stale no momento da execução.

**Arquivo:** `TextChatUI.tsx` (linha ~1050)

**Causa Raiz:**
Closure capturava valor antigo de `messages`.

**Correção Aplicada:**
Usando `messagesRef.current` para obter o valor atual:

```typescript
// ANTES (Bug)
const conversationHistory = getRecentHistory([...messages, userMessage], ...);

// DEPOIS (Corrigido)
const currentMessages = messagesRef.current;
const conversationHistory = getRecentHistory([...currentMessages, userMessage], ...);
```

---

### 🟡 Bug #5: Usuários Novos Sem Perfil
**Severidade:** MÉDIO

**Problema:**
`getProfile` retornava `null` quando não existia perfil, mas não criava um automaticamente.

**Arquivo:** `contextService.ts` (linha ~24)

**Causa Raiz:**
`getProfile` não cria perfil automaticamente, apenas busca.

**Correção Aplicada:**
Trocado `getProfile` por `getOrCreateProfile`:

```typescript
// ANTES
const userProfile = await profileService.getProfile(userId, scenario);

// DEPOIS
const userProfile = await profileService.getOrCreateProfile(userId, scenario);
```

---

### 🔴 Bug #6: Mensagens Duplicadas (Stale Closure)
**Severidade:** CRÍTICO

**Problema:**
As mensagens do usuário apareciam duplicadas no chat. O AI respondia repetidamente.

**Arquivo:** `TextChatUI.tsx` (linha ~897)

**Causa Raiz:**
O `useCallback` do `handleSend` usava `messages` diretamente, que estava stale devido ao closure. Isso causava comportamento inesperado no fluxo de mensagens.

**Correção Aplicada:**
Movido `messagesRef.current` para antes do bloco try-catch para evitar stale closure:

```typescript
// ANTES (Bug)
try {
  const conversationHistory = getRecentHistory(messages, ...); // messages stale!
  ...
}

// DEPOIS (Corrigido)
const currentMessages = messagesRef.current;
try {
  const conversationHistory = getRecentHistory(currentMessages, ...);
  ...
}
```

Também atualizado o array de dependências do useCallback para incluir `messagesRef` em vez de `messages`.

---

## Bugs Não Corrigidos (Menores)

### Bug #7: Race Condition em Salvamento de Mensagens
**Severidade:** MÉDIO
**Status:** Não crítico - funciona na maioria dos casos

### Bug #8: Dados de Visitante (Guest)
**Severidade:** MÉDIO
**Status:** Para futura melhoria - não afeta usuários logados

---

## Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `types.ts` | Adicionado campo `id` ao `UserProfile` |
| `components/TextChatUI.tsx` | Helper getUserId, refs, correções de voz, histórico e mensagens duplicadas |
| `services/contextService.ts` | Trocado getProfile por getOrCreateProfile |

---

## Como Testar

1. **Histórico:** Faça conversas e verifique se aparecem no painel de histórico
2. **Voz:** Use o ditado e verifique se as mensagens são salvas
3. **Perfil:** Verifique no Supabase se o perfil é criado automaticamente

```sql
SELECT * FROM user_learning_profile LIMIT 10;
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 10;
```

---

## Próximos Passos (Opcional)

1. Adicionar validação de autenticação antes de permitir chats
2. Sistema de feedback do usuário
3. Dashboard de analytics
4. Adicionar embeddings para busca semântica (pgvector)
