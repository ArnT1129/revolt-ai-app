import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Battery, BatteryGrade, BatteryStatus } from "@/types";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { FileText, Trash2, Plus, AlertTriangle, Search } from "lucide-react";
import BatteryPassportModal from "./BatteryPassportModal";
import ManualBatteryModal from "./ManualBatteryModal";
import IssueDetailViewer from "./IssueDetailViewer";
import RootCauseAnalysis from "./RootCauseAnalysis";
import { toast } from "@/hooks/use-toast";

const mockData: Battery[] = [
  { id: "NMC-001A", grade: "A", status: "Healthy", soh: 99.1, rul: 1850, cycles: 150, chemistry: "NMC", uploadDate: "2025-06-14", sohHistory: Array.from({ length: 20 }, (_, i) => ({ cycle: i * 10, soh: 100 - i * 0.05 })) },
  { id: "LFP-002B", grade: "B", status: "Degrading", soh: 92.5, rul: 820, cycles: 1180, chemistry: "LFP", uploadDate: "2025-06-12", sohHistory: Array.from({ length: 20 }, (_, i) => ({ cycle: i * 50, soh: 98 - i * 0.3 })) },
  { id: "NMC-003C", grade: "C", status: "Critical", soh: 84.3, rul: 210, cycles: 2400, chemistry: "NMC", uploadDate: "2025-06-10", sohHistory: Array.from({ length: 20 }, (_, i) => ({ cycle: i * 100, soh: 95 - i * 0.6 })) },
  { id: "LFP-004A", grade: "A", status: "Healthy", soh: 99.8, rul: 2800, cycles: 50, chemistry: "LFP", uploadDate: "2025-06-15", sohHistory: Array.from({ length: 20 }, (_, i) => ({ cycle: i * 5, soh: 100 - i * 0.01 })) },
];

const gradeColor: Record<BatteryGrade, string> = {
  A: "bg-green-500",
  B: "bg-yellow-500",
  C: "bg-orange-500",
  D: "bg-red-500",
};

const statusColor: Record<BatteryStatus, string> = {
    Healthy: "text-green-400",
    Degrading: "text-yellow-400",
    Critical: "text-red-400",
    Unknown: "text-gray-400"
}

export default function BatteryTable() {
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [viewingIssues, setViewingIssues] = useState<Battery | null>(null);
  const [viewingRootCause, setViewingRootCause] = useState<Battery | null>(null);
  const [batteries, setBatteries] = useState<Battery[]>(mockData);

  useEffect(() => {
    const updateBatteries = () => {
      // Load uploaded batteries from localStorage and merge with mock data
      const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
      const allBatteries = [...mockData];
      
      // Add uploaded batteries, avoiding duplicates
      uploadedBatteries.forEach((uploadedBattery: Battery) => {
        const existingIndex = allBatteries.findIndex(b => b.id === uploadedBattery.id);
        if (existingIndex >= 0) {
          allBatteries[existingIndex] = uploadedBattery; // Update existing
        } else {
          allBatteries.push(uploadedBattery); // Add new
        }
      });
      
      setBatteries(allBatteries);
    };

    updateBatteries();

    // Listen for battery data updates
    window.addEventListener('batteryDataUpdated', updateBatteries);
    
    return () => {
      window.removeEventListener('batteryDataUpdated', updateBatteries);
    };
  }, []);

  const handleViewPassport = (battery: Battery) => {
    setSelectedBattery(battery);
    setIsModalOpen(true);
  };

  const handleDeleteBattery = (batteryId: string) => {
    setBatteries(prev => prev.filter(battery => battery.id !== batteryId));
    
    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const updatedUploaded = uploadedBatteries.filter((b: Battery) => b.id !== batteryId);
    localStorage.setItem('uploadedBatteries', JSON.stringify(updatedUploaded));
    
    toast({
      title: "Battery Deleted",
      description: `Battery ${batteryId} has been removed from the system`,
    });
    
    window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
  };

  const handleAddManualBattery = (newBattery: Battery) => {
    setBatteries(prev => [...prev, newBattery]);
    
    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    uploadedBatteries.push(newBattery);
    localStorage.setItem('uploadedBatteries', JSON.stringify(uploadedBatteries));
    
    toast({
      title: "Battery Added",
      description: `Battery ${newBattery.id} has been added to the system`,
    });
    
    window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
  };

  const handleSaveBattery = (updatedBattery: Battery) => {
    setBatteries(prev => 
      prev.map(battery => 
        battery.id === updatedBattery.id ? updatedBattery : battery
      )
    );
    setSelectedBattery(updatedBattery);
    
    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const isUploaded = uploadedBatteries.some((b: Battery) => b.id === updatedBattery.id);
    if (isUploaded) {
      const updatedUploaded = uploadedBatteries.map((b: Battery) => 
        b.id === updatedBattery.id ? updatedBattery : b
      );
      localStorage.setItem('uploadedBatteries', JSON.stringify(updatedUploaded));
    }
    
    window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
  };

  if (viewingRootCause) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewingRootCause(null)}>
            ← Back to Battery Table
          </Button>
          <h2 className="text-lg font-semibold text-white">Root Cause Analysis for {viewingRootCause.id}</h2>
        </div>
        <RootCauseAnalysis battery={viewingRootCause} />
      </div>
    );
  }

  if (viewingIssues) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewingIssues(null)}>
            ← Back to Battery Table
          </Button>
          <h2 className="text-lg font-semibold text-white">Issues for {viewingIssues.id}</h2>
        </div>
        <IssueDetailViewer 
          issues={viewingIssues.issues || []} 
          batteryId={viewingIssues.id} 
        />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Battery Fleet Overview</CardTitle>
            <Button onClick={() => setIsManualModalOpen(true)} size="sm" className="glass-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Battery
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-slate-300">Battery ID</TableHead>
                <TableHead className="text-center text-slate-300">Grade</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-right text-slate-300">SoH (%)</TableHead>
                <TableHead className="text-right text-slate-300">RUL (cycles)</TableHead>
                <TableHead className="text-right text-slate-300">Total Cycles</TableHead>
                <TableHead className="text-slate-300">SoH Trend</TableHead>
                <TableHead className="text-center text-slate-300">Issues</TableHead>
                <TableHead className="text-center text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batteries.map((battery) => (
                <TableRow key={battery.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{battery.id}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-white", gradeColor[battery.grade])}>{battery.grade}</Badge>
                  </TableCell>
                  <TableCell>
                      <span className={cn("font-semibold", statusColor[battery.status])}>
                          {battery.status}
                      </span>
                  </TableCell>
                  <TableCell className="text-right text-slate-300">{battery.soh.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-slate-300">{battery.rul}</TableCell>
                  <TableCell className="text-right text-slate-300">{battery.cycles}</TableCell>
                  <TableCell>
                    <div className="h-10 w-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={battery.sohHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSoh" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="soh" stroke="#8884d8" fillOpacity={1} fill="url(#colorSoh)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {battery.issues && battery.issues.length > 0 ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewingIssues(battery)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {battery.issues.length}
                      </Button>
                    ) : (
                      <span className="text-green-400 text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewPassport(battery)}
                        className="text-slate-300 hover:text-white hover:bg-white/10"
                        title="View Battery Passport"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewingRootCause(battery)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        title="Root Cause Analysis"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteBattery(battery.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Delete Battery"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BatteryPassportModal
        battery={selectedBattery}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBattery}
      />

      <ManualBatteryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleAddManualBattery}
      />
    </>
  );
}
