
-- Only create the batteries table (profiles already exists)
CREATE TABLE IF NOT EXISTS public.user_batteries (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Create RLS policies for user_batteries
CREATE POLICY "Users can view own batteries" ON public.user_batteries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batteries" ON public.user_batteries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batteries" ON public.user_batteries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batteries" ON public.user_batteries
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on user_batteries table
ALTER TABLE public.user_batteries ENABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on user_batteries
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_batteries
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
