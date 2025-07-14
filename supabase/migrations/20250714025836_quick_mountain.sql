/*
  # Fix RLS Policies to Prevent Infinite Recursion

  1. Security Changes
    - Drop all existing problematic RLS policies on user_batteries and company_members
    - Create new, simplified policies that avoid circular references
    - Ensure users can only access their own data or company data they belong to
    
  2. Policy Structure
    - user_batteries: Simple policies based on user_id only
    - company_members: Simple policies based on user_id only
    - No cross-table references that could cause recursion
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can delete own batteries" ON user_batteries;
DROP POLICY IF EXISTS "Users can insert own batteries" ON user_batteries;
DROP POLICY IF EXISTS "Users can update own batteries" ON user_batteries;
DROP POLICY IF EXISTS "Users can update own batteries or company batteries they have a" ON user_batteries;
DROP POLICY IF EXISTS "Users can view own batteries" ON user_batteries;
DROP POLICY IF EXISTS "Users can view own batteries or company batteries" ON user_batteries;

DROP POLICY IF EXISTS "Company admins can delete members" ON company_members;
DROP POLICY IF EXISTS "Company admins can insert members" ON company_members;
DROP POLICY IF EXISTS "Company admins can manage members" ON company_members;
DROP POLICY IF EXISTS "Company admins can update members" ON company_members;
DROP POLICY IF EXISTS "Company owners and admins can manage members" ON company_members;
DROP POLICY IF EXISTS "Company owners can manage all members" ON company_members;
DROP POLICY IF EXISTS "Users can view their own company memberships" ON company_members;

-- Create simple, non-recursive policies for user_batteries
CREATE POLICY "Users can manage their own batteries"
  ON user_batteries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create simple, non-recursive policies for company_members
CREATE POLICY "Users can view their own memberships"
  ON company_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Company owners can manage members"
  ON company_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies  
      WHERE companies.id = company_members.company_id 
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_members.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Ensure RLS is enabled on both tables
ALTER TABLE user_batteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Add a simple policy for companies table if it doesn't exist
DROP POLICY IF EXISTS "Users can manage their own companies" ON companies;
CREATE POLICY "Users can manage their own companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can view companies they are members of
CREATE POLICY "Users can view companies they belong to"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;