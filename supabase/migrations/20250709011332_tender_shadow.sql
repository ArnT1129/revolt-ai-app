/*
  # Create battery_alerts table for the alert system

  1. New Tables
    - `battery_alerts`
      - `id` (uuid, primary key)
      - `battery_id` (text, references user_batteries.id)
      - `sender_id` (uuid, references users.id)
      - `recipient_id` (uuid, references users.id)
      - `alert_type` (text, constrained to specific values)
      - `title` (text, alert title)
      - `message` (text, alert message content)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `battery_alerts` table
    - Add policy for users to create alerts they send
    - Add policy for users to view alerts sent to them
    - Add policy for users to update alerts sent to them (mark as read)

  3. Indexes
    - Index on battery_id for efficient lookups
    - Index on recipient_id for user's alerts
    - Index on is_read for filtering unread alerts
*/

-- Create battery_alerts table for the alert system
CREATE TABLE IF NOT EXISTS public.battery_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battery_id TEXT NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('mistake', 'concern', 'info', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_battery_alerts_battery_id 
    FOREIGN KEY (battery_id) REFERENCES public.user_batteries(id) ON DELETE CASCADE,
  CONSTRAINT fk_battery_alerts_sender_id 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_battery_alerts_recipient_id 
    FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.battery_alerts ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_battery_alerts_battery_id ON public.battery_alerts(battery_id);
CREATE INDEX IF NOT EXISTS idx_battery_alerts_recipient_id ON public.battery_alerts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_battery_alerts_sender_id ON public.battery_alerts(sender_id);
CREATE INDEX IF NOT EXISTS idx_battery_alerts_is_read ON public.battery_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_battery_alerts_created_at ON public.battery_alerts(created_at DESC);

-- RLS Policies

-- Users can create alerts they send
CREATE POLICY "Users can create alerts" ON public.battery_alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can view alerts sent to them
CREATE POLICY "Users can view alerts sent to them" ON public.battery_alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

-- Users can update alerts sent to them (mark as read)
CREATE POLICY "Users can update alerts sent to them" ON public.battery_alerts
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id);

-- Users can view alerts they sent (for tracking purposes)
CREATE POLICY "Users can view alerts they sent" ON public.battery_alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);