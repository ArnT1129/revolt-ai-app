-- Create user_batteries table for ReVolt AI
-- Run this in your Supabase SQL Editor

-- Create user_batteries table
CREATE TABLE IF NOT EXISTS public.user_batteries (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
  status TEXT NOT NULL CHECK (status IN ('Healthy', 'Degrading', 'Critical', 'Unknown')),
  soh DECIMAL NOT NULL,
  rul INTEGER NOT NULL,
  cycles INTEGER NOT NULL,
  chemistry TEXT NOT NULL CHECK (chemistry IN ('LFP', 'NMC')),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  soh_history JSONB DEFAULT '[]'::jsonb,
  issues JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add demo user tracking to profiles table if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create demo user cleanup function
CREATE OR REPLACE FUNCTION cleanup_demo_user_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all batteries for demo users when they sign out
  IF OLD.is_demo = TRUE THEN
    DELETE FROM user_batteries WHERE user_id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger for demo user cleanup
DROP TRIGGER IF EXISTS demo_user_cleanup_trigger ON profiles;
CREATE TRIGGER demo_user_cleanup_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.is_demo = TRUE AND NEW.is_demo = FALSE)
  EXECUTE FUNCTION cleanup_demo_user_data();

-- Enable RLS on user_batteries table
ALTER TABLE user_batteries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_batteries
DROP POLICY IF EXISTS "Users can manage their own batteries" ON user_batteries;
CREATE POLICY "Users can manage their own batteries"
  ON user_batteries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on user_batteries
DROP TRIGGER IF EXISTS handle_updated_at ON user_batteries;
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON user_batteries
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.user_batteries TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 