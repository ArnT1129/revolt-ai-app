/*
# Fix RLS infinite recursion in company_members and related tables

This migration resolves the infinite recursion error by:

1. New Functions
   - `get_user_managed_company_ids()` - Returns company IDs user owns or is admin of
   - Uses SECURITY DEFINER to bypass RLS and prevent recursion
   
2. Updated Policies
   - Replace all recursive RLS policies for `company_members` table
   - Update `company_invitations` policies to use the new function
   - Ensure no circular dependencies in policy evaluation
   
3. Security
   - All policies maintain proper access control
   - Function bypasses RLS to prevent recursion while maintaining security
*/

-- Drop existing problematic functions
DROP FUNCTION IF EXISTS public.is_company_owner_or_admin(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_company_admin_or_owner(UUID, UUID);

-- Create a security definer function that returns company IDs the user manages
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_managed_company_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return companies where user is owner
  RETURN QUERY
  SELECT id FROM public.companies WHERE owner_id = auth.uid();
  
  -- Return companies where user is admin member
  RETURN QUERY
  SELECT company_id FROM public.company_members 
  WHERE user_id = auth.uid() AND role = 'admin';
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_managed_company_ids() TO authenticated;

-- Drop all existing RLS policies on company_members
DROP POLICY IF EXISTS "Company owners can manage all members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can manage members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can insert members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can update members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can delete members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners and admins can manage members" ON public.company_members;

-- Create new non-recursive policies for company_members
CREATE POLICY "Users can view own membership" ON public.company_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Company managers can view all members" ON public.company_members
  FOR SELECT USING (
    company_id IN (SELECT public.get_user_managed_company_ids())
  );

CREATE POLICY "Company managers can insert members" ON public.company_members
  FOR INSERT WITH CHECK (
    company_id IN (SELECT public.get_user_managed_company_ids())
  );

CREATE POLICY "Company managers can update members" ON public.company_members
  FOR UPDATE USING (
    company_id IN (SELECT public.get_user_managed_company_ids())
  );

CREATE POLICY "Company managers can delete members" ON public.company_members
  FOR DELETE USING (
    company_id IN (SELECT public.get_user_managed_company_ids())
  );

-- Drop and recreate company_invitations policies
DROP POLICY IF EXISTS "Company owners and admins can manage invitations" ON public.company_invitations;

CREATE POLICY "Company managers can manage invitations" ON public.company_invitations
  FOR ALL USING (
    company_id IN (SELECT public.get_user_managed_company_ids())
  );

-- Update user_batteries policies to avoid recursion
DROP POLICY IF EXISTS "Users can update own batteries or company batteries they have access to" ON public.user_batteries;

CREATE POLICY "Users can manage own batteries" ON public.user_batteries
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Company members can view company batteries" ON public.user_batteries
  FOR SELECT USING (
    company_id IS NOT NULL AND 
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid()
      UNION
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Company managers can manage company batteries" ON public.user_batteries
  FOR INSERT WITH CHECK (
    company_id IS NULL OR 
    company_id IN (SELECT public.get_user_managed_company_ids())
  );

CREATE POLICY "Company managers can update company batteries" ON public.user_batteries
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (company_id IS NOT NULL AND company_id IN (SELECT public.get_user_managed_company_ids()))
  );

CREATE POLICY "Company managers can delete company batteries" ON public.user_batteries
  FOR DELETE USING (
    user_id = auth.uid() OR 
    (company_id IS NOT NULL AND company_id IN (SELECT public.get_user_managed_company_ids()))
  );