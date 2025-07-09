
-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create company_members table to track employees
CREATE TABLE public.company_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'employee')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, user_id)
);

-- Create company_invitations table for pending invites
CREATE TABLE public.company_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted BOOLEAN DEFAULT FALSE,
  UNIQUE(company_id, email)
);

-- Enable RLS on all new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies table
CREATE POLICY "Company owners can manage their companies" ON public.companies
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Company members can view their companies" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE company_id = companies.id AND user_id = auth.uid()
    )
  );

-- RLS policies for company_members table
CREATE POLICY "Company owners and admins can manage members" ON public.company_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = company_members.company_id 
      AND (c.owner_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.company_members cm 
                  WHERE cm.company_id = c.id AND cm.user_id = auth.uid() AND cm.role = 'admin'))
    )
  );

CREATE POLICY "Users can view their own company memberships" ON public.company_members
  FOR SELECT USING (user_id = auth.uid());

-- RLS policies for company_invitations table
CREATE POLICY "Company owners and admins can manage invitations" ON public.company_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = company_invitations.company_id 
      AND (c.owner_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.company_members cm 
                  WHERE cm.company_id = c.id AND cm.user_id = auth.uid() AND cm.role = 'admin'))
    )
  );

CREATE POLICY "Users can view invitations sent to their email" ON public.company_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Update user_batteries table to support company sharing
ALTER TABLE public.user_batteries ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Update RLS policies for user_batteries to include company access
DROP POLICY IF EXISTS "Users can view own batteries" ON public.user_batteries;
DROP POLICY IF EXISTS "Users can insert own batteries" ON public.user_batteries;
DROP POLICY IF EXISTS "Users can update own batteries" ON public.user_batteries;
DROP POLICY IF EXISTS "Users can delete own batteries" ON public.user_batteries;

-- New RLS policies for user_batteries with company support
CREATE POLICY "Users can view own batteries or company batteries" ON public.user_batteries
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE company_id = user_batteries.company_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own batteries" ON public.user_batteries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own batteries or company batteries they have access to" ON public.user_batteries
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE company_id = user_batteries.company_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own batteries" ON public.user_batteries
  FOR DELETE USING (user_id = auth.uid());

-- Create function to handle company invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_company_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get the invitation details
  SELECT * INTO invitation_record 
  FROM public.company_invitations 
  WHERE id = invitation_id 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND NOT accepted 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Add user to company_members
  INSERT INTO public.company_members (company_id, user_id, role, invited_by)
  VALUES (invitation_record.company_id, auth.uid(), invitation_record.role, invitation_record.invited_by)
  ON CONFLICT (company_id, user_id) DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE public.company_invitations 
  SET accepted = TRUE 
  WHERE id = invitation_id;
  
  RETURN TRUE;
END;
$$;

-- Create triggers for updated_at timestamps
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
