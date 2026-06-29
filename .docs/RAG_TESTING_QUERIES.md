# Consultas para Testar o RAG

Este documento contém consultas SQL para verificar se o sistema RAG está funcionando corretamente.

---

## 1. Verificar se as Tabelas Existem

```sql
-- Verificar todas as tabelas do RAG
SELECT 
  table_name,
  rowsecurity as "RLS Enabled"
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'user_learning_profile', 'conversation_context')
ORDER BY table_name;
```

**Esperado:** 4 tabelas com RLS habilitado

---

## 2. Verificar Conversas Recentes

```sql
-- Ver as últimas 10 conversas
SELECT 
  id,
  user_id,
  scenario,
  category,
  started_at,
  ended_at,
  duration_seconds,
  total_messages
FROM conversations 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 3. Verificar Mensagens de uma Conversa

```sql
-- Substitua 'UUID_AQUI' pelo ID da conversa
SELECT 
  id,
  role,
  content,
  message_type,
  created_at
FROM messages 
WHERE conversation_id = 'UUID_AQUI'
ORDER BY created_at;
```

---

## 4. Verificar Perfil de Aprendizado

```sql
-- Ver todos os perfis de aprendizado
SELECT 
  user_id,
  scenario,
  total_conversations,
  total_messages,
  total_time_seconds,
  current_level,
  level_progress,
  topics_practiced,
  areas_to_improve,
  common_mistakes,
  last_practiced_at
FROM user_learning_profile 
ORDER BY last_practiced_at DESC;
```

---

## 5. Verificar Contexto de Conversa

```sql
-- Ver contexto salvo
SELECT 
  id,
  user_id,
  scenario,
  content,
  content_type,
  themes,
  created_at
FROM conversation_context 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 6. Consulta Completa: Verificar dados de um Usuário Específico

```sql
-- Substitua 'xavier' pelo user_id desejado
-- Este comando mostra TODO o RAG de um usuário

-- 6.1 Ver perfil do usuário por cenário
SELECT 
  'Perfil' as tipo,
  scenario,
  total_conversations,
  total_messages,
  current_level,
  topics_practiced,
  areas_to_improve
FROM user_learning_profile 
WHERE user_id = 'xavier';

-- 6.2 Ver conversas do usuário
SELECT 
  'Conversa' as tipo,
  scenario,
  category,
  started_at,
  duration_seconds,
  total_messages
FROM conversations 
WHERE user_id = 'xavier'
ORDER BY created_at DESC
LIMIT 10;

-- 6.3 Contar mensagens por conversa
SELECT 
  c.id,
  c.scenario,
  COUNT(m.id) as total_mensagens
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.user_id = 'xavier'
GROUP BY c.id, c.scenario
ORDER BY c.created_at DESC;
```

---

## 7. Verificar se Dados Estão sendo Inseridos (Teste em Tempo Real)

### Antes de uma conversa:
```sql
-- Anote o número atual
SELECT COUNT(*) as total_conversations FROM conversations;
SELECT COUNT(*) as total_messages FROM messages;
SELECT COUNT(*) as total_profiles FROM user_learning_profile;
```

### Depois de uma conversa:
```sql
-- Execute novamente para ver se aumentou
SELECT COUNT(*) as total_conversations FROM conversations;
SELECT COUNT(*) as total_messages FROM messages;
SELECT COUNT(*) as total_profiles FROM user_learning_profile;
```

---

## 8. Verificar Problemas Comuns

### 8.1 Ver user_ids duplicados ou inconsistentes
```sql
-- Ver quantos user_ids únicos existem
SELECT 
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(*) as total_registros
FROM conversations;
```

### 8.2 Ver conversas sem mensagens
```sql
-- Ver conversas que não têm mensagens
SELECT c.id, c.user_id, c.scenario, c.started_at
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE m.id IS NULL
ORDER BY c.created_at DESC;
```

### 8.3 Ver perfis sem última prática
```sql
-- Ver perfis que nunca foram usados
SELECT user_id, scenario, created_at
FROM user_learning_profile 
WHERE last_practiced_at IS NULL
ORDER BY created_at;
```

