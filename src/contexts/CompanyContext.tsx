
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
  domain?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'employee';
  joined_at: string;
  invited_by?: string;
}

interface CompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role: 'admin' | 'employee';
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

interface CompanyContextType {
  currentCompany: Company | null;
  userCompanies: Company[];
  isCompanyMode: boolean;
  loading: boolean;
  switchToCompany: (companyId: string) => void;
  switchToIndividual: () => void;
  createCompany: (name: string, domain?: string) => Promise<Company>;
  inviteEmployee: (companyId: string, email: string, role: 'admin' | 'employee') => Promise<void>;
  getCompanyMembers: (companyId: string) => Promise<CompanyMember[]>;
  getPendingInvitations: (companyId: string) => Promise<CompanyInvitation[]>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [isCompanyMode, setIsCompanyMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserCompanies();
    } else {
      setUserCompanies([]);
      setCurrentCompany(null);
      setIsCompanyMode(false);
      setLoading(false);
    }
  }, [user]);

  const fetchUserCompanies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Check if tables exist first
      const { data: tableCheck, error: tableError } = await supabase
        .from('companies')
        .select('id')
        .limit(1);

      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist, set empty companies
        setUserCompanies([]);
        return;
      }

      // Check for infinite recursion error in policies
      if (tableError && tableError.code === '42P17') {

        setUserCompanies([]);
        return;
      }

      // Get companies where user is a member
      const { data: memberCompanies, error: memberError } = await supabase
        .from('company_members')
        .select(`
          company_id,
          companies (
            id,
            name,
            domain,
            owner_id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (memberError) {

        // Continue with owned companies only
      }

      // Get companies owned by user
      const { data: ownedCompanies, error: ownedError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) {

        // Set empty companies if both queries fail
        setUserCompanies([]);
        return;
      }

      const allCompanies = [
        ...(ownedCompanies || []),
        ...(memberCompanies || []).map(mc => mc.companies).filter(Boolean)
      ];

      // Remove duplicates
      const uniqueCompanies = allCompanies.filter((company, index, self) => 
        index === self.findIndex(c => c.id === company.id)
      );

      setUserCompanies(uniqueCompanies);
    } catch (error) {
      console.error('Error fetching user companies:', error);
      // Set empty companies on error
      setUserCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const switchToCompany = (companyId: string) => {
    const company = userCompanies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      setIsCompanyMode(true);
      localStorage.setItem('currentCompanyId', companyId);
    }
  };

  const switchToIndividual = () => {
    setCurrentCompany(null);
    setIsCompanyMode(false);
    localStorage.removeItem('currentCompanyId');
  };

  const createCompany = async (name: string, domain?: string): Promise<Company> => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name,
          domain,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as a member
      await supabase
        .from('company_members')
        .insert({
          company_id: data.id,
          user_id: user.id,
          role: 'owner'
        });

      await fetchUserCompanies();
      return data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error('Failed to create company. Please try again.');
    }
  };

  const inviteEmployee = async (companyId: string, email: string, role: 'admin' | 'employee'): Promise<void> => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: companyId,
          email,
          role,
          invited_by: user.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error inviting employee:', error);
      throw new Error('Failed to invite employee. Please try again.');
    }
  };

  const getCompanyMembers = async (companyId: string): Promise<CompanyMember[]> => {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      
      // Type assertion with proper role casting
      return (data || []).map(member => ({
        ...member,
        role: member.role as 'owner' | 'admin' | 'employee'
      }));
    } catch (error) {
      console.error('Error fetching company members:', error);
      return [];
    }
  };

  const getPendingInvitations = async (companyId: string): Promise<CompanyInvitation[]> => {
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', companyId)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      
      // Type assertion with proper role casting
      return (data || []).map(invitation => ({
        ...invitation,
        role: invitation.role as 'admin' | 'employee'
      }));
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }
  };

  const acceptInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('accept_company_invitation', {
        invitation_id: invitationId
      });

      if (error) throw error;
      
      if (data) {
        await fetchUserCompanies();
      }
      
      return data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  };

  const value = {
    currentCompany,
    userCompanies,
    isCompanyMode,
    loading,
    switchToCompany,
    switchToIndividual,
    createCompany,
    inviteEmployee,
    getCompanyMembers,
    getPendingInvitations,
    acceptInvitation,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};
