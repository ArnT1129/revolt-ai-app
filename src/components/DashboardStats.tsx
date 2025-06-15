
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Battery, TrendingUp, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Battery as BatteryType } from "@/types";
import { DashboardStatistics, DashboardStatsService } from "@/services/dashboardStats";
import { batteryService } from "@/services/batteryService";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        const batteries = await batteryService.getUserBatteries(user.id);
        const calculatedStats = DashboardStatsService.calculateStats(batteries);
        setStats(calculatedStats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Listen for battery data updates
    const handleBatteryUpdate = () => {
      loadStats();
    };

    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    
    return () => {
      window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/50 border-white/10">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-slate-600 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-6">
            <div className="text-center text-slate-400">
              <p>No battery data available</p>
              <p className="text-sm">Upload battery data to see statistics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Batteries",
      value: stats.totalBatteries.toString(),
      icon: Battery,
      subtitle: `${stats.healthyBatteries} healthy, ${stats.degradingBatteries} degrading, ${stats.criticalBatteries} critical`,
    },
    {
      title: "Average SoH",
      value: `${stats.averageSoH}%`,
      icon: Activity,
      subtitle: `${stats.totalCycles.toLocaleString()} total cycles`,
    },
    {
      title: "Average RUL",
      value: `${stats.averageRUL}`,
      icon: TrendingUp,
      subtitle: "remaining cycles",
    },
    {
      title: "Critical Issues",
      value: stats.criticalIssues.toString(),
      icon: AlertTriangle,
      subtitle: "require attention",
      variant: stats.criticalIssues > 0 ? "destructive" : "default",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="bg-card/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.subtitle}
            </p>
            {stat.title === "Critical Issues" && stats.criticalIssues > 0 && (
              <Badge variant="destructive" className="mt-2">
                Attention Required
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
