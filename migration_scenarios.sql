-- Create scenarios table for adaptive learning
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for default scenarios
  category TEXT NOT NULL CHECK (category IN ('real-life', 'learn')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT NOT NULL,
  scenario_id TEXT NOT NULL, -- Map to ChatScenario enum string or custom ID
  system_prompt TEXT, -- If NULL, use the hardcoded one based on scenario_id
  is_locked BOOLEAN DEFAULT true,
  required_messages INTEGER DEFAULT 0, -- Messages needed to unlock (if default)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_category ON scenarios(category);

-- Allow Read Access for everyone (RLS)
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Users can read default scenarios (user_id IS NULL) OR their own scenarios
CREATE POLICY "Users can view their own and default scenarios" 
ON scenarios FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);

-- Only service role or the user themselves can insert/update (for adaptation engine)
CREATE POLICY "Users can insert their own scenarios" 
ON scenarios FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" 
ON scenarios FOR UPDATE 
USING (auth.uid() = user_id);

-- Optional: Insert initial seed data based on topicSlugs.ts
-- You can run this block to migrate the default ones
INSERT INTO scenarios (category, title, description, slug, scenario_id, is_locked, required_messages) VALUES
('real-life', 'Phone Screen', 'Practice telephone conversations', 'phonescreen', 'phone-screen', false, 0),
('real-life', 'Job Interviews', 'Prepare for job interviews', 'jobinterviews', 'job-interviews', true, 10),
('real-life', 'Travel Conversations', 'Learn travel-related conversations', 'travelconversations', 'travel-conversations', true, 20),
('real-life', 'Business Meetings', 'Engage in business meeting simulations', 'businessmeetings', 'business-meetings', true, 30),
('learn', 'Grammar Essentials', 'Master English grammar fundamentals', 'grammaressentials', 'grammar-specialist', false, 0),
('learn', 'Vocabulary Builder', 'Expand your word power systematically', 'vocabularybuilder', 'vocabulary-specialist', true, 5),
('learn', 'Pronunciation Practice', 'Sound like a native speaker', 'pronunciationpractice', 'pronunciation-specialist', true, 15),
('learn', 'Business English', 'Professional communication skills', 'businessenglish', 'business-specialist', true, 25),
('learn', 'Travel Phrases', 'Essential travel expressions', 'travelphrases', 'travel-specialist', true, 35),
('learn', 'Idioms & Slang', 'Sound like a local', 'idiomsslang', 'idioms-specialist', true, 40);
