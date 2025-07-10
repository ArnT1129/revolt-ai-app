
-- Fix infinite recursion in RLS policies by removing problematic policies and creating simpler ones

-- Drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Company members can view their companies" ON public.companies;
DROP POLICY IF EXISTS "Company admins can manage members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can insert members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can update members" ON public.company_members;  
DROP POLICY IF EXISTS "Company admins can delete members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners and admins can manage members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can manage all members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners and admins can manage invitations" ON public.company_invitations;

-- Recreate simpler policies without recursion for companies
CREATE POLICY "Company owners can manage their companies" 
  ON public.companies 
  FOR ALL 
  USING (auth.uid() = owner_id);

CREATE POLICY "Company members can view companies they belong to" 
  ON public.companies 
  FOR SELECT 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE company_id = companies.id AND user_id = auth.uid()
    )
  );

-- Simplify company_members policies
CREATE POLICY "Users can view their own memberships" 
  ON public.company_members 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Company owners can manage members" 
  ON public.company_members 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = company_members.company_id AND owner_id = auth.uid()
    )
  );

-- Simplify company invitations policy  
CREATE POLICY "Company owners can manage invitations" 
  ON public.company_invitations 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = company_invitations.company_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations sent to them" 
  ON public.company_invitations 
  FOR SELECT 
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
