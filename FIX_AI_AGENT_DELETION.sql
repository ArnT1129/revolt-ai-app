-- FIX_AI_AGENT_DELETION.sql
-- This script fixes all AI agent deletion issues and ensures proper demo data cleanup

-- 1. Ensure AI Agent tables exist with proper structure
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

-- 2. Enable RLS on all AI Agent tables
ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_metrics ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own analysis history" ON ai_analysis_history;
DROP POLICY IF EXISTS "Users can manage their own AI agent configs" ON ai_agent_configs;
DROP POLICY IF EXISTS "Users can manage their own AI agent settings" ON ai_agent_settings;
DROP POLICY IF EXISTS "Users can manage their own AI agent metrics" ON ai_agent_metrics;

-- 4. Create proper RLS policies for AI Agent tables
CREATE POLICY "Users can manage their own analysis history"
  ON ai_analysis_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI agent configs"
  ON ai_agent_configs
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

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_user_id ON ai_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_demo ON ai_analysis_history(is_demo);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_agent_id ON ai_analysis_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_user_id ON ai_agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_demo ON ai_agent_configs(is_demo);
CREATE INDEX IF NOT EXISTS idx_ai_agent_settings_user_id ON ai_agent_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_settings_demo ON ai_agent_settings(is_demo);
CREATE INDEX IF NOT EXISTS idx_ai_agent_metrics_user_id ON ai_agent_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_metrics_demo ON ai_agent_metrics(is_demo);

-- 6. Create function to delete specific analysis result by result ID
CREATE OR REPLACE FUNCTION delete_analysis_result_by_id(
  p_user_id UUID,
  p_result_id TEXT,
  p_is_demo BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete the analysis result that contains the specific result_id in result_data
  DELETE FROM ai_analysis_history 
  WHERE user_id = p_user_id 
    AND is_demo = p_is_demo
    AND result_data->>'id' = p_result_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;

-- 7. Create function to clear all demo data for a user
CREATE OR REPLACE FUNCTION clear_demo_ai_data(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all demo AI agent data for the user
  DELETE FROM ai_analysis_history WHERE user_id = p_user_id AND is_demo = TRUE;
  DELETE FROM ai_agent_configs WHERE user_id = p_user_id AND is_demo = TRUE;
  DELETE FROM ai_agent_settings WHERE user_id = p_user_id AND is_demo = TRUE;
  DELETE FROM ai_agent_metrics WHERE user_id = p_user_id AND is_demo = TRUE;
END;
$$;

-- 8. Create function to get analysis history for a user
CREATE OR REPLACE FUNCTION get_analysis_history(
  p_user_id UUID,
  p_is_demo BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  battery_id TEXT,
  agent_id TEXT,
  analysis_type TEXT,
  result_data JSONB,
  confidence DECIMAL,
  risk_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ah.id,
    ah.battery_id,
    ah.agent_id,
    ah.analysis_type,
    ah.result_data,
    ah.confidence,
    ah.risk_level,
    ah.created_at
  FROM ai_analysis_history ah
  WHERE ah.user_id = p_user_id 
    AND ah.is_demo = p_is_demo
  ORDER BY ah.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ai_analysis_history TO authenticated;
GRANT ALL ON ai_agent_configs TO authenticated;
GRANT ALL ON ai_agent_settings TO authenticated;
GRANT ALL ON ai_agent_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION delete_analysis_result_by_id(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_demo_ai_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analysis_history(UUID, BOOLEAN, INTEGER) TO authenticated;

-- 10. Create a trigger to automatically clean up demo data when demo users are deleted
CREATE OR REPLACE FUNCTION cleanup_demo_user_ai_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If a demo user is being deleted, clean up all their demo data
  IF OLD.is_demo = TRUE THEN
    PERFORM clear_demo_ai_data(OLD.id);
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger for demo user cleanup (if profiles table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    DROP TRIGGER IF EXISTS demo_user_ai_cleanup_trigger ON profiles;
    CREATE TRIGGER demo_user_ai_cleanup_trigger
      AFTER UPDATE ON profiles
      FOR EACH ROW
      WHEN (OLD.is_demo = TRUE AND NEW.is_demo = FALSE)
      EXECUTE FUNCTION cleanup_demo_user_ai_data();
  END IF;
END $$;

-- 11. Insert a test record to verify the table works (optional - remove in production)
-- INSERT INTO ai_analysis_history (user_id, battery_id, agent_id, analysis_type, result_data, confidence, risk_level, is_demo)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID for testing
--   'test_battery',
--   'test_agent',
--   'health_analysis',
--   '{"id": "test_result_123", "findings": [], "recommendations": []}'::jsonb,
--   0.85,
--   'low',
--   TRUE
-- );

-- 12. Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'AI Agent deletion fix completed successfully!';
  RAISE NOTICE 'Tables created/verified: ai_analysis_history, ai_agent_configs, ai_agent_settings, ai_agent_metrics';
  RAISE NOTICE 'Functions created: delete_analysis_result_by_id, clear_demo_ai_data, get_analysis_history';
  RAISE NOTICE 'RLS policies enabled and configured';
END $$; 