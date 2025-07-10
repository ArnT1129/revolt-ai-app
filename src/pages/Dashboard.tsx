import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Battery, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { batteryService } from '@/services/batteryService';
import type { Battery as BatteryType } from '@/types';

interface OptimizedBatteryTableProps {
  batteries?: BatteryType[];
}

type SortField = 'id' | 'soh' | 'rul' | 'cycles' | 'uploadDate' | 'status';
type SortDirection = 'asc' | 'desc';

export default function OptimizedBatteryTable({ batteries: propBatteries }: OptimizedBatteryTableProps) {
  const [batteries, setBatteries] = useState<BatteryType[]>(propBatteries || []);
  const [loading, setLoading] = useState(!propBatteries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chemistryFilter, setChemistryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('uploadDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const navigate = useNavigate();

  // Only fetch data if no batteries were passed as props
  useEffect(() => {
    if (!propBatteries) {
      loadBatteries();
    }
  }, [propBatteries]);

  // Update batteries when props change
  useEffect(() => {
    if (propBatteries) {
      setBatteries(propBatteries);
      setLoading(false);
    }
  }, [propBatteries]);

  const loadBatteries = async () => {
    if (propBatteries) return; // Don't fetch if we have prop data
    
    try {
      setLoading(true);
      const batteryData = await batteryService.getUserBatteries();
      setBatteries(batteryData);
    } catch (error) {
      console.error('Error loading batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'Healthy': 'bg-green-600/80 text-green-100',
      'Degrading': 'bg-yellow-600/80 text-yellow-100',
      'Critical': 'bg-red-600/80 text-red-100'
    };
    return statusStyles[status as keyof typeof statusStyles] || 'bg-gray-600/80 text-gray-100';
  };

  const getGradeBadge = (grade: string) => {
    const gradeStyles = {
      'A': 'bg-green-600/80 text-green-100',
      'B': 'bg-yellow-600/80 text-yellow-100',
      'C': 'bg-red-600/80 text-red-100'
    };
    return gradeStyles[grade as keyof typeof gradeStyles] || 'bg-gray-600/80 text-gray-100';
  };

  const filteredAndSortedBatteries = useMemo(() => {
    let filtered = batteries.filter(battery => {
      const matchesSearch = battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           battery.chemistry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || battery.status === statusFilter;
      const matchesChemistry = chemistryFilter === 'all' || battery.chemistry === chemistryFilter;
      
      return matchesSearch && matchesStatus && matchesChemistry;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'soh':
          aValue = a.soh;
          bValue = b.soh;
          break;
        case 'rul':
          aValue = a.rul;
          bValue = b.rul;
          break;
        case 'cycles':
          aValue = a.cycles;
          bValue = b.cycles;
          break;
        case 'uploadDate':
          aValue = new Date(a.uploadDate).getTime();
          bValue = new Date(b.uploadDate).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [batteries, searchTerm, statusFilter, chemistryFilter, sortField, sortDirection]);

  const uniqueChemistries = useMemo(() => {
    const chemistries = [...new Set(batteries.map(b => b.chemistry))];
    return chemistries.sort();
  }, [batteries]);

  if (loading) {
    return (
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Battery Fleet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-white/10 rounded"></div>
            <div className="h-64 bg-white/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Battery className="h-5 w-5" />
          Battery Fleet Overview
          <Badge className="ml-2 bg-blue-600/80 text-blue-100">
            {filteredAndSortedBatteries.length} batteries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search batteries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-button"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] glass-button">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Healthy">Healthy</SelectItem>
              <SelectItem value="Degrading">Degrading</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chemistryFilter} onValueChange={setChemistryFilter}>
            <SelectTrigger className="w-[180px] glass-button">
              <SelectValue placeholder="Filter by chemistry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chemistries</SelectItem>
              {uniqueChemistries.map(chemistry => (
                <SelectItem key={chemistry} value={chemistry}>{chemistry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-2">
                    Battery ID
                    {getSortIcon('id')}
                  </div>
                </TableHead>
                <TableHead className="text-slate-300">Chemistry</TableHead>
                <TableHead className="text-slate-300">Grade</TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('soh')}
                >
                  <div className="flex items-center gap-2">
                    SoH (%)
                    {getSortIcon('soh')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('rul')}
                >
                  <div className="flex items-center gap-2">
                    RUL (cycles)
                    {getSortIcon('rul')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('cycles')}
                >
                  <div className="flex items-center gap-2">
                    Cycles
                    {getSortIcon('cycles')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('uploadDate')}
                >
                  <div className="flex items-center gap-2">
                    Upload Date
                    {getSortIcon('uploadDate')}
                  </div>
                </TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedBatteries.map((battery) => (
                <TableRow 
                  key={battery.id} 
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center gap-2">
                      {battery.id.startsWith('MOCK-') && (
                        <Badge className="bg-amber-600/80 text-amber-100 text-xs">
                          Demo
                        </Badge>
                      )}
                      {battery.id}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{battery.chemistry}</TableCell>
                  <TableCell>
                    <Badge className={getGradeBadge(battery.grade)}>
                      {battery.grade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(battery.status)}>
                      {battery.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        battery.soh >= 90 ? 'text-green-400' : 
                        battery.soh >= 80 ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}>
                        {battery.soh.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{battery.rul.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-300">{battery.cycles.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-300">
                    {new Date(battery.uploadDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/battery/${battery.id}`)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedBatteries.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No batteries found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
