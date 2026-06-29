-- Drop previous strict RLS policies FIRST so they don't block the column alter
DROP POLICY IF EXISTS "Users can view their own and default scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can insert their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON scenarios;

-- Remove foreign key constraint that requires an actual auth.users record
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_user_id_fkey;

-- Change the user_id column from UUID to TEXT to accept names like "GabrielXavier5053"
ALTER TABLE scenarios ALTER COLUMN user_id TYPE TEXT;

-- Create permissive policies for development testing (dropping first if they already exist to avoid errors)
DROP POLICY IF EXISTS "Allow all select" ON scenarios;
DROP POLICY IF EXISTS "Allow all insert" ON scenarios;
DROP POLICY IF EXISTS "Allow all update" ON scenarios;

CREATE POLICY "Allow all select" ON scenarios FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON scenarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON scenarios FOR UPDATE USING (true);

-- Ensure user_gamification_profile table exists and has the correct columns
CREATE TABLE IF NOT EXISTS user_gamification_profile (
  user_id TEXT PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_progress INTEGER DEFAULT 0,
  voice_seconds_used_today INTEGER DEFAULT 0,
  voice_seconds_used_lifetime INTEGER DEFAULT 0,
  last_voice_chat_date TEXT DEFAULT CURRENT_DATE::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add voice limit columns if the table already exists
ALTER TABLE user_gamification_profile ADD COLUMN IF NOT EXISTS voice_seconds_used_today INTEGER DEFAULT 0;
ALTER TABLE user_gamification_profile ADD COLUMN IF NOT EXISTS voice_seconds_used_lifetime INTEGER DEFAULT 0;
ALTER TABLE user_gamification_profile ADD COLUMN IF NOT EXISTS last_voice_chat_date TEXT;
