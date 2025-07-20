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
import BatteryPassportModal from '@/components/BatteryPassportModal';
import { Battery, TrendingUp, AlertTriangle, Clock, BarChart3, Upload, Search, BatteryFull, Eye, Zap, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Battery as BatteryType } from '@/types';

export default function Dashboard() {
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [allBatteries, setAllBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<BatteryType | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
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
      setAllBatteries(batteryData);
      // Check if user is demo
      let isDemoUser = false;
      if (user) {
        try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_demo')
          .eq('id', user.id)
          .single();
        isDemoUser = profile?.is_demo || false;
        setIsDemo(isDemoUser);
        } catch (profileError) {
          console.error('Error checking demo status:', profileError);
          setIsDemo(false);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
      setAllBatteries([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Use allBatteries for all calculations
  const recentBatteries = allBatteries.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()).slice(0, 3);
  const criticalBatteries = allBatteries.filter(b => b.status === 'Critical');
  const degradingBatteries = allBatteries.filter(b => b.status === 'Degrading');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-600/80 text-green-100';
      case 'Degrading': return 'bg-yellow-600/80 text-yellow-100';
      case 'Critical': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-blue-600/80 text-blue-100';
      case 'B': return 'bg-green-600/80 text-green-100';
      case 'C': return 'bg-yellow-600/80 text-yellow-100';
      case 'D': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const handleViewBattery = (battery: BatteryType) => {
    setSelectedBattery(battery);
    setIsPassportOpen(true);
  };

  const handleSaveBattery = async (updatedBattery: BatteryType): Promise<boolean> => {
    // Check if battery can be modified
    const canModify = await batteryService.canModifyBattery(updatedBattery.id);
    if (!canModify) {
      toast({
        title: "Demo Battery",
        description: "Cannot modify demo batteries",
        variant: "destructive",
      });
      return false;
    }

    try {
      const success = await batteryService.updateBattery(updatedBattery);
      if (success) {
        setAllBatteries(prev => prev.map(b => b.id === updatedBattery.id ? updatedBattery : b));
        toast({
          title: "Success",
          description: "Battery updated successfully",
        });
        return true;
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update battery",
        variant: "destructive",
      });
      return false;
    }
  };
  
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
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Battery className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{battery.id}</p>
                        <p className="text-xs text-slate-400">{battery.chemistry}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs flex-shrink-0 ml-2 ${getStatusColor(battery.status)}`}>
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
                             {criticalBatteries.length > 0 ? (
                 <div className="max-h-60 overflow-y-auto pr-2">
                   {criticalBatteries.map(battery => <div key={battery.id} className="flex items-center justify-between p-2 rounded border border-red-500/50 bg-red-900/20 mb-2">
                     <div className="flex items-center gap-3 min-w-0 flex-1">
                       <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                       <div className="min-w-0 flex-1">
                         <p className="text-sm font-medium text-white truncate">{battery.name || battery.id}</p>
                        <p className="text-xs text-red-300">SoH: {battery.soh.toFixed(1)}%</p>
                      </div>
                    </div>
                     <Badge className="bg-red-600/80 text-red-100 text-xs flex-shrink-0 ml-2">
                      Critical
                    </Badge>
                   </div>)}
                 </div>
                             ) : <p className="text-slate-400 text-sm text-center py-4">No critical alerts</p>}
              {criticalBatteries.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full glass-button mt-3" 
                  onClick={() => navigate('/search')}
                  title="View all critical batteries in search page"
                >
                  View All ({criticalBatteries.length})
                </Button>
              )}
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
              <Button variant="outline" size="sm" className="w-full glass-button" onClick={() => navigate('/analytics')} title="Open advanced analytics dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-button">
            <TabsTrigger value="overview">Battery Overview</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="comparison">Battery Comparison</TabsTrigger>
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Battery Overview Grid - Updated to match SearchPage layout */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BatteryFull className="h-5 w-5" />
                  Battery Passports ({allBatteries.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allBatteries.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {allBatteries.map((battery) => (
                      <Card key={battery.id} className="enhanced-card hover:border-blue-500/50 min-w-0">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-white text-lg truncate flex-1">{battery.name || battery.id}</CardTitle>
                            <Badge className={`${getStatusColor(battery.status)} flex-shrink-0`}>
                              {battery.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className={`${getGradeColor(battery.grade)} flex-shrink-0`}>
                              Grade {battery.grade}
                            </Badge>
                            <Badge variant="outline" className="text-slate-300 flex-shrink-0">
                              {battery.chemistry}
                            </Badge>
                            {battery.id.startsWith('DEMO-') && (
                              <Badge variant="outline" className="text-amber-300 border-amber-500/50 flex-shrink-0">
                                Demo
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <Battery className="h-4 w-4 text-blue-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-400">SoH</p>
                                <p className="text-white font-medium truncate">{battery.soh.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-400">RUL</p>
                                <p className="text-white font-medium truncate">{battery.rul.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <Zap className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-400">Cycles</p>
                                <p className="text-white font-medium truncate">{battery.cycles.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <Calendar className="h-4 w-4 text-purple-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-400">Uploaded</p>
                                <p className="text-white font-medium text-xs truncate">
                                  {new Date(battery.uploadDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Health Status</span>
                              <span className="text-white">{battery.soh.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  battery.soh >= 90 ? 'bg-green-500' :
                                  battery.soh >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.max(0, Math.min(100, battery.soh))}%` }}
                              />
                            </div>
                          </div>

                          {/* Issues */}
                          {battery.issues && battery.issues.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                              <span className="text-yellow-300 text-sm">
                                {battery.issues.length} issue{battery.issues.length !== 1 ? 's' : ''} detected
                              </span>
                            </div>
                          )}

                          {/* Actions */}
                          <Button
                            onClick={() => handleViewBattery(battery)}
                            className="w-full glass-button"
                            title="View detailed battery information and passport"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BatteryFull className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No batteries available</p>
                    <p className="text-slate-500 text-sm">Upload battery data to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
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

        {/* Battery Passport Modal */}
        {selectedBattery && (
          <BatteryPassportModal
            battery={selectedBattery}
            isOpen={isPassportOpen}
            onClose={() => {
              setIsPassportOpen(false);
              setSelectedBattery(null);
            }}
            onSave={handleSaveBattery}
          />
        )}
      </div>
    </div>;
}
