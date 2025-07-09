
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Battery, TrendingUp, Mail, Calendar } from 'lucide-react';

interface CompanyMember {
  id: string;
  user_id: string;
  role: 'admin' | 'owner' | 'employee';
  joined_at: string;
  user_email: string;
}

interface CompanyInvitation {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

interface CompanyStats {
  totalBatteries: number;
  healthyBatteries: number;
  criticalBatteries: number;
  totalMembers: number;
  pendingInvitations: number;
}

export default function CompanyDashboard() {
  const { currentCompany } = useCompany();
  const [stats, setStats] = useState<CompanyStats>({
    totalBatteries: 0,
    healthyBatteries: 0,
    criticalBatteries: 0,
    totalMembers: 0,
    pendingInvitations: 0
  });
  const [recentMembers, setRecentMembers] = useState<CompanyMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CompanyInvitation[]>([]);

  useEffect(() => {
    if (currentCompany) {
      fetchDashboardData();
    }
  }, [currentCompany]);

  const fetchDashboardData = async () => {
    if (!currentCompany) return;

    try {
      // Fetch battery statistics
      const { data: batteries } = await supabase
        .from('user_batteries')
        .select('status')
        .eq('company_id', currentCompany.id);

      const totalBatteries = batteries?.length || 0;
      const healthyBatteries = batteries?.filter(b => b.status === 'Healthy').length || 0;
      const criticalBatteries = batteries?.filter(b => b.status === 'Critical').length || 0;

      // Fetch company members
      const { data: membersData } = await supabase
        .from('company_members')
        .select('id, user_id, role, joined_at')
        .eq('company_id', currentCompany.id)
        .order('joined_at', { ascending: false })
        .limit(5);

      // Get profile data for members
      const memberIds = membersData?.map(m => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', memberIds);

      const formattedMembers: CompanyMember[] = membersData?.map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        return {
          ...member,
          role: member.role as 'admin' | 'owner' | 'employee',
          user_email: profile?.email || 'Unknown'
        };
      }) || [];

      setRecentMembers(formattedMembers);

      // Fetch pending invitations
      const { data: invitationsData } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      const formattedInvitations: CompanyInvitation[] = invitationsData?.map(inv => ({
        ...inv,
        role: inv.role as 'admin' | 'employee'
      })) || [];

      setPendingInvitations(formattedInvitations);

      setStats({
        totalBatteries,
        healthyBatteries,
        criticalBatteries,
        totalMembers: formattedMembers.length,
        pendingInvitations: formattedInvitations.length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      {/* Company Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Battery className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Total Batteries</p>
                <p className="text-lg font-bold text-white">{stats.totalBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Healthy Batteries</p>
                <p className="text-lg font-bold text-white">{stats.healthyBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Team Members</p>
                <p className="text-lg font-bold text-white">{stats.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Pending Invites</p>
                <p className="text-lg font-bold text-white">{stats.pendingInvitations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Team Members */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMembers.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No team members yet</p>
              ) : (
                recentMembers.map((member) => (
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
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No pending invitations</p>
              ) : (
                pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-white font-medium">{invitation.email}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      {invitation.role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button className="glass-button justify-start h-12">
              <Users className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
            <Button className="glass-button justify-start h-12">
              <Battery className="h-4 w-4 mr-2" />
              Upload Battery Data
            </Button>
            <Button className="glass-button justify-start h-12">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
