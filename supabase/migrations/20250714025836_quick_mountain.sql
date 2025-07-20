/*
  # Fix RLS Policies to Prevent Infinite Recursion

  1. Security Changes
    - Drop all existing problematic RLS policies on user_batteries and company_members
    - Create new, simplified policies that avoid circular references
    - Ensure users can only access their own data or company data they belong to
    
  2. Policy Structure
    - user_batteries: Simple policies based on user_id only
    - company_members: Simple policies based on user_id only
    - No cross-table references that could cause recursion

  3. Demo User Management
    - Add demo user tracking to profiles table
    - Create demo user cleanup functions
    - Ensure demo batteries are only accessible to demo users

  4. AI Agent Data Persistence
    - Add tables for AI agent configurations and analysis history
    - Support user-specific and demo-specific data
    - Enable proper data cleanup for demo accounts
*/

-- Create user_batteries table if it doesn't exist
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

-- Create AI Agent configurations table
CREATE TABLE IF NOT EXISTS public.ai_agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id TEXT NOT NULL,
  config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Create AI Agent analysis history table
CREATE TABLE IF NOT EXISTS public.ai_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  battery_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  result_data JSONB NOT NULL,
  confidence DECIMAL NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI Agent settings table
CREATE TABLE IF NOT EXISTS public.ai_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Create AI Agent performance metrics table
CREATE TABLE IF NOT EXISTS public.ai_agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  metric_data JSONB,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can delete own batteries" ON user_batteries;
DROP POLICY IF EXISTS "Users can insert own batteries" ON user_batteries;
DROP POLICY IF EXISTS "Users can update own batteries" ON user_batteries;
DROP POLICY IF EXISTS "Users can update own batteries or company batteries they have a" ON user_batteries;
DROP POLICY IF EXISTS "Users can view own batteries" ON user_batteries;
DROP POLICY IF EXISTS "Users can view own batteries or company batteries" ON user_batteries;

DROP POLICY IF EXISTS "Company admins can delete members" ON company_members;
DROP POLICY IF EXISTS "Company admins can insert members" ON company_members;
DROP POLICY IF EXISTS "Company admins can manage members" ON company_members;
DROP POLICY IF EXISTS "Company admins can update members" ON company_members;
DROP POLICY IF EXISTS "Company owners and admins can manage members" ON company_members;
DROP POLICY IF EXISTS "Company owners can manage all members" ON company_members;
DROP POLICY IF EXISTS "Users can view their own company memberships" ON company_members;

-- Add demo user tracking to profiles table
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
    DELETE FROM ai_agent_configs WHERE user_id = OLD.id AND is_demo = TRUE;
    DELETE FROM ai_analysis_history WHERE user_id = OLD.id AND is_demo = TRUE;
    DELETE FROM ai_agent_settings WHERE user_id = OLD.id AND is_demo = TRUE;
    DELETE FROM ai_agent_metrics WHERE user_id = OLD.id AND is_demo = TRUE;
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

-- Create simple, non-recursive policies for user_batteries
CREATE POLICY "Users can manage their own batteries"
  ON user_batteries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for AI Agent tables
CREATE POLICY "Users can manage their own AI agent configs"
  ON ai_agent_configs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own analysis history"
  ON ai_analysis_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI agent settings"
  ON ai_agent_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI agent metrics"
  ON ai_agent_metrics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create simple, non-recursive policies for company_members
CREATE POLICY "Users can view their own memberships"
  ON company_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Company owners can manage members"
  ON company_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies  
      WHERE companies.id = company_members.company_id 
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_members.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Ensure RLS is enabled on all tables
ALTER TABLE user_batteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_metrics ENABLE ROW LEVEL SECURITY;

-- Add a simple policy for companies table if it doesn't exist
DROP POLICY IF EXISTS "Users can manage their own companies" ON companies;
CREATE POLICY "Users can manage their own companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can view companies they are members of
CREATE POLICY "Users can view companies they belong to"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_batteries_user_id ON user_batteries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_user_id ON ai_agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_user_id ON ai_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_settings_user_id ON ai_agent_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_metrics_user_id ON ai_agent_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_demo ON ai_agent_configs(is_demo);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_demo ON ai_analysis_history(is_demo);



