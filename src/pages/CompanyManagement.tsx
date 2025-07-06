
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CompanyDashboard from '@/components/CompanyDashboard';
import BatteryAccessControl from '@/components/BatteryAccessControl';
import CompanyAuditLog from '@/components/CompanyAuditLog';
import { Building2, Shield, Activity, Users, Settings as SettingsIcon, Mail, Plus, Trash2, UserCheck, Crown } from 'lucide-react';

interface CompanyMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'employee';
  joined_at: string;
  user_email: string;
  user_name: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
  expires_at: string;
}

export default function CompanyManagement() {
  const { currentCompany, isCompanyMode } = useCompany();
  const { toast } = useToast();
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyName, setCompanyName] = useState(currentCompany?.name || '');
  const [companyDomain, setCompanyDomain] = useState(currentCompany?.domain || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'employee'>('employee');
  const [teamMembers, setTeamMembers] = useState<CompanyMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('employee');

  useEffect(() => {
    if (currentCompany) {
      setCompanyName(currentCompany.name);
      setCompanyDomain(currentCompany.domain || '');
      fetchTeamMembers();
      fetchPendingInvitations();
      fetchCurrentUserRole();
    }
  }, [currentCompany]);

  const fetchCurrentUserRole = async () => {
    if (!currentCompany) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is owner
      if (currentCompany.owner_id === user.id) {
        setCurrentUserRole('owner');
        return;
      }

      // Get user's role from company_members
      const { data: memberData } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', currentCompany.id)
        .eq('user_id', user.id)
        .single();

      if (memberData) {
        setCurrentUserRole(memberData.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchTeamMembers = async () => {
    if (!currentCompany) return;

    try {
      const { data: membersData, error } = await supabase
        .from('company_members')
        .select('id, user_id, role, joined_at')
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      // Get user profiles for the members
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Combine member and profile data
      const enrichedMembers: CompanyMember[] = membersData?.map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        return {
          ...member,
          role: member.role as 'owner' | 'admin' | 'employee',
          user_email: profile?.email || 'Unknown',
          user_name: profile?.full_name || profile?.email || 'Unknown User'
        };
      }) || [];

      // Add owner to the list if not already present
      const ownerExists = enrichedMembers.some(m => m.user_id === currentCompany.owner_id);
      if (!ownerExists) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', currentCompany.owner_id)
          .single();

        if (ownerProfile) {
          enrichedMembers.unshift({
            id: 'owner',
            user_id: currentCompany.owner_id,
            role: 'owner',
            joined_at: currentCompany.created_at,
            user_email: ownerProfile.email,
            user_name: ownerProfile.full_name || ownerProfile.email
          });
        }
      }

      setTeamMembers(enrichedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchPendingInvitations = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('id, email, role, created_at, expires_at')
        .eq('company_id', currentCompany.id)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      setPendingInvitations(data?.map(inv => ({
        ...inv,
        role: inv.role as 'admin' | 'employee'
      })) || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const canManageTeam = () => {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  };

  const canEditCompany = () => {
    return currentUserRole === 'owner';
  };

  const handleUpdateCompany = async () => {
    if (!companyName.trim() || !canEditCompany()) {
      toast({
        title: "Error",
        description: "Company name is required or insufficient permissions",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyName,
          domain: companyDomain || null
        })
        .eq('id', currentCompany!.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company information updated successfully",
      });
      setIsEditingCompany(false);
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !canManageTeam()) {
      toast({
        title: "Error",
        description: "Email address is required or insufficient permissions",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompany!.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail('');
      fetchPendingInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (!canManageTeam() || memberUserId === currentCompany?.owner_id) {
      toast({
        title: "Error",
        description: "Cannot remove this member",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed from company",
      });
      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'employee') => {
    if (!canManageTeam()) {
      toast({
        title: "Error",
        description: "Insufficient permissions",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member role updated",
      });
      fetchTeamMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-600/80 text-purple-100';
      case 'admin': return 'bg-blue-600/80 text-blue-100';
      case 'employee': return 'bg-green-600/80 text-green-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'employee': return <UserCheck className="h-3 w-3" />;
      default: return null;
    }
  };

  if (!isCompanyMode || !currentCompany) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Company Selected</h2>
          <p className="text-slate-400">
            Switch to company mode and select a company to access management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">{currentCompany.name} Management</h1>
          <p className="text-slate-400">
            Manage your company's battery analytics platform
            <Badge className={`ml-2 ${getRoleColor(currentUserRole)} border-0`}>
              {getRoleIcon(currentUserRole)}
              <span className="ml-1 capitalize">{currentUserRole}</span>
            </Badge>
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="glass-button w-full md:w-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          {canEditCompany() && (
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access Control
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CompanyDashboard />
        </TabsContent>

        {canEditCompany() && (
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white">Company Information</CardTitle>
                  <CardDescription>Manage your company's basic information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingCompany ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
                        <Input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyDomain" className="text-slate-300">Domain (optional)</Label>
                        <Input
                          id="companyDomain"
                          value={companyDomain}
                          onChange={(e) => setCompanyDomain(e.target.value)}
                          placeholder="company.com"
                          className="glass-input"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateCompany} className="glass-button">
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditingCompany(false)}
                          className="glass-button"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Company Name</Label>
                        <p className="text-white mt-1">{currentCompany.name}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300">Domain</Label>
                        <p className="text-white mt-1">{currentCompany.domain || 'Not set'}</p>
                      </div>
                      <Button 
                        onClick={() => setIsEditingCompany(true)}
                        className="glass-button"
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Edit Information
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="team">
          <div className="space-y-6">
            {canManageTeam() && (
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white">Invite Team Members</CardTitle>
                  <CardDescription>Send invitations to new team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <Select value={inviteRole} onValueChange={(value: 'admin' | 'employee') => setInviteRole(value)}>
                      <SelectTrigger className="w-32 glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleInviteUser} className="glass-button">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white">Pending Invitations</CardTitle>
                  <CardDescription>Invitations waiting for acceptance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingInvitations.map(invitation => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-slate-800/40">
                        <div>
                          <p className="text-white font-medium">{invitation.email}</p>
                          <p className="text-slate-400 text-sm">
                            Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getRoleColor(invitation.role)}>
                          {getRoleIcon(invitation.role)}
                          <span className="ml-1 capitalize">{invitation.role}</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Members */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Team Members ({teamMembers.length})</CardTitle>
                <CardDescription>Manage your team members and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-slate-800/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {member.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.user_name}</p>
                          <p className="text-slate-400 text-sm">{member.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManageTeam() && member.role !== 'owner' ? (
                          <Select 
                            value={member.role} 
                            onValueChange={(value: 'admin' | 'employee') => updateMemberRole(member.id, value)}
                          >
                            <SelectTrigger className="w-32 glass-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getRoleColor(member.role)}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </Badge>
                        )}
                        {canManageTeam() && member.role !== 'owner' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeMember(member.id, member.user_id)}
                            className="glass-button text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access">
          <BatteryAccessControl />
        </TabsContent>

        <TabsContent value="audit">
          <CompanyAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
