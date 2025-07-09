/*
  # Add demo flag to profiles table

  1. Changes
    - Add `is_demo` column to profiles table to track demo accounts
    - Set default value to false for existing accounts
    - Add index for better query performance on demo accounts

  2. Security
    - No RLS changes needed as profiles table already has proper policies
*/

-- Add demo flag to profiles table to track demo accounts
ALTER TABLE public.profiles 
ADD COLUMN is_demo BOOLEAN DEFAULT false;

-- Add index for better performance when querying demo accounts
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON public.profiles(is_demo);

-- Update existing profiles to ensure they are not marked as demo by default
UPDATE public.profiles SET is_demo = false WHERE is_demo IS NULL;