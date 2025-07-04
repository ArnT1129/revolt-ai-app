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
  CheckCircle,
  Shield,
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

      // Fetch alerts from database
      const { data: alertsData, error } = await supabase
        .from('battery_alerts')
        .select(`
          *,
          sender:profiles!battery_alerts_sender_id_fkey(full_name),
          battery:batteries(*)
        `)
        .eq('recipient_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        // Set empty alerts array if there's an error
        setAlerts([]);
      } else {
        // Transform the data to match our interface
        const transformedAlerts = alertsData?.map(alert => ({
          id: alert.id,
          battery_id: alert.battery_id,
          sender_id: alert.sender_id,
          recipient_id: alert.recipient_id,
          alert_type: alert.alert_type,
          title: alert.title,
          message: alert.message,
          is_read: alert.is_read,
          created_at: alert.created_at,
          sender_name: alert.sender?.full_name || 'Unknown User',
          battery: alert.battery
        })) || [];

        setAlerts(transformedAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts and batteries:', error);
      setAlerts([]);
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
    try {
      const { error } = await supabase
        .from('battery_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) {
        throw error;
      }

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark alert as read",
        variant: "destructive",
      });
    }
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

  // Show "No review needed" message if there are no alerts at all
  if (alerts.length === 0) {
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
        </div>

        <Card className="bg-slate-800/40 border-slate-600/30">
          <CardContent className="text-center py-16">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <Shield className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-200 mb-2">No Review Needed</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Great news! All your battery passports are in good standing. No alerts or concerns have been reported at this time.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Shield className="h-4 w-4" />
              <span>Your battery data is secure and verified</span>
            </div>
          </CardContent>
        </Card>
      </main>
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
              {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
        <Button
          variant={filterType === 'mistake' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setFilterType('mistake')}
          className="glass-button"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Mistakes
        </Button>
        <Button
          variant={filterType === 'info' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setFilterType('info')}
          className="glass-button"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Info
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-slate-800/40 border-slate-600/30">
            <CardContent className="text-center py-12">
              <Filter className="h-16 w-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-xl font-medium text-slate-300 mb-2">
                No {filterType === 'all' ? '' : filterType} alerts found
              </h3>
              <p className="text-slate-500">
                {filterType === 'all' 
                  ? "No alerts match your current filters." 
                  : `No ${filterType} alerts found. Try adjusting your filters.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map(alert => (
            <Card key={alert.id} className={`bg-slate-800/40 border-slate-600/30 transition-all duration-200 hover:bg-slate-800/60 ${!alert.is_read ? 'ring-1 ring-blue-500/30' : ''}`}>
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
                          <span>SoH: {alert.battery.soh?.toFixed(1) || 'N/A'}%</span>
                          <span>Grade: {alert.battery.grade || 'N/A'}</span>
                          <span>Status: {alert.battery.status || 'N/A'}</span>
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
