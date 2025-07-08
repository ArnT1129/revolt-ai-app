
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  Users, 
  UserPlus, 
  Settings, 
  Mail, 
  Crown,
  Shield,
  User,
  Trash2,
  Edit
} from 'lucide-react';

interface CompanyMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface CompanyInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

export default function CompanyManagement() {
  const { currentCompany, isCompanyMode } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviting, setInviting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      setCompanyName(currentCompany.name);
      setCompanyDomain(currentCompany.domain || '');
      loadCompanyData();
    }
  }, [currentCompany]);

  const loadCompanyData = async () => {
    if (!currentCompany) return;

    try {
      setLoading(true);
      
      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('company_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles!inner(email, first_name, last_name)
        `)
        .eq('company_id', currentCompany.id);

      if (membersError) throw membersError;

      const formattedMembers = membersData?.map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        email: (member.profiles as any)?.email,
        first_name: (member.profiles as any)?.first_name,
        last_name: (member.profiles as any)?.last_name,
      })) || [];

      setMembers(formattedMembers);

      // Load invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('accepted', false);

      if (invitationsError) throw invitationsError;
      setInvitations(invitationsData || []);

    } catch (error) {
      console.error('Error loading company data:', error);
      toast({
        title: "Error",
        description: "Failed to load company data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      const { error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompany.id,
          email: inviteEmail.trim(),
          role: inviteRole,
          invited_by: user?.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });

      setInviteEmail('');
      setInviteRole('employee');
      loadCompanyData();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member role updated successfully",
      });

      loadCompanyData();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed successfully",
      });

      loadCompanyData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyName.trim(),
          domain: companyDomain.trim() || null
        })
        .eq('id', currentCompany.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company information updated successfully",
      });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-400" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-400" />;
      default: return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return <Badge className="bg-yellow-600/80 text-yellow-100">Owner</Badge>;
      case 'admin': return <Badge className="bg-blue-600/80 text-blue-100">Admin</Badge>;
      default: return <Badge variant="secondary">Employee</Badge>;
    }
  };

  const canManageMembers = () => {
    const currentMember = members.find(m => m.user_id === user?.id);
    return currentMember?.role === 'owner' || currentMember?.role === 'admin';
  };

  const canEditMember = (member: CompanyMember) => {
    const currentMember = members.find(m => m.user_id === user?.id);
    if (currentMember?.role === 'owner') return true;
    if (currentMember?.role === 'admin' && member.role !== 'owner') return true;
    return false;
  };

  if (!isCompanyMode || !currentCompany) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="enhanced-card">
            <CardContent className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-slate-400 opacity-50" />
              <h3 className="text-xl font-medium text-white mb-2">Company Mode Required</h3>
              <p className="text-slate-400">
                Switch to company mode to manage your company settings and members.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64 bg-white/10 rounded"></div>
              <div className="h-64 bg-white/10 rounded"></div>
            </div>
            <div className="h-96 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{currentCompany.name}</h1>
            <p className="text-slate-400">Company Management</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company Settings */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5" />
                Company Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-slate-300">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="glass-input"
                    placeholder="Enter company name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company-domain" className="text-slate-300">Domain (optional)</Label>
                  <Input
                    id="company-domain"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    className="glass-input"
                    placeholder="company.com"
                  />
                </div>

                <Button type="submit" disabled={updating} className="w-full glass-button">
                  {updating ? 'Updating...' : 'Update Company'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Invite Member */}
          {canManageMembers() && (
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserPlus className="h-5 w-5" />
                  Invite Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email" className="text-slate-300">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="glass-input"
                      placeholder="colleague@company.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-role" className="text-slate-300">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={inviting} className="w-full glass-button">
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Team Members */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Team Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(member.role)}
                    <div>
                      <p className="text-white font-medium">
                        {member.first_name && member.last_name 
                          ? `${member.first_name} ${member.last_name}`
                          : member.email}
                      </p>
                      <p className="text-xs text-slate-400">
                        {member.email} • Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    
                    {canEditMember(member) && member.user_id !== user?.id && (
                      <div className="flex gap-1">
                        <Select
                          value={member.role}
                          onValueChange={(newRole) => handleUpdateMemberRole(member.id, newRole)}
                        >
                          <SelectTrigger className="w-32 h-8 glass-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveMember(member.id)}
                          className="glass-button h-8 w-8 p-0 hover:bg-red-600/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5" />
                Pending Invitations ({invitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                    <div>
                      <p className="text-white font-medium">{invitation.email}</p>
                      <p className="text-xs text-slate-400">
                        Invited as {invitation.role} • Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
