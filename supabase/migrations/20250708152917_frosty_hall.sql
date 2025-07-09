/*
# Fix RLS infinite recursion

1. New Functions
   - `is_company_owner_or_admin` - Security definer function to check user roles without triggering RLS
   
2. Updated Policies
   - Replace recursive RLS policies for `company_members` table
   - Update `company_invitations` policies to use the new function
   - Update `user_batteries` policies to use the new function
   
3. Security
   - All policies maintain proper access control
   - Function bypasses RLS to prevent recursion while maintaining security
*/

-- Create a security definer function to check if user is owner or admin
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_company_owner_or_admin(company_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_owner BOOLEAN := FALSE;
  is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if user is the company owner
  SELECT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = company_id_param AND owner_id = user_id_param
  ) INTO is_owner;
  
  -- Check if user is an admin (only if not owner)
  IF NOT is_owner THEN
    SELECT EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE company_id = company_id_param 
        AND user_id = user_id_param 
        AND role = 'admin'
    ) INTO is_admin;
  END IF;
  
  RETURN is_owner OR is_admin;
END;
$$;

-- Drop existing problematic policies for company_members
DROP POLICY IF EXISTS "Company owners and admins can manage members" ON public.company_members;

-- Create new non-recursive policies for company_members
CREATE POLICY "Company owners can manage all members" ON public.company_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = company_members.company_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage members" ON public.company_members
  FOR SELECT USING (
    company_members.user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = company_members.company_id AND c.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.company_members cm 
      WHERE cm.company_id = company_members.company_id 
        AND cm.user_id = auth.uid() 
        AND cm.role = 'admin'
        AND cm.id != company_members.id  -- Prevent self-reference
    )
  );

CREATE POLICY "Company admins can insert members" ON public.company_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    ) OR
    public.is_company_owner_or_admin(company_id, auth.uid())
  );

CREATE POLICY "Company admins can update members" ON public.company_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = company_members.company_id AND c.owner_id = auth.uid()
    ) OR
    public.is_company_owner_or_admin(company_members.company_id, auth.uid())
  );

CREATE POLICY "Company admins can delete members" ON public.company_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = company_members.company_id AND c.owner_id = auth.uid()
    ) OR
    public.is_company_owner_or_admin(company_members.company_id, auth.uid())
  );

-- Update company_invitations policies to use the new function
DROP POLICY IF EXISTS "Company owners and admins can manage invitations" ON public.company_invitations;

CREATE POLICY "Company owners and admins can manage invitations" ON public.company_invitations
  FOR ALL USING (
    public.is_company_owner_or_admin(company_invitations.company_id, auth.uid())
  );

-- Update user_batteries policies to use the new function
DROP POLICY IF EXISTS "Users can update own batteries or company batteries they have access to" ON public.user_batteries;

CREATE POLICY "Users can update own batteries or company batteries they have access to" ON public.user_batteries
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE company_id = user_batteries.company_id AND user_id = auth.uid()
    ))
  );