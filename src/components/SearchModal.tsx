
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Battery, Zap, AlertTriangle, Building2, Filter } from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import { useCompany } from '@/contexts/CompanyContext';
import { Battery as BatteryType } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatterySelect?: (battery: BatteryType) => void;
}

interface SearchFilters {
  chemistry: 'all' | 'LFP' | 'NMC';
  grade: 'all' | 'A' | 'B' | 'C' | 'D';
  status: 'all' | 'Healthy' | 'Degrading' | 'Critical';
  sohRange: [number, number];
  cycleRange: [number, number];
}

export default function SearchModal({ isOpen, onClose, onBatterySelect }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [filteredBatteries, setFilteredBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('batteries');
  const { isCompanyMode, currentCompany } = useCompany();
  const [filters, setFilters] = useState<SearchFilters>({
    chemistry: 'all',
    grade: 'all',
    status: 'all',
    sohRange: [0, 100],
    cycleRange: [0, 5000]
  });

  useEffect(() => {
    if (isOpen) {
      fetchBatteries();
    }
  }, [isOpen, isCompanyMode]);

  useEffect(() => {
    filterBatteries();
  }, [searchQuery, batteries, filters]);

  const fetchBatteries = async () => {
    setLoading(true);
    try {
      const data = await batteryService.getUserBatteries();
      setBatteries(data);
    } catch (error) {
      console.error('Error fetching batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBatteries = () => {
    let filtered = batteries;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(battery => 
        battery.id.toLowerCase().includes(query) ||
        battery.chemistry.toLowerCase().includes(query) ||
        battery.grade.toLowerCase().includes(query) ||
        battery.status.toLowerCase().includes(query) ||
        battery.notes?.toLowerCase().includes(query) ||
        battery.issues?.some(issue => 
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          issue.category.toLowerCase().includes(query)
        )
      );
    }

    // Apply filters
    if (filters.chemistry !== 'all') {
      filtered = filtered.filter(b => b.chemistry === filters.chemistry);
    }
    if (filters.grade !== 'all') {
      filtered = filtered.filter(b => b.grade === filters.grade);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(b => b.status === filters.status);
    }

    // SoH range filter
    filtered = filtered.filter(b => 
      b.soh >= filters.sohRange[0] && b.soh <= filters.sohRange[1]
    );

    // Cycle range filter
    filtered = filtered.filter(b => 
      b.cycles >= filters.cycleRange[0] && b.cycles <= filters.cycleRange[1]
    );

    setFilteredBatteries(filtered);
  };

  const resetFilters = () => {
    setFilters({
      chemistry: 'all',
      grade: 'all',
      status: 'all',
      sohRange: [0, 100],
      cycleRange: [0, 5000]
    });
    setSearchQuery('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-500/20 text-green-400';
      case 'Degrading': return 'bg-yellow-500/20 text-yellow-400';
      case 'Critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500/20 text-green-400';
      case 'B': return 'bg-blue-500/20 text-blue-400';
      case 'C': return 'bg-yellow-500/20 text-yellow-400';
      case 'D': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="enhanced-card max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Battery Search & Analytics
            {isCompanyMode && currentCompany && (
              <Badge variant="secondary" className="ml-2">
                <Building2 className="h-3 w-3 mr-1" />
                {currentCompany.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, chemistry, status, issues, notes..."
              className="glass-input pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/20 border border-white/10">
              <TabsTrigger value="batteries">
                <Battery className="h-4 w-4 mr-2" />
                Batteries ({filteredBatteries.length})
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <Zap className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="filters">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </TabsTrigger>
            </TabsList>

            <TabsContent value="batteries" className="mt-4">
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Loading batteries...</div>
                ) : filteredBatteries.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    {batteries.length === 0 ? 'No batteries found' : 'No batteries match your search criteria'}
                  </div>
                ) : (
                  filteredBatteries.map((battery) => (
                    <Card 
                      key={battery.id} 
                      className="enhanced-card cursor-pointer hover:border-blue-400/50 transition-all"
                      onClick={() => {
                        onBatterySelect?.(battery);
                        onClose();
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Battery className="h-5 w-5 text-blue-400" />
                            <div>
                              <div className="font-medium text-white">{battery.id}</div>
                              <div className="text-sm text-slate-400">
                                {battery.chemistry} • {battery.cycles.toLocaleString()} cycles
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getGradeColor(battery.grade)}>
                              Grade {battery.grade}
                            </Badge>
                            <Badge className={getStatusColor(battery.status)}>
                              {battery.status}
                            </Badge>
                            <div className="text-right">
                              <div className="text-sm font-medium text-white">{battery.soh.toFixed(1)}% SoH</div>
                              <div className="text-xs text-slate-400">{battery.rul} cycles RUL</div>
                            </div>
                          </div>
                        </div>
                        {battery.issues && battery.issues.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3 text-orange-400" />
                            <span className="text-orange-400">
                              {battery.issues.length} issue{battery.issues.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="enhanced-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {filteredBatteries.length}
                    </div>
                    <div className="text-sm text-slate-400">Total Batteries</div>
                  </CardContent>
                </Card>
                <Card className="enhanced-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {filteredBatteries.length > 0 
                        ? (filteredBatteries.reduce((sum, b) => sum + b.soh, 0) / filteredBatteries.length).toFixed(1)
                        : 0}%
                    </div>
                    <div className="text-sm text-slate-400">Avg SoH</div>
                  </CardContent>
                </Card>
                <Card className="enhanced-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {filteredBatteries.filter(b => b.status === 'Critical').length}
                    </div>
                    <div className="text-sm text-slate-400">Critical</div>
                  </CardContent>
                </Card>
                <Card className="enhanced-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {filteredBatteries.reduce((sum, b) => sum + (b.issues?.length || 0), 0)}
                    </div>
                    <div className="text-sm text-slate-400">Total Issues</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Chemistry</label>
                  <select 
                    value={filters.chemistry} 
                    onChange={(e) => setFilters({...filters, chemistry: e.target.value as any})}
                    className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white"
                  >
                    <option value="all">All Chemistries</option>
                    <option value="LFP">LFP</option>
                    <option value="NMC">NMC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Grade</label>
                  <select 
                    value={filters.grade} 
                    onChange={(e) => setFilters({...filters, grade: e.target.value as any})}
                    className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white"
                  >
                    <option value="all">All Grades</option>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="D">Grade D</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Status</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                    className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Degrading">Degrading</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    className="w-full glass-button"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
