import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { batteryService } from '@/services/batteryService';
import { Search, Filter, Download, Eye, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Battery } from '@/types';
import BatteryPassportModal from './BatteryPassportModal';

export default function BatteryFleetTable() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chemistryFilter, setChemistryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [showPassportModal, setShowPassportModal] = useState(false);

  useEffect(() => {
    loadBatteries();
    
    // Listen for battery data updates
    const handleBatteryUpdate = () => {
      loadBatteries();
    };
    
    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    return () => window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
  }, []);

  const loadBatteries = async () => {
    try {
      setLoading(true);
      const data = await batteryService.getUserBatteries();
      setBatteries(data);
    } catch (error) {
      console.error('Error loading batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatteries = useMemo(() => {
    return batteries.filter(battery => {
      const matchesSearch = battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          battery.chemistry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || battery.status === statusFilter;
      const matchesChemistry = chemistryFilter === 'all' || battery.chemistry === chemistryFilter;
      const matchesGrade = gradeFilter === 'all' || battery.grade === gradeFilter;
      
      return matchesSearch && matchesStatus && matchesChemistry && matchesGrade;
    });
  }, [batteries, searchTerm, statusFilter, chemistryFilter, gradeFilter]);

  const handleViewDetails = (battery: Battery) => {
    setSelectedBattery(battery);
    setShowPassportModal(true);
  };

  const exportToCsv = () => {
    const csvContent = [
      ['ID', 'Chemistry', 'Grade', 'Status', 'SoH (%)', 'RUL (cycles)', 'Cycles', 'Upload Date'],
      ...filteredBatteries.map(battery => [
        battery.id,
        battery.chemistry,
        battery.grade,
        battery.status,
        battery.soh.toString(),
        battery.rul.toString(),
        battery.cycles.toString(),
        battery.uploadDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'battery-fleet-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-600/80 text-green-100';
      case 'Degrading': return 'bg-yellow-600/80 text-yellow-100';
      case 'Critical': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-600/80 text-green-100';
      case 'B': return 'bg-blue-600/80 text-blue-100';
      case 'C': return 'bg-yellow-600/80 text-yellow-100';
      case 'D': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const getSoHTrendIcon = (soh: number) => {
    if (soh >= 90) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (soh >= 80) return <TrendingUp className="h-4 w-4 text-yellow-400 transform rotate-180" />;
    return <TrendingUp className="h-4 w-4 text-red-400 transform rotate-180" />;
  };

  if (loading) {
    return (
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Battery Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="enhanced-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Battery Fleet Overview
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                Showing {filteredBatteries.length} of {batteries.length} batteries
              </p>
            </div>
            <Button onClick={exportToCsv} variant="outline" className="glass-button">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search batteries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Healthy">Healthy</SelectItem>
                <SelectItem value="Degrading">Degrading</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={chemistryFilter} onValueChange={setChemistryFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="All Chemistry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chemistry</SelectItem>
                <SelectItem value="LFP">LFP</SelectItem>
                <SelectItem value="NMC">NMC</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">Grade A</SelectItem>
                <SelectItem value="B">Grade B</SelectItem>
                <SelectItem value="C">Grade C</SelectItem>
                <SelectItem value="D">Grade D</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center text-sm text-slate-400">
              <Filter className="h-4 w-4 mr-2" />
              {filteredBatteries.length} results
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-slate-300">Battery ID</TableHead>
                  <TableHead className="text-slate-300">Grade</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">SoH (%)</TableHead>
                  <TableHead className="text-slate-300">RUL (cycles)</TableHead>
                  <TableHead className="text-slate-300">Total Cycles</TableHead>
                  <TableHead className="text-slate-300">SoH Trend</TableHead>
                  <TableHead className="text-slate-300">Issues</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatteries.length > 0 ? (
                  filteredBatteries.map((battery) => (
                    <TableRow key={battery.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">
                        <div className="flex items-center gap-2">
                          {battery.id.includes('DEMO') && (
                            <Badge className="bg-amber-600/80 text-amber-100 text-xs">DEMO</Badge>
                          )}
                          <span>{battery.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getGradeColor(battery.grade)}`}>
                          {battery.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getStatusColor(battery.status)}`}>
                          {battery.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <span>{battery.soh.toFixed(1)}%</span>
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                battery.soh >= 90 ? 'bg-green-500' :
                                battery.soh >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, battery.soh))}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{battery.rul.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-300">{battery.cycles.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getSoHTrendIcon(battery.soh)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {battery.issues && battery.issues.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            <span className="text-amber-300 text-sm">{battery.issues.length}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleViewDetails(battery)}
                          size="sm"
                          variant="outline"
                          className="glass-button"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-400 py-8">
                      No batteries found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Battery Passport Modal */}
      {selectedBattery && (
        <BatteryPassportModal
          isOpen={showPassportModal}
          onClose={() => {
            setShowPassportModal(false);
            setSelectedBattery(null);
          }}
          battery={selectedBattery}
        />
      )}
    </>
  );
}