
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { batteryService } from '@/services/batteryService';
import { DemoService } from '@/services/demoService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Battery } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Battery as BatteryIcon, Zap, TrendingUp, Calendar, AlertTriangle, Compare } from 'lucide-react';

export default function BatteryComparison() {
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([]);
  const [comparisonMetric, setComparisonMetric] = useState<string>('soh');
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
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
      const userBatteries = await batteryService.getUserBatteries();
      
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
      const combined = DemoService.getCombinedBatteries(userBatteries, isDemoUser);
      setAllBatteries(combined);
      
      // Auto-select first few batteries for demo users
      if (isDemoUser && combined.length >= 2) {
        setSelectedBatteries(combined.slice(0, Math.min(3, combined.length)).map(b => b.id));
      }
    } catch (error) {
      console.error('Error loading batteries:', error);
      // Fallback to demo data
      const demoBatteries = DemoService.getDemoBatteries();
      setAllBatteries(demoBatteries);
      if (demoBatteries.length >= 2) {
        setSelectedBatteries(demoBatteries.slice(0, 3).map(b => b.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBatteryToggle = (batteryId: string, checked: boolean) => {
    if (checked) {
      if (selectedBatteries.length < 5) {
        setSelectedBatteries(prev => [...prev, batteryId]);
      }
    } else {
      setSelectedBatteries(prev => prev.filter(id => id !== batteryId));
    }
  };

  const getComparisonData = () => {
    const selected = allBatteries.filter(b => selectedBatteries.includes(b.id));
    return selected.map(battery => ({
      name: battery.id,
      value: getMetricValue(battery, comparisonMetric),
      battery: battery
    }));
  };

  const getMetricValue = (battery: Battery, metric: string) => {
    switch (metric) {
      case 'soh': return battery.soh;
      case 'rul': return battery.rul;
      case 'cycles': return battery.cycles;
      default: return 0;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'soh': return 'State of Health (%)';
      case 'rul': return 'Remaining Useful Life';
      case 'cycles': return 'Cycle Count';
      default: return '';
    }
  };

  const getBarColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[index % colors.length];
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading batteries...</p>
        </div>
      </div>
    );
  }

  const comparisonData = getComparisonData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Compare className="h-6 w-6 text-blue-400" />
            Battery Comparison
          </h2>
          <p className="text-slate-400">
            Compare up to 5 batteries side by side
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={comparisonMetric} onValueChange={setComparisonMetric}>
            <SelectTrigger className="w-48 glass-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soh">State of Health</SelectItem>
              <SelectItem value="rul">Remaining Useful Life</SelectItem>
              <SelectItem value="cycles">Cycle Count</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-slate-300">
            {selectedBatteries.length}/5 selected
          </Badge>
        </div>
      </div>

      {allBatteries.length === 0 ? (
        <Card className="enhanced-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BatteryIcon className="h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Batteries Available</h3>
            <p className="text-slate-400 text-center">
              Upload battery data to start comparing batteries
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Battery Selection */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white">Select Batteries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {allBatteries.map((battery) => (
                <div key={battery.id} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/40 border border-slate-600/30">
                  <Checkbox
                    id={battery.id}
                    checked={selectedBatteries.includes(battery.id)}
                    onCheckedChange={(checked) => handleBatteryToggle(battery.id, checked as boolean)}
                    disabled={!selectedBatteries.includes(battery.id) && selectedBatteries.length >= 5}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <label htmlFor={battery.id} className="text-white font-medium cursor-pointer">
                        {battery.id}
                      </label>
                      {battery.id.startsWith('DEMO-') && (
                        <Badge variant="outline" className="text-amber-300 border-amber-500/50 text-xs">
                          Demo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(battery.status)} text-xs`}>
                        {battery.status}
                      </Badge>
                      <Badge className={`${getGradeColor(battery.grade)} text-xs`}>
                        Grade {battery.grade}
                      </Badge>
                      <span className="text-xs text-slate-500">{battery.chemistry}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <div className="lg:col-span-2">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">
                  {getMetricLabel(comparisonMetric)} Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBatteries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Compare className="h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select Batteries to Compare</h3>
                    <p className="text-slate-400 text-center">
                      Choose at least 2 batteries from the list to start comparing
                    </p>
                  </div>
                ) : selectedBatteries.length === 1 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Compare className="h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select More Batteries</h3>
                    <p className="text-slate-400 text-center">
                      Add at least one more battery to enable comparison
                    </p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {comparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Detailed Comparison Table */}
      {selectedBatteries.length >= 2 && (
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left text-slate-300 py-3 px-4">Metric</th>
                    {allBatteries
                      .filter(b => selectedBatteries.includes(b.id))
                      .map(battery => (
                        <th key={battery.id} className="text-left text-slate-300 py-3 px-4">
                          <div className="flex items-center gap-2">
                            {battery.id}
                            {battery.id.startsWith('DEMO-') && (
                              <Badge variant="outline" className="text-amber-300 border-amber-500/50 text-xs">
                                Demo
                              </Badge>
                            )}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-slate-400 flex items-center gap-2">
                      <BatteryIcon className="h-4 w-4" />
                      State of Health
                    </td>
                    {allBatteries
                      .filter(b => selectedBatteries.includes(b.id))
                      .map(battery => (
                        <td key={battery.id} className="py-3 px-4 text-white font-medium">
                          {battery.soh.toFixed(1)}%
                        </td>
                      ))}
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-slate-400 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Remaining Useful Life
                    </td>
                    {allBatteries
                      .filter(b => selectedBatteries.includes(b.id))
                      .map(battery => (
                        <td key={battery.id} className="py-3 px-4 text-white font-medium">
                          {battery.rul.toLocaleString()}
                        </td>
                      ))}
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-slate-400 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Cycle Count
                    </td>
                    {allBatteries
                      .filter(b => selectedBatteries.includes(b.id))
                      .map(battery => (
                        <td key={battery.id} className="py-3 px-4 text-white font-medium">
                          {battery.cycles.toLocaleString()}
                        </td>
                      ))}
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-slate-400">Status</td>
                    {allBatteries
                      .filter(b => selectedBatteries.includes(b.id))
                      .map(battery => (
                        <td key={battery.id} className="py-3 px-4">
                          <Badge className={getStatusColor(battery.status)}>
                            {battery.status}
                          </Badge>
                        </td>
                      ))}
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-slate-400">Grade</td>
                    {allBatteries
                      .filter(b => selectedBatteries.includes(b.id))
                      .map(battery => (
                        <td key={battery.id} className="py-3 px-4">
                          <Badge className={getGradeColor(battery.grade)}>
                            Grade {battery.grade}
                          </Badge>
                        </td>
                      ))}
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-slate-400">Chemistry</td>
                    {allBatteries
                      .filter(b => selectedBatteries.includes(b.id))
                      .map(battery => (
                        <td key={battery.id} className="py-3 px-4 text-white">
                          {battery.chemistry}
                        </td>
                      ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Upload Date
                    </td>
                    {allBatteries
                      .filter(b => selectedBatteries.includes(b.id))
                      .map(battery => (
                        <td key={battery.id} className="py-3 px-4 text-white">
                          {new Date(battery.uploadDate).toLocaleDateString()}
                        </td>
                      ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
