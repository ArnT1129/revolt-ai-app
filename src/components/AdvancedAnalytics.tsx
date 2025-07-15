
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import { DemoService } from '@/services/demoService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Battery } from '@/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AdvancedAnalytics() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [allBatteries, setAllBatteries] = useState<Battery[]>([]);
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
      const realBatteries = await batteryService.getUserBatteries();
      setBatteries(realBatteries);
      setAllBatteries(realBatteries);
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
    } catch (error) {
      console.error('Error loading batteries:', error);
      setAllBatteries([]);
    } finally {
      setLoading(false);
    }
  };

  // Data processing using allBatteries (which includes demo data for demo users)
  const sohDistribution = allBatteries.reduce((acc, battery) => {
    const range = Math.floor(battery.soh / 10) * 10;
    const key = `${range}-${range + 10}%`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sohData = Object.entries(sohDistribution).map(([range, count]) => ({
    range,
    count
  }));

  const statusDistribution = allBatteries.reduce((acc, battery) => {
    acc[battery.status] = (acc[battery.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
    name: status,
    value: count
  }));

  const chemistryDistribution = allBatteries.reduce((acc, battery) => {
    acc[battery.chemistry] = (acc[battery.chemistry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chemistryData = Object.entries(chemistryDistribution).map(([chemistry, count]) => ({
    name: chemistry,
    value: count
  }));

  const gradeDistribution = allBatteries.reduce((acc, battery) => {
    acc[battery.grade] = (acc[battery.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: `Grade ${grade}`,
    value: count
  }));

  // Generate trend data based on actual batteries for demo users
  const trendData = allBatteries.length > 0 ? 
    allBatteries.flatMap(battery => 
      battery.sohHistory?.map((point, index) => ({
        month: `Cycle ${point.cycle}`,
        avgSoH: point.soh,
        totalBatteries: allBatteries.length,
        criticalCount: allBatteries.filter(b => b.status === 'Critical').length,
        batteryId: battery.id
      })) || []
    ).sort((a, b) => parseInt(a.month.split(' ')[1]) - parseInt(b.month.split(' ')[1]))
    : [];

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
                  {statusData.length > 0 ? (
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
                  ) : (
                    <div className="h-200 flex items-center justify-center">
                      <p className="text-slate-400">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Chemistry Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {chemistryData.length > 0 ? (
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
                  ) : (
                    <div className="h-200 flex items-center justify-center">
                      <p className="text-slate-400">No data available</p>
                    </div>
                  )}
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
                {sohData.length > 0 ? (
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
                ) : (
                  <div className="h-300 flex items-center justify-center">
                    <p className="text-slate-400">No health data available</p>
                  </div>
                )}
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
                  {gradeData.length > 0 ? (
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
                  ) : (
                    <div className="h-250 flex items-center justify-center">
                      <p className="text-slate-400">No grade data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Battery Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">{allBatteries.length}</p>
                      <p className="text-sm text-slate-400">Total Batteries</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">
                        {allBatteries.length > 0 ? (allBatteries.reduce((acc, b) => acc + b.soh, 0) / allBatteries.length).toFixed(1) : '0'}%
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
                <CardTitle className="text-white text-lg">State of Health Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
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
                        name="State of Health (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center">
                    <p className="text-slate-400">No trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
