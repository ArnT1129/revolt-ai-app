
-- Create battery_alerts table for the alert system
CREATE TABLE public.battery_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battery_id TEXT NOT NULL REFERENCES public.user_batteries(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('mistake', 'concern', 'info', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.battery_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for battery_alerts
CREATE POLICY "Users can view alerts sent to them" 
  ON public.battery_alerts 
  FOR SELECT 
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can create alerts" 
  ON public.battery_alerts 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update alerts sent to them" 
  ON public.battery_alerts 
  FOR UPDATE 
  USING (auth.uid() = recipient_id);

-- Add full_name column to profiles table for easier querying
ALTER TABLE public.profiles ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
    WHEN first_name IS NOT NULL THEN first_name
    WHEN last_name IS NOT NULL THEN last_name
    ELSE split_part(email, '@', 1)
  END
) STORED;
