import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Eye, 
  Trash2, 
  Download,
  AlertTriangle,
  Battery,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useBatteryStore } from '@/services/batteryService';
import BatteryPassportModal from './BatteryPassportModal';
import IssueDetailViewer from './IssueDetailViewer';
import type { Battery as BatteryType, BatteryIssue } from '@/types';

type SortField = 'id' | 'soh' | 'rul' | 'cycles' | 'uploadDate' | 'grade' | 'status';
type SortDirection = 'asc' | 'desc';

interface TableFilters {
  search: string;
  chemistry: string;
  status: string;
  grade: string;
}

export default function OptimizedBatteryTable() {
  const { batteries, removeBattery, updateBattery } = useBatteryStore();
  const [selectedBattery, setSelectedBattery] = useState<BatteryType | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<BatteryIssue | null>(null);
  const [isIssueViewerOpen, setIsIssueViewerOpen] = useState(false);
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([]);
  
  const [sortField, setSortField] = useState<SortField>('uploadDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    chemistry: 'all',
    status: 'all',
    grade: 'all'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Memoized filtered and sorted data
  const filteredAndSortedBatteries = useMemo(() => {
    let filtered = batteries.filter(battery => {
      const matchesSearch = filters.search === '' || 
        battery.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        (battery.notes?.toLowerCase().includes(filters.search.toLowerCase()) ?? false);
      
      const matchesChemistry = filters.chemistry === 'all' || battery.chemistry === filters.chemistry;
      const matchesStatus = filters.status === 'all' || battery.status === filters.status;
      const matchesGrade = filters.grade === 'all' || battery.grade === filters.grade;
      
      return matchesSearch && matchesChemistry && matchesStatus && matchesGrade;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Convert dates to timestamps for comparison
      if (sortField === 'uploadDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [batteries, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBatteries.length / itemsPerPage);
  const paginatedBatteries = filteredAndSortedBatteries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof TableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      chemistry: 'all',
      status: 'all',
      grade: 'all'
    });
    setCurrentPage(1);
  };

  const handleBatterySelect = (batteryId: string) => {
    setSelectedBatteries(prev => 
      prev.includes(batteryId) 
        ? prev.filter(id => id !== batteryId)
        : [...prev, batteryId]
    );
  };

  const handleSelectAll = () => {
    const allIds = paginatedBatteries.map(b => b.id);
    const allSelected = allIds.every(id => selectedBatteries.includes(id));
    
    if (allSelected) {
      setSelectedBatteries(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedBatteries(prev => [...new Set([...prev, ...allIds])]);
    }
  };

  const handleBulkDelete = () => {
    selectedBatteries.forEach(id => removeBattery(id));
    setSelectedBatteries([]);
  };

  const handleBulkExport = () => {
    // Implementation for bulk export
    console.log('Exporting batteries:', selectedBatteries);
  };

  const viewBattery = (battery: BatteryType) => {
    setSelectedBattery(battery);
    setIsPassportOpen(true);
  };

  const viewIssue = (issue: BatteryIssue) => {
    setSelectedIssue(issue);
    setIsIssueViewerOpen(true);
  };

  const handleSaveBattery = async (updatedBattery: BatteryType) => {
    updateBattery(updatedBattery);
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

  const getSoHTrend = (battery: BatteryType) => {
    if (battery.sohHistory.length < 2) return null;
    const recent = battery.sohHistory.slice(-2);
    const trend = recent[1].soh - recent[0].soh;
    return trend;
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-1 text-slate-300 hover:text-white"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? 
          <SortAsc className="h-3 w-3 ml-1" /> : 
          <SortDesc className="h-3 w-3 ml-1" />
      )}
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card className="enhanced-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search batteries..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.chemistry} onValueChange={(value) => handleFilterChange('chemistry', value)}>
              <SelectTrigger className="w-32 glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chemistry</SelectItem>
                <SelectItem value="LFP">LFP</SelectItem>
                <SelectItem value="NMC">NMC</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-32 glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Healthy">Healthy</SelectItem>
                <SelectItem value="Degrading">Degrading</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.grade} onValueChange={(value) => handleFilterChange('grade', value)}>
              <SelectTrigger className="w-24 glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">Grade A</SelectItem>
                <SelectItem value="B">Grade B</SelectItem>
                <SelectItem value="C">Grade C</SelectItem>
                <SelectItem value="D">Grade D</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              className="glass-button"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
          
          {selectedBatteries.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-600">
              <span className="text-sm text-slate-300">
                {selectedBatteries.length} selected
              </span>
              <Button 
                size="sm" 
                onClick={handleBulkExport}
                className="glass-button"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Battery Fleet ({filteredAndSortedBatteries.length})</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
                className="glass-button"
              >
                {paginatedBatteries.every(b => selectedBatteries.includes(b.id)) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-3 px-2">
                  <input
                    type="checkbox"
                    checked={paginatedBatteries.length > 0 && paginatedBatteries.every(b => selectedBatteries.includes(b.id))}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="id">Battery ID</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="grade">Grade</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="status">Status</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="soh">SoH</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="rul">RUL</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="cycles">Cycles</SortButton>
                </th>
                <th className="text-left py-3 px-4">Chemistry</th>
                <th className="text-left py-3 px-4">Issues</th>
                <th className="text-left py-3 px-4">
                  <SortButton field="uploadDate">Upload Date</SortButton>
                </th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBatteries.map((battery) => {
                const trend = getSoHTrend(battery);
                return (
                  <tr key={battery.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedBatteries.includes(battery.id)}
                        onChange={() => handleBatterySelect(battery.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4 text-blue-400" />
                        <span className="text-white font-medium">{battery.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getGradeColor(battery.grade)}>
                        {battery.grade}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(battery.status)}>
                        {battery.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium">{battery.soh}%</span>
                        {trend !== null && (
                          trend > 0 ? 
                            <TrendingUp className="h-3 w-3 text-green-400" /> :
                            trend < 0 ?
                              <TrendingDown className="h-3 w-3 text-red-400" /> :
                              null
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{battery.rul}</td>
                    <td className="py-3 px-4 text-slate-300">{battery.cycles}</td>
                    <td className="py-3 px-4 text-slate-300">{battery.chemistry}</td>
                    <td className="py-3 px-4">
                      {battery.issues && battery.issues.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewIssue(battery.issues![0])}
                          className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {battery.issues.length}
                        </Button>
                      ) : (
                        <span className="text-green-400 text-sm">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(battery.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewBattery(battery)}
                          className="glass-button h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeBattery(battery.id)}
                          className="glass-button h-8 w-8 p-0 hover:bg-red-600/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedBatteries.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Battery className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No batteries found</p>
              <p className="text-sm">Try adjusting your search filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedBatteries.length)} of {filteredAndSortedBatteries.length} batteries
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="glass-button"
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="glass-button"
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
          onNavigateToDashboard={() => {
            setIsPassportOpen(false);
            setSelectedBattery(null);
          }}
        />
      )}

      {/* Issue Detail Viewer */}
      {selectedIssue && (
        <IssueDetailViewer
          issue={selectedIssue}
          isOpen={isIssueViewerOpen}
          onClose={() => {
            setIsIssueViewerOpen(false);
            setSelectedIssue(null);
          }}
        />
      )}
    </div>
  );
}
