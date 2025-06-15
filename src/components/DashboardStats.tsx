
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatteryFull, BatteryMedium, AlertTriangle, TrendingUp } from "lucide-react";
import { Battery } from "@/types";
import { DashboardStatsService } from "@/services/dashboardStats";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalBatteries: 0,
    averageSoH: 0,
    criticalIssues: 0,
  });

  const updateStats = () => {
    // Get mock data batteries
    const mockData: Battery[] = [
      { id: "NMC-001A", grade: "A", status: "Healthy", soh: 99.1, rul: 1850, cycles: 150, chemistry: "NMC", uploadDate: "2025-06-14", sohHistory: [] },
      { id: "LFP-002B", grade: "B", status: "Degrading", soh: 92.5, rul: 820, cycles: 1180, chemistry: "LFP", uploadDate: "2025-06-12", sohHistory: [] },
      { id: "NMC-003C", grade: "C", status: "Critical", soh: 84.3, rul: 210, cycles: 2400, chemistry: "NMC", uploadDate: "2025-06-10", sohHistory: [] },
      { id: "LFP-004A", grade: "A", status: "Healthy", soh: 99.8, rul: 2800, cycles: 50, chemistry: "LFP", uploadDate: "2025-06-15", sohHistory: [] },
    ];

    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const allBatteries = [...mockData];
    
    uploadedBatteries.forEach((uploadedBattery: Battery) => {
      const existingIndex = allBatteries.findIndex(b => b.id === uploadedBattery.id);
      if (existingIndex >= 0) {
        allBatteries[existingIndex] = uploadedBattery;
      } else {
        allBatteries.push(uploadedBattery);
      }
    });

    const dashboardStats = DashboardStatsService.calculateStats(allBatteries);
    
    setStats({
      totalBatteries: dashboardStats.totalBatteries,
      averageSoH: dashboardStats.averageSoH,
      criticalIssues: dashboardStats.criticalIssues,
    });
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

  const statsData = [
    { 
      name: "Total Batteries Analyzed", 
      value: stats.totalBatteries.toString(), 
      icon: BatteryFull,
      color: "text-blue-400"
    },
    { 
      name: "Avg. State of Health (SoH)", 
      value: `${stats.averageSoH.toFixed(1)}%`, 
      icon: BatteryMedium,
      color: "text-cyan-400"
    },
    { 
      name: "Critical Issues Flagged", 
      value: stats.criticalIssues.toString(), 
      icon: AlertTriangle,
      color: "text-indigo-400"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statsData.map((stat, index) => (
        <Card key={stat.name} className="enhanced-card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{stat.name}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
