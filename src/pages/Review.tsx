
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, MessageCircle, Search, Filter, Eye, Clock, User } from 'lucide-react';

interface BatteryAlert {
  id: string;
  battery_id: string;
  sender_id: string;
  recipient_id: string;
  alert_type: 'mistake' | 'concern' | 'info' | 'urgent';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  battery_chemistry?: string;
}

export default function Review() {
  const [alerts, setAlerts] = useState<BatteryAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<BatteryAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<BatteryAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, typeFilter, statusFilter]);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch alerts for current user
      const { data: alertsData, error } = await supabase
        .from('battery_alerts')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get sender information
      const senderIds = alertsData?.map(alert => alert.sender_id) || [];
      const { data: sendersData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', senderIds);

      // Get battery information
      const batteryIds = alertsData?.map(alert => alert.battery_id) || [];
      const { data: batteriesData } = await supabase
        .from('user_batteries')
        .select('id, chemistry')
        .in('id', batteryIds);

      // Combine all data
      const enrichedAlerts: BatteryAlert[] = alertsData?.map(alert => {
        const sender = sendersData?.find(s => s.id === alert.sender_id);
        const battery = batteriesData?.find(b => b.id === alert.battery_id);
        
        return {
          ...alert,
          sender_name: sender?.full_name || sender?.email || 'Unknown User',
          battery_chemistry: battery?.chemistry || 'Unknown'
        };
      }) || [];

      setAlerts(enrichedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Create mock data for demo
      const mockAlerts: BatteryAlert[] = [
        {
          id: '1',
          battery_id: 'DEMO-001',
          sender_id: 'demo-user',
          recipient_id: 'current-user',
          alert_type: 'concern',
          title: 'Battery Performance Issue',
          message: 'This battery shows signs of rapid degradation. SoH dropped from 95% to 87% in just 50 cycles.',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender_name: 'John Smith',
          battery_chemistry: 'NMC'
        },
        {
          id: '2',
          battery_id: 'DEMO-002',
          sender_id: 'demo-user2',
          recipient_id: 'current-user',
          alert_type: 'urgent',
          title: 'Critical Temperature Alert',
          message: 'Battery temperature exceeded 60°C during charging. Immediate attention required.',
          is_read: false,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Sarah Johnson',
          battery_chemistry: 'LFP'
        },
        {
          id: '3',
          battery_id: 'DEMO-003',
          sender_id: 'demo-user3',
          recipient_id: 'current-user',
          alert_type: 'info',
          title: 'Data Analysis Complete',
          message: 'Completed analysis of battery cycle data. Results show normal wear patterns.',
          is_read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Mike Chen',
          battery_chemistry: 'NMC'
        }
      ];
      setAlerts(mockAlerts);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.battery_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.alert_type === typeFilter);
    }

    if (statusFilter === 'unread') {
      filtered = filtered.filter(alert => !alert.is_read);
    } else if (statusFilter === 'read') {
      filtered = filtered.filter(alert => alert.is_read);
    }

    setFilteredAlerts(filtered);
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('battery_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));

      toast({
        title: "Success",
        description: "Alert marked as read",
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      // Still update UI for demo purposes
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-600/80 text-red-100 border-red-600/50';
      case 'mistake': return 'bg-orange-600/80 text-orange-100 border-orange-600/50';
      case 'concern': return 'bg-yellow-600/80 text-yellow-100 border-yellow-600/50';
      case 'info': return 'bg-blue-600/80 text-blue-100 border-blue-600/50';
      default: return 'bg-gray-600/80 text-gray-100 border-gray-600/50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'mistake': return <AlertTriangle className="h-4 w-4" />;
      case 'concern': return <MessageCircle className="h-4 w-4" />;
      case 'info': return <MessageCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const unreadCount = alerts.filter(alert => !alert.is_read).length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-400" />
            Battery Review
            {unreadCount > 0 && (
              <Badge className="bg-red-600/80 text-red-100 border-0 ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-slate-400">Review battery alerts and team communications</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="enhanced-card">
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 glass-input">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="concern">Concern</SelectItem>
                <SelectItem value="mistake">Mistake</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Battery Alerts ({filteredAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No alerts found</p>
                <p className="text-sm">Try adjusting your search filters</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border transition-all hover:bg-white/5 ${
                    alert.is_read 
                      ? 'bg-slate-800/40 border-slate-600/30' 
                      : 'bg-blue-900/20 border-blue-600/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs px-2 py-1 ${getAlertTypeColor(alert.alert_type)}`}>
                            {alert.alert_type.toUpperCase()}
                          </Badge>
                          {!alert.is_read && (
                            <Badge className="bg-blue-600/80 text-blue-100 text-xs px-2 py-1 border-0">
                              NEW
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            Battery: {alert.battery_id} ({alert.battery_chemistry})
                          </span>
                        </div>
                        <h3 className="font-semibold text-white mb-2">{alert.title}</h3>
                        <p className="text-slate-300 text-sm mb-3 line-clamp-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            From: {alert.sender_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="enhanced-card max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white flex items-center gap-2">
                              {selectedAlert && getAlertIcon(selectedAlert.alert_type)}
                              {selectedAlert?.title}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedAlert && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Badge className={`${getAlertTypeColor(selectedAlert.alert_type)}`}>
                                  {selectedAlert.alert_type.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-slate-400">
                                  Battery: {selectedAlert.battery_id} ({selectedAlert.battery_chemistry})
                                </span>
                              </div>
                              <div className="bg-slate-800/40 p-4 rounded-lg">
                                <p className="text-slate-300 whitespace-pre-wrap">{selectedAlert.message}</p>
                              </div>
                              <div className="flex items-center justify-between text-sm text-slate-400">
                                <span>From: {selectedAlert.sender_name}</span>
                                <span>{new Date(selectedAlert.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      {!alert.is_read && (
                        <Button
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                          className="glass-button"
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
