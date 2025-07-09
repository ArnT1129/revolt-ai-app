
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from '@/hooks/use-toast';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Battery,
  Settings,
  Shield,
  Upload,
  Trash2,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_email: string;
  action: string;
  resource_type: 'battery' | 'user' | 'company' | 'settings' | 'access';
  resource_id: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
}

const ACTION_ICONS = {
  'create': Upload,
  'update': Edit,
  'delete': Trash2,
  'access': Shield,
  'login': User,
  'invite': User,
  'settings': Settings,
} as const;

const ACTION_COLORS = {
  'create': 'text-green-400',
  'update': 'text-blue-400',
  'delete': 'text-red-400',
  'access': 'text-purple-400',
  'login': 'text-cyan-400',
  'invite': 'text-yellow-400',
  'settings': 'text-slate-400',
} as const;

export default function CompanyAuditLog() {
  const { currentCompany } = useCompany();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      fetchAuditLogs();
    }
  }, [currentCompany, actionFilter, resourceFilter, dateRange]);

  const fetchAuditLogs = async () => {
    if (!currentCompany) return;

    setLoading(true);
    try {
      // In a real implementation, you'd have an audit_logs table
      // For demonstration, we'll generate sample audit log data
      const sampleLogs: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          user_email: 'john.doe@company.com',
          action: 'create',
          resource_type: 'battery',
          resource_id: 'BATT-001',
          details: 'Uploaded new NMC battery data with 1000 cycles',
          ip_address: '192.168.1.100'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          user_email: 'admin@company.com',
          action: 'invite',
          resource_type: 'user',
          resource_id: 'new.employee@company.com',
          details: 'Invited new team member with employee role',
          ip_address: '192.168.1.101'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          user_email: 'jane.smith@company.com',
          action: 'update',
          resource_type: 'battery',
          resource_id: 'BATT-002',
          details: 'Updated battery notes and status to Critical',
          ip_address: '192.168.1.102'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          user_email: 'admin@company.com',
          action: 'access',
          resource_type: 'access',
          resource_id: 'BATT-003',
          details: 'Granted read access to jane.smith@company.com',
          ip_address: '192.168.1.101'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          user_email: 'john.doe@company.com',
          action: 'delete',
          resource_type: 'battery',
          resource_id: 'BATT-OLD-001',
          details: 'Removed outdated battery record',
          ip_address: '192.168.1.100'
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          user_email: 'admin@company.com',
          action: 'settings',
          resource_type: 'company',
          resource_id: currentCompany.id,
          details: 'Updated company notification settings',
          ip_address: '192.168.1.101'
        }
      ];

      // Apply filters
      let filteredLogs = sampleLogs;

      // Date range filter
      const now = new Date();
      const dateThreshold = new Date();
      switch (dateRange) {
        case '1day':
          dateThreshold.setDate(now.getDate() - 1);
          break;
        case '7days':
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case '30days':
          dateThreshold.setDate(now.getDate() - 30);
          break;
        case '90days':
          dateThreshold.setDate(now.getDate() - 90);
          break;
      }

      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= dateThreshold);

      // Action filter
      if (actionFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
      }

      // Resource filter
      if (resourceFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.resource_type === resourceFilter);
      }

      // Search filter
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
          log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setAuditLogs(filteredLogs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLog = async () => {
    try {
      const csvData = [
        ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address'],
        ...auditLogs.map(log => [
          new Date(log.timestamp).toLocaleString(),
          log.user_email,
          log.action,
          log.resource_type,
          log.resource_id,
          log.details,
          log.ip_address || 'N/A'
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentCompany?.name}_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Audit log exported successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export audit log",
        variant: "destructive"
      });
    }
  };

  const getActionIcon = (action: string) => {
    const IconComponent = ACTION_ICONS[action as keyof typeof ACTION_ICONS] || Activity;
    return IconComponent;
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action as keyof typeof ACTION_COLORS] || 'text-slate-400';
  };

  if (!currentCompany) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Please select a company to view audit logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Company Audit Log
          </h2>
          <p className="text-slate-400">Track all activities and changes in your company</p>
        </div>
        <Button onClick={exportAuditLog} className="glass-button">
          <Download className="h-4 w-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Filters */}
      <Card className="enhanced-card">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="glass-input">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="access">Access</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="invite">Invite</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="battery">Battery</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="access">Access</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="glass-input">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">Last 24 hours</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">
            Recent Activity ({auditLogs.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No audit log entries found</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
                    <div className={`p-2 rounded-lg bg-white/10 ${getActionColor(log.action)}`}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{log.user_email}</p>
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {log.resource_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{log.details}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        <span>Resource: {log.resource_id}</span>
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Upload className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Creates</p>
                <p className="text-lg font-bold text-white">
                  {auditLogs.filter(log => log.action === 'create').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Updates</p>
                <p className="text-lg font-bold text-white">
                  {auditLogs.filter(log => log.action === 'update').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Access Changes</p>
                <p className="text-lg font-bold text-white">
                  {auditLogs.filter(log => log.action === 'access').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-cyan-400" />
              <div>
                <p className="text-sm text-slate-400">User Actions</p>
                <p className="text-lg font-bold text-white">
                  {auditLogs.filter(log => log.resource_type === 'user').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
