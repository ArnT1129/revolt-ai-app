import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Battery, Zap, AlertTriangle, Building2, Filter, Calendar, Activity } from 'lucide-react';
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

const ITEMS_PER_PAGE = 12; // 4 rows × 3 columns
const LOAD_MORE_THRESHOLD = 500; // pixels from bottom

const DEFAULT_FILTERS: SearchFilters = {
  chemistry: 'all',
  grade: 'all',
  status: 'all',
  sohRange: [0, 100],
  cycleRange: [0, 5000]
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('batteries');
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { isCompanyMode, currentCompany } = useCompany();
  const mountedRef = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setDisplayedCount(ITEMS_PER_PAGE); // Reset displayed count when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load batteries function
  const loadBatteries = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await batteryService.getUserBatteries();
      if (mountedRef.current) {
        setBatteries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching batteries:', err);
      if (mountedRef.current) {
        setError('Failed to load batteries');
        setBatteries([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial load and company mode change detection
  useEffect(() => {
    loadBatteries();
  }, [loadBatteries, isCompanyMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - LOAD_MORE_THRESHOLD;

    if (isNearBottom && !isLoadingMore && displayedCount < filteredBatteries.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredBatteries.length));
        setIsLoadingMore(false);
      }, 300);
    }
  }, [displayedCount, isLoadingMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Memoized filter function
  const filteredBatteries = useMemo(() => {
    if (!Array.isArray(batteries)) return [];

    return batteries.filter(battery => {
      // Text search
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        const searchFields = [
          battery.id || '',
          battery.chemistry || '',
          battery.grade || '',
          battery.status || '',
          battery.notes || ''
        ].map(field => field.toLowerCase());

        const matchesBasicFields = searchFields.some(field => field.includes(query));
        
        if (!matchesBasicFields && battery.issues && Array.isArray(battery.issues)) {
          const matchesIssues = battery.issues.some(issue => {
            if (!issue || typeof issue !== 'object') return false;
            const issueFields = [
              issue.title || '',
              issue.description || '',
              issue.category || ''
            ].map(field => field.toLowerCase());
            return issueFields.some(field => field.includes(query));
          });
          
          if (!matchesIssues) return false;
        } else if (!matchesBasicFields) {
          return false;
        }
      }

      // Apply filters
      if (filters.chemistry !== 'all' && battery.chemistry !== filters.chemistry) return false;
      if (filters.grade !== 'all' && battery.grade !== filters.grade) return false;
      if (filters.status !== 'all' && battery.status !== filters.status) return false;

      const soh = typeof battery.soh === 'number' ? battery.soh : 0;
      const cycles = typeof battery.cycles === 'number' ? battery.cycles : 0;
      
      if (soh < filters.sohRange[0] || soh > filters.sohRange[1]) return false;
      if (cycles < filters.cycleRange[0] || cycles > filters.cycleRange[1]) return false;

      return true;
    });
  }, [batteries, debouncedSearchQuery, filters]);

  // Get displayed batteries
  const displayedBatteries = useMemo(() => {
    return filteredBatteries.slice(0, displayedCount);
  }, [filteredBatteries, displayedCount]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [filters]);

  // Analytics
  const analytics = useMemo(() => {
    if (!filteredBatteries.length) {
      return { totalBatteries: 0, avgSoH: 0, criticalCount: 0, totalIssues: 0 };
    }

    const validBatteries = filteredBatteries.filter(b => 
      b && typeof b.soh === 'number' && typeof b.status === 'string'
    );

    if (!validBatteries.length) {
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
  }, [filteredBatteries]);

  // Event handlers
  const handleRetry = useCallback(() => { 
    loadBatteries(); 
  }, [loadBatteries]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
    setDisplayedCount(ITEMS_PER_PAGE);
  }, []);

  const updateFilters = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Utility functions
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

  const formatDate = useCallback((date: string | Date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }, []);

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
          <Button onClick={handleRetry} className="glass-button">
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
            Battery Fleet Overview
          </h1>
          <p className="text-muted-foreground text-lg">Battery passport search and fleet analytics</p>
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
              Fleet ({filteredBatteries.length})
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
            <div 
              ref={scrollContainerRef}
              className="h-[calc(100vh-400px)] overflow-y-auto pr-2"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #1e293b' }}
            >
              <div className="space-y-4">
                {displayedBatteries.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    {batteries.length === 0 ? 'No batteries found' : 'No batteries match your search criteria'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedBatteries.map((battery) => (
                      <Card 
                        key={battery.id} 
                        className="enhanced-card cursor-pointer hover:border-blue-400/50 transition-all group"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Battery className="h-5 w-5 text-blue-400" />
                              <CardTitle className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {battery.id}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge className={getGradeColor(battery.grade)} variant="secondary">
                                {battery.grade}
                              </Badge>
                              <Badge className={getStatusColor(battery.status)} variant="secondary">
                                {battery.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/20 rounded-lg p-2">
                              <div className="text-xs text-slate-400">State of Health</div>
                              <div className="text-lg font-semibold text-green-400">
                                {(battery.soh || 0).toFixed(1)}%
                              </div>
                            </div>
                            <div className="bg-black/20 rounded-lg p-2">
                              <div className="text-xs text-slate-400">Remaining Life</div>
                              <div className="text-lg font-semibold text-cyan-400">
                                {(battery.rul || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Technical Details */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Chemistry:</span>
                              <span className="text-white font-medium">{battery.chemistry}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Cycles:</span>
                              <span className="text-white font-medium">{(battery.cycles || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Capacity:</span>
                              <span className="text-white font-medium">{battery.capacity || 'N/A'} Ah</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Voltage:</span>
                              <span className="text-white font-medium">{battery.voltage || 'N/A'} V</span>
                            </div>
                          </div>

                          {/* Timestamps */}
                          <div className="space-y-1 pt-2 border-t border-white/10">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Calendar className="h-3 w-3" />
                              <span>Mfg: {formatDate(battery.manufactureDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Activity className="h-3 w-3" />
                              <span>Updated: {formatDate(battery.lastUpdated)}</span>
                            </div>
                          </div>

                          {/* Issues Alert */}
                          {battery.issues && Array.isArray(battery.issues) && battery.issues.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-orange-400" />
                              <span className="text-xs text-orange-400">
                                {battery.issues.length} active issue{battery.issues.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Loading More Indicator */}
                {isLoadingMore && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                    <p className="text-slate-400 text-sm">Loading more batteries...</p>
                  </div>
                )}
                
                {/* Load More Button (fallback) */}
                {!isLoadingMore && displayedCount < filteredBatteries.length && (
                  <div className="text-center py-4">
                    <Button
                      onClick={() => setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredBatteries.length))}
                      variant="outline"
                      className="glass-button"
                    >
                      Load More ({filteredBatteries.length - displayedCount} remaining)
                    </Button>
                  </div>
                )}
                
                {/* End of Results */}
                {displayedCount >= filteredBatteries.length && filteredBatteries.length > ITEMS_PER_PAGE && (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">
                      Showing all {filteredBatteries.length} batteries
                    </p>
                  </div>
                )}
              </div>
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
                  onChange={(e) => updateFilters('chemistry', e.target.value)}
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
                  onChange={(e) => updateFilters('grade', e.target.value)}
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
                  onChange={(e) => updateFilters('status', e.target.value)}
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
