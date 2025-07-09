/*
  # Add helper functions for user management

  1. Functions
    - `uid()` helper function to get current user ID
    - `setup_demo_user()` function to initialize demo accounts with sample data

  2. Security
    - Functions are created with appropriate security definer context
    - Demo setup function includes proper error handling
*/

-- Helper function to get current user ID (if not already exists)
CREATE OR REPLACE FUNCTION public.uid()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Function to set up demo user with sample data
CREATE OR REPLACE FUNCTION public.setup_demo_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user profile to mark as demo
  UPDATE public.profiles 
  SET is_demo = true 
  WHERE id = user_id;
  
  -- Insert sample battery data for demo user
  INSERT INTO public.user_batteries (
    id, user_id, grade, status, soh, rul, cycles, chemistry, 
    upload_date, soh_history, issues, notes
  ) VALUES 
  (
    'DEMO-HEALTHY-001',
    user_id,
    'A',
    'Healthy',
    95.8,
    1800,
    350,
    'NMC',
    CURRENT_DATE,
    '[{"cycle": 0, "soh": 100}, {"cycle": 100, "soh": 98.5}, {"cycle": 200, "soh": 97.2}, {"cycle": 350, "soh": 95.8}]'::jsonb,
    '[]'::jsonb,
    'Demo Battery - Excellent performance, recommended for high-demand applications'
  ),
  (
    'DEMO-DEGRADING-002',
    user_id,
    'B',
    'Degrading',
    82.3,
    450,
    1200,
    'LFP',
    CURRENT_DATE,
    '[{"cycle": 0, "soh": 100}, {"cycle": 400, "soh": 92.0}, {"cycle": 800, "soh": 87.5}, {"cycle": 1200, "soh": 82.3}]'::jsonb,
    '[{"id": "demo-issue-1", "category": "Performance", "title": "Gradual Capacity Fade", "description": "Battery showing expected degradation patterns", "severity": "Warning", "cause": "Normal aging process", "recommendation": "Monitor closely and plan replacement", "solution": "Continue monitoring, replace when SoH drops below 80%", "affectedMetrics": ["soh", "rul"]}]'::jsonb,
    'Demo Battery - Showing typical LFP degradation, still suitable for stationary applications'
  ),
  (
    'DEMO-CRITICAL-003',
    user_id,
    'D',
    'Critical',
    68.9,
    75,
    2500,
    'NMC',
    CURRENT_DATE,
    '[{"cycle": 0, "soh": 100}, {"cycle": 800, "soh": 88.0}, {"cycle": 1600, "soh": 78.5}, {"cycle": 2500, "soh": 68.9}]'::jsonb,
    '[{"id": "demo-issue-2", "category": "Safety", "title": "Critical SoH Threshold Exceeded", "description": "Battery has dropped below safe operating threshold", "severity": "Critical", "cause": "Extensive cycling and aging", "recommendation": "Immediate replacement required", "solution": "Remove from service and dispose safely", "affectedMetrics": ["soh", "rul", "cycles"]}]'::jsonb,
    'Demo Battery - Critical condition, requires immediate attention and replacement'
  )
  ON CONFLICT (id) DO NOTHING;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the function
    RAISE NOTICE 'Error setting up demo user: %', SQLERRM;
END;
$$;