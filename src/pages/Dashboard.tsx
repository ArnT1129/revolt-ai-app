
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { batteryService } from '@/services/batteryService';
import { DemoService } from '@/services/demoService';
import DashboardStats from '@/components/DashboardStats';
import OptimizedBatteryTable from '@/components/OptimizedBatteryTable';
import BatteryComparison from '@/components/BatteryComparison';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import FileUploader from '@/components/FileUploader';
import { Battery, TrendingUp, AlertTriangle, Clock, BarChart3, Upload, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Battery as BatteryType } from '@/types';

export default function Dashboard() {
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [allBatteries, setAllBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    loadDashboardData();

    // Listen for battery data updates
    const handleBatteryUpdate = () => {
      loadDashboardData();
    };
    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    return () => window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
  }, [user]);
  
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const batteryData = await batteryService.getUserBatteries();
      setBatteries(batteryData);
      
      // Check if user is demo
      let isDemoUser = false;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_demo')
          .eq('id', user.id)
          .single();
        
        isDemoUser = profile?.is_demo || false;
        setIsDemo(isDemoUser);
      }
      
      // Combine real batteries with demo batteries when appropriate
      const combined = DemoService.getCombinedBatteries(batteryData, isDemoUser);
      setAllBatteries(combined);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
      // Fallback to demo data if there's an error
      const demoBatteries = DemoService.getDemoBatteries();
      setAllBatteries(demoBatteries);
    } finally {
      setLoading(false);
    }
  };
  
  // Use allBatteries for all calculations
  const recentBatteries = allBatteries.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()).slice(0, 5);
  const criticalBatteries = allBatteries.filter(b => b.status === 'Critical');
  const degradingBatteries = allBatteries.filter(b => b.status === 'Degrading');
  
  if (loading) {
    return <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/10 rounded"></div>)}
            </div>
            <div className="h-96 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>;
  }
  
  return <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">
              Monitor and analyze your battery fleet performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/upload')} className="glass-button">
              <Upload className="h-4 w-4 mr-2" />
              Upload Data
            </Button>
            <Button onClick={() => navigate('/search')} variant="outline" className="glass-button">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <DashboardStats />

        {/* Quick Actions & Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Uploads */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Uploads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentBatteries.length > 0 ? recentBatteries.map(battery => <div key={battery.id} className="flex items-center justify-between p-2 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <Battery className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{battery.id}</p>
                        <p className="text-xs text-slate-400">{battery.chemistry}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${battery.status === 'Healthy' ? 'bg-green-600/80 text-green-100' : battery.status === 'Degrading' ? 'bg-yellow-600/80 text-yellow-100' : 'bg-red-600/80 text-red-100'}`}>
                      {battery.status}
                    </Badge>
                  </div>) : <p className="text-slate-400 text-sm text-center py-4">No recent uploads</p>}
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalBatteries.length > 0 ? criticalBatteries.slice(0, 3).map(battery => <div key={battery.id} className="flex items-center justify-between p-2 rounded border border-red-500/50 bg-red-900/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{battery.id}</p>
                        <p className="text-xs text-red-300">SoH: {battery.soh.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Badge className="bg-red-600/80 text-red-100 text-xs">
                      Critical
                    </Badge>
                  </div>) : <p className="text-slate-400 text-sm text-center py-4">No critical alerts</p>}
              {criticalBatteries.length > 3 && <Button variant="outline" size="sm" className="w-full glass-button" onClick={() => navigate('/search')}>
                  View All ({criticalBatteries.length})
                </Button>}
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Avg SoH</span>
                  <span className="text-white font-medium">
                    {allBatteries.length > 0 ? (allBatteries.reduce((acc, b) => acc + b.soh, 0) / allBatteries.length).toFixed(1) : '0'}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Degrading</span>
                  <Badge className="bg-yellow-600/80 text-yellow-100 text-xs">
                    {degradingBatteries.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Critical</span>
                  <Badge className="bg-red-600/80 text-red-100 text-xs">
                    {criticalBatteries.length}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full glass-button" onClick={() => navigate('/search')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-button">
            <TabsTrigger value="overview">Fleet</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="comparison">Battery Comparison</TabsTrigger>
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OptimizedBatteryTable />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <BatteryComparison />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Battery Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}
