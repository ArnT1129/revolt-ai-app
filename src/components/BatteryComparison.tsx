
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GitCompare, TrendingUp, Battery } from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import type { Battery as BatteryType } from '@/types';

export default function BatteryComparison() {
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBattery1, setSelectedBattery1] = useState<string>('');
  const [selectedBattery2, setSelectedBattery2] = useState<string>('');

  useEffect(() => {
    loadBatteries();
    
    // Listen for battery data updates
    const handleBatteryUpdate = () => {
      loadBatteries();
    };
    
    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    return () => window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
  }, []);

  const loadBatteries = async () => {
    try {
      setLoading(true);
      const data = await batteryService.getUserBatteries();
      setBatteries(data);
      
      // Auto-select first two batteries if available
      if (data.length >= 2) {
        setSelectedBattery1(data[0].id);
        setSelectedBattery2(data[1].id);
      }
    } catch (error) {
      console.error('Error loading batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const battery1 = batteries.find(b => b.id === selectedBattery1);
  const battery2 = batteries.find(b => b.id === selectedBattery2);

  // Generate comparison data
  const getComparisonData = () => {
    if (!battery1 || !battery2) return [];

    return [
      {
        metric: 'SoH',
        battery1: battery1.soh,
        battery2: battery2.soh,
        unit: '%'
      },
      {
        metric: 'RUL',
        battery1: battery1.rul,
        battery2: battery2.rul,
        unit: 'cycles'
      },
      {
        metric: 'Cycles',
        battery1: battery1.cycles,
        battery2: battery2.cycles,
        unit: 'cycles'
      }
    ];
  };

  // Generate radar chart data
  const getRadarData = () => {
    if (!battery1 || !battery2) return [];

    return [
      {
        subject: 'SoH',
        battery1: battery1.soh,
        battery2: battery2.soh,
        fullMark: 100
      },
      {
        subject: 'RUL (scaled)',
        battery1: Math.min(battery1.rul / 50, 100), // Scale RUL to 0-100
        battery2: Math.min(battery2.rul / 50, 100),
        fullMark: 100
      },
      {
        subject: 'Efficiency',
        battery1: Math.max(0, 100 - (battery1.cycles / 100)), // Simple efficiency calculation
        battery2: Math.max(0, 100 - (battery2.cycles / 100)),
        fullMark: 100
      }
    ];
  };

  // Generate historical trend data (mock data)
  const getTrendData = () => {
    if (!battery1 || !battery2) return [];

    return Array.from({ length: 10 }, (_, i) => ({
      cycle: i * 100,
      battery1: Math.max(battery1.soh - (i * 2) + (Math.random() * 2 - 1), 70),
      battery2: Math.max(battery2.soh - (i * 2) + (Math.random() * 2 - 1), 70)
    }));
  };

  const comparisonData = getComparisonData();
  const radarData = getRadarData();
  const trendData = getTrendData();

  if (loading) {
    return (
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Battery Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-white/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (batteries.length < 2) {
    return (
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Battery Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Battery className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">At least 2 batteries are required for comparison</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          Battery Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Battery Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Battery 1</label>
            <Select value={selectedBattery1} onValueChange={setSelectedBattery1}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select first battery" />
              </SelectTrigger>
              <SelectContent>
                {batteries.map((battery) => (
                  <SelectItem key={battery.id} value={battery.id}>
                    {battery.id} - {battery.chemistry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Battery 2</label>
            <Select value={selectedBattery2} onValueChange={setSelectedBattery2}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select second battery" />
              </SelectTrigger>
              <SelectContent>
                {batteries.map((battery) => (
                  <SelectItem key={battery.id} value={battery.id}>
                    {battery.id} - {battery.chemistry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {battery1 && battery2 && (
          <>
            {/* Battery Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="enhanced-card border-blue-500/50">
                <CardHeader>
                  <CardTitle className="text-blue-400 text-lg">{battery1.id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Chemistry</span>
                    <span className="text-white">{battery1.chemistry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Grade</span>
                    <Badge className="bg-blue-600/80 text-blue-100">{battery1.grade}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Status</span>
                    <Badge className={`${
                      battery1.status === 'Healthy' ? 'bg-green-600/80 text-green-100' :
                      battery1.status === 'Degrading' ? 'bg-yellow-600/80 text-yellow-100' :
                      'bg-red-600/80 text-red-100'
                    }`}>
                      {battery1.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">SoH</span>
                    <span className="text-white">{battery1.soh.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">RUL</span>
                    <span className="text-white">{battery1.rul} cycles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Cycles</span>
                    <span className="text-white">{battery1.cycles}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="enhanced-card border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-green-400 text-lg">{battery2.id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Chemistry</span>
                    <span className="text-white">{battery2.chemistry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Grade</span>
                    <Badge className="bg-green-600/80 text-green-100">{battery2.grade}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Status</span>
                    <Badge className={`${
                      battery2.status === 'Healthy' ? 'bg-green-600/80 text-green-100' :
                      battery2.status === 'Degrading' ? 'bg-yellow-600/80 text-yellow-100' :
                      'bg-red-600/80 text-red-100'
                    }`}>
                      {battery2.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">SoH</span>
                    <span className="text-white">{battery2.soh.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">RUL</span>
                    <span className="text-white">{battery2.rul} cycles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Cycles</span>
                    <span className="text-white">{battery2.cycles}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend Comparison */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    SoH Trend Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="cycle" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="battery1"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        name={battery1.id}
                      />
                      <Line
                        type="monotone"
                        dataKey="battery2"
                        stroke="#10B981"
                        strokeWidth={2}
                        name={battery2.id}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Radar Comparison */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Performance Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      />
                      <Radar
                        name={battery1.id}
                        dataKey="battery1"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.2}
                      />
                      <Radar
                        name={battery2.id}
                        dataKey="battery2"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.2}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Metric Comparison Table */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparisonData.map((item) => (
                    <div key={item.metric} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300 font-medium">{item.metric}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-blue-400">
                          {item.battery1.toFixed(1)} {item.unit}
                        </span>
                        <span className="text-slate-500">vs</span>
                        <span className="text-green-400">
                          {item.battery2.toFixed(1)} {item.unit}
                        </span>
                        <div className="w-16 text-right">
                          {item.battery1 > item.battery2 ? (
                            <Badge className="bg-blue-600/80 text-blue-100">Better</Badge>
                          ) : item.battery1 < item.battery2 ? (
                            <Badge className="bg-red-600/80 text-red-100">Lower</Badge>
                          ) : (
                            <Badge className="bg-gray-600/80 text-gray-100">Equal</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}
