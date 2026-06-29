# Plano: RAG com Supabase para Personalização do AI Tutor

## Visão Geral

Criar um sistema RAG (Retrieval Augmented Generation) usando o histórico de conversas do usuário armazenado no Supabase para:
- Personalizar respostas baseadas no histórico do aluno
- Adaptar o ensino ao nível e objetivos do usuário
- Manter contexto entre sessões

---

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO RAG PROPOSTO                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Mensagem    │───▶│  Buscar      │───▶│  Construir        │  │
│  │  do Usuário │    │  Contexto    │    │  Prompt Rico      │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                             │                      │             │
│                             ▼                      ▼             │
│                     ┌──────────────┐    ┌──────────────────┐    │
│                     │  Supabase    │    │  Gemini AI       │    │
│                     │  (Vector/    │    │  + Contexto      │    │
│                     │   Query)     │    │  = Resposta      │    │
│                     └──────────────┘    └──────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Expansão do Schema do Banco

### 1.1 Adicionar campos à tabela `conversations`

```sql
-- Adicionar campos para capturar contexto do usuário no momento da conversa
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_level TEXT DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS native_language TEXT DEFAULT 'portuguese',
ADD COLUMN IF NOT EXISTS user_goals TEXT[],  -- ARRAY de goals
ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_corrections INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS topics_covered TEXT[],  -- ARRAY de tópicos discutidos
ADD COLUMN IF NOT EXISTS user_satisfaction INTEGER;  -- 1-5 rating
```

### 1.2 Criar tabela para perfil de aprendizado do usuário

```sql
CREATE TABLE user_learning_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- referencia ao user.name
  scenario TEXT NOT NULL,  -- 'phone-screen', 'job-interviews', etc.
  
  -- Métricas agregadas
  total_conversations INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_duration_seconds INTEGER DEFAULT 0,
  
  -- Nível atual (pode evoluir)
  current_level TEXT DEFAULT 'beginner',
  level_progress INTEGER DEFAULT 0,  -- 0-100
  
  -- Topics mais praticados
  topics_practiced TEXT[] DEFAULT '{}',
  
  -- Áreas que precisam de melhoria (detectadas automaticamente)
  areas_to_improve TEXT[] DEFAULT '{}',
  
  -- Palavras/expressões mais cometidas erros
  common_mistakes JSONB DEFAULT '{}',
  
  -- último acesso
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, scenario)
);
```

### 1.3 Criar tabela para armazenar contexto indexável (RAG)

```sql
-- Tabela para armazenar snippets de contexto para busca
CREATE TABLE conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  scenario TEXT NOT NULL,
  
  -- Conteúdo chunkado
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'message',  -- 'message', 'correction', 'topic', 'summary'
  
  -- Metadados para busca
  message_index INTEGER,  -- posição na conversa
  tokens_count INTEGER,
  embedding VECTOR(768),  -- para busca semântica (futuro com pgvector)
  
  -- Contexto adicional
  themes TEXT[] DEFAULT '{}',  -- temas detectados
  difficulty_level TEXT DEFAULT 'intermediate',
  is_correction BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_user_scenario (user_id, scenario),
  INDEX idx_themes (themes) USING GIN,
  INDEX idx_content_type (content_type)
);

-- Habilitar extensão vector se necessário no futuro
-- CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Fase 2: Serviço de Processamento de Contexto

### 2.1 Novo serviço: `contextService.ts`

```typescript
// services/contextService.ts

interface UserLearningProfile {
  userId: string;
  scenario: string;
  totalConversations: number;
  averageDuration: number;
  currentLevel: string;
  topicsPracticed: string[];
  areasToImprove: string[];
  commonMistakes: Record<string, number>;
}

interface ConversationContext {
  recentMessages: Message[];
  userProfile: UserLearningProfile;
  scenarioContext: string;
  learningFocus: string[];
}

export class ContextService {
  // 1. Buscar perfil de aprendizado do usuário
  async getUserProfile(userId: string, scenario: string): Promise<UserLearningProfile>
  
  // 2. Buscar contexto relevante das conversas anteriores
  async getRelevantContext(
    userId: string, 
    scenario: string, 
    currentMessage: string,
    limit?: number
  ): Promise<ConversationContext>
  
