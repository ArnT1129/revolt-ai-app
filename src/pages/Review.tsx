
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  AlertTriangle, 
  Clock, 
  Battery, 
  Users, 
  Search,
  Filter
} from "lucide-react";
import { Battery as BatteryType } from "@/types";
import { batteryService } from "@/services/batteryService";
import BatteryPassportModal from "@/components/BatteryPassportModal";

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
  sender_name?: string;
  battery?: BatteryType;
}

export default function Review() {
  const [alerts, setAlerts] = useState<BatteryAlert[]>([]);
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [selectedBattery, setSelectedBattery] = useState<BatteryType | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchAlertsAndBatteries();
  }, []);

  const fetchAlertsAndBatteries = async () => {
    try {
      setLoading(true);
      
      // Fetch user batteries
      const userBatteries = await batteryService.getUserBatteries();
      setBatteries(userBatteries);

      // Mock alerts with battery associations for now
      const mockAlerts: BatteryAlert[] = [
        {
          id: '1',
          battery_id: userBatteries[0]?.id || 'DEMO-NMC-001',
          sender_id: 'user1',
          recipient_id: 'current-user',
          alert_type: 'concern',
          title: 'Battery Performance Concern',
          message: 'SoH declining faster than expected for this NMC battery. Recommend investigation.',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender_name: 'John Doe',
          battery: userBatteries[0]
        },
        {
          id: '2',
          battery_id: userBatteries[1]?.id || 'DEMO-LFP-002',
          sender_id: 'user2',
          recipient_id: 'current-user',
          alert_type: 'mistake',
          title: 'Data Entry Error',
          message: 'Found incorrect cycle count in the passport. Should be verified.',
          is_read: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Jane Smith',
          battery: userBatteries[1]
        },
        {
          id: '3',
          battery_id: userBatteries[2]?.id || 'DEMO-NMC-003',
          sender_id: 'user3',
          recipient_id: 'current-user',
          alert_type: 'urgent',
          title: 'Critical Battery Status',
          message: 'This battery has reached critical SoH levels and needs immediate attention.',
          is_read: true,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          sender_name: 'Mike Johnson',
          battery: userBatteries[2]
        }
      ];

      // Associate batteries with alerts
      const alertsWithBatteries = mockAlerts.map(alert => ({
        ...alert,
        battery: userBatteries.find(b => b.id === alert.battery_id) || userBatteries[0]
      }));

      setAlerts(alertsWithBatteries);
    } catch (error) {
      console.error('Error fetching alerts and batteries:', error);
      toast({
        title: "Error",
        description: "Failed to load review data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, is_read: true } : alert
    ));
  };

  const openBatteryPassport = (battery: BatteryType) => {
    setSelectedBattery(battery);
    setIsPassportOpen(true);
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-600/80 text-red-100 border-red-600/30';
      case 'mistake': return 'bg-orange-600/80 text-orange-100 border-orange-600/30';
      case 'concern': return 'bg-yellow-600/80 text-yellow-100 border-yellow-600/30';
      case 'info': return 'bg-blue-600/80 text-blue-100 border-blue-600/30';
      default: return 'bg-gray-600/80 text-gray-100 border-gray-600/30';
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

  const filteredAlerts = alerts.filter(alert => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !alert.is_read;
    return alert.alert_type === filterType;
  });

  const unreadCount = alerts.filter(alert => !alert.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Battery Review Center
          </h1>
          <p className="text-muted-foreground text-lg">
            Review alerts and concerns about battery passports
          </p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Badge className="bg-red-600/80 text-red-100 border-0">
              {unreadCount} unread alerts
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filterType === 'all' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setFilterType('all')}
          className="glass-button"
        >
          All Alerts ({alerts.length})
        </Button>
        <Button
          variant={filterType === 'unread' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setFilterType('unread')}
          className="glass-button"
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filterType === 'urgent' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setFilterType('urgent')}
          className="glass-button"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Urgent
        </Button>
        <Button
          variant={filterType === 'concern' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setFilterType('concern')}
          className="glass-button"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Concerns
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-slate-800/40 border-slate-600/30">
            <CardContent className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-xl font-medium text-slate-300 mb-2">No alerts found</h3>
              <p className="text-slate-500">
                {filterType === 'all' 
                  ? "No alerts have been received yet." 
                  : `No ${filterType} alerts found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map(alert => (
            <Card key={alert.id} className={`bg-slate-800/40 border-slate-600/30 ${!alert.is_read ? 'ring-1 ring-blue-500/30' : ''}`}>
              <CardHeader>
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
                      </div>
                      <h3 className="text-lg font-semibold text-slate-200 mb-1">
                        {alert.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          From: {alert.sender_name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.created_at).toLocaleDateString()} at {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!alert.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(alert.id)}
                        className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="border-slate-600/30 bg-slate-900/40 mb-4">
                  <AlertDescription className="text-slate-300">
                    {alert.message}
                  </AlertDescription>
                </Alert>

                {alert.battery && (
                  <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-slate-600/30">
                    <div className="flex items-center gap-3">
                      <Battery className="h-5 w-5 text-blue-400" />
                      <div>
                        <h4 className="font-medium text-slate-200">Battery {alert.battery.id}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>SoH: {alert.battery.soh.toFixed(1)}%</span>
                          <span>Grade: {alert.battery.grade}</span>
                          <span>Status: {alert.battery.status}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openBatteryPassport(alert.battery!)}
                      className="bg-blue-600/70 hover:bg-blue-600/85"
                    >
                      View Passport
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Battery Passport Modal */}
      {selectedBattery && (
        <BatteryPassportModal
          battery={selectedBattery}
          isOpen={isPassportOpen}
          onClose={() => setIsPassportOpen(false)}
          onSave={async () => {}}
        />
      )}
    </main>
  );
}
