/*
# Fix infinite recursion in company_members RLS policy

This migration resolves the infinite recursion error in the company_members table RLS policy by:

1. Creating a security definer function that bypasses RLS for role checks
2. Dropping and recreating the problematic RLS policy to use the new function
3. Ensuring proper permissions are granted for the function

## Changes Made
- Added `is_company_admin_or_owner` function with SECURITY DEFINER privileges
- Updated company_members RLS policy to use the new function
- Granted execute permissions to authenticated users

## Security
- The function runs with definer privileges to bypass RLS for internal queries
- This prevents the recursive policy evaluation that was causing the error
*/

-- Function to check if a user is an owner or admin of a given company
CREATE OR REPLACE FUNCTION public.is_company_admin_or_owner(p_company_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Crucial: function runs with definer's privileges, bypassing RLS for its internal query
AS $$
BEGIN
  -- Check if the user is the owner of the company
  IF EXISTS (SELECT 1 FROM public.companies WHERE id = p_company_id AND owner_id = p_user_id) THEN
    RETURN TRUE;
  END IF;

  -- Check if the user is an admin member of the company
  IF EXISTS (SELECT 1 FROM public.company_members WHERE company_id = p_company_id AND user_id = p_user_id AND role = 'admin') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_company_admin_or_owner(UUID, UUID) TO authenticated;

-- Drop the problematic RLS policy on company_members
DROP POLICY IF EXISTS "Company owners and admins can manage members" ON public.company_members;

-- Recreate the RLS policy using the new function
CREATE POLICY "Company owners and admins can manage members" ON public.company_members
  FOR ALL USING (
    public.is_company_admin_or_owner(company_id, auth.uid())
  );

-- Also fix the similar issue in company_invitations policy
DROP POLICY IF EXISTS "Company owners and admins can manage invitations" ON public.company_invitations;

CREATE POLICY "Company owners and admins can manage invitations" ON public.company_invitations
  FOR ALL USING (
    public.is_company_admin_or_owner(company_id, auth.uid())
  );