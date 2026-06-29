# Teste do Histórico de Conversas

Este documento explica como testar a funcionalidade de histórico de conversas do Real-Life.

---

## Pré-requisitos

### 1. Tabelas criadas no Supabase

Antes de testar, certifique-se de que as tabelas foram criadas:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá para **SQL Editor**
3. Execute o código em `.docs/supabase-tables.sql`

Ou execute manualmente:

```sql
-- Criar tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'real-life',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow all access to conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to messages" ON messages FOR ALL USING (true) WITH CHECK (true);
```

---

## Como Testar

### Passo 1: Iniciar uma conversa

1. Abra o aplicativo no navegador
2. Navegue até a página do **Real-Life** (Real-Time Mode)
3. Clique no botão para iniciar uma conversa (microfone)
4. Aguarde o agente conectar
5. Fala algo com o agente de IA
6. Após algumas frases, encerre a conexão

### Passo 2: Verificar no banco de dados

1. Acesse o **Supabase Dashboard**
2. Vá para **Table Editor**
3. Selecione a tabela `conversations`
4. Você deve ver um registro类似:

| id | user_id | scenario | started_at | ended_at | duration_seconds |
|----|---------|----------|------------|----------|------------------|
| xxx | guest | real-life | 2025-02-13... | 2025-02-13... | 120 |

5. Selecione a tabela `messages`
6. Você deve ver as mensagens:

| id | conversation_id | role | content | created_at |
|----|-----------------|------|---------|------------|
| xxx | xxx | user | Hello... | 2025-02-13... |
| xxx | xxx | assistant | Hi! How... | 2025-02-13... |

### Passo 3: Ver no Perfil

1. Clique no menu de perfil/navegação
2. Acesse **My Profile** ou **Perfil**
3. Clique no botão **"Show History"**
4. Você deve ver a lista de conversas
5. Clique em uma conversa para ver os detalhes

---

## Debug

### Verificar erros no Console

1. Abra o navegador e pressione **F12** para abrir DevTools
2. Vá na aba **Console**
3. Procure por mensagens com `[DEBUG]` ou `[ConversationService]`

### Mensagens de erro comuns:

| Erro | Causa | Solução |
|------|-------|---------|
| `Failed to fetch` | Erro de rede | Verificar conexão com internet |
| `row-level security` | RLS bloqueando | Verificar políticas de acesso no Supabase |
| `conversation is null` | Erro ao criar conversa | Verificar se tabela existe |

### Verificar requisições de rede

1. No DevTools, aba **Network**
2. Filtre por **Fetch/XHR**
3. Procure por requisições para `supabase.co`
4. Verifique o status (200 = sucesso, 400/500 = erro)

---

## Estrutura dos Dados

### conversations

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único da conversa |
| user_id | TEXT | Identificação do usuário |
| scenario | TEXT | Cenário (ex: "real-life") |
| started_at | TIMESTAMP | Quando a conversa começou |
| ended_at | TIMESTAMP | Quando a conversa terminou |
| duration_seconds | INT | Duração em segundos |

### messages

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único da mensagem |
| conversation_id | UUID | Referência para conversa |
| role | TEXT | "user" ou "assistant" |
| content | TEXT | Texto da mensagem |
| created_at | TIMESTAMP | Quando a mensagem foi enviada |

---

## Solução de Problemas

### Histórico não aparece no perfil

1. Verifique se o `user_id` salvo na conversa é igual ao usuário logado
2. Verifique no console se há erros de requisição
3. Atualize a página e tente novamente

### Mensagens não estão sendo salvas

1. Verifique se a conexão com o Supabase está funcionando
2. Verifique as políticas de RLS
3. Verifique o console para erros

### Dados duplicados

Isso pode acontecer se o componente remontar. O código atual usa `useRef` para evitar duplicatas, mas se persistir, verifique os logs.
