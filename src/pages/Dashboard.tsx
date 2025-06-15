
import DashboardStats from "@/components/DashboardStats";
import OptimizedBatteryTable from "@/components/OptimizedBatteryTable";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import BatteryComparison from "@/components/BatteryComparison";
import DataExporter from "@/components/DataExporter";
import BatteryPassportModal from "@/components/BatteryPassportModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, GitCompare, Download, Activity, Zap } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Battery } from "@/types";

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);
  const [defaultView, setDefaultView] = useState("fleet");
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);

  const updateBatteries = () => {
    // Mock data with enhanced entries
    const mockData: Battery[] = [
      { id: "NMC-001A", grade: "A", status: "Healthy", soh: 99.1, rul: 1850, cycles: 150, chemistry: "NMC", uploadDate: "2025-06-14", sohHistory: [] },
      { id: "LFP-002B", grade: "B", status: "Degrading", soh: 92.5, rul: 820, cycles: 1180, chemistry: "LFP", uploadDate: "2025-06-12", sohHistory: [] },
      { id: "NMC-003C", grade: "C", status: "Critical", soh: 84.3, rul: 210, cycles: 2400, chemistry: "NMC", uploadDate: "2025-06-10", sohHistory: [] },
      { id: "LFP-004A", grade: "A", status: "Healthy", soh: 99.8, rul: 2800, cycles: 50, chemistry: "LFP", uploadDate: "2025-06-15", sohHistory: [] },
      { id: "NMC-005B", grade: "B", status: "Healthy", soh: 95.2, rul: 1200, cycles: 800, chemistry: "NMC", uploadDate: "2025-06-13", sohHistory: [] },
      { id: "LFP-006A", grade: "A", status: "Healthy", soh: 98.7, rul: 2100, cycles: 320, chemistry: "LFP", uploadDate: "2025-06-16", sohHistory: [] },
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
    return combined;
  };

  const handleSaveBattery = (updatedBattery: Battery) => {
    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const updatedBatteries = uploadedBatteries.map((battery: Battery) =>
      battery.id === updatedBattery.id ? updatedBattery : battery
    );
    localStorage.setItem('uploadedBatteries', JSON.stringify(updatedBatteries));

    setSelectedBattery(updatedBattery);
    setIsPassportOpen(false);
    
    window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
  };

  useEffect(() => {
    const batteries = updateBatteries();

    // Check if there's a battery ID in the URL
    const batteryId = searchParams.get('battery');
    if (batteryId) {
      const battery = batteries.find(b => b.id === batteryId);
      if (battery) {
        setSelectedBattery(battery);
        setIsPassportOpen(true);
        // Remove the battery parameter from URL
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('battery');
          return newParams;
        });
      }
    }

    // Load default view from settings
    const savedSettings = localStorage.getItem('batteryAnalysisSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDefaultView(settings.defaultView || "fleet");
    }

    const handleBatteryUpdate = () => {
      updateBatteries();
    };

    const handleSettingsChanged = (event: CustomEvent) => {
      const settings = event.detail;
      setDefaultView(settings.defaultView || "fleet");
    };

    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    window.addEventListener('settingsChanged', handleSettingsChanged as EventListener);
    
    return () => {
      window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
      window.removeEventListener('settingsChanged', handleSettingsChanged as EventListener);
    };
  }, [searchParams, setSearchParams]);

  return (
    <main className="flex-1 p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            ReVolt Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Universal Battery Intelligence Platform - Advanced Analytics & Diagnostics</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-green-400" />
              <span>Real-time Monitoring</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-blue-400" />
              <span>AI-Powered Analytics</span>
            </div>
          </div>
        </div>
        <Link to="/upload">
          <Button className="glass-button border-blue-500/40 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
            <Upload className="mr-2 h-4 w-4" />
            Upload Data
          </Button>
        </Link>
      </div>
      
      <DashboardStats />
      
      <div className="mt-8">
        <Tabs defaultValue={defaultView} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/20 border border-white/10 mb-6">
            <TabsTrigger value="fleet" className="flex items-center gap-2 transition-all duration-200">
              <Activity className="h-4 w-4" />
              Fleet
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 transition-all duration-200">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2 transition-all duration-200">
              <GitCompare className="h-4 w-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2 transition-all duration-200">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fleet" className="animate-fade-in">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Battery Fleet Overview</h2>
              <OptimizedBatteryTable />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in">
            <AdvancedAnalytics batteries={allBatteries} />
          </TabsContent>

          <TabsContent value="comparison" className="animate-fade-in">
            <BatteryComparison batteries={allBatteries} />
          </TabsContent>

          <TabsContent value="export" className="animate-fade-in">
            <DataExporter batteries={allBatteries} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Battery Passport Modal */}
      {selectedBattery && (
        <BatteryPassportModal
          battery={selectedBattery}
          isOpen={isPassportOpen}
          onClose={() => setIsPassportOpen(false)}
          onSave={handleSaveBattery}
        />
      )}
    </main>
  );
}
