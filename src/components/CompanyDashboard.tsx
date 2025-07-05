
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Battery, 
  TrendingUp, 
  AlertTriangle, 
  Mail, 
  UserPlus, 
  Settings,
  Shield,
  Clock,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'employee';
  joined_at: string;
  user_email?: string;
  last_active?: string;
}

interface CompanyInvitation {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
  expires_at: string;
}

interface CompanyAnalytics {
  totalBatteries: number;
  totalMembers: number;
  avgSoH: number;
  criticalBatteries: number;
  monthlyUploads: number;
  storageUsed: string;
}

export default function CompanyDashboard() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [analytics, setAnalytics] = useState<CompanyAnalytics>({
    totalBatteries: 0,
    totalMembers: 0,
    avgSoH: 0,
    criticalBatteries: 0,
    monthlyUploads: 0,
    storageUsed: '0 MB'
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'employee'>('employee');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      fetchCompanyData();
    }
  }, [currentCompany]);

  const fetchCompanyData = async () => {
    if (!currentCompany) return;

    try {
      // Fetch company members with user emails
      const { data: membersData, error: membersError } = await supabase
        .from('company_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles!inner(email)
        `)
        .eq('company_id', currentCompany.id);

      if (membersError) throw membersError;

      const formattedMembers = membersData.map(member => ({
        ...member,
        user_email: member.profiles?.email || 'Unknown'
      }));

      setMembers(formattedMembers);

      // Fetch pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) throw invitationsError;
      setInvitations(invitationsData || []);

      // Fetch company batteries analytics
      const { data: batteriesData, error: batteriesError } = await supabase
        .from('user_batteries')
        .select('soh, status, created_at')
        .eq('company_id', currentCompany.id);

      if (batteriesError) throw batteriesError;

      const totalBatteries = batteriesData?.length || 0;
      const avgSoH = totalBatteries > 0 
        ? batteriesData.reduce((sum, battery) => sum + battery.soh, 0) / totalBatteries 
        : 0;
      const criticalBatteries = batteriesData?.filter(b => b.status === 'Critical').length || 0;
      
      // Calculate monthly uploads (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyUploads = batteriesData?.filter(b => 
        new Date(b.created_at) > thirtyDaysAgo
      ).length || 0;

      setAnalytics({
        totalBatteries,
        totalMembers: formattedMembers.length,
        avgSoH: Math.round(avgSoH * 10) / 10,
        criticalBatteries,
        monthlyUploads,
        storageUsed: `${Math.round(totalBatteries * 2.3)} MB` // Estimated storage
      });

    } catch (error: any) {
      console.error('Error fetching company data:', error);
      toast({
        title: "Error",
        description: "Failed to load company data",
        variant: "destructive"
      });
    }
  };

  const sendInvitation = async () => {
    if (!currentCompany || !inviteEmail.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompany.id,
          email: inviteEmail.trim(),
          role: inviteRole,
          invited_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}`
      });

      setInviteEmail('');
      fetchCompanyData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'employee') => {
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member role updated successfully"
      });

      fetchCompanyData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update member role",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed successfully"
      });

      fetchCompanyData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const exportCompanyReport = async () => {
    if (!currentCompany) return;

    try {
      const { data: batteries } = await supabase
        .from('user_batteries')
        .select('*')
        .eq('company_id', currentCompany.id);

      const csvData = [
        ['Battery ID', 'Chemistry', 'SoH (%)', 'RUL (cycles)', 'Status', 'Grade', 'Upload Date'],
        ...(batteries || []).map(battery => [
          battery.id,
          battery.chemistry,
          battery.soh,
          battery.rul,
          battery.status,
          battery.grade,
          new Date(battery.upload_date).toLocaleDateString()
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentCompany.name}_battery_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Company report exported successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  if (!currentCompany) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Please select a company to view dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{currentCompany.name}</h1>
          <p className="text-slate-400">Company Dashboard</p>
        </div>
        <Button onClick={exportCompanyReport} className="glass-button">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Battery className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Total Batteries</p>
                <p className="text-xl font-bold text-white">{analytics.totalBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Team Members</p>
                <p className="text-xl font-bold text-white">{analytics.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-cyan-400" />
              <div>
                <p className="text-sm text-slate-400">Avg SoH</p>
                <p className="text-xl font-bold text-white">{analytics.avgSoH}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Critical Issues</p>
                <p className="text-xl font-bold text-white">{analytics.criticalBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="glass-button w-full md:w-auto">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <div className="space-y-4">
            {/* Invite Member Section */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invite Team Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="glass-input flex-1"
                  />
                  <Select value={inviteRole} onValueChange={(value: 'admin' | 'employee') => setInviteRole(value)}>
                    <SelectTrigger className="w-32 glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={sendInvitation} disabled={loading} className="glass-button">
                    <Mail className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Members */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Current Members ({members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {member.user_email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.user_email}</p>
                          <p className="text-xs text-slate-400">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        {member.role !== 'owner' && member.user_id !== user?.id && (
                          <div className="flex gap-1">
                            <Select 
                              value={member.role} 
                              onValueChange={(value: 'admin' | 'employee') => updateMemberRole(member.id, value)}
                            >
                              <SelectTrigger className="w-24 h-8 glass-input text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employee">Employee</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => removeMember(member.id)}
                            >
                              Remove
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
                  <CardTitle className="text-white">Pending Invitations ({invitations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <div>
                          <p className="text-white font-medium">{invitation.email}</p>
                          <p className="text-xs text-slate-400">
                            Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-amber-400 border-amber-400">
                          {invitation.role} (pending)
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Uploads</span>
                  <span className="text-white font-medium">{analytics.monthlyUploads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage Used</span>
                  <span className="text-white font-medium">{analytics.storageUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Users</span>
                  <span className="text-white font-medium">{analytics.totalMembers}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Health Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Healthy Batteries</span>
                  <span className="text-green-400 font-medium">
                    {analytics.totalBatteries - analytics.criticalBatteries}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Critical Batteries</span>
                  <span className="text-orange-400 font-medium">{analytics.criticalBatteries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average SoH</span>
                  <span className="text-cyan-400 font-medium">{analytics.avgSoH}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Company Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Company Name</Label>
                <Input 
                  value={currentCompany.name} 
                  readOnly 
                  className="glass-input bg-slate-800/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Domain</Label>
                <Input 
                  value={currentCompany.domain || 'Not set'} 
                  readOnly 
                  className="glass-input bg-slate-800/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Created</Label>
                <Input 
                  value={new Date(currentCompany.created_at).toLocaleDateString()} 
                  readOnly 
                  className="glass-input bg-slate-800/50" 
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="pt-4">
                <p className="text-sm text-slate-400 mb-4">
                  Contact support to modify company settings or upgrade your plan.
                </p>
                <Button variant="outline" className="glass-button">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
