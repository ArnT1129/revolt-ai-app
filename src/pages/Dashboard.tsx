
import DashboardStats from "@/components/DashboardStats";
import BatteryTable from "@/components/BatteryTable";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import BatteryComparison from "@/components/BatteryComparison";
import DataExporter from "@/components/DataExporter";
import BatteryPassportModal from "@/components/BatteryPassportModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, GitCompare, Download } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Battery } from "@/types";
import { batteryService } from "@/services/batteryService";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);
  const [defaultView, setDefaultView] = useState("fleet");
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const updateBatteries = async () => {
    if (!user) return [];
    
    try {
      const batteries = await batteryService.getUserBatteries(user.id);
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
    try {
      await batteryService.updateBattery(updatedBattery.id, updatedBattery);
      setSelectedBattery(updatedBattery);
      setIsPassportOpen(false);
      updateBatteries(); // Refresh the data
    } catch (error) {
      console.error('Error updating battery:', error);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user) return;
      
      const batteries = await updateBatteries();

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
    };

    initializeDashboard();

    const handleSettingsChanged = (event: CustomEvent) => {
      const settings = event.detail;
      setDefaultView(settings.defaultView || "fleet");
    };

    window.addEventListener('settingsChanged', handleSettingsChanged as EventListener);
    
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChanged as EventListener);
    };
  }, [user, searchParams, setSearchParams]);

  if (!user) {
    return null; // This will be handled by ProtectedRoute
  }

  if (loading) {
    return (
      <main className="flex-1 p-4 md:p-8 animate-fade-in">
        <div className="text-center py-8">
          <div className="text-white">Loading your dashboard...</div>
        </div>
      </main>
    );
  }

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
        <Tabs defaultValue={defaultView} className="w-full">
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
              <h2 className="text-2xl font-semibold text-white">My Battery Fleet</h2>
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
