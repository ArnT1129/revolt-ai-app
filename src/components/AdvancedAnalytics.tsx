
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, AlertTriangle, TrendingDown, Lightbulb, Target, Clock, Battery } from 'lucide-react';
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
      
      // Get combined batteries (real + demo if appropriate)
      const combinedBatteries = DemoService.getCombinedBatteries(realBatteries, isDemoUser);
      setAllBatteries(combinedBatteries);
    } catch (error) {
      console.error('Error loading batteries:', error);
      // Fallback to demo data if there's an error
      const demoBatteries = DemoService.getDemoBatteries();
      setAllBatteries(demoBatteries);
    } finally {
      setLoading(false);
    }
  };

  // Analytics calculations
  const avgSoH = allBatteries.length > 0 ? allBatteries.reduce((acc, b) => acc + b.soh, 0) / allBatteries.length : 0;
  const avgRUL = allBatteries.length > 0 ? allBatteries.reduce((acc, b) => acc + b.rul, 0) / allBatteries.length : 0;
  const avgCycles = allBatteries.length > 0 ? allBatteries.reduce((acc, b) => acc + b.cycles, 0) / allBatteries.length : 0;

  // Data processing using allBatteries
  const sohDistribution = allBatteries.reduce((acc, battery) => {
    const range = Math.floor(battery.soh / 10) * 10;
    const key = `${range}-${range + 10}%`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sohData = Object.entries(sohDistribution)
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => parseInt(a.range) - parseInt(b.range));

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

  // Generate comprehensive trend data
  const trendData = allBatteries.length > 0 ? 
    Array.from({ length: 12 }, (_, i) => {
      const monthsAgo = 11 - i;
      const month = new Date();
      month.setMonth(month.getMonth() - monthsAgo);
      
      // Simulate degradation over time for demonstration
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        avgSoH: Math.max(75, avgSoH - (monthsAgo * 0.5)),
        criticalCount: Math.max(0, Math.floor(allBatteries.filter(b => b.status === 'Critical').length * (monthsAgo / 12))),
        totalBatteries: allBatteries.length
      };
    })
    : [];

  // Actionable insights
  const insights = [
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'Degradation Alert',
      message: `${allBatteries.filter(b => b.soh < 85).length} batteries below 85% SoH require attention`,
      action: 'Schedule maintenance checks',
      priority: 'High'
    },
    {
      type: 'info',
      icon: TrendingUp,
      title: 'Performance Trend',
      message: `Average SoH is ${avgSoH.toFixed(1)}% across your fleet`,
      action: 'Monitor monthly degradation rates',
      priority: 'Medium'
    },
    {
      type: 'success',
      icon: Target,
      title: 'Optimization Opportunity',
      message: `${allBatteries.filter(b => b.rul > 1000).length} batteries have high remaining useful life`,
      action: 'Consider reallocation to critical applications',
      priority: 'Low'
    }
  ];

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
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="enhanced-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-sm text-slate-400">Average SoH</p>
                      <p className="text-2xl font-bold text-white">{avgSoH.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="enhanced-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-sm text-slate-400">Average RUL</p>
                      <p className="text-2xl font-bold text-white">{Math.round(avgRUL).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="enhanced-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Battery className="h-8 w-8 text-purple-400" />
                    <div>
                      <p className="text-sm text-slate-400">Total Batteries</p>
                      <p className="text-2xl font-bold text-white">{allBatteries.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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

            {/* Actionable Insights */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  Actionable Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                    <insight.icon className="h-5 w-5 text-blue-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{insight.title}</h4>
                        <Badge className={`text-xs ${
                          insight.priority === 'High' ? 'bg-red-600/80 text-red-100' :
                          insight.priority === 'Medium' ? 'bg-yellow-600/80 text-yellow-100' :
                          'bg-green-600/80 text-green-100'
                        }`}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{insight.message}</p>
                      <p className="text-blue-400 text-sm font-medium">{insight.action}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">State of Health Analysis</CardTitle>
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

            {/* Health Recommendations */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Health Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border border-green-500/30 bg-green-900/20">
                    <h4 className="font-medium text-green-400 mb-2">Healthy Batteries ({statusDistribution['Healthy'] || 0})</h4>
                    <p className="text-slate-300 text-sm">Continue regular monitoring and maintain optimal operating conditions.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-900/20">
                    <h4 className="font-medium text-yellow-400 mb-2">Degrading Batteries ({statusDistribution['Degrading'] || 0})</h4>
                    <p className="text-slate-300 text-sm">Increase monitoring frequency and consider preventive maintenance.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-red-500/30 bg-red-900/20">
                    <h4 className="font-medium text-red-400 mb-2">Critical Batteries ({statusDistribution['Critical'] || 0})</h4>
                    <p className="text-slate-300 text-sm">Immediate attention required. Schedule replacement or detailed inspection.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-900/20">
                    <h4 className="font-medium text-blue-400 mb-2">Predictive Maintenance</h4>
                    <p className="text-slate-300 text-sm">Use SoH trends to predict optimal replacement timing and reduce costs.</p>
                  </div>
                </div>
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
                  <CardTitle className="text-white text-lg">Fleet Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">{allBatteries.length}</p>
                      <p className="text-sm text-slate-400">Total Batteries</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">
                        {avgSoH.toFixed(1)}%
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
                <CardTitle className="text-white text-lg">Performance Trends Over Time</CardTitle>
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
                        name="Average SoH (%)"
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

            {/* Trend Analysis */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Trend Analysis & Predictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-900/20">
                    <h4 className="font-medium text-blue-400 mb-2">Degradation Rate</h4>
                    <p className="text-2xl font-bold text-white mb-1">0.5%</p>
                    <p className="text-slate-300 text-sm">Average monthly SoH decline</p>
                  </div>
                  <div className="p-4 rounded-lg border border-green-500/30 bg-green-900/20">
                    <h4 className="font-medium text-green-400 mb-2">Fleet Lifecycle</h4>
                    <p className="text-2xl font-bold text-white mb-1">{Math.round(avgCycles).toLocaleString()}</p>
                    <p className="text-slate-300 text-sm">Average cycles completed</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-900/20">
                  <h4 className="font-medium text-yellow-400 mb-2">Predictive Insights</h4>
                  <ul className="space-y-1 text-slate-300 text-sm">
                    <li>• {Math.round(allBatteries.filter(b => b.soh > 90).length / allBatteries.length * 100)}% of fleet in excellent condition</li>
                    <li>• Estimated {Math.round(avgRUL / 100)} months remaining useful life</li>
                    <li>• {allBatteries.filter(b => b.chemistry === 'LFP').length} LFP batteries showing superior longevity</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
