import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Battery, TrendingUp, Zap, Thermometer, Calendar, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useBatteryStore } from '@/services/batteryService';
import type { Battery as BatteryType } from '@/types';

type ComparisonMetric = 'soh' | 'performance' | 'temperature';

interface ComparisonData {
  metric: string;
  [key: string]: any;
}

export default function BatteryComparison() {
  const { batteries } = useBatteryStore();
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([]);
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>('soh');
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'radar'>('chart');

  useEffect(() => {
    // Auto-select first two batteries for comparison
    if (batteries.length >= 2 && selectedBatteries.length === 0) {
      setSelectedBatteries([batteries[0].id, batteries[1].id]);
    }
  }, [batteries, selectedBatteries.length]);

  const getSelectedBatteries = () => {
    return batteries.filter(battery => selectedBatteries.includes(battery.id));
  };

  const getComparisonData = (): ComparisonData[] => {
    const selected = getSelectedBatteries();
    
    if (comparisonMetric === 'soh') {
      // Create SoH history comparison
      const maxCycles = Math.max(...selected.map(b => Math.max(...b.sohHistory.map(h => h.cycle))));
      const data: ComparisonData[] = [];
      
      for (let cycle = 0; cycle <= maxCycles; cycle += 50) {
        const dataPoint: ComparisonData = { metric: `Cycle ${cycle}` };
        
        selected.forEach(battery => {
          const closestPoint = battery.sohHistory.reduce((prev, curr) => 
            Math.abs(curr.cycle - cycle) < Math.abs(prev.cycle - cycle) ? curr : prev
          );
          dataPoint[battery.id] = closestPoint.soh;
        });
        
        data.push(dataPoint);
      }
      
      return data;
    } else if (comparisonMetric === 'performance') {
      // Performance metrics comparison
      return [
        {
          metric: 'SoH (%)',
          ...Object.fromEntries(selected.map(b => [b.id, b.soh]))
        },
        {
          metric: 'RUL (cycles)',
          ...Object.fromEntries(selected.map(b => [b.id, b.rul]))
        },
        {
          metric: 'Cycles',
          ...Object.fromEntries(selected.map(b => [b.id, b.cycles]))
        }
      ];
    } else {
      // Temperature comparison (mock data)
      return [
        {
          metric: 'Min Temp (°C)',
          ...Object.fromEntries(selected.map(b => [b.id, Math.random() * 10 + 15]))
        },
        {
          metric: 'Max Temp (°C)',
          ...Object.fromEntries(selected.map(b => [b.id, Math.random() * 20 + 40]))
        },
        {
          metric: 'Avg Temp (°C)',
          ...Object.fromEntries(selected.map(b => [b.id, Math.random() * 15 + 25]))
        }
      ];
    }
  };

  const getRadarData = () => {
    const selected = getSelectedBatteries();
    const metrics = ['SoH', 'RUL', 'Efficiency', 'Stability', 'Performance'];
    
    return metrics.map(metric => {
      const dataPoint: any = { metric };
      selected.forEach(battery => {
        // Normalize different metrics to 0-100 scale for radar chart
        switch (metric) {
          case 'SoH':
            dataPoint[battery.id] = battery.soh;
            break;
          case 'RUL':
            dataPoint[battery.id] = Math.min(100, (battery.rul / 2000) * 100);
            break;
          case 'Efficiency':
            dataPoint[battery.id] = Math.random() * 30 + 70;
            break;
          case 'Stability':
            dataPoint[battery.id] = battery.status === 'Healthy' ? 90 : battery.status === 'Degrading' ? 60 : 30;
            break;
          case 'Performance':
            dataPoint[battery.id] = (battery.soh + (battery.rul / 20)) / 2;
            break;
        }
      });
      return dataPoint;
    });
  };

  const toggleBatterySelection = (batteryId: string) => {
    setSelectedBatteries(prev => {
      if (prev.includes(batteryId)) {
        return prev.filter(id => id !== batteryId);
      } else if (prev.length < 4) {
        return [...prev, batteryId];
      } else {
        return prev;
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'text-green-400';
      case 'Degrading': return 'text-yellow-400';
      case 'Critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-600/80 text-green-100';
      case 'B': return 'bg-blue-600/80 text-blue-100';
      case 'C': return 'bg-yellow-600/80 text-yellow-100';
      case 'D': return 'bg-red-600/80 text-red-100';
      default: return 'bg-slate-600/80 text-slate-100';
    }
  };

  const selected = getSelectedBatteries();
  const comparisonData = getComparisonData();
  const radarData = getRadarData();

  // Define colors for different batteries in charts
  const batteryColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Battery className="h-6 w-6 text-blue-400" />
            Battery Comparison
          </h2>
          <p className="text-slate-400">Compare multiple batteries side by side</p>
        </div>
        <div className="flex gap-2">
          <Select value={comparisonMetric} onValueChange={(value: ComparisonMetric) => setComparisonMetric(value)}>
            <SelectTrigger className="glass-input w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soh">SoH Trends</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
            </SelectContent>
          </Select>
          <Select value={viewMode} onValueChange={(value: 'chart' | 'table' | 'radar') => setViewMode(value)}>
            <SelectTrigger className="glass-input w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chart">Chart</SelectItem>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="radar">Radar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Battery Selection */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Select Batteries to Compare (max 4)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {batteries.map(battery => (
              <div 
                key={battery.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedBatteries.includes(battery.id)
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-slate-600/50 bg-slate-800/40 hover:bg-slate-700/40'
                }`}
                onClick={() => toggleBatterySelection(battery.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{battery.id}</span>
                  <Badge className={getGradeColor(battery.grade)}>
                    Grade {battery.grade}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">SoH:</span>
                    <span className="text-white">{battery.soh}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={getStatusColor(battery.status)}>{battery.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chemistry:</span>
                    <span className="text-white">{battery.chemistry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedBatteries.length === 0 && (
            <div className="text-center py-4 text-slate-400">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Select batteries to start comparison</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <>
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="enhanced-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Battery className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-400">Comparing</p>
                    <p className="text-lg font-bold text-white">{selected.length} Batteries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-sm text-slate-400">Best SoH</p>
                    <p className="text-lg font-bold text-white">
                      {Math.max(...selected.map(b => b.soh))}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  <div>
                    <p className="text-sm text-slate-400">Avg RUL</p>
                    <p className="text-lg font-bold text-white">
                      {Math.round(selected.reduce((sum, b) => sum + b.rul, 0) / selected.length)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-purple-400" />
                  <div>
                    <p className="text-sm text-slate-400">Total Cycles</p>
                    <p className="text-lg font-bold text-white">
                      {selected.reduce((sum, b) => sum + b.cycles, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Comparison View */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white">
                {comparisonMetric === 'soh' ? 'SoH Trend Analysis' :
                 comparisonMetric === 'performance' ? 'Performance Comparison' :
                 'Temperature Analysis'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'chart' && (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    {comparisonMetric === 'soh' ? (
                      <LineChart data={comparisonData}>
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
                        <Legend />
                        {selected.map((battery, index) => (
                          <Line
                            key={battery.id}
                            type="monotone"
                            dataKey={battery.id}
                            stroke={batteryColors[index]}
                            strokeWidth={2}
                            name={battery.id}
                          />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={comparisonData}>
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
                        <Legend />
                        {selected.map((battery, index) => (
                          <Bar
                            key={battery.id}
                            dataKey={battery.id}
                            fill={batteryColors[index]}
                            name={battery.id}
                          />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {viewMode === 'radar' && (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF' }} />
                      <PolarRadiusAxis tick={{ fill: '#9CA3AF' }} />
                      {selected.map((battery, index) => (
                        <Radar
                          key={battery.id}
                          name={battery.id}
                          dataKey={battery.id}
                          stroke={batteryColors[index]}
                          fill={batteryColors[index]}
                          fillOpacity={0.1}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-4 text-slate-300">Metric</th>
                        {selected.map(battery => (
                          <th key={battery.id} className="text-center py-3 px-4 text-slate-300">
                            {battery.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b border-slate-700/50">
                          <td className="py-3 px-4 text-white font-medium">{row.metric}</td>
                          {selected.map(battery => (
                            <td key={battery.id} className="text-center py-3 px-4 text-slate-300">
                              {typeof row[battery.id] === 'number' 
                                ? row[battery.id].toFixed(1)
                                : row[battery.id] || 'N/A'
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Comparison Table */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white">Detailed Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300">Property</th>
                      {selected.map(battery => (
                        <th key={battery.id} className="text-center py-3 px-4 text-slate-300">
                          {battery.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-white font-medium">Grade</td>
                      {selected.map(battery => (
                        <td key={battery.id} className="text-center py-3 px-4">
                          <Badge className={getGradeColor(battery.grade)}>
                            {battery.grade}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-white font-medium">Status</td>
                      {selected.map(battery => (
                        <td key={battery.id} className="text-center py-3 px-4">
                          <span className={getStatusColor(battery.status)}>
                            {battery.status}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-white font-medium">Chemistry</td>
                      {selected.map(battery => (
                        <td key={battery.id} className="text-center py-3 px-4 text-slate-300">
                          {battery.chemistry}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-white font-medium">SoH (%)</td>
                      {selected.map(battery => (
                        <td key={battery.id} className="text-center py-3 px-4 text-slate-300">
                          {battery.soh}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-white font-medium">RUL (cycles)</td>
                      {selected.map(battery => (
                        <td key={battery.id} className="text-center py-3 px-4 text-slate-300">
                          {battery.rul}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-white font-medium">Total Cycles</td>
                      {selected.map(battery => (
                        <td key={battery.id} className="text-center py-3 px-4 text-slate-300">
                          {battery.cycles}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-white font-medium">Upload Date</td>
                      {selected.map(battery => (
                        <td key={battery.id} className="text-center py-3 px-4 text-slate-300">
                          {new Date(battery.uploadDate).toLocaleDateString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-white font-medium">Issues</td>
                      {selected.map(battery => (
                        <td key={battery.id} className="text-center py-3 px-4">
                          {battery.issues?.length ? (
                            <div className="flex items-center justify-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                              <span className="text-yellow-400">{battery.issues.length}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="text-green-400">0</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
