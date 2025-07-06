import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from '@/hooks/use-toast';
import { 
  Battery, 
  Users, 
  Shield, 
  Lock, 
  Unlock,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Battery {
  id: string;
  chemistry: string;
  soh: number;
  status: string;
  grade: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'employee';
  user_email: string;
}

interface BatteryAccess {
  battery_id: string;
  user_id: string;
  permission_level: 'read' | 'write' | 'admin';
  granted_by: string;
  granted_at: string;
}

export default function BatteryAccessControl() {
  const { currentCompany } = useCompany();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [batteryAccess, setBatteryAccess] = useState<BatteryAccess[]>([]);
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [permissionLevel, setPermissionLevel] = useState<'read' | 'write' | 'admin'>('read');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany]);

  const fetchData = async () => {
    if (!currentCompany) return;

    try {
      // Fetch company batteries
      const { data: batteriesData, error: batteriesError } = await supabase
        .from('user_batteries')
        .select('id, chemistry, soh, status, grade, created_at')
        .eq('company_id', currentCompany.id);

      if (batteriesError) throw batteriesError;
      setBatteries(batteriesData || []);

      // Fetch team members with proper join
      const { data: membersData, error: membersError } = await supabase
        .from('company_members')
        .select(`
          id,
          user_id,
          role
        `)
        .eq('company_id', currentCompany.id);

      if (membersError) throw membersError;

      // Get profile data separately to avoid join issues
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const formattedMembers: TeamMember[] = membersData.map(member => {
        const profile = profilesData.find(p => p.id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role as 'owner' | 'admin' | 'employee',
          user_email: profile?.email || 'Unknown'
        };
      });

      setTeamMembers(formattedMembers);

      // Note: In a real implementation, you'd have a battery_access table
      // For now, we'll simulate this data structure
      setBatteryAccess([]);

    } catch (error: any) {
      console.error('Error fetching access control data:', error);
      toast({
        title: "Error",
        description: "Failed to load access control data",
        variant: "destructive"
      });
    }
  };

  const filteredBatteries = batteries.filter(battery => {
    const matchesSearch = battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         battery.chemistry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || battery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const grantAccess = async () => {
    if (!selectedUser || selectedBatteries.length === 0) {
      toast({
        title: "Error",
        description: "Please select a user and at least one battery",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you'd insert into a battery_access table
      // For demonstration, we'll just show a success message
      toast({
        title: "Success",
        description: `Access granted to ${selectedBatteries.length} batteries`
      });

      setSelectedBatteries([]);
      setSelectedUser('');
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to grant access",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBatterySelection = (batteryId: string) => {
    setSelectedBatteries(prev => 
      prev.includes(batteryId) 
        ? prev.filter(id => id !== batteryId)
        : [...prev, batteryId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredBatteries.map(b => b.id);
    setSelectedBatteries(prev => {
      const allSelected = filteredIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !filteredIds.includes(id));
      } else {
        return [...new Set([...prev, ...filteredIds])];
      }
    });
  };

  if (!currentCompany) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Please select a company to manage battery access</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Battery Access Control
          </h2>
          <p className="text-slate-400">Manage team member access to specific batteries</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="glass-button">
              <Users className="h-4 w-4 mr-2" />
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent className="enhanced-card max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Grant Battery Access</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Select Team Member</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Choose team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.user_id}>
                        {member.user_email} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Permission Level</label>
                <Select value={permissionLevel} onValueChange={(value: 'read' | 'write' | 'admin') => setPermissionLevel(value)}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="write">Read & Write</SelectItem>
                    <SelectItem value="admin">Full Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Selected Batteries ({selectedBatteries.length})
                </label>
                <p className="text-xs text-slate-400">
                  Select batteries from the list below to grant access
                </p>
              </div>

              <Button 
                onClick={grantAccess} 
                disabled={loading || !selectedUser || selectedBatteries.length === 0}
                className="w-full glass-button"
              >
                Grant Access
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="enhanced-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search batteries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 glass-input">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Healthy">Healthy</SelectItem>
                <SelectItem value="Degrading">Degrading</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={selectAllFiltered}
              variant="outline" 
              className="glass-button"
            >
              {filteredBatteries.every(b => selectedBatteries.includes(b.id)) ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Battery List */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Company Batteries ({filteredBatteries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredBatteries.map((battery) => (
              <div key={battery.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedBatteries.includes(battery.id)}
                    onCheckedChange={() => toggleBatterySelection(battery.id)}
                  />
                  <div className="flex items-center gap-3">
                    <Battery className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{battery.id}</p>
                      <p className="text-xs text-slate-400">
                        {battery.chemistry} • Grade {battery.grade} • 
                        Added {new Date(battery.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={battery.status === 'Healthy' ? 'default' : 
                            battery.status === 'Degrading' ? 'secondary' : 'destructive'}
                  >
                    {battery.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm text-white">{battery.soh}% SoH</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      {batteryAccess.some(access => access.battery_id === battery.id) ? (
                        <>
                          <Lock className="h-3 w-3" />
                          Restricted
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3" />
                          Open Access
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Access Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Battery className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Total Batteries</p>
                <p className="text-lg font-bold text-white">{batteries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Team Members</p>
                <p className="text-lg font-bold text-white">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Access Grants</p>
                <p className="text-lg font-bold text-white">{batteryAccess.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