### 8.4 Ver dados do usuário "xavier"
```sql
-- Ver todas as conversas do usuário xavier
SELECT * FROM conversations WHERE user_id = 'xavier' ORDER BY created_at DESC;

-- Ver perfil do usuário xavier
SELECT * FROM user_learning_profile WHERE user_id = 'xavier';

---

## 9. Teste de Integração: Simular uma Conversa

### Passo 1: Criar uma conversa de teste
```sql
INSERT INTO conversations (user_id, scenario, category, started_at)
VALUES ('xavier', 'phone-screen', 'real-life', NOW())
RETURNING id;
```

### Passo 2: Adicionar mensagens de teste
```sql
-- Substitua 'ID_DA_CONVERSA' pelo ID gerado acima
INSERT INTO messages (conversation_id, role, content, message_type, created_at)
VALUES 
  ('ID_DA_CONVERSA', 'user', 'Hello, I am looking for a job', 'user', NOW()),
  ('ID_DA_CONVERSA', 'assistant', 'Hi! That is great. What kind of job are you looking for?', 'system', NOW()),
  ('ID_DA_CONVERSA', 'user', 'I want to work as a software developer', 'user', NOW());
```

### Passo 3: Verificar se foram salvas
```sql
SELECT * FROM messages 
WHERE conversation_id = 'ID_DA_CONVERSA'
ORDER BY created_at;
```

### Passo 4: Criar perfil de teste
```sql
INSERT INTO user_learning_profile (user_id, scenario, total_conversations, total_messages, topics_practiced, last_practiced_at)
VALUES ('xavier', 'phone-screen', 1, 3, ARRAY['job', 'software'], NOW())
ON CONFLICT (user_id, scenario) DO UPDATE
SET total_conversations = 1, total_messages = 3, topics_practiced = ARRAY['job', 'software'], last_practiced_at = NOW();
```

### Passo 5: Limpar dados de teste
```sql
DELETE FROM messages WHERE conversation_id = 'ID_DA_CONVERSA';
DELETE FROM conversations WHERE id = 'ID_DA_CONVERSA';
DELETE FROM user_learning_profile WHERE user_id = 'xavier';
```

---

## 10. Checklist de Verificação

| Teste | Query | Esperado |
|-------|-------|----------|
| Tabelas existem | Query 1 | 4 tabelas |
| Conversas são criadas | Query 2 | Novas linhas após conversa |
| Mensagens são salvas | Query 3 | Mensagens com role user/assistant |
| Perfil é criado | Query 4 | Linha em user_learning_profile |
| RLS está funcionando | - | Usuários só veem seus próprios dados |

---

## Problemas Comuns e Soluções

| Problema | Solução |
|----------|---------|
| Nenhuma conversa aparece | Verificar se usuário está logado |
| Mensagens não são salvas | Verificar se conversation_id está correto |
| Perfil não é criado | Verificar se scenario está sendo passado |
| Dados de outro usuário aparecem | RLS pode estar desabilitado |
| user_id aparece como "guest" ou vazio | Verificar se login está correto |

---

## Quick Test (para usuário xavier)

```sql
-- 1. Ver conversas do xavier
SELECT id, scenario, started_at, duration_seconds 
FROM conversations 
WHERE user_id = 'xavier'
ORDER BY created_at DESC;

-- 2. Ver perfil do xavier
SELECT scenario, total_conversations, topics_practiced, areas_to_improve
FROM user_learning_profile 
WHERE user_id = 'xavier';

-- 3. Ver mensagens da última conversa
SELECT m.role, m.content, m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.user_id = 'xavier'
ORDER BY m.created_at DESC
LIMIT 10;
```

---

## Como Testar o RAG Completo

1. **Faça login** no app (usuário: xavier)
2. **Abra o console** do navegador (F12) > Console
3. **Vá para um cenário** (ex: Phone Screen)
4. **Faça uma conversa** (mínimo 5 mensagens)
5. **Volte ao Supabase** e execute:

```sql
-- Ver dados do usuário xavier
SELECT * FROM user_learning_profile 
WHERE user_id = 'xavier';

SELECT * FROM conversations 
WHERE user_id = 'xavier'
ORDER BY created_at DESC LIMIT 5;
```

6. **Verifique no console** do navegador:
   - `[TextChatUI] RAG Context loaded: {hasProfile: true, ...}`
   - `[ContextService] Conversation processed: {...}`

---

**Para executar todas as consultas de uma vez, basta copiar e colar cada bloco no SQL Editor do Supabase.**
