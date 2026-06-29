ALTER TABLE scenarios
  ADD COLUMN IF NOT EXISTS required_level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS generation_source TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE scenarios
  DROP CONSTRAINT IF EXISTS scenarios_generation_source_check;

ALTER TABLE scenarios
  ADD CONSTRAINT scenarios_generation_source_check
  CHECK (generation_source IN ('default', 'automatic', 'manual'));

CREATE INDEX IF NOT EXISTS idx_scenarios_user_category_created
  ON scenarios (user_id, category, created_at DESC);
