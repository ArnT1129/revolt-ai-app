
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Edit,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Key,
  Lock,
  Unlock,
  Globe,
  Database,
  Activity,
  BarChart3,
  Battery,
  FileText,
  Calendar,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Save
} from 'lucide-react';

interface CompanyMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  last_active?: string;
  battery_count?: number;
}

interface CompanyInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
  invited_by?: string;
  invite_code?: string;
}

interface CompanyStats {
  total_members: number;
  total_batteries: number;
  active_members: number;
  pending_invitations: number;
  admin_count: number;
  employee_count: number;
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [stats, setStats] = useState<CompanyStats>({
    total_members: 0,
    total_batteries: 0,
    active_members: 0,
    pending_invitations: 0,
    admin_count: 0,
    employee_count: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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
      
      // Load members with battery count
      const { data: membersData, error: membersError } = await supabase
        .from('company_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles!inner(email, first_name, last_name, last_active)
        `)
        .eq('company_id', currentCompany.id);

      if (membersError) throw membersError;

      // Get battery counts for each member
      const membersWithBatteries = await Promise.all(
        (membersData || []).map(async (member) => {
          const { count } = await supabase
            .from('user_batteries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', member.user_id);

          return {
            id: member.id,
            user_id: member.user_id,
            role: member.role,
            joined_at: member.joined_at,
            email: (member.profiles as any)?.email,
            first_name: (member.profiles as any)?.first_name,
            last_name: (member.profiles as any)?.last_name,
            last_active: (member.profiles as any)?.last_active,
            battery_count: count || 0
          };
        })
      );

      setMembers(membersWithBatteries);

      // Load invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('accepted', false);

      if (invitationsError) throw invitationsError;
      setInvitations(invitationsData || []);

      // Calculate stats
      const totalMembers = membersWithBatteries.length;
      const adminCount = membersWithBatteries.filter(m => m.role === 'admin').length;
      const employeeCount = membersWithBatteries.filter(m => m.role === 'employee').length;
      const totalBatteries = membersWithBatteries.reduce((sum, m) => sum + (m.battery_count || 0), 0);
      const activeMembers = membersWithBatteries.filter(m => {
        const lastActive = new Date(m.last_active || 0);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastActive > thirtyDaysAgo;
      }).length;

      setStats({
        total_members: totalMembers,
        total_batteries: totalBatteries,
        active_members: activeMembers,
        pending_invitations: invitationsData?.length || 0,
        admin_count: adminCount,
        employee_count: employeeCount
      });

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

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      const inviteCode = generateInviteCode();
      
      const { error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompany.id,
          email: inviteEmail.trim(),
          role: inviteRole,
          invited_by: user?.id,
          invite_code: inviteCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} with code: ${inviteCode}`,
      });

      setInviteEmail('');
      setInviteRole('employee');
      setShowInviteModal(false);
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
    if (!confirm('Are you sure you want to remove this member? This action cannot be undone.')) return;

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

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation cancelled successfully",
      });

      loadCompanyData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
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
          name: companyName,
          domain: companyDomain
        })
        .eq('id', currentCompany.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company information updated successfully",
      });

      // Refresh company context
      window.location.reload();
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
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'employee': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-purple-600/80 text-purple-100">Admin</Badge>;
      case 'employee': return <Badge className="bg-blue-600/80 text-blue-100">Employee</Badge>;
      default: return <Badge className="bg-gray-600/80 text-gray-100">{role}</Badge>;
    }
  };

  const canManageMembers = () => {
    if (!currentCompany || !user) return false;
    const currentMember = members.find(m => m.user_id === user.id);
    return currentMember?.role === 'admin';
  };

  const canEditMember = (member: CompanyMember) => {
    if (!canManageMembers()) return false;
    if (member.user_id === user?.id) return false; // Can't edit own role
    return true;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!currentCompany) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="enhanced-card">
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Company Selected</h3>
              <p className="text-slate-400">
                Please select a company to manage its settings and members.
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
            <div className="grid gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/10 rounded"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-400" />
              Company Management
            </h1>
            <p className="text-slate-400 mt-2">
              Manage your company settings, members, and security
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowSecurityModal(true)}
              variant="outline"
              className="glass-button"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security
            </Button>
            
            {canManageMembers() && (
              <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                <DialogTrigger asChild>
                  <Button className="glass-button">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowInviteModal(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={inviting}
                        className="flex-1"
                      >
                        {inviting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Inviting...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600/20">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total_members}</div>
                  <div className="text-sm text-slate-400">Total Members</div>
                  <div className="text-xs text-slate-500">{stats.active_members} active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-600/20">
                  <Battery className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total_batteries}</div>
                  <div className="text-sm text-slate-400">Total Batteries</div>
                  <div className="text-xs text-slate-500">Company-wide</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-600/20">
                  <Crown className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.admin_count}</div>
                  <div className="text-sm text-slate-400">Admins</div>
                  <div className="text-xs text-slate-500">{stats.employee_count} employees</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-600/20">
                  <Mail className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.pending_invitations}</div>
                  <div className="text-sm text-slate-400">Pending Invites</div>
                  <div className="text-xs text-slate-500">Awaiting response</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-button">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Company Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="employee">Employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Members List */}
                <div className="space-y-4">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                          {getRoleIcon(member.role)}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-slate-400 text-sm">{member.email}</div>
                          <div className="text-slate-500 text-xs">
                            Joined {new Date(member.joined_at).toLocaleDateString()} • {member.battery_count} batteries
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getRoleBadge(member.role)}
                        {canEditMember(member) && (
                          <Select
                            value={member.role}
                            onValueChange={(newRole) => handleUpdateMemberRole(member.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {canEditMember(member) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-400 hover:text-red-300"
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
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-400" />
                  Pending Invitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invitations.length > 0 ? (
                    invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{invitation.email}</div>
                          <div className="text-slate-400 text-sm">
                            Role: {invitation.role} • Invited {new Date(invitation.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-slate-500 text-xs">
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </div>
                          {invitation.invite_code && (
                            <div className="text-blue-400 text-xs mt-1">
                              Code: {invitation.invite_code}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(invitation.role)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No pending invitations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Company Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateCompany} className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyDomain">Domain (Optional)</Label>
                    <Input
                      id="companyDomain"
                      value={companyDomain}
                      onChange={(e) => setCompanyDomain(e.target.value)}
                      placeholder="company.com"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Company
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    Security Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <div>
                          <div className="text-white font-medium">Company Isolation</div>
                          <div className="text-slate-400 text-sm">Batteries are private to company</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="text-white font-medium">Invitation Codes</div>
                          <div className="text-slate-400 text-sm">Secure member invitations</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-purple-400" />
                        <div>
                          <div className="text-white font-medium">Role-Based Access</div>
                          <div className="text-slate-400 text-sm">Admin and employee roles</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-yellow-400" />
                    Security Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-900/20 rounded-lg">
                      <div className="text-yellow-400 font-medium mb-1">Regular Access Review</div>
                      <div className="text-slate-400 text-sm">
                        Review member access monthly and remove inactive users
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-900/20 rounded-lg">
                      <div className="text-blue-400 font-medium mb-1">Secure Invitations</div>
                      <div className="text-slate-400 text-sm">
                        Use invitation codes and verify email addresses
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-900/20 rounded-lg">
                      <div className="text-green-400 font-medium mb-1">Data Privacy</div>
                      <div className="text-slate-400 text-sm">
                        Battery data is isolated and private to your company
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