  // 3. Atualizar perfil após conversa
  async updateUserProfile(
    userId: string, 
    scenario: string,
    metrics: {
      duration: number;
      messageCount: number;
      corrections: Correction[];
      topics: string[];
    }
  ): Promise<void>
  
  // 4. Gerar resumo da conversa para storage
  async generateConversationSummary(
    conversationId: string
  ): Promise<string>
  
  // 5. Detectar temas e áreas de melhoria
  async analyzeConversation(
    messages: Message[]
  ): Promise<{
    topics: string[];
    corrections: Correction[];
    difficulty: string;
    areasToImprove: string[];
  }>
}
```

### 2.2 Funções helper para construir contexto

```typescript
// services/contextBuilder.ts

export function buildRAGPrompt(
  basePrompt: string,
  context: ConversationContext,
  userMessage: string
): string {
  const sections = [
    basePrompt,
    '',
    '=== PERFIL DO ALUNO ===',
    `Nome: ${context.userProfile.userId}`,
    `Nível: ${context.userProfile.currentLevel}`,
    `Idioma nativo: ${context.userProfile.nativeLanguage}`,
    `Objetivos: ${context.userProfile.topicsPracticed.join(', ')}`,
    '',
    '=== ÁREAS A MELHORAR ===',
    context.userProfile.areasToImprove.length > 0
      ? context.userProfile.areasToImprove.join(', ')
      : 'Nenhuma área específica identificada',
    '',
    '=== HISTÓRICO RECENTE ===',
    context.recentMessages
      .slice(-10)  // últimas 10 mensagens
      .map(m => `${m.role === 'user' ? 'Aluno' : 'Tutor'}: ${m.content}`)
      .join('\n'),
    '',
    '=== CONVERSA ATUAL ===',
    `Aluno: ${userMessage}`,
    '',
    'Tutor:'
  ];
  
  return sections.join('\n');
}
```

---

## Fase 3: Integração com o Fluxo Atual

### 3.1 Modificações no `TextChatUI.tsx`

```typescript
// Adicionar estado para contexto RAG
const [ragContext, setRagContext] = useState<ConversationContext | null>(null);

// Carregar contexto quando o chat inicia
useEffect(() => {
  if (user?.name && scenario) {
    loadRAGContext();
  }
}, [user?.name, scenario]);

const loadRAGContext = async () => {
  const context = await contextService.getRelevantContext(
    user.name,
    scenarioString,
    '',
    5
  );
  setRagContext(context);
};

// Modificar handleSend para incluir contexto RAG
const handleSend = async () => {
  // ... código existente ...
  
  const fullPrompt = buildRAGPrompt(
    systemPrompt,
    ragContext!,  // contexto RAG
    userMessage.text
  );
  
  const aiResponse = await sendChatMessageWithContext(
    userMessage.text,
    fullPrompt,
    conversationHistory
  );
};
```

### 3.2 Modificações no `geminiService.ts`

```typescript
// Nova função para enviar com contexto RAG
export async function sendChatMessageWithContext(
  message: string,
  fullPromptWithContext: string,
  conversationHistory: string[]
): Promise<string> {
  // Implementação similar à atual, mas usando o prompt enriquecido
}

// Ou modificar a função existente para aceitar contexto opcional
export async function sendChatMessage(
  message: string,
  conversationHistory: string[],
  scenario?: ChatScenario,
  correctionsEnabled?: boolean,
  ragContext?: ConversationContext  // NOVO PARÂMETRO
): Promise<string> {
  // Se tiver contexto RAG, incluir no prompt
}
```

---

## Fase 4: Estratégias de Recuperação de Contexto

### 4.1 Buscar por Similaridade (sem vetores inicialmente)

```typescript
// Estratégia 1: Buscar conversas recentes do mesmo cenário
async function getRecentConversationsContext(
  userId: string,
  scenario: string,
  limit: number = 5
): Promise<Message[]> {
  const conversations = await conversationService.getConversationsByScenario(
    userId, 
    scenario, 
    limit
  );
  
  // Buscar mensagens de cada conversa
  const allMessages: Message[] = [];
  for (const conv of conversations) {
    const convWithMessages = await conversationService.getConversationWithMessages(conv.id);
    if (convWithMessages) {
      allMessages.push(...convWithMessages.messages);
    }
  }
  
  return allMessages;
}

