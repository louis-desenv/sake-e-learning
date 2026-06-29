-- ============================================================
-- GAMIFICATION SYSTEM — user_gamification_profile
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS user_gamification_profile (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT        NOT NULL,
  total_xp       INTEGER     NOT NULL DEFAULT 0
                             CONSTRAINT chk_total_xp_non_negative CHECK (total_xp >= 0),
  current_level  INTEGER     NOT NULL DEFAULT 1
                             CONSTRAINT chk_current_level_range CHECK (current_level BETWEEN 1 AND 5),
  level_progress INTEGER     NOT NULL DEFAULT 0
                             CONSTRAINT chk_level_progress_range CHECK (level_progress BETWEEN 0 AND 100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_gamification_user UNIQUE (user_id)
);

-- Índice para lookup por user_id (operação mais frequente)
CREATE INDEX IF NOT EXISTS idx_gamification_user_id
  ON user_gamification_profile (user_id);

-- RLS — alinhado ao padrão atual do projeto (política permissiva)
ALTER TABLE user_gamification_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to user_gamification_profile" ON user_gamification_profile;
CREATE POLICY "Allow all access to user_gamification_profile"
  ON user_gamification_profile FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- SELECT * FROM user_gamification_profile LIMIT 10;
