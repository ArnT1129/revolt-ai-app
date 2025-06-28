
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatteryFull, BatteryMedium, AlertTriangle, TrendingUp } from "lucide-react";
import { Battery } from "@/types";
import { DashboardStatsService } from "@/services/dashboardStats";
import { batteryService } from "@/services/batteryService";

// Mock batteries clearly labeled for demonstration
const DEMO_MOCK_BATTERIES: Battery[] = [
  {
    id: "MOCK-NMC-001",
    grade: "A",
    status: "Healthy",
    soh: 98.5,
    rul: 2100,
    cycles: 200,
    chemistry: "NMC",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 50, soh: 99.5 },
      { cycle: 100, soh: 99.0 },
      { cycle: 150, soh: 98.8 },
      { cycle: 200, soh: 98.5 }
    ],
    issues: [],
    notes: "Mock Battery - High-performance NMC demonstrating excellent health"
  },
  {
    id: "MOCK-LFP-002",
    grade: "B",
    status: "Degrading",
    soh: 89.2,
    rul: 650,
    cycles: 1500,
    chemistry: "LFP",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 500, soh: 96.0 },
      { cycle: 1000, soh: 92.5 },
      { cycle: 1500, soh: 89.2 }
    ],
    issues: [
      {
        id: "mock-issue-1",
        category: "Performance",
        title: "Capacity Fade Detected",
        description: "Mock issue showing gradual capacity degradation",
        severity: "Warning",
        cause: "Simulated aging process",
        recommendation: "Monitor performance trends",
        solution: "Consider replacement planning",
        affectedMetrics: ["soh", "rul"]
      }
    ],
    notes: "Mock Battery - LFP showing typical degradation patterns"
  },
  {
    id: "MOCK-NMC-003",
    grade: "C",
    status: "Critical",
    soh: 78.1,
    rul: 150,
    cycles: 2800,
    chemistry: "NMC",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 1000, soh: 92.0 },
      { cycle: 2000, soh: 84.5 },
      { cycle: 2800, soh: 78.1 }
    ],
    issues: [
      {
        id: "mock-issue-2",
        category: "Safety",
        title: "Critical SoH Threshold",
        description: "Mock critical battery requiring immediate attention",
        severity: "Critical",
        cause: "Extensive cycling simulation",
        recommendation: "Replace immediately",
        solution: "Battery replacement required",
        affectedMetrics: ["soh", "rul", "cycles"]
      }
    ],
    notes: "Mock Battery - Critical condition demonstration"
  }
];

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalBatteries: 0,
    averageSoH: 0,
    criticalIssues: 0,
    growthRate: 12.5,
  });
  const [userBatteries, setUserBatteries] = useState<Battery[]>([]);

  const updateStats = async () => {
    try {
      // Get real user batteries
      const realBatteries = await batteryService.getUserBatteries();
      setUserBatteries(realBatteries);
      
      // Combine real batteries with mock batteries for display
      const allBatteries = [...realBatteries, ...DEMO_MOCK_BATTERIES];
      
      const dashboardStats = DashboardStatsService.calculateStats(allBatteries);
      
      setStats({
        totalBatteries: dashboardStats.totalBatteries,
        averageSoH: dashboardStats.averageSoH,
        criticalIssues: dashboardStats.criticalIssues,
        growthRate: 12.5,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      // Fallback to just mock data if there's an error
      const dashboardStats = DashboardStatsService.calculateStats(DEMO_MOCK_BATTERIES);
      setStats({
        totalBatteries: dashboardStats.totalBatteries,
        averageSoH: dashboardStats.averageSoH,
        criticalIssues: dashboardStats.criticalIssues,
        growthRate: 12.5,
      });
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
  }, []);

  const statsData = useMemo(() => [
    { 
      name: "Total Batteries Analyzed", 
      value: `${stats.totalBatteries} (${userBatteries.length} real + ${DEMO_MOCK_BATTERIES.length} demo)`, 
      icon: BatteryFull,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    { 
      name: "Avg. State of Health (SoH)", 
      value: `${stats.averageSoH.toFixed(1)}%`, 
      icon: BatteryMedium,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10"
    },
    { 
      name: "Critical Issues Flagged", 
      value: stats.criticalIssues.toString(), 
      icon: AlertTriangle,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10"
    },
    { 
      name: "Fleet Growth Rate", 
      value: `${stats.growthRate}%`, 
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10"
    },
  ], [stats, userBatteries.length]);

  return (
    <div className="space-y-4">
      {/* Mock Data Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-amber-300 text-sm font-medium">
            Demo Mode: Statistics include {DEMO_MOCK_BATTERIES.length} mock batteries for demonstration purposes
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
