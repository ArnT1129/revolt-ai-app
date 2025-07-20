
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, BarChart3, Activity, AlertTriangle, Zap, Battery as BatteryIcon, 
  Target, Lightbulb, Clock, Thermometer, Gauge, Shield, 
  TrendingDown, AlertCircle, CheckCircle, XCircle, Info, 
  Users, Building, ArrowRight, Star, Award, Target as TargetIcon2,
  Calendar, FileText, HardDrive, Settings, Eye, Download,
  Filter, Search, Download as DownloadIcon, RefreshCw, 
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  BarChart3 as BarChart3Icon, PieChart as PieChartIcon,
  Calendar as CalendarIcon, Clock as ClockIcon, Zap as ZapIcon
} from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import { DemoService } from '@/services/demoService';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import type { Battery } from '@/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function Analytics() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedChemistry, setSelectedChemistry] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const { isCompanyMode, currentCompany } = useCompany();

  useEffect(() => {
    loadBatteries();
    
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
    } catch (error) {
      console.error('Error loading batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter batteries based on selected criteria
  const filteredBatteries = batteries.filter(battery => {
    const chemistryMatch = selectedChemistry === 'all' || battery.chemistry === selectedChemistry;
    const statusMatch = selectedStatus === 'all' || battery.status === selectedStatus;
    return chemistryMatch && statusMatch;
  });

  // Calculate key metrics
  const metrics = {
    total: filteredBatteries.length,
    healthy: filteredBatteries.filter(b => b.status === 'Healthy').length,
    degrading: filteredBatteries.filter(b => b.status === 'Degrading').length,
    critical: filteredBatteries.filter(b => b.status === 'Critical').length,
    avgSoH: filteredBatteries.length > 0 ? filteredBatteries.reduce((acc, b) => acc + b.soh, 0) / filteredBatteries.length : 0,
    avgRUL: filteredBatteries.length > 0 ? filteredBatteries.reduce((acc, b) => acc + b.rul, 0) / filteredBatteries.length : 0,
    totalCycles: filteredBatteries.reduce((acc, b) => acc + b.cycles, 0),
    totalAttachments: filteredBatteries.reduce((acc, b) => acc + (b.attachments?.length || 0), 0)
  };

  // Trend analysis data
  const trendData = filteredBatteries.map((battery, index) => ({
    name: battery.name || battery.id,
    soh: battery.soh,
    rul: battery.rul,
    cycles: battery.cycles,
    status: battery.status === 'Healthy' ? 100 : battery.status === 'Degrading' ? 60 : 20,
    date: new Date(battery.uploadDate).toLocaleDateString()
  })).sort((a, b) => b.soh - a.soh);

  // Chemistry distribution
  const chemistryData = filteredBatteries.reduce((acc, battery) => {
    acc[battery.chemistry] = (acc[battery.chemistry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const chemistryChartData = Object.entries(chemistryData).map(([chemistry, count]) => ({
    name: chemistry,
    value: count,
    color: COLORS[Object.keys(chemistryData).indexOf(chemistry) % COLORS.length]
  }));

  // Status distribution for pie chart
  const statusData = [
    { name: 'Healthy', value: metrics.healthy, color: '#10B981' },
    { name: 'Degrading', value: metrics.degrading, color: '#F59E0B' },
    { name: 'Critical', value: metrics.critical, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Performance trends over time
  const performanceTrends = [
    { period: 'Q1', avgSoH: 95.2, avgRUL: 1200, batteries: 12 },
    { period: 'Q2', avgSoH: 93.8, avgRUL: 1150, batteries: 15 },
    { period: 'Q3', avgSoH: 91.5, avgRUL: 1100, batteries: 18 },
    { period: 'Q4', avgSoH: 89.2, avgRUL: 1050, batteries: 22 }
  ];

  // Top performers and alerts
  const topPerformers = filteredBatteries
    .filter(b => b.status === 'Healthy')
    .sort((a, b) => b.soh - a.soh)
    .slice(0, 5);

  const criticalAlerts = filteredBatteries
    .filter(b => b.status === 'Critical')
    .sort((a, b) => a.soh - b.soh);

  const degradingAlerts = filteredBatteries
    .filter(b => b.status === 'Degrading')
    .sort((a, b) => a.soh - b.soh)
    .slice(0, 5);

  // Predictive insights
  const predictiveInsights = [
    {
      type: metrics.avgSoH < 85 ? 'warning' : 'success',
      title: 'Fleet Health Prediction',
      description: metrics.avgSoH < 85 
        ? `At current degradation rate, fleet health will drop to 75% within 6 months`
        : `Fleet health is stable and expected to remain above 85% for the next year`,
      icon: metrics.avgSoH < 85 ? TrendingDown : TrendingUp
    },
    {
      type: metrics.avgRUL < 500 ? 'warning' : 'info',
      title: 'Replacement Planning',
      description: metrics.avgRUL < 500 
        ? `${Math.ceil(metrics.critical * 1.5)} batteries will need replacement within 3 months`
        : `Replacement planning can be scheduled for the next 6-12 months`,
      icon: Clock
    },
    {
        type: 'info',
      title: 'Efficiency Analysis',
      description: `Average cycle efficiency is ${(metrics.avgSoH / Math.max(metrics.totalCycles / metrics.total, 1)).toFixed(1)}% per 1000 cycles`,
      icon: Gauge
    }
  ];

  const handleExportData = async () => {
    setExporting(true);
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        company: currentCompany?.name || 'Personal',
        timeframe: selectedTimeframe,
        filters: {
          chemistry: selectedChemistry,
          status: selectedStatus
        },
        metrics: metrics,
        batteries: filteredBatteries.map(b => ({
          id: b.id,
          name: b.name,
          chemistry: b.chemistry,
          status: b.status,
          soh: b.soh,
          rul: b.rul,
          cycles: b.cycles,
          grade: b.grade,
          uploadDate: b.uploadDate
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `battery-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/10 rounded"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-400" />
              Fleet Analytics
              {isCompanyMode && currentCompany && (
                <Badge variant="outline" className="text-blue-300 border-blue-500/50">
                  <Building className="h-4 w-4 mr-2" />
                  {currentCompany.name}
                </Badge>
              )}
            </h1>
            <p className="text-slate-400 mt-2">
              Comprehensive insights into your battery fleet performance
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                value={selectedChemistry} 
                onChange={(e) => setSelectedChemistry(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">All Chemistries</option>
                <option value="LFP">LFP</option>
                <option value="NMC">NMC</option>
                <option value="LCO">LCO</option>
                <option value="NCA">NCA</option>
              </select>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Healthy">Healthy</option>
                <option value="Degrading">Degrading</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Timeframe:</span>
              <select 
                value={selectedTimeframe} 
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            {/* Export Button */}
            <Button
              onClick={() => setShowExportModal(true)}
              size="sm"
              variant="outline"
              className="glass-button"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600/20">
                  <BatteryIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{metrics.total}</div>
                  <div className="text-sm text-slate-400">Total Batteries</div>
                  <div className="text-xs text-slate-500">
                    {batteries.length !== metrics.total && `${batteries.length} total`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-600/20">
                  <Thermometer className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{metrics.avgSoH.toFixed(1)}%</div>
                  <div className="text-sm text-slate-400">Avg State of Health</div>
                  <div className="text-xs text-slate-500">
                    {metrics.avgSoH > 90 ? 'Excellent' : metrics.avgSoH > 80 ? 'Good' : metrics.avgSoH > 70 ? 'Fair' : 'Poor'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-600/20">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{metrics.avgRUL.toFixed(0)}</div>
                  <div className="text-sm text-slate-400">Avg RUL (cycles)</div>
                  <div className="text-xs text-slate-500">
                    {Math.ceil(metrics.avgRUL / 30)} months remaining
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-600/20">
                  <HardDrive className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{metrics.totalAttachments}</div>
                  <div className="text-sm text-slate-400">Total Attachments</div>
                  <div className="text-xs text-slate-500">
                    {metrics.totalAttachments > 0 ? `${(metrics.totalAttachments / metrics.total).toFixed(1)} per battery` : 'No files'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 glass-button">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-blue-400" />
                    Battery Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <BatteryIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No battery data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chemistry Distribution */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Chemistry Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chemistryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chemistryChartData}>
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
                    <div className="text-center py-12 text-slate-400">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No chemistry data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SoH Performance */}
            <Card className="enhanced-card">
              <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    State of Health Performance
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={trendData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="soh" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No performance data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.length > 0 ? (
                      topPerformers.map((battery, index) => (
                        <div key={battery.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center">
                              <span className="text-yellow-400 font-bold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{battery.name || battery.id}</div>
                              <div className="text-slate-400 text-sm">{battery.chemistry}</div>
                            </div>
                  </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold">{battery.soh.toFixed(1)}%</div>
                            <div className="text-slate-400 text-sm">SoH</div>
                    </div>
                  </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No top performers available</p>
                    </div>
                    )}
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card className="enhanced-card">
              <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5 text-blue-400" />
                    Performance Trends
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Area type="monotone" dataKey="avgSoH" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>

              {/* Fleet Growth */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5 text-green-400" />
                    Fleet Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                      />
                      <Bar dataKey="batteries" fill="#10B981" />
                    </BarChart>
                    </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Critical Alerts */}
            <Card className="enhanced-card">
              <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-400" />
                    Critical Alerts ({criticalAlerts.length})
                  </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {criticalAlerts.length > 0 ? (
                      criticalAlerts.map((battery) => (
                        <div key={battery.id} className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-white font-medium">{battery.name || battery.id}</div>
                            <Badge className="bg-red-600/80 text-red-100">Critical</Badge>
                </div>
                          <div className="text-red-300 text-sm mb-2">
                            SoH: {battery.soh.toFixed(1)}% • RUL: {battery.rul} cycles
                        </div>
                          <div className="text-red-200 text-xs">
                            Immediate replacement required
                      </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No critical alerts</p>
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>

              {/* Degrading Alerts */}
                  <Card className="enhanced-card">
                    <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    Degrading Alerts ({degradingAlerts.length})
                  </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                    {degradingAlerts.length > 0 ? (
                      degradingAlerts.map((battery) => (
                        <div key={battery.id} className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-white font-medium">{battery.name || battery.id}</div>
                            <Badge className="bg-yellow-600/80 text-yellow-100">Degrading</Badge>
                          </div>
                          <div className="text-yellow-300 text-sm mb-2">
                            SoH: {battery.soh.toFixed(1)}% • RUL: {battery.rul} cycles
                          </div>
                          <div className="text-yellow-200 text-xs">
                            Monitor closely and plan replacement
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No degrading alerts</p>
                      </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fleet Health Score */}
              <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    Fleet Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {metrics.avgSoH > 90 ? 'A' : metrics.avgSoH > 80 ? 'B' : metrics.avgSoH > 70 ? 'C' : 'D'}
                    </div>
                    <div className="text-slate-400 mb-4">
                      {metrics.avgSoH > 90 ? 'Excellent' : metrics.avgSoH > 80 ? 'Good' : metrics.avgSoH > 70 ? 'Fair' : 'Poor'}
                    </div>
                    <Progress value={metrics.avgSoH} className="h-3" />
                    <div className="text-sm text-slate-400 mt-2">
                      Average SoH: {metrics.avgSoH.toFixed(1)}%
                    </div>
                </div>
              </CardContent>
            </Card>

              {/* Predictive Insights */}
            <Card className="enhanced-card">
              <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    Predictive Insights
                  </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {predictiveInsights.map((insight, index) => (
                      <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                        insight.type === 'success' ? 'bg-green-900/20' :
                        insight.type === 'warning' ? 'bg-yellow-900/20' :
                        'bg-blue-900/20'
                      }`}>
                        <insight.icon className={`h-5 w-5 ${
                          insight.type === 'success' ? 'text-green-400' :
                          insight.type === 'warning' ? 'text-yellow-400' :
                          'text-blue-400'
                        }`} />
                        <div>
                          <div className="text-white font-medium">{insight.title}</div>
                          <div className="text-slate-400 text-sm">{insight.description}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-white text-lg font-semibold mb-4">Export Analytics Data</h3>
              <p className="text-slate-400 mb-4">
                Export current analytics data including metrics, battery information, and insights.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="flex-1"
                >
                  {exporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
