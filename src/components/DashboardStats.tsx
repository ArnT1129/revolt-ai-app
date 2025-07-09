
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatteryFull, BatteryMedium, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Battery } from "@/types";
import { DashboardStatsService } from "@/services/dashboardStats";
import { batteryService } from "@/services/batteryService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalBatteries: 0,
    averageSoH: 0,
    criticalIssues: 0,
  });
  const [userBatteries, setUserBatteries] = useState<Battery[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [showDemoBatteries, setShowDemoBatteries] = useState(false);
  const [demoBatteriesAdded, setDemoBatteriesAdded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const updateStats = async () => {
    try {
      // Get real user batteries
      const realBatteries = await batteryService.getUserBatteries();
      setUserBatteries(realBatteries);
      
      // Check if user is demo
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_demo')
          .eq('id', user.id)
          .single();
        
        const isDemoUser = profile?.is_demo || false;
        setIsDemo(isDemoUser);
        
        // Auto-add demo batteries for demo users if they don't have any batteries
        if (isDemoUser && realBatteries.length === 0 && !demoBatteriesAdded) {
          await addDemoBatteries();
          return; // Exit early as addDemoBatteries will trigger another updateStats
        }
      }
      
      // Show demo batteries option if user has no batteries and is not demo
      setShowDemoBatteries(!isDemo && realBatteries.length === 0);
      
      // Calculate stats from real batteries only
      const dashboardStats = DashboardStatsService.calculateStats(realBatteries);
      
      setStats({
        totalBatteries: dashboardStats.totalBatteries,
        averageSoH: dashboardStats.averageSoH,
        criticalIssues: dashboardStats.criticalIssues,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      // Set default values for empty state
      setStats({
        totalBatteries: 0,
        averageSoH: 0,
        criticalIssues: 0,
      });
    }
  };

  const addDemoBatteries = async () => {
    try {
      setDemoBatteriesAdded(true);
      
      const demoBatteries: Battery[] = [
        {
          id: 'DEMO-HEALTHY-001',
          grade: 'A',
          status: 'Healthy',
          soh: 95.8,
          rul: 1800,
          cycles: 350,
          chemistry: 'NMC',
          uploadDate: new Date().toISOString().split('T')[0],
          sohHistory: [
            { cycle: 0, soh: 100 },
            { cycle: 100, soh: 98.5 },
            { cycle: 200, soh: 97.2 },
            { cycle: 350, soh: 95.8 }
          ],
          issues: [],
          notes: 'Demo Battery - Excellent performance, recommended for high-demand applications'
        },
        {
          id: 'DEMO-DEGRADING-002',
          grade: 'B',
          status: 'Degrading',
          soh: 82.3,
          rul: 450,
          cycles: 1200,
          chemistry: 'LFP',
          uploadDate: new Date().toISOString().split('T')[0],
          sohHistory: [
            { cycle: 0, soh: 100 },
            { cycle: 400, soh: 92.0 },
            { cycle: 800, soh: 87.5 },
            { cycle: 1200, soh: 82.3 }
          ],
          issues: [
            {
              id: 'demo-issue-1',
              category: 'Performance',
              title: 'Gradual Capacity Fade',
              description: 'Battery showing expected degradation patterns',
              severity: 'Warning',
              cause: 'Normal aging process',
              recommendation: 'Monitor closely and plan replacement',
              solution: 'Continue monitoring, replace when SoH drops below 80%',
              affectedMetrics: ['soh', 'rul']
            }
          ],
          notes: 'Demo Battery - Showing typical LFP degradation, still suitable for stationary applications'
        },
        {
          id: 'DEMO-CRITICAL-003',
          grade: 'D',
          status: 'Critical',
          soh: 68.9,
          rul: 75,
          cycles: 2500,
          chemistry: 'NMC',
          uploadDate: new Date().toISOString().split('T')[0],
          sohHistory: [
            { cycle: 0, soh: 100 },
            { cycle: 800, soh: 88.0 },
            { cycle: 1600, soh: 78.5 },
            { cycle: 2500, soh: 68.9 }
          ],
          issues: [
            {
              id: 'demo-issue-2',
              category: 'Safety',
              title: 'Critical SoH Threshold Exceeded',
              description: 'Battery has dropped below safe operating threshold',
              severity: 'Critical',
              cause: 'Extensive cycling and aging',
              recommendation: 'Immediate replacement required',
              solution: 'Remove from service and dispose safely',
              affectedMetrics: ['soh', 'rul', 'cycles']
            }
          ],
          notes: 'Demo Battery - Critical condition, requires immediate attention and replacement'
        }
      ];

      // Add demo batteries to the service
      for (const battery of demoBatteries) {
        await batteryService.addBattery(battery);
      }

      // Refresh the dashboard immediately
      await updateStats();
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
      setShowDemoBatteries(false);

      toast({
        title: "Demo Batteries Added",
        description: "3 demo batteries have been added to help you explore the app's features.",
      });

    } catch (error) {
      console.error('Error adding demo batteries:', error);
      setDemoBatteriesAdded(false);
      toast({
        title: "Error",
        description: "Failed to add demo batteries. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    updateStats();

    const handleBatteryUpdate = () => {
      console.log('Battery data updated, refreshing dashboard stats...');
      updateStats();
    };

    // Listen for various update events
    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    window.addEventListener('storage', handleBatteryUpdate);
    window.addEventListener('focus', handleBatteryUpdate);

    return () => {
      window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
      window.removeEventListener('storage', handleBatteryUpdate);
      window.removeEventListener('focus', handleBatteryUpdate);
    };
  }, [user, demoBatteriesAdded]);

  const statsData = useMemo(() => [
    { 
      name: "Total Batteries", 
      value: stats.totalBatteries.toString(), 
      icon: BatteryFull,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    { 
      name: "Avg. State of Health", 
      value: stats.totalBatteries > 0 ? `${stats.averageSoH.toFixed(1)}%` : "N/A", 
      icon: BatteryMedium,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10"
    },
    { 
      name: "Critical Issues", 
      value: stats.totalBatteries > 0 ? stats.criticalIssues.toString() : "N/A", 
      icon: AlertTriangle,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10"
    },
  ], [stats]);

  return (
    <div className="space-y-4">
      {/* Demo Mode Notice - Only show for demo users */}
      {isDemo && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">
              Demo Mode: You're using a demo account with sample data
            </span>
          </div>
        </div>
      )}

      {/* Demo Batteries CTA - Show when user has no batteries and not demo user */}
      {showDemoBatteries && !isDemo && (
        <Card className="enhanced-card border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Try Demo Batteries
                </h3>
                <p className="text-slate-300 text-sm">
                  Add 3 sample batteries (Healthy, Degrading, Critical) to explore all app features
                </p>
              </div>
              <Button 
                onClick={addDemoBatteries}
                className="glass-button border-green-500/40 hover:border-green-400"
                disabled={demoBatteriesAdded}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Demo Batteries
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        {statsData.map((stat, index) => (
          <Card key={stat.name} className="enhanced-card animate-fade-in hover:scale-105 transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">{stat.name}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
