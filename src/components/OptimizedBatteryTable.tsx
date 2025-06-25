
import { useState, useEffect, useMemo, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Battery, BatteryGrade, BatteryStatus } from "@/types";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { FileText, Trash2, Plus, AlertTriangle, Search, Filter, Download, RefreshCw } from "lucide-react";
import BatteryPassportModal from "./BatteryPassportModal";
import ManualBatteryModal from "./ManualBatteryModal";
import IssueDetailViewer from "./IssueDetailViewer";
import RootCauseAnalysis from "./RootCauseAnalysis";
import { toast } from "@/hooks/use-toast";
import { batteryService } from "@/services/batteryService";

const gradeColor: Record<BatteryGrade, string> = {
  A: "bg-green-500/80 hover:bg-green-500",
  B: "bg-yellow-500/80 hover:bg-yellow-500",
  C: "bg-orange-500/80 hover:bg-orange-500",
  D: "bg-red-500/80 hover:bg-red-500",
};

const statusColor: Record<BatteryStatus, string> = {
    Healthy: "text-green-400",
    Degrading: "text-yellow-400",
    Critical: "text-red-400",
    Unknown: "text-gray-400"
}

export default function OptimizedBatteryTable() {
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [viewingIssues, setViewingIssues] = useState<Battery | null>(null);
  const [viewingRootCause, setViewingRootCause] = useState<Battery | null>(null);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredAndSortedBatteries = useMemo(() => {
    let filtered = batteries.filter(battery => {
      const matchesSearch = battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           battery.chemistry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || battery.status === statusFilter;
      const matchesGrade = gradeFilter === "all" || battery.grade === gradeFilter;
      
      return matchesSearch && matchesStatus && matchesGrade;
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Battery];
      let bValue: any = b[sortBy as keyof Battery];
      
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [batteries, searchTerm, statusFilter, gradeFilter, sortBy, sortOrder]);

  const updateBatteries = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedBatteries = await batteryService.getUserBatteries();
      setBatteries(fetchedBatteries);
      return fetchedBatteries;
    } catch (error) {
      console.error('Error fetching batteries:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    updateBatteries();

    const handleBatteryUpdate = () => {
      updateBatteries();
    };

    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    
    return () => {
      window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
    };
  }, [updateBatteries]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleViewPassport = useCallback((battery: Battery) => {
    setSelectedBattery(battery);
    setIsModalOpen(true);
  }, []);

  const handleDeleteBattery = useCallback(async (batteryId: string) => {
    const success = await batteryService.deleteBattery(batteryId);
    if (success) {
      setBatteries(prev => prev.filter(battery => battery.id !== batteryId));
      toast({
        title: "Battery Deleted",
        description: `Battery ${batteryId} has been removed from the system`,
      });
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
    } else {
      toast({
        title: "Error",
        description: "Failed to delete battery",
        variant: "destructive"
      });
    }
  }, []);

  const handleAddManualBattery = useCallback(async (newBattery: Battery) => {
    const success = await batteryService.addBattery(newBattery);
    if (success) {
      setBatteries(prev => [...prev, newBattery]);
      toast({
        title: "Battery Added",
        description: `Battery ${newBattery.id} has been added to the system`,
      });
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
    } else {
      toast({
        title: "Error",
        description: "Failed to add battery",
        variant: "destructive"
      });
    }
  }, []);

  const handleSaveBattery = useCallback(async (updatedBattery: Battery) => {
    const success = await batteryService.updateBattery(updatedBattery);
    if (success) {
      setBatteries(prev => 
        prev.map(battery => 
          battery.id === updatedBattery.id ? updatedBattery : battery
        )
      );
      setSelectedBattery(updatedBattery);
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
    } else {
      toast({
        title: "Error",
        description: "Failed to save battery",
        variant: "destructive"
      });
    }
  }, []);

  const exportData = () => {
    const csv = [
      "ID,Grade,Status,SoH,RUL,Cycles,Chemistry,Upload Date",
      ...filteredAndSortedBatteries.map(b => 
        `${b.id},${b.grade},${b.status},${b.soh},${b.rul},${b.cycles},${b.chemistry},${b.uploadDate}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'battery-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
            <span className="text-white">Loading battery data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

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
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Battery Fleet Overview</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={exportData} size="sm" variant="outline" className="glass-button">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={updateBatteries} size="sm" variant="outline" className="glass-button">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsManualModalOpen(true)} size="sm" className="glass-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Battery
              </Button>
            </div>
          </div>
          
          {/* Enhanced Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search batteries by ID or chemistry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-effect"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md bg-background border border-input"
            >
              <option value="all">All Status</option>
              <option value="Healthy">Healthy</option>
              <option value="Degrading">Degrading</option>
              <option value="Critical">Critical</option>
            </select>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 rounded-md bg-background border border-input"
            >
              <option value="all">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-sm text-slate-400 px-6 pb-2">
            Showing {filteredAndSortedBatteries.length} of {batteries.length} batteries
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('id')}
                >
                  Battery ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-center text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('grade')}
                >
                  Grade {sortBy === 'grade' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-right text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('soh')}
                >
                  SoH (%) {sortBy === 'soh' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-right text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('rul')}
                >
                  RUL (cycles) {sortBy === 'rul' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-right text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('cycles')}
                >
                  Total Cycles {sortBy === 'cycles' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-slate-300">SoH Trend</TableHead>
                <TableHead className="text-center text-slate-300">Issues</TableHead>
                <TableHead className="text-center text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedBatteries.map((battery, index) => (
                <TableRow 
                  key={battery.id} 
                  className="border-white/10 hover:bg-white/5 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="font-medium text-white">{battery.id}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-white transition-all duration-200 cursor-pointer", gradeColor[battery.grade])}>
                      {battery.grade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      <span className={cn("font-semibold", statusColor[battery.status])}>
                          {battery.status}
                      </span>
                  </TableCell>
                  <TableCell className="text-right text-slate-300">{battery.soh.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-slate-300">{battery.rul.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-slate-300">{battery.cycles.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="h-10 w-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={battery.sohHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`colorSoh-${battery.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="soh" 
                            stroke="#8884d8" 
                            fillOpacity={1} 
                            fill={`url(#colorSoh-${battery.id})`} 
                          />
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
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
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
                        className="text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                        title="View Battery Passport"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewingRootCause(battery)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-200"
                        title="Root Cause Analysis"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteBattery(battery.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
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
