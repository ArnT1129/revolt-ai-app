
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Eye, Download, AlertTriangle } from 'lucide-react';
import BatteryPassportModal from './BatteryPassportModal';
import type { Battery } from '@/types';

interface OptimizedBatteryTableProps {
  batteries: Battery[];
}

export default function OptimizedBatteryTable({ batteries }: OptimizedBatteryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);

  const filteredBatteries = useMemo(() => {
    return batteries.filter(battery => {
      const matchesSearch = battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           battery.chemistry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || battery.status === statusFilter;
      const matchesGrade = gradeFilter === 'all' || battery.grade === gradeFilter;
      
      return matchesSearch && matchesStatus && matchesGrade;
    });
  }, [batteries, searchTerm, statusFilter, gradeFilter]);

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
      case 'A': return 'bg-blue-600/80 text-blue-100';
      case 'B': return 'bg-green-600/80 text-green-100';
      case 'C': return 'bg-yellow-600/80 text-yellow-100';
      case 'D': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const handleViewBattery = (battery: Battery) => {
    setSelectedBattery(battery);
    setIsPassportOpen(true);
  };

  const handleSaveBattery = async (updatedBattery: Battery) => {
    // This would typically update the battery in your data store
    console.log('Saving battery:', updatedBattery);
  };

  const handleExportData = () => {
    const csvContent = [
      ['ID', 'Chemistry', 'Grade', 'Status', 'SoH (%)', 'RUL (cycles)', 'Cycles', 'Upload Date'].join(','),
      ...filteredBatteries.map(battery => [
        battery.id,
        battery.chemistry,
        battery.grade,
        battery.status,
        battery.soh,
        battery.rul,
        battery.cycles,
        new Date(battery.uploadDate).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'battery-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Battery Inventory ({filteredBatteries.length})</span>
            <Button onClick={handleExportData} variant="outline" className="glass-button">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search batteries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] glass-input">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Healthy">Healthy</SelectItem>
                <SelectItem value="Degrading">Degrading</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] glass-input">
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">Grade A</SelectItem>
                <SelectItem value="B">Grade B</SelectItem>
                <SelectItem value="C">Grade C</SelectItem>
                <SelectItem value="D">Grade D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-slate-300">ID</TableHead>
                  <TableHead className="text-slate-300">Chemistry</TableHead>
                  <TableHead className="text-slate-300">Grade</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">SoH</TableHead>
                  <TableHead className="text-slate-300">RUL</TableHead>
                  <TableHead className="text-slate-300">Cycles</TableHead>
                  <TableHead className="text-slate-300">Issues</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatteries.map((battery) => (
                  <TableRow key={battery.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="font-medium text-white">{battery.id}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(battery.uploadDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-300">{battery.chemistry}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(battery.grade)}>
                        Grade {battery.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(battery.status)}>
                        {battery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{battery.soh.toFixed(1)}%</span>
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
                    <TableCell>
                      <span className="text-slate-300">{battery.rul.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-300">{battery.cycles.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      {battery.issues && battery.issues.length > 0 ? (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">{battery.issues.length}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewBattery(battery)}
                        className="glass-button"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBatteries.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No batteries found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Battery Passport Modal */}
      {selectedBattery && (
        <BatteryPassportModal
          battery={selectedBattery}
          isOpen={isPassportOpen}
          onClose={() => {
            setIsPassportOpen(false);
            setSelectedBattery(null);
          }}
          onSave={handleSaveBattery}
        />
      )}
    </div>
  );
}
