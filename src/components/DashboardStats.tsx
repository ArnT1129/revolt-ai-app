
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatteryFull, BatteryMedium, AlertTriangle } from "lucide-react";
import { Battery } from "@/types";
import { DashboardStatsService } from "@/services/dashboardStats";
import { batteryService } from "@/services/batteryService";
import { DemoService } from "@/services/demoService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalBatteries: 0,
    averageSoH: 0,
    criticalIssues: 0,
  });
  const [userBatteries, setUserBatteries] = useState<Battery[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const { user } = useAuth();

  const updateStats = async () => {
    try {
      // Get real user batteries (or demo for demo user)
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
      }
      // Calculate stats from batteries
      const dashboardStats = DashboardStatsService.calculateStats(realBatteries);
      setStats({
        totalBatteries: dashboardStats.totalBatteries,
        averageSoH: dashboardStats.averageSoH,
        criticalIssues: dashboardStats.criticalIssues,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      setStats({ totalBatteries: 0, averageSoH: 0, criticalIssues: 0 });
    }
  };

  useEffect(() => {
    updateStats();

    const handleBatteryUpdate = () => {
      updateStats();
    };

    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    
    return () => {
      window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
    };
  }, [user]);

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