// Estratégia 2: Detectar temas e buscar por tema
async function getTopicBasedContext(
  userId: string,
  currentMessage: string,
  detectedThemes: string[]
): Promise<Message[]> {
  // Por enquanto, retornar mensagens dos mesmos temas
  // (implementação simples sem embeddings)
}

// Estratégia 3: Buscar correções anteriores similares
async function getCorrectionBasedContext(
  userId: string,
  currentMessage: string
): Promise<string[]> {
  // Buscar padrões de erro similares do usuário
}
```

### 4.2 Sistema de Foco de Ensino

```typescript
interface LearningFocus {
  // Foco atual baseado no nível
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Objetivos de aprendizado do usuário
  userGoals: string[];
  
  // Tópicos a priorizar
  priorityTopics: string[];
  
  // Erros comuns a evitar
  commonPitfalls: string[];
  
  // Estilo de correção preferido
  correctionStyle: 'direct' | 'gentle' | 'explanatory';
}

function determineLearningFocus(
  userProfile: UserLearningProfile,
  recentMessages: Message[]
): LearningFocus {
  // Lógica para determinar foco de ensino
  return {
    currentLevel: userProfile.currentLevel,
    userGoals: userProfile.topicsPracticed,
    priorityTopics: userProfile.areasToImprove,
    commonPitfalls: Object.keys(userProfile.commonMistakes).slice(0, 5),
    correctionStyle: 'explanatory'
  };
}
```

---

## Fase 5: Atualização do Perfil de Aprendizado

### 5.1 Processar conversa após finalização

```typescript
// Chamado quando conversa termina (component unmount)
async function processConversationEnd(
  conversationId: string,
  messages: Message[],
  userId: string,
  scenario: string
) {
  // 1. Analisar conversa
  const analysis = await contextService.analyzeConversation(messages);
  
  // 2. Atualizar perfil do usuário
  await contextService.updateUserProfile(userId, scenario, {
    duration: totalDuration,
    messageCount: messages.length,
    corrections: analysis.corrections,
    topics: analysis.topics
  });
  
  // 3. Gerar e armazenar resumo
  const summary = await contextService.generateConversationSummary(conversationId);
  
  // 4. Armazenar chunks de contexto para futuras buscas
  await storeConversationChunks(conversationId, messages, analysis);
}
```

---

## Fase 6: Estrutura de Arquivos

```
src/
├── services/
│   ├── contextService.ts       # Novo - Lógica de contexto RAG
│   ├── contextBuilder.ts       # Novo - Construtor de prompts com contexto
│   ├── profileService.ts       # Novo - Gerenciamento de perfil
│   └── conversationService.ts  # Já existe - modificar
│
├── components/
│   └── TextChatUI.tsx          # Modificar - integrar RAG
│
├── services/
│   └── geminiService.ts        # Modificar - aceitar contexto
│
└── types/
    └── index.ts                # Adicionar tipos do RAG
```

---

## Próximos Passos Recomendados

### Fase 1 (Imediata - 1 dia)
- [ ] Executar SQL para criar novas tabelas/campos
- [ ] Criar `profileService.ts` básico

### Fase 2 (Curto prazo - 2 dias)
- [ ] Criar `contextService.ts`
- [ ] Implementar `buildRAGPrompt()`
- [ ] Modificar `TextChatUI` para carregar contexto

### Fase 3 (Médio prazo - 3 dias)
- [ ] Integrar com `geminiService`
- [ ] Implementar sistema de foco de ensino
- [ ] Testar com usuários reais

### Fase 4 (Futuro - com Gemini Embeddings)
- [ ] Adicionar pgvector para busca semântica
- [ ] Implementar embeddings das mensagens
- [ ] Busca por similaridade de conteúdo

---

## Observações

1. **Sem necessidade de vector store inicialmente** - Você pode começar com busca por cenário/tema e ir evoluindo

2. **Dados já disponíveis** - O histórico já está no Supabase, só precisamos processar melhor

3. **Gradualidade** - Pode implementar por partes:
   - Primeiro: contexto básico (perfil + histórico recente)
   - Depois: detecção de temas
   - Depois: embeddings (se necessário)

4. **Sem custos extras** - Usa a infraestrutura que já tem (Supabase + Gemini)
