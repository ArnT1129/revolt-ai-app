
import DashboardStats from "@/components/DashboardStats";
import OptimizedBatteryTable from "@/components/OptimizedBatteryTable";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import BatteryComparison from "@/components/BatteryComparison";
import DataExporter from "@/components/DataExporter";
import BatteryPassportModal from "@/components/BatteryPassportModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, GitCompare, Download, Activity, Zap, LogOut } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Battery } from "@/types";
import { batteryService } from "@/services/batteryService";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);
  const [defaultView, setDefaultView] = useState("fleet");
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  const updateBatteries = async () => {
    try {
      setLoading(true);
      const batteries = await batteryService.getUserBatteries();
      setAllBatteries(batteries);
      return batteries;
    } catch (error) {
      console.error('Error fetching batteries:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBattery = async (updatedBattery: Battery) => {
    const success = await batteryService.updateBattery(updatedBattery);
    if (success) {
      setSelectedBattery(updatedBattery);
      setIsPassportOpen(false);
      await updateBatteries();
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    updateBatteries();

    // Check if there's a battery ID in the URL
    const batteryId = searchParams.get('battery');
    if (batteryId && allBatteries.length > 0) {
      const battery = allBatteries.find(b => b.id === batteryId);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading your battery data...</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-1">
              <span className="text-slate-300">Welcome, {user?.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/upload">
            <Button className="glass-button border-blue-500/40 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
              <Upload className="mr-2 h-4 w-4" />
              Upload Data
            </Button>
          </Link>
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="glass-button border-red-500/40 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <DashboardStats />
      
      <div className="mt-8">
        <Tabs defaultValue={defaultView} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/20 border border-white/10 mb-6">
            <TabsTrigger value="fleet" className="flex items-center gap-2 transition-all duration-200">
              <Activity className="h-4 w-4" />
              Fleet ({allBatteries.length})
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
