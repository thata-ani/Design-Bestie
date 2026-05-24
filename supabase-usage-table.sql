-- Create usage table for Design Besti
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used INTEGER NOT NULL DEFAULT 0,
  limit INTEGER NOT NULL DEFAULT 14,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usage_updated_at BEFORE UPDATE ON usage
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only read their own usage
CREATE POLICY "Users can view own usage"
  ON usage FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can update their own usage
CREATE POLICY "Users can update own usage"
  ON usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: allow insert for authenticated users (for auto-creation)
CREATE POLICY "Users can insert own usage"
  ON usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
