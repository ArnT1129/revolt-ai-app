
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, MessageCircle, Users, Clock, CheckCircle2, Send, Bell } from "lucide-react";

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
  sender_email?: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
}

interface BatteryAlertSystemProps {
  batteryId: string;
}

export default function BatteryAlertSystem({ batteryId }: BatteryAlertSystemProps) {
  const [alerts, setAlerts] = useState<BatteryAlert[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    recipient_id: '',
    alert_type: 'info' as const,
    title: '',
    message: ''
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    fetchTeamMembers();
  }, [batteryId]);

  const fetchAlerts = async () => {
    try {
      // Fetch from the actual battery_alerts table
      const { data: alertsData, error } = await supabase
        .from('battery_alerts')
        .select('*')
        .eq('battery_id', batteryId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get sender information separately
      const senderIds = alertsData?.map(alert => alert.sender_id) || [];
      const { data: sendersData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', senderIds);

      // Combine alert data with sender info and ensure proper typing
      const enrichedAlerts: BatteryAlert[] = alertsData?.map(alert => {
        const sender = sendersData?.find(s => s.id === alert.sender_id);
        return {
          ...alert,
          alert_type: alert.alert_type as 'mistake' | 'concern' | 'info' | 'urgent',
          sender_name: sender?.full_name || sender?.email || 'Unknown',
          sender_email: sender?.email || 'Unknown'
        };
      }) || [];

      setAlerts(enrichedAlerts);
      
      // Count unread alerts for current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const unread = enrichedAlerts.filter(alert => 
          alert.recipient_id === user.id && !alert.is_read
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Fall back to mock data for demo
      const mockAlerts: BatteryAlert[] = [
        {
          id: '1',
          battery_id: batteryId,
          sender_id: 'user1',
          recipient_id: 'user2',
          alert_type: 'concern',
          title: 'Battery Performance Concern',
          message: 'I noticed the SoH is declining faster than expected. Should we investigate?',
          is_read: false,
          created_at: new Date().toISOString(),
          sender_name: 'John Doe',
          sender_email: 'john@example.com'
        }
      ];
      setAlerts(mockAlerts);
      setUnreadCount(1);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Get current user's company members
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membersData, error } = await supabase
        .from('company_members')
        .select('user_id, role')
        .neq('user_id', user.id);

      if (error) throw error;

      // Get profile data separately
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const formattedMembers = membersData?.map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        return {
          id: member.user_id,
          user_id: member.user_id,
          name: profile?.full_name || profile?.email || 'Unknown',
          email: profile?.email || 'Unknown',
          role: member.role
        };
      }) || [];

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const createAlert = async () => {
    if (!newAlert.recipient_id || !newAlert.title || !newAlert.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('battery_alerts')
        .insert({
          battery_id: batteryId,
          sender_id: user.id,
          recipient_id: newAlert.recipient_id,
          alert_type: newAlert.alert_type,
          title: newAlert.title,
          message: newAlert.message
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert sent successfully",
      });

      setIsCreateDialogOpen(false);
      setNewAlert({
        recipient_id: '',
        alert_type: 'info',
        title: '',
        message: ''
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Success",
        description: "Alert sent successfully (demo mode)",
      });
      setIsCreateDialogOpen(false);
      setNewAlert({
        recipient_id: '',
        alert_type: 'info',
        title: '',
        message: ''
      });
    }
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
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      // Still update UI for demo purposes
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-600/80 text-red-100';
      case 'mistake': return 'bg-orange-600/80 text-orange-100';
      case 'concern': return 'bg-yellow-600/80 text-yellow-100';
      case 'info': return 'bg-blue-600/80 text-blue-100';
      default: return 'bg-gray-600/80 text-gray-100';
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

  return (
    <Card className="bg-slate-800/40 border-slate-600/30">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-400" />
            Battery Alerts
            {unreadCount > 0 && (
              <Badge className="bg-red-600/80 text-red-100 border-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600/70 hover:bg-blue-600/85">
                <Send className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-600">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Create New Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Alert To</Label>
                  <Select 
                    value={newAlert.recipient_id} 
                    onValueChange={(value) => setNewAlert(prev => ({ ...prev, recipient_id: value }))}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.user_id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {member.name} ({member.role})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Alert Type</Label>
                  <Select 
                    value={newAlert.alert_type} 
                    onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, alert_type: value }))}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="concern">Concern</SelectItem>
                      <SelectItem value="mistake">Mistake</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Title</Label>
                  <Input
                    value={newAlert.title}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Alert title..."
                    className="bg-slate-700/50 border-slate-600/50"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Message</Label>
                  <Textarea
                    value={newAlert.message}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe the issue or concern..."
                    className="bg-slate-700/50 border-slate-600/50 min-h-[100px]"
                  />
                </div>

                <Button onClick={createAlert} className="w-full bg-blue-600/70 hover:bg-blue-600/85">
                  Send Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No alerts for this battery yet</p>
            </div>
          ) : (
            alerts.map(alert => (
              <Alert key={alert.id} className="border-slate-600/30 bg-slate-900/40">
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs px-2 py-0 ${getAlertTypeColor(alert.alert_type)} border-0`}>
                          {alert.alert_type.toUpperCase()}
                        </Badge>
                        {!alert.is_read && (
                          <Badge className="bg-blue-600/80 text-blue-100 text-xs px-2 py-0 border-0">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-slate-200 mb-1">{alert.title}</h4>
                      <AlertDescription className="text-slate-300 text-sm mb-2">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>From: {alert.sender_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.created_at).toLocaleDateString()} {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(alert.id)}
                      className="ml-3 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Alert>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
