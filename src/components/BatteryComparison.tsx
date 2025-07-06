
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { batteryService } from '@/services/batteryService';
import { Battery } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Zap, Activity, Thermometer, Users, FileCheck } from 'lucide-react';

interface ComparisonMetric {
  key: string;
  label: string;
  unit: string;
  getValue: (battery: Battery) => number;
  format?: (value: number) => string;
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  { key: 'soh', label: 'State of Health', unit: '%', getValue: (b) => b.soh },
  { key: 'rul', label: 'Remaining Useful Life', unit: 'cycles', getValue: (b) => b.rul },
  { key: 'cycles', label: 'Cycle Count', unit: 'cycles', getValue: (b) => b.cycles },
  { key: 'efficiency', label: 'Estimated Efficiency', unit: '%', getValue: (b) => Math.max(0, 100 - (100 - b.soh) * 1.2) },
];

const COMPARISON_CATEGORIES = [
  { value: 'soh', label: 'State of Health' },
  { value: 'performance', label: 'Performance Metrics' },
  { value: 'temperature', label: 'Temperature Analysis' },
];

export default function BatteryComparison() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([]);
  const [comparisonCategory, setComparisonCategory] = useState('soh');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatteries();
  }, []);

  const loadBatteries = async () => {
    try {
      const data = await batteryService.getUserBatteries();
      setBatteries(data);
    } catch (error) {
      console.error('Error loading batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatterySelection = (batteryId: string, checked: boolean) => {
    setSelectedBatteries(prev => 
      checked 
        ? [...prev, batteryId]
        : prev.filter(id => id !== batteryId)
    );
  };

  const getComparisonData = () => {
    const selected = batteries.filter(b => selectedBatteries.includes(b.id));
    
    return COMPARISON_METRICS.map(metric => ({
      metric: metric.label,
      ...selected.reduce((acc, battery) => ({
        ...acc,
        [battery.id]: metric.getValue(battery)
      }), {} as Record<string, number>)
    }));
  };

  const getRadarData = () => {
    const selected = batteries.filter(b => selectedBatteries.includes(b.id));
    
    return COMPARISON_METRICS.map(metric => ({
      metric: metric.label,
      ...selected.reduce((acc, battery) => ({
        ...acc,
        [battery.id]: metric.getValue(battery)
      }), {} as Record<string, number>)
    }));
  };

  const getTrendComparison = (batteryId: string, metric: string) => {
    const battery = batteries.find(b => b.id === batteryId);
    if (!battery || !battery.sohHistory || battery.sohHistory.length < 2) return 'stable';
    
    const recent = battery.sohHistory.slice(-5);
    const trend = recent[recent.length - 1].soh - recent[0].soh;
    
    if (trend > 1) return 'improving';
    if (trend < -1) return 'declining';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Minus className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-600/80 text-green-100';
      case 'Degrading': return 'bg-yellow-600/80 text-yellow-100';
      case 'Critical': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const selectedBatteriesData = batteries.filter(b => selectedBatteries.includes(b.id));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading batteries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Battery Selection */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Select Batteries to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batteries.map(battery => (
              <div key={battery.id} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/40 border border-slate-600/30">
                <Checkbox
                  id={battery.id}
                  checked={selectedBatteries.includes(battery.id)}
                  onCheckedChange={(checked) => handleBatterySelection(battery.id, checked as boolean)}
                  className="border-slate-400"
                />
                <div className="flex-1 min-w-0">
                  <label htmlFor={battery.id} className="text-sm font-medium text-white cursor-pointer">
                    {battery.id}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${getStatusColor(battery.status)} border-0`}>
                      {battery.status}
                    </Badge>
                    <span className="text-xs text-slate-400">{battery.chemistry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedBatteries.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select batteries to start comparing</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBatteries.length > 0 && (
        <>
          {/* Comparison Controls */}
          <Card className="enhanced-card">
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <span className="text-sm font-medium text-slate-300">Comparison Category:</span>
                <Select value={comparisonCategory} onValueChange={setComparisonCategory}>
                  <SelectTrigger className="w-48 glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPARISON_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="ml-auto text-sm text-slate-400">
                  Comparing {selectedBatteries.length} batteries
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Results */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="glass-button">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Comparison Table */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-600/30">
                            <th className="text-left py-2 text-slate-300">Battery</th>
                            <th className="text-left py-2 text-slate-300">SoH</th>
                            <th className="text-left py-2 text-slate-300">RUL</th>
                            <th className="text-left py-2 text-slate-300">Cycles</th>
                            <th className="text-left py-2 text-slate-300">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBatteriesData.map(battery => (
                            <tr key={battery.id} className="border-b border-slate-700/30">
                              <td className="py-3">
                                <div>
                                  <div className="font-medium text-white">{battery.id}</div>
                                  <div className="text-xs text-slate-400">{battery.chemistry}</div>
                                </div>
                              </td>
                              <td className="py-3 text-white">{battery.soh.toFixed(1)}%</td>
                              <td className="py-3 text-white">{battery.rul}</td>
                              <td className="py-3 text-white">{battery.cycles.toLocaleString()}</td>
                              <td className="py-3">
                                {getTrendIcon(getTrendComparison(battery.id, 'soh'))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Summary */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Best Performing:</span>
                        <span className="text-green-300 font-medium">
                          {selectedBatteriesData.reduce((best, current) => 
                            current.soh > best.soh ? current : best
                          ).id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Most Cycled:</span>
                        <span className="text-blue-300 font-medium">
                          {selectedBatteriesData.reduce((most, current) => 
                            current.cycles > most.cycles ? current : most
                          ).id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Average SoH:</span>
                        <span className="text-white font-medium">
                          {(selectedBatteriesData.reduce((sum, b) => sum + b.soh, 0) / selectedBatteriesData.length).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="charts">
              <div className="space-y-6">
                {/* Bar Chart Comparison */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white">Metrics Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getComparisonData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="metric" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }} 
                          />
                          {selectedBatteriesData.map((battery, index) => (
                            <Bar 
                              key={battery.id} 
                              dataKey={battery.id} 
                              fill={`hsl(${200 + index * 60}, 70%, 50%)`}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Radar Chart */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Radar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={getRadarData()}>
                          <PolarGrid stroke="#374151" />
                          <PolarAngleAxis dataKey="metric" className="text-slate-300" />
                          <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} className="text-slate-400" />
                          {selectedBatteriesData.map((battery, index) => (
                            <Radar
                              key={battery.id}
                              name={battery.id}
                              dataKey={battery.id}
                              stroke={`hsl(${200 + index * 60}, 70%, 50%)`}
                              fill={`hsl(${200 + index * 60}, 70%, 50%)`}
                              fillOpacity={0.1}
                            />
                          ))}
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }} 
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed">
              <div className="space-y-6">
                {selectedBatteriesData.map(battery => (
                  <Card key={battery.id} className="enhanced-card">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>{battery.id}</span>
                        <Badge className={`${getStatusColor(battery.status)} border-0`}>
                          {battery.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-slate-400">SoH</span>
                          </div>
                          <div className="text-xl font-bold text-white">{battery.soh.toFixed(1)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-slate-400">RUL</span>
                          </div>
                          <div className="text-xl font-bold text-white">{battery.rul}</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-sm text-slate-400">Cycles</span>
                          </div>
                          <div className="text-xl font-bold text-white">{battery.cycles.toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-sm text-slate-400">Chemistry</span>
                          </div>
                          <div className="text-xl font-bold text-white">{battery.chemistry}</div>
                        </div>
                      </div>
                      
                      {battery.issues && battery.issues.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Thermometer className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-300">Active Issues</span>
                          </div>
                          <div className="text-sm text-amber-200">
                            {battery.issues.length} issue(s) detected
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
