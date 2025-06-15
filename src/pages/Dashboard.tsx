
import DashboardStats from "@/components/DashboardStats";
import BatteryTable from "@/components/BatteryTable";
import { Button } from "@/components/ui/button";
import { Upload, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Battery } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [recentUploads, setRecentUploads] = useState<Battery[]>([]);

  const updateRecentUploads = () => {
    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const recent = uploadedBatteries
      .sort((a: Battery, b: Battery) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 3);
    setRecentUploads(recent);
  };

  useEffect(() => {
    updateRecentUploads();

    // Listen for battery data updates (including deletions)
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
          <p className="text-muted-foreground">Welcome to the Universal Battery Intelligence Platform.</p>
        </div>
        <Link to="/upload">
          <Button className="glass-button border-blue-500/40 hover:border-blue-400">
            <Upload className="mr-2 h-4 w-4" />
            Upload Data
          </Button>
        </Link>
      </div>
      
      <DashboardStats />
      
      {recentUploads.length > 0 && (
        <div className="mt-8">
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Recently Analyzed Batteries
              </CardTitle>
              <CardDescription>
                Latest batteries processed from your uploads
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">Battery Fleet Overview</h2>
        <BatteryTable />
      </div>
    </main>
  );
}
