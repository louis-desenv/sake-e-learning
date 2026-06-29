-- ============================================
-- HISTÓRICO DE CONVERSAS - SUPABASE
-- Execute este código no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar coluna category na conversations se não existir
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'real-life';

-- 2. Atualizar dados existentes para ter a categoria correta
UPDATE conversations 
SET category = 'real-life' 
WHERE category IS NULL OR category = '';

-- 3. Adicionar coluna message_type na messages se não existir
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'user';

-- 4. Atualizar dados existentes
UPDATE messages 
SET message_type = 'assistant' 
WHERE message_type IS NULL OR message_type = '';

-- 5. Criar índice para category e message_type
CREATE INDEX IF NOT EXISTS idx_conversations_category ON conversations(category);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- 6. Políticas de acesso
DROP POLICY IF EXISTS "Allow all access to conversations" ON conversations;
CREATE POLICY "Allow all access to conversations" 
  ON conversations FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to messages" ON messages;
CREATE POLICY "Allow all access to messages" 
  ON messages FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- SELECT * FROM conversations LIMIT 10;
-- SELECT * FROM messages LIMIT 10;

-- ============================================
-- RAG - USER LEARNING PROFILE
-- Tabela para armazenar perfil de aprendizado por cenário
-- ============================================

-- 1. Criar tabela de perfil de aprendizado
CREATE TABLE IF NOT EXISTS user_learning_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  scenario TEXT NOT NULL,
  
  -- Métricas agregadas
  total_conversations INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_duration_seconds INTEGER DEFAULT 0,
  
  -- Nível atual (pode evoluir)
  current_level TEXT DEFAULT 'intermediate',
  level_progress INTEGER DEFAULT 0,
  
  -- Topics mais praticados
  topics_practiced TEXT[] DEFAULT '{}',
  
  -- Áreas que precisam de melhoria
  areas_to_improve TEXT[] DEFAULT '{}',
  
  -- Palavras/expressões mais cometidas erros
  common_mistakes JSONB DEFAULT '{}',
  
  -- último acesso
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, scenario)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_learning_profile_user_scenario 
  ON user_learning_profile(user_id, scenario);

-- 3. Políticas de acesso
DROP POLICY IF EXISTS "Allow all access to user_learning_profile" ON user_learning_profile;
CREATE POLICY "Allow all access to user_learning_profile" 
  ON user_learning_profile FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- RAG - CONVERSATION CONTEXT
-- Tabela para armazenar chunks de contexto para busca
-- ============================================

-- 4. Criar tabela de contexto
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  scenario TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Conteúdo chunkado
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'message',
  
  -- Metadados para busca
  message_index INTEGER,
  tokens_count INTEGER,
  
  -- Contexto adicional
  themes TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'intermediate',
  is_correction BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_context_user_scenario 
  ON conversation_context(user_id, scenario);
CREATE INDEX IF NOT EXISTS idx_context_themes 
  ON conversation_context USING GIN(themes);
CREATE INDEX IF NOT EXISTS idx_context_content_type 
  ON conversation_context(content_type);

-- 6. Políticas de acesso
DROP POLICY IF EXISTS "Allow all access to conversation_context" ON conversation_context;
CREATE POLICY "Allow all access to conversation_context" 
  ON conversation_context FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- ADICIONAR CAMPOS À TABELA CONVERSATIONS
-- ============================================

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_level TEXT DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS native_language TEXT DEFAULT 'portuguese',
ADD COLUMN IF NOT EXISTS user_goals TEXT[],
ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_corrections INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS topics_covered TEXT[],
ADD COLUMN IF NOT EXISTS user_satisfaction INTEGER;

-- Criar índice para os novos campos
CREATE INDEX IF NOT EXISTS idx_conversations_user_level ON conversations(user_level);
CREATE INDEX IF NOT EXISTS idx_conversations_native_language ON conversations(native_language);


-- 5. Adicionar coluna category e scenario na messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'real-life';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS scenario TEXT DEFAULT 'free-conversation';

CREATE INDEX IF NOT EXISTS idx_messages_category ON messages(category);
CREATE INDEX IF NOT EXISTS idx_messages_scenario ON messages(scenario);
