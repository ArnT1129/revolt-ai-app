import DashboardStats from "@/components/DashboardStats";
import OptimizedBatteryTable from "@/components/OptimizedBatteryTable";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import BatteryComparison from "@/components/BatteryComparison";
import DataExporter from "@/components/DataExporter";
import BatteryPassportModal from "@/components/BatteryPassportModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart3, GitCompare, Download, Activity } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Battery } from "@/types";
import { batteryService } from "@/services/batteryService";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);
  const [activeTab, setActiveTab] = useState("fleet");
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const { user } = useAuth();

  const updateBatteries = async () => {
    try {
      console.log('Fetching batteries...');
      const batteries = await batteryService.getUserBatteries();
      console.log('Fetched batteries:', batteries.length);
      setAllBatteries(batteries);
      return batteries;
    } catch (error) {
      console.error('Error fetching batteries:', error);
      return [];
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

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      console.log('Loading initial battery data...');
      
      try {
        const batteries = await updateBatteries();
        
        // Handle URL parameters after data is loaded
        const tabParam = searchParams.get('tab');
        const batteryId = searchParams.get('battery');

        // Set active tab from URL or default to fleet
        if (tabParam && ['fleet', 'analytics', 'comparison', 'export'].includes(tabParam)) {
          setActiveTab(tabParam);
        } else {
          setActiveTab('fleet');
        }

        // Handle battery passport from URL
        if (batteryId && batteries.length > 0) {
          const battery = batteries.find(b => b.id === batteryId);
          if (battery) {
            setSelectedBattery(battery);
            setIsPassportOpen(true);
            // Clean up URL
            setSearchParams(prev => {
              const newParams = new URLSearchParams(prev);
              newParams.delete('battery');
              return newParams;
            });
          }
        }
        
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialLoadComplete) {
      loadInitialData();
    }
  }, [initialLoadComplete, searchParams, setSearchParams]);

  // Event listeners for updates
  useEffect(() => {
    const handleBatteryUpdate = async () => {
      if (initialLoadComplete) {
        console.log('Battery data updated, refreshing...');
        await updateBatteries();
      }
    };

    const handleSettingsChanged = (event: CustomEvent) => {
      const settings = event.detail;
      if (settings.defaultView) {
        setActiveTab(settings.defaultView);
      }
    };

    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    window.addEventListener('settingsChanged', handleSettingsChanged as EventListener);
    
    return () => {
      window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
      window.removeEventListener('settingsChanged', handleSettingsChanged as EventListener);
    };
  }, [initialLoadComplete]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading your battery data...</p>
          <p className="text-slate-400 text-sm mt-2">This may take a moment...</p>
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
          <p className="text-muted-foreground text-lg">Battery Intelligence Platform</p>
        </div>
        <div className="flex items-center justify-center">
          <Link to="/upload">
            <Button className="glass-button border-blue-500/40 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
              <FileText className="mr-2 h-4 w-4" />
              Create Passport
            </Button>
          </Link>
        </div>
      </div>
      
      <DashboardStats />
      
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
