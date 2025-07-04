import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Battery, Zap, AlertTriangle, Building2, Filter } from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import { useCompany } from '@/contexts/CompanyContext';
import { Battery as BatteryType } from '@/types';

interface SearchFilters {
  chemistry: 'all' | 'LFP' | 'NMC';
  grade: 'all' | 'A' | 'B' | 'C' | 'D';
  status: 'all' | 'Healthy' | 'Degrading' | 'Critical';
  sohRange: [number, number];
  cycleRange: [number, number];
}

const ITEMS_PER_PAGE = 20;

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('batteries');
  const [currentPage, setCurrentPage] = useState(1);
  const { isCompanyMode, currentCompany } = useCompany();
  const [filters, setFilters] = useState<SearchFilters>({
    chemistry: 'all',
    grade: 'all',
    status: 'all',
    sohRange: [0, 100],
    cycleRange: [0, 5000]
  });

  // Debounced search query to prevent excessive filtering
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Memoize the fetchBatteries function to prevent infinite re-renders
  const fetchBatteries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await batteryService.getUserBatteries();
      setBatteries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching batteries:', error);
      setError('Failed to load batteries');
      setBatteries([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any state

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Only fetch batteries on mount and when company mode changes
  useEffect(() => {
    fetchBatteries();
  }, [fetchBatteries, isCompanyMode]);

  // Memoized filtered batteries to prevent unnecessary recalculations
  const filteredBatteries = useMemo(() => {
    if (!Array.isArray(batteries)) {
      return [];
    }

    let filtered = batteries;

    // Text search - optimized to avoid multiple toLowerCase calls
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(battery => {
        try {
          // Pre-compute lowercase values to avoid repeated calls
          const batteryId = (battery.id || '').toLowerCase();
          const batteryChemistry = (battery.chemistry || '').toLowerCase();
          const batteryGrade = (battery.grade || '').toLowerCase();
          const batteryStatus = (battery.status || '').toLowerCase();
          const batteryNotes = (battery.notes || '').toLowerCase();
          
          // Check basic fields first (most common matches)
          if (batteryId.includes(query) || 
              batteryChemistry.includes(query) || 
              batteryGrade.includes(query) || 
              batteryStatus.includes(query) || 
              batteryNotes.includes(query)) {
            return true;
          }
          
          // Check issues only if basic fields don't match
          if (battery.issues && Array.isArray(battery.issues)) {
            return battery.issues.some(issue => {
              if (!issue || typeof issue !== 'object') return false;
              return (
                (issue.title || '').toLowerCase().includes(query) ||
                (issue.description || '').toLowerCase().includes(query) ||
                (issue.category || '').toLowerCase().includes(query)
              );
            });
          }
          
          return false;
        } catch (err) {
          console.error('Error filtering battery:', battery, err);
          return false;
        }
      });
    }

    // Apply filters efficiently
    try {
      if (filters.chemistry !== 'all') {
        filtered = filtered.filter(b => b.chemistry === filters.chemistry);
      }
      if (filters.grade !== 'all') {
        filtered = filtered.filter(b => b.grade === filters.grade);
      }
      if (filters.status !== 'all') {
        filtered = filtered.filter(b => b.status === filters.status);
      }

      // Numeric range filters with safety checks
      filtered = filtered.filter(b => {
        const soh = typeof b.soh === 'number' ? b.soh : 0;
        const cycles = typeof b.cycles === 'number' ? b.cycles : 0;
        return (
          soh >= filters.sohRange[0] && 
          soh <= filters.sohRange[1] &&
          cycles >= filters.cycleRange[0] && 
          cycles <= filters.cycleRange[1]
        );
      });
    } catch (err) {
      console.error('Error applying filters:', err);
      return [];
    }

    return filtered;
  }, [batteries, debouncedSearchQuery, filters]);

  // Paginated results to improve rendering performance
  const paginatedBatteries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredBatteries.slice(startIndex, endIndex);
  }, [filteredBatteries, currentPage]);

  const totalPages = Math.ceil(filteredBatteries.length / ITEMS_PER_PAGE);

  const resetFilters = useCallback(() => {
    setFilters({
      chemistry: 'all',
      grade: 'all',
      status: 'all',
      sohRange: [0, 100],
      cycleRange: [0, 5000]
    });
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Memoized analytics to prevent recalculation on every render
  const analytics = useMemo(() => {
    if (!Array.isArray(filteredBatteries) || filteredBatteries.length === 0) {
      return { totalBatteries: 0, avgSoH: 0, criticalCount: 0, totalIssues: 0 };
    }

    try {
      const validBatteries = filteredBatteries.filter(b => 
        b && typeof b.soh === 'number' && typeof b.status === 'string'
      );

      if (validBatteries.length === 0) {
        return { totalBatteries: 0, avgSoH: 0, criticalCount: 0, totalIssues: 0 };
      }

      const avgSoH = validBatteries.reduce((sum, b) => sum + b.soh, 0) / validBatteries.length;
      const criticalCount = validBatteries.filter(b => b.status === 'Critical').length;
      const totalIssues = validBatteries.reduce((sum, b) => 
        sum + (Array.isArray(b.issues) ? b.issues.length : 0), 0
      );

      return {
        totalBatteries: filteredBatteries.length,
        avgSoH: avgSoH.toFixed(1),
        criticalCount,
        totalIssues
      };
    } catch (err) {
      console.error('Error calculating analytics:', err);
      return { totalBatteries: 0, avgSoH: 0, criticalCount: 0, totalIssues: 0 };
    }
  }, [filteredBatteries]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-500/20 text-green-400';
      case 'Degrading': return 'bg-yellow-500/20 text-yellow-400';
      case 'Critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }, []);

  const getGradeColor = useCallback((grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500/20 text-green-400';
      case 'B': return 'bg-blue-500/20 text-blue-400';
      case 'C': return 'bg-yellow-500/20 text-yellow-400';
      case 'D': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-slate-400">
        Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredBatteries.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredBatteries.length)} of {filteredBatteries.length} results
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="glass-button"
        >
          Previous
        </Button>
        <span className="text-sm text-slate-400">
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          variant="outline"
          size="sm"
          className="glass-button"
        >
          Next
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <main className="flex-1 p-4 md:p-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading batteries...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-4 md:p-8 animate-fade-in">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white mb-2">Error Loading Batteries</p>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={fetchBatteries} className="glass-button">
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Battery Search & Analytics
          </h1>
          <p className="text-muted-foreground text-lg">Advanced battery fleet search and analysis</p>
          {isCompanyMode && currentCompany && (
            <Badge variant="secondary" className="mt-2">
              <Building2 className="h-3 w-3 mr-1" />
              {currentCompany.name}
            </Badge>
          )}
        </div>
      </div>

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
            <div className="space-y-4">
              <div className="space-y-2">
                {paginatedBatteries.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    {batteries.length === 0 ? 'No batteries found' : 'No batteries match your search criteria'}
                  </div>
                ) : (
                  paginatedBatteries.map((battery) => (
                    <Card 
                      key={battery.id} 
                      className="enhanced-card cursor-pointer hover:border-blue-400/50 transition-all"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Battery className="h-5 w-5 text-blue-400" />
                            <div>
                              <div className="font-medium text-white">{battery.id}</div>
                              <div className="text-sm text-slate-400">
                                {battery.chemistry} • {(battery.cycles || 0).toLocaleString()} cycles
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
                              <div className="text-sm font-medium text-white">
                                {(battery.soh || 0).toFixed(1)}% SoH
                              </div>
                              <div className="text-xs text-slate-400">
                                {battery.rul || 0} cycles RUL
                              </div>
                            </div>
                          </div>
                        </div>
                        {battery.issues && Array.isArray(battery.issues) && battery.issues.length > 0 && (
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
              
              {filteredBatteries.length > ITEMS_PER_PAGE && (
                <PaginationControls />
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {analytics.totalBatteries}
                  </div>
                  <div className="text-sm text-slate-400">Total Batteries</div>
                </CardContent>
              </Card>
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {analytics.avgSoH}%
                  </div>
                  <div className="text-sm text-slate-400">Avg SoH</div>
                </CardContent>
              </Card>
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {analytics.criticalCount}
                  </div>
                  <div className="text-sm text-slate-400">Critical</div>
                </CardContent>
              </Card>
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">
                    {analytics.totalIssues}
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
    </main>
  );
}
