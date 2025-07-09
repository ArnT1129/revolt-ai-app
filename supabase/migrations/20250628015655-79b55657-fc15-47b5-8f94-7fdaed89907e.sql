
-- Enable RLS on user_batteries table if not already enabled
ALTER TABLE public.user_batteries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own batteries" ON public.user_batteries;
DROP POLICY IF EXISTS "Users can insert own batteries" ON public.user_batteries;
DROP POLICY IF EXISTS "Users can update own batteries" ON public.user_batteries;
DROP POLICY IF EXISTS "Users can delete own batteries" ON public.user_batteries;

-- Create RLS policies for user_batteries
CREATE POLICY "Users can view own batteries" ON public.user_batteries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batteries" ON public.user_batteries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batteries" ON public.user_batteries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batteries" ON public.user_batteries
  FOR DELETE USING (auth.uid() = user_id);
