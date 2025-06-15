
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

  useEffect(() => {
    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    // Show only the 3 most recently uploaded batteries
    const recent = uploadedBatteries
      .sort((a: Battery, b: Battery) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 3);
    setRecentUploads(recent);
  }, []);

  return (
    <main className="flex-1 p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the ReVolt Intelligence Platform.</p>
        </div>
        <Link to="/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Data
          </Button>
        </Link>
      </div>
      
      <DashboardStats />
      
      {recentUploads.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recently Analyzed Batteries
              </CardTitle>
              <CardDescription>
                Latest batteries processed from your uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentUploads.map((battery) => (
                  <div key={battery.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{battery.id}</h4>
                      <span className="text-sm text-muted-foreground">{battery.uploadDate}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>SoH: <span className="font-medium">{battery.soh.toFixed(1)}%</span></p>
                      <p>Grade: <span className="font-medium">Grade {battery.grade}</span></p>
                      <p>Cycles: <span className="font-medium">{battery.cycles}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Battery Fleet Overview</h2>
        <BatteryTable />
      </div>
    </main>
  );
}
