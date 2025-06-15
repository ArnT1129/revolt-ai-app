
import DashboardStats from "@/components/DashboardStats";
import BatteryTable from "@/components/BatteryTable";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import BatteryComparison from "@/components/BatteryComparison";
import DataExporter from "@/components/DataExporter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, TrendingUp, BarChart3, GitCompare, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Battery } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [recentUploads, setRecentUploads] = useState<Battery[]>([]);
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);

  const updateRecentUploads = () => {
    // Mock data
    const mockData: Battery[] = [
      { id: "NMC-001A", grade: "A", status: "Healthy", soh: 99.1, rul: 1850, cycles: 150, chemistry: "NMC", uploadDate: "2025-06-14", sohHistory: [] },
      { id: "LFP-002B", grade: "B", status: "Degrading", soh: 92.5, rul: 820, cycles: 1180, chemistry: "LFP", uploadDate: "2025-06-12", sohHistory: [] },
      { id: "NMC-003C", grade: "C", status: "Critical", soh: 84.3, rul: 210, cycles: 2400, chemistry: "NMC", uploadDate: "2025-06-10", sohHistory: [] },
      { id: "LFP-004A", grade: "A", status: "Healthy", soh: 99.8, rul: 2800, cycles: 50, chemistry: "LFP", uploadDate: "2025-06-15", sohHistory: [] },
    ];

    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const combined = [...mockData];
    
    uploadedBatteries.forEach((uploadedBattery: Battery) => {
      const existingIndex = combined.findIndex(b => b.id === uploadedBattery.id);
      if (existingIndex >= 0) {
        combined[existingIndex] = uploadedBattery;
      } else {
        combined.push(uploadedBattery);
      }
    });

    const recent = combined
      .sort((a: Battery, b: Battery) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 3);
    
    setRecentUploads(recent);
    setAllBatteries(combined);
  };

  useEffect(() => {
    updateRecentUploads();

    const handleBatteryUpdate = () => {
      updateRecentUploads();
    };

    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    
    return () => {
      window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
    };
  }, []);

  return (
    <main className="flex-1 p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ReVolt Dashboard
          </h1>
          <p className="text-muted-foreground">Universal Battery Intelligence Platform - Advanced Analytics & Diagnostics</p>
        </div>
        <Link to="/upload">
          <Button className="glass-button border-blue-500/40 hover:border-blue-400">
            <Upload className="mr-2 h-4 w-4" />
            Upload Data
          </Button>
        </Link>
      </div>
      
      <DashboardStats />
      
      <div className="mt-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-black/20 border border-white/10">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="fleet" className="flex items-center gap-2">
              Fleet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {recentUploads.length > 0 && (
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    Recently Analyzed Batteries
                  </CardTitle>
                  <CardDescription>
                    Latest batteries processed with advanced diagnostics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentUploads.map((battery) => (
                      <div key={battery.id} className="p-4 border border-white/10 rounded-lg bg-black/20 backdrop-blur-sm hover:border-blue-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{battery.id}</h4>
                          <span className="text-sm text-muted-foreground">{battery.uploadDate}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300">SoH: <span className="font-medium text-blue-400">{battery.soh.toFixed(1)}%</span></p>
                          <p className="text-slate-300">Grade: <span className="font-medium text-cyan-400">Grade {battery.grade}</span></p>
                          <p className="text-slate-300">Cycles: <span className="font-medium text-indigo-400">{battery.cycles}</span></p>
                          {battery.issues && (
                            <p className="text-slate-300">Issues: <span className="font-medium text-red-400">{battery.issues.length}</span></p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AdvancedAnalytics batteries={allBatteries} />
          </TabsContent>

          <TabsContent value="comparison">
            <BatteryComparison batteries={allBatteries} />
          </TabsContent>

          <TabsContent value="export">
            <DataExporter batteries={allBatteries} />
          </TabsContent>

          <TabsContent value="fleet">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Battery Fleet Overview</h2>
              <BatteryTable />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
