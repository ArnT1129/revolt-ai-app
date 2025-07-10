
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BatteryPassportModal from '@/components/BatteryPassportModal';
import { batteryService } from '@/services/batteryService';
import { DemoService } from '@/services/demoService';
import { Search, Filter, Download, Eye, BatteryFull, Zap, TrendingUp, Activity, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Battery } from '@/types';

export default function SearchPage() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chemistryFilter, setChemistryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadBatteries();
    
    // Listen for battery data updates
    const handleBatteryUpdate = () => {
      loadBatteries();
    };
    
    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    return () => window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
  }, [user]);

  const loadBatteries = async () => {
    try {
      setLoading(true);
      const batteryData = await batteryService.getUserBatteries();
      setBatteries(batteryData);
      
      // Check if user is demo
      let isDemoUser = false;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_demo')
          .eq('id', user.id)
          .single();
        
        isDemoUser = profile?.is_demo || false;
        setIsDemo(isDemoUser);
      }
      
      // Combine real batteries with demo batteries when appropriate
      const combined = DemoService.getCombinedBatteries(batteryData, isDemoUser);
      setAllBatteries(combined);
    } catch (error) {
      console.error('Error loading batteries:', error);
      // Fallback to demo data if there's an error
      const demoBatteries = DemoService.getDemoBatteries();
      setAllBatteries(demoBatteries);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatteries = useMemo(() => {
    return allBatteries.filter(battery => {
      const matchesSearch = battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          battery.chemistry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || battery.status === statusFilter;
      const matchesChemistry = chemistryFilter === 'all' || battery.chemistry === chemistryFilter;
      const matchesGrade = gradeFilter === 'all' || battery.grade === gradeFilter;
      
      return matchesSearch && matchesStatus && matchesChemistry && matchesGrade;
    });
  }, [allBatteries, searchTerm, statusFilter, chemistryFilter, gradeFilter]);

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
    a.download = 'battery-data.csv';
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
      case 'A': return 'bg-blue-600/80 text-blue-100';
      case 'B': return 'bg-green-600/80 text-green-100';
      case 'C': return 'bg-yellow-600/80 text-yellow-100';
      case 'D': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const getHealthBarColor = (soh: number) => {
    if (soh >= 90) return 'bg-green-500';
    if (soh >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-1/4"></div>
          <div className="h-12 bg-white/10 rounded"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Battery Search</h1>
            <p className="text-slate-400">
              Search and filter through your battery fleet
            </p>
          </div>
          <Button onClick={exportToCsv} variant="outline" className="glass-button">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              
              <div className="text-sm text-slate-400 flex items-center">
                Showing {filteredBatteries.length} of {allBatteries.length} batteries
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Battery Grid */}
        {filteredBatteries.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBatteries.map((battery) => (
              <div key={battery.id} className="enhanced-card p-6 hover:scale-105 transition-all duration-300 border border-white/10">
                {/* Header with ID and Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BatteryFull className="h-5 w-5 text-blue-400" />
                    <h3 className="font-bold text-white text-lg">{battery.id}</h3>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(battery.status)}`}>
                    {battery.status}
                  </Badge>
                </div>

                {/* Grade, Chemistry, Demo badges */}
                <div className="flex gap-2 mb-4">
                  <Badge className={`text-xs ${getGradeColor(battery.grade)}`}>
                    Grade {battery.grade}
                  </Badge>
                  <Badge className="bg-gray-600/80 text-gray-100 text-xs">
                    {battery.chemistry}
                  </Badge>
                  {battery.id.startsWith('DEMO-') && (
                    <Badge className="bg-purple-600/80 text-purple-100 text-xs">
                      Demo
                    </Badge>
                  )}
                </div>

                {/* SoH and RUL Display */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <span className="text-slate-400 text-sm">SoH</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{battery.soh.toFixed(1)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-slate-400 text-sm">RUL</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">{battery.rul.toLocaleString()}</div>
                  </div>
                </div>

                {/* Cycles and Upload Date */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <div>
                      <p className="text-slate-400">Cycles</p>
                      <p className="text-white font-medium">{battery.cycles.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className="text-slate-400">Uploaded</p>
                      <p className="text-white font-medium text-xs">{formatDate(battery.uploadDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Health Status Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Health Status</span>
                    <span className="text-white font-medium">{battery.soh.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getHealthBarColor(battery.soh)}`}
                      style={{ width: `${battery.soh}%` }}
                    ></div>
                  </div>
                </div>

                {/* Issues Alert */}
                {battery.issues && battery.issues.length > 0 && (
                  <div className="mb-4 p-2 rounded border border-yellow-500/50 bg-yellow-900/20">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 text-yellow-400">⚠</div>
                      <span className="text-yellow-400 text-sm font-medium">
                        {battery.issues.length} issue{battery.issues.length > 1 ? 's' : ''} detected
                      </span>
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <Button 
                  onClick={() => handleViewDetails(battery)}
                  className="w-full glass-button flex items-center gap-2"
                  variant="outline"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Card className="enhanced-card">
            <CardContent className="text-center py-12">
              <BatteryFull className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No batteries found</h3>
              <p className="text-slate-400">Try adjusting your search criteria or upload battery data to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

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
