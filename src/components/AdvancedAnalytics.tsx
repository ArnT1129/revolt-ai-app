
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import type { Battery } from '@/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AdvancedAnalytics() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error loading batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Data processing
  const sohDistribution = batteries.reduce((acc, battery) => {
    const range = Math.floor(battery.soh / 10) * 10;
    const key = `${range}-${range + 10}%`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sohData = Object.entries(sohDistribution).map(([range, count]) => ({
    range,
    count
  }));

  const statusDistribution = batteries.reduce((acc, battery) => {
    acc[battery.status] = (acc[battery.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
    name: status,
    value: count
  }));

  const chemistryDistribution = batteries.reduce((acc, battery) => {
    acc[battery.chemistry] = (acc[battery.chemistry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chemistryData = Object.entries(chemistryDistribution).map(([chemistry, count]) => ({
    name: chemistry,
    value: count
  }));

  const gradeDistribution = batteries.reduce((acc, battery) => {
    acc[battery.grade] = (acc[battery.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: `Grade ${grade}`,
    value: count
  }));

  // Sample trend data (would come from historical data in real app)
  const trendData = Array.from({ length: 12 }, (_, i) => ({
    month: `Month ${i + 1}`,
    avgSoH: 95 - (i * 2) + (Math.random() * 4 - 2),
    totalBatteries: batteries.length + Math.floor(Math.random() * 10),
    criticalCount: Math.floor(Math.random() * 5)
  }));

  if (loading) {
    return (
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics
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

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Advanced Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-button">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="health">Health Analysis</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Chemistry Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chemistryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">State of Health Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sohData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="range" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={gradeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {gradeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Battery Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">{batteries.length}</p>
                      <p className="text-sm text-slate-400">Total Batteries</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">
                        {batteries.length > 0 ? (batteries.reduce((acc, b) => acc + b.soh, 0) / batteries.length).toFixed(1) : '0'}%
                      </p>
                      <p className="text-sm text-slate-400">Avg SoH</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(statusDistribution).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-slate-300">{status}</span>
                        <Badge className={`text-xs ${
                          status === 'Healthy' ? 'bg-green-600/80 text-green-100' :
                          status === 'Degrading' ? 'bg-yellow-600/80 text-yellow-100' :
                          'bg-red-600/80 text-red-100'
                        }`}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
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
                      dataKey="avgSoH"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Average SoH"
                    />
                    <Line
                      type="monotone"
                      dataKey="criticalCount"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Critical Batteries"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
