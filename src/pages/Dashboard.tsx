
import DashboardStats from "@/components/DashboardStats";
import BatteryTable from "@/components/BatteryTable";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import BatteryComparison from "@/components/BatteryComparison";
import DataExporter from "@/components/DataExporter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, GitCompare, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Battery } from "@/types";

export default function Dashboard() {
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);

  const updateBatteries = () => {
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

    setAllBatteries(combined);
  };

  useEffect(() => {
    updateBatteries();

    const handleBatteryUpdate = () => {
      updateBatteries();
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
        <Tabs defaultValue="fleet" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/20 border border-white/10">
            <TabsTrigger value="fleet" className="flex items-center gap-2">
              Fleet
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
          </TabsList>

          <TabsContent value="fleet">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Battery Fleet Overview</h2>
              <BatteryTable />
            </div>
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
        </Tabs>
      </div>
    </main>
  );
}
