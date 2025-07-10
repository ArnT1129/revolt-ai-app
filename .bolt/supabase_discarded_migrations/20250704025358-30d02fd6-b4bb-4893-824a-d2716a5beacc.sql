
-- Add a demo flag to profiles table to track demo accounts
ALTER TABLE public.profiles ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;

-- Create a function to create demo user data
CREATE OR REPLACE FUNCTION public.setup_demo_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark user as demo
  UPDATE public.profiles SET is_demo = TRUE WHERE id = user_id;
  
  -- Insert demo batteries for demo users
  INSERT INTO public.user_batteries (id, user_id, chemistry, grade, status, soh, rul, cycles, upload_date, soh_history, issues, notes)
  VALUES 
    ('DEMO-NMC-001', user_id, 'NMC', 'A', 'Healthy', 98.5, 2100, 200, now()::date::text, 
     '[{"cycle": 0, "soh": 100}, {"cycle": 50, "soh": 99.5}, {"cycle": 100, "soh": 99.0}, {"cycle": 150, "soh": 98.8}, {"cycle": 200, "soh": 98.5}]'::jsonb,
     '[]'::jsonb, 'Demo Battery - High-performance NMC demonstrating excellent health'),
    ('DEMO-LFP-002', user_id, 'LFP', 'B', 'Degrading', 89.2, 650, 1500, now()::date::text,
     '[{"cycle": 0, "soh": 100}, {"cycle": 500, "soh": 96.0}, {"cycle": 1000, "soh": 92.5}, {"cycle": 1500, "soh": 89.2}]'::jsonb,
     '[{"id": "demo-issue-1", "category": "Performance", "title": "Capacity Fade Detected", "description": "Demo issue showing gradual capacity degradation", "severity": "Warning", "cause": "Simulated aging process", "recommendation": "Monitor performance trends", "solution": "Consider replacement planning", "affectedMetrics": ["soh", "rul"]}]'::jsonb,
     'Demo Battery - LFP showing typical degradation patterns'),
    ('DEMO-NMC-003', user_id, 'NMC', 'C', 'Critical', 78.1, 150, 2800, now()::date::text,
     '[{"cycle": 0, "soh": 100}, {"cycle": 1000, "soh": 92.0}, {"cycle": 2000, "soh": 84.5}, {"cycle": 2800, "soh": 78.1}]'::jsonb,
     '[{"id": "demo-issue-2", "category": "Safety", "title": "Critical SoH Threshold", "description": "Demo critical battery requiring immediate attention", "severity": "Critical", "cause": "Extensive cycling simulation", "recommendation": "Replace immediately", "solution": "Battery replacement required", "affectedMetrics": ["soh", "rul", "cycles"]}]'::jsonb,
     'Demo Battery - Critical condition demonstration');
END;
$$;

-- Create onboarding steps table for user walkthrough
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding" ON public.user_onboarding
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at on user_onboarding
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
