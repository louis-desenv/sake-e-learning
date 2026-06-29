-- ============================================
-- SUPABASE RLS BEST PRACTICES - SCHEMA OPTIMIZADO
-- Data: Fevereiro 2026
-- Objetivo: Segurança total dos dados dos usuários
-- ============================================

-- ============================================
-- 1. TABELA DE CONVERSAS (COM RLS)
-- ============================================

-- Drop tabela existente se houver (CUIDADO - só em desenvolvimento!)
-- DROP TABLE IF EXISTS conversations CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS user_learning_profile CASCADE;
-- DROP TABLE IF EXISTS conversation_context CASCADE;

-- Criar tabela de conversas com UUID
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do usuário (obrigatório para RLS)
  user_id TEXT NOT NULL,
  
  -- Cenário e categoria
  scenario TEXT NOT NULL DEFAULT 'real-life',
  category TEXT NOT NULL DEFAULT 'real-life',
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métricas
  duration_seconds INTEGER,
  total_messages INTEGER DEFAULT 0,
  total_corrections INTEGER DEFAULT 0,
  
  -- Contexto adicional
  user_level TEXT DEFAULT 'intermediate',
  native_language TEXT DEFAULT 'portuguese',
  user_goals TEXT[],
  topics_covered TEXT[],
  user_satisfaction INTEGER,
  
  -- Constraints
  CONSTRAINT unique_user_scenario UNIQUE (user_id, id)
);

-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (RLS)
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (user_id = auth.uid()::text);

-- Índices para performance
DROP INDEX IF EXISTS idx_conversations_user_id;
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

DROP INDEX IF EXISTS idx_conversations_scenario;
CREATE INDEX idx_conversations_scenario ON conversations(scenario);

DROP INDEX IF EXISTS idx_conversations_category;
CREATE INDEX idx_conversations_category ON conversations(category);

DROP INDEX IF EXISTS idx_conversations_created_at;
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- ============================================
-- 2. TABELA DE MENSAGENS (COM RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Conteúdo
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'welcome', 'system', 'correction')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()::text
    )
  );

-- Índices
DROP INDEX IF EXISTS idx_messages_conversation_id;
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

DROP INDEX IF EXISTS idx_messages_created_at;
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============================================
-- 3. TABELA DE PERFIL DE APRENDIZADO (COM RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS user_learning_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  user_id TEXT NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'real-life',
  
  -- Métricas agregadas
  total_conversations INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_duration_seconds INTEGER DEFAULT 0,
  
  -- Nível atual
  current_level TEXT DEFAULT 'intermediate',
  level_progress INTEGER DEFAULT 0,
  
  -- Dados de aprendizado
  topics_practiced TEXT[] DEFAULT '{}',
  areas_to_improve TEXT[] DEFAULT '{}',
  common_mistakes JSONB DEFAULT '{}',
  
  -- Timestamps
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint
  UNIQUE(user_id, scenario)
);

-- Habilitar RLS
ALTER TABLE user_learning_profile ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view own profile" ON user_learning_profile;
CREATE POLICY "Users can view own profile"
  ON user_learning_profile FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_learning_profile;
CREATE POLICY "Users can insert own profile"
  ON user_learning_profile FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own profile" ON user_learning_profile;
CREATE POLICY "Users can update own profile"
  ON user_learning_profile FOR UPDATE
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own profile" ON user_learning_profile;
CREATE POLICY "Users can delete own profile"
  ON user_learning_profile FOR DELETE
  USING (user_id = auth.uid()::text);

-- Índices
DROP INDEX IF EXISTS idx_learning_profile_user_scenario;
CREATE INDEX idx_learning_profile_user_scenario ON user_learning_profile(user_id, scenario);

-- ============================================
-- 4. TABELA DE CONTEXTO (COM RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  user_id TEXT NOT NULL,
  scenario TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Conteúdo
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'message',
  
  -- Metadados
  message_index INTEGER,
  tokens_count INTEGER,
  themes TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'intermediate',
  is_correction BOOLEAN DEFAULT FALSE,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view own context" ON conversation_context;
CREATE POLICY "Users can view own context"
  ON conversation_context FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own context" ON conversation_context;
CREATE POLICY "Users can insert own context"
  ON conversation_context FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own context" ON conversation_context;
CREATE POLICY "Users can delete own context"
  ON conversation_context FOR DELETE
  USING (user_id = auth.uid()::text);

-- Índices
DROP INDEX IF EXISTS idx_context_user_scenario;
CREATE INDEX idx_context_user_scenario ON conversation_context(user_id, scenario);

DROP INDEX IF EXISTS idx_context_themes;
CREATE INDEX idx_context_themes ON conversation_context USING GIN(themes);

-- ============================================
-- 5. POLÍTICA DE ACESSO PÚBLICO (ANÔNIMO)
-- ============================================

-- Se quiser permitir acesso sem autenticação (cuidado!)
-- DROP POLICY IF EXISTS "Allow anonymous access" ON conversations;
-- CREATE POLICY "Allow anonymous access" ON conversations FOR SELECT USING (true);

-- ============================================
-- 6. MIGRAÇÃO DE DADOS EXISTENTES
-- ============================================

-- Atualizar user_id com valor consistente (se necessário)
-- UPDATE conversations SET user_id = 'guest' WHERE user_id IS NULL OR user_id = '';

-- ============================================
-- 7. VERIFICAÇÃO
-- ============================================

-- Verificar tabelas
SELECT 
  table_name,
  rowsecurity
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('conversations', 'messages', 'user_learning_profile', 'conversation_context');

-- Verificar políticas
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'user_learning_profile', 'conversation_context')
ORDER BY tablename, policyname;

-- Verificar índices
SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN ('conversations', 'messages', 'user_learning_profile', 'conversation_context')
ORDER BY tablename, indexname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*

IMPORTANT: Para que o RLS funcione corretamente:

1. O usuário DEVE estar autenticado no Supabase Auth
2. O user_id deve ser igual ao auth.uid()::text
3. O JWT deve conter o user_id correto

Se o usuário não estiver autenticado, as políticas vão bloquear TODO acesso.
Para acesso sem autenticação, você precisa de políticas específicas.

Para testar localmente:
- Use o Supabase Dashboard > Authentication > Providers
- Configure um provider (email, google, etc)
- Faça login antes de fazer requisições

*/
