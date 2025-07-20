
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line,
  ScatterChart, Scatter, ComposedChart, Area, AreaChart
} from 'recharts';
import { 
  GitCompare, TrendingUp, BarChart3, AlertTriangle, Zap, 
  Target, Lightbulb, Clock, Thermometer, Gauge, 
  TrendingDown, AlertCircle, CheckCircle, XCircle, Info,
  Award, Activity, Battery as BatteryIcon, Star, Shield, Settings, 
  Users, Building, ArrowRight, Target as TargetIcon2,
  BarChart3 as BarChart3Icon, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Minus, Filter, Download,
  RefreshCw, Eye, BarChart3 as BarChart3Icon2, TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon, Clock as ClockIcon, Zap as ZapIcon,
  Target as TargetIcon3, Shield as ShieldIcon
} from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import { DemoService } from '@/services/demoService';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import type { Battery } from '@/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function Comparison() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedBattery1, setSelectedBattery1] = useState<string>('');
  const [selectedBattery2, setSelectedBattery2] = useState<string>('');
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'detailed' | 'efficiency'>('side-by-side');
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

      // Auto-select first two batteries if available
      if (realBatteries.length >= 2) {
        setSelectedBattery1(realBatteries[0].id);
        setSelectedBattery2(realBatteries[1].id);
      }
    } catch (error) {
      console.error('Error loading batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const battery1 = batteries.find(b => b.id === selectedBattery1);
  const battery2 = batteries.find(b => b.id === selectedBattery2);

  // Comparison calculations
  const comparison = battery1 && battery2 ? {
    soh: {
      b1: battery1.soh,
      b2: battery2.soh,
      diff: battery1.soh - battery2.soh,
      percentage: ((battery1.soh - battery2.soh) / battery2.soh) * 100
    },
    rul: {
      b1: battery1.rul,
      b2: battery2.rul,
      diff: battery1.rul - battery2.rul,
      percentage: ((battery1.rul - battery2.rul) / battery2.rul) * 100
    },
    cycles: {
      b1: battery1.cycles,
      b2: battery2.cycles,
      diff: battery1.cycles - battery2.cycles,
      percentage: ((battery1.cycles - battery2.cycles) / battery2.cycles) * 100
    },
    efficiency: {
      b1: (battery1.soh / Math.max(battery1.cycles, 1)) * 1000,
      b2: (battery2.soh / Math.max(battery2.cycles, 1)) * 1000,
      diff: ((battery1.soh / Math.max(battery1.cycles, 1)) * 1000) - ((battery2.soh / Math.max(battery2.cycles, 1)) * 1000)
    }
  } : null;

  // Radar chart data
  const radarData = battery1 && battery2 ? [
    { metric: 'SoH', b1: battery1.soh, b2: battery2.soh, fullMark: 100 },
    { metric: 'RUL', b1: Math.min(100, battery1.rul / 10), b2: Math.min(100, battery2.rul / 10), fullMark: 100 },
    { metric: 'Cycles', b1: Math.min(100, battery1.cycles / 10), b2: Math.min(100, battery2.cycles / 10), fullMark: 100 },
    { metric: 'Grade', b1: battery1.grade === 'A' ? 100 : battery1.grade === 'B' ? 75 : battery1.grade === 'C' ? 50 : 25, b2: battery2.grade === 'A' ? 100 : battery2.grade === 'B' ? 75 : battery2.grade === 'C' ? 50 : 25, fullMark: 100 },
    { metric: 'Efficiency', b1: Math.min(100, (battery1.soh / Math.max(battery1.cycles, 1)) * 100), b2: Math.min(100, (battery2.soh / Math.max(battery2.cycles, 1)) * 100), fullMark: 100 }
  ] : [];

  // Performance comparison data
  const performanceData = battery1 && battery2 ? [
    { metric: 'State of Health', b1: battery1.soh, b2: battery2.soh },
    { metric: 'RUL (cycles)', b1: battery1.rul, b2: battery2.rul },
    { metric: 'Total Cycles', b1: battery1.cycles, b2: battery2.cycles },
    { metric: 'Efficiency (SoH/1000 cycles)', b1: (battery1.soh / Math.max(battery1.cycles, 1)) * 1000, b2: (battery2.soh / Math.max(battery2.cycles, 1)) * 1000 }
  ] : [];

  // Efficiency analysis data
  const efficiencyData = battery1 && battery2 ? [
    { cycle: 0, b1: 100, b2: 100 },
    { cycle: 500, b1: battery1.soh, b2: battery2.soh },
    { cycle: 1000, b1: Math.max(battery1.soh - 5, 0), b2: Math.max(battery2.soh - 5, 0) },
    { cycle: 1500, b1: Math.max(battery1.soh - 10, 0), b2: Math.max(battery2.soh - 10, 0) },
    { cycle: 2000, b1: Math.max(battery1.soh - 15, 0), b2: Math.max(battery2.soh - 15, 0) }
  ] : [];

  // Key insights
  const insights = battery1 && battery2 ? [
    {
      type: Math.abs(comparison!.soh.diff) > 10 ? (comparison!.soh.diff > 0 ? 'success' : 'warning') : 'info',
      title: 'Health Performance',
      description: `${battery1.name || battery1.id} has ${Math.abs(comparison!.soh.diff).toFixed(1)}% ${comparison!.soh.diff > 0 ? 'better' : 'worse'} State of Health`,
      icon: comparison!.soh.diff > 0 ? TrendingUp : comparison!.soh.diff < 0 ? TrendingDown : Minus
    },
    {
      type: Math.abs(comparison!.rul.diff) > 500 ? (comparison!.rul.diff > 0 ? 'success' : 'warning') : 'info',
      title: 'Life Expectancy',
      description: `${battery1.name || battery1.id} has ${Math.abs(comparison!.rul.diff).toLocaleString()} ${comparison!.rul.diff > 0 ? 'more' : 'fewer'} cycles remaining`,
      icon: comparison!.rul.diff > 0 ? Clock : AlertTriangle
    },
    {
      type: battery1.chemistry !== battery2.chemistry ? 'info' : 'success',
      title: 'Chemistry',
      description: battery1.chemistry === battery2.chemistry ? 'Same chemistry type' : `Different chemistries: ${battery1.chemistry} vs ${battery2.chemistry}`,
      icon: battery1.chemistry === battery2.chemistry ? CheckCircle : Info
    },
    {
      type: battery1.status !== battery2.status ? 'warning' : 'success',
      title: 'Operational Status',
      description: battery1.status === battery2.status ? 'Same operational status' : `Different statuses: ${battery1.status} vs ${battery2.status}`,
      icon: battery1.status === battery2.status ? CheckCircle : AlertCircle
    },
    {
      type: Math.abs(comparison!.efficiency.diff) > 5 ? (comparison!.efficiency.diff > 0 ? 'success' : 'warning') : 'info',
      title: 'Efficiency Analysis',
      description: `${battery1.name || battery1.id} has ${comparison!.efficiency.diff > 0 ? 'better' : 'worse'} cycle efficiency`,
      icon: comparison!.efficiency.diff > 0 ? TrendingUp : TrendingDown
    }
  ] : [];

  // Detailed analysis
  const detailedAnalysis = battery1 && battery2 ? {
    healthScore: {
      b1: battery1.soh > 90 ? 'A' : battery1.soh > 80 ? 'B' : battery1.soh > 70 ? 'C' : 'D',
      b2: battery2.soh > 90 ? 'A' : battery2.soh > 80 ? 'B' : battery2.soh > 70 ? 'C' : 'D'
    },
    lifeExpectancy: {
      b1: Math.ceil(battery1.rul / 30),
      b2: Math.ceil(battery2.rul / 30)
    },
    cycleEfficiency: {
      b1: (battery1.soh / Math.max(battery1.cycles, 1)) * 1000,
      b2: (battery2.soh / Math.max(battery2.cycles, 1)) * 1000
    },
    degradationRate: {
      b1: ((100 - battery1.soh) / Math.max(battery1.cycles, 1)) * 1000,
      b2: ((100 - battery2.soh) / Math.max(battery2.cycles, 1)) * 1000
    }
  } : null;

  const handleExportComparison = async () => {
    if (!battery1 || !battery2) return;
    
    setExporting(true);
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        company: currentCompany?.name || 'Personal',
        comparison: {
          battery1: {
            id: battery1.id,
            name: battery1.name,
            chemistry: battery1.chemistry,
            status: battery1.status,
            soh: battery1.soh,
            rul: battery1.rul,
            cycles: battery1.cycles,
            grade: battery1.grade
          },
          battery2: {
            id: battery2.id,
            name: battery2.name,
            chemistry: battery2.chemistry,
            status: battery2.status,
            soh: battery2.soh,
            rul: battery2.rul,
            cycles: battery2.cycles,
            grade: battery2.grade
          },
          analysis: comparison,
          insights: insights
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `battery-comparison-${battery1.id}-vs-${battery2.id}-${new Date().toISOString().split('T')[0]}.json`;
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
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-white/10 rounded"></div>)}
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
              <GitCompare className="h-8 w-8 text-blue-400" />
              Battery Comparison
              {isCompanyMode && currentCompany && (
                <Badge variant="outline" className="text-blue-300 border-blue-500/50">
                  <Building className="h-4 w-4 mr-2" />
                  {currentCompany.name}
                </Badge>
              )}
            </h1>
            <p className="text-slate-400 mt-2">
              Compare battery performance and identify optimization opportunities
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Comparison Mode Selector */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                value={comparisonMode} 
                onChange={(e) => setComparisonMode(e.target.value as any)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="side-by-side">Side by Side</option>
                <option value="detailed">Detailed Analysis</option>
                <option value="efficiency">Efficiency Focus</option>
              </select>
            </div>

            {/* Export Button */}
            {battery1 && battery2 && (
              <Button
                onClick={() => setShowExportModal(true)}
                size="sm"
                variant="outline"
                className="glass-button"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Battery Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
                <BatteryIcon className="h-5 w-5 text-blue-400" />
                Battery 1
            </CardTitle>
          </CardHeader>
          <CardContent>
                <select 
                  value={selectedBattery1} 
                  onChange={(e) => setSelectedBattery1(e.target.value)}
                  className="w-full glass-button p-3"
                >
                <option value="">Select battery...</option>
                  {batteries.map((battery) => (
                    <option key={battery.id} value={battery.id}>
                      {battery.name || battery.id} - {battery.chemistry} (SoH: {battery.soh.toFixed(1)}%)
                    </option>
                  ))}
                </select>
              {battery1 && (
                <div className="mt-4 p-4 bg-slate-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-medium">{battery1.name || battery1.id}</div>
                    <Badge className={`${
                      battery1.status === 'Healthy' ? 'bg-green-600/80 text-green-100' :
                      battery1.status === 'Degrading' ? 'bg-yellow-600/80 text-yellow-100' :
                      'bg-red-600/80 text-red-100'
                    } border-0`}>
                      {battery1.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">SoH</div>
                      <div className="text-white font-bold">{battery1.soh.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">RUL</div>
                      <div className="text-white font-bold">{battery1.rul.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Cycles</div>
                      <div className="text-white font-bold">{battery1.cycles.toLocaleString()}</div>
                    </div>
                  </div>
              </div>
              )}
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BatteryIcon className="h-5 w-5 text-green-400" />
                Battery 2
              </CardTitle>
            </CardHeader>
            <CardContent>
                <select 
                  value={selectedBattery2} 
                  onChange={(e) => setSelectedBattery2(e.target.value)}
                  className="w-full glass-button p-3"
                >
                <option value="">Select battery...</option>
                  {batteries.map((battery) => (
                    <option key={battery.id} value={battery.id}>
                      {battery.name || battery.id} - {battery.chemistry} (SoH: {battery.soh.toFixed(1)}%)
                    </option>
                  ))}
                </select>
              {battery2 && (
                <div className="mt-4 p-4 bg-slate-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-medium">{battery2.name || battery2.id}</div>
                    <Badge className={`${
                      battery2.status === 'Healthy' ? 'bg-green-600/80 text-green-100' :
                      battery2.status === 'Degrading' ? 'bg-yellow-600/80 text-yellow-100' :
                      'bg-red-600/80 text-red-100'
                    } border-0`}>
                      {battery2.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">SoH</div>
                      <div className="text-white font-bold">{battery2.soh.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">RUL</div>
                      <div className="text-white font-bold">{battery2.rul.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Cycles</div>
                      <div className="text-white font-bold">{battery2.cycles.toLocaleString()}</div>
                    </div>
              </div>
            </div>
              )}
          </CardContent>
        </Card>
        </div>

        {/* Comparison Results */}
        {battery1 && battery2 ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 glass-button">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="radar">Radar</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Comparison */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3Icon className="h-5 w-5 text-blue-400" />
                      Quick Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg">
                          <div className="text-slate-300 font-medium">{item.metric}</div>
                          <div className="flex items-center gap-4">
                            <div className="text-blue-400 font-bold">{item.b1.toFixed(1)}</div>
                            <div className="text-slate-400">vs</div>
                            <div className="text-green-400 font-bold">{item.b2.toFixed(1)}</div>
                      </div>
                    </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Key Differences */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-yellow-400" />
                      Key Differences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {insights.slice(0, 3).map((insight, index) => (
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

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      Performance Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceData}>
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
                          <Bar dataKey="b1" fill="#3B82F6" name={battery1.name || battery1.id} />
                          <Bar dataKey="b2" fill="#10B981" name={battery2.name || battery2.id} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No performance data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Detailed Metrics */}
              <Card className="enhanced-card">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-purple-400" />
                      Detailed Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                      <div className="p-4 bg-slate-800/40 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300">State of Health</span>
                          <div className="flex items-center gap-2">
                            {comparison!.soh.diff > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-400" />
                            ) : comparison!.soh.diff < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-400" />
                            ) : (
                              <Minus className="h-4 w-4 text-slate-400" />
                            )}
                            <span className={`font-bold ${
                              comparison!.soh.diff > 0 ? 'text-green-400' :
                              comparison!.soh.diff < 0 ? 'text-red-400' :
                              'text-slate-400'
                            }`}>
                              {comparison!.soh.diff > 0 ? '+' : ''}{comparison!.soh.diff.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress value={Math.max(battery1.soh, battery2.soh)} className="h-2" />
                      </div>

                      <div className="p-4 bg-slate-800/40 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300">RUL Difference</span>
                          <div className="flex items-center gap-2">
                            {comparison!.rul.diff > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-400" />
                            ) : comparison!.rul.diff < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-400" />
                            ) : (
                              <Minus className="h-4 w-4 text-slate-400" />
                            )}
                            <span className={`font-bold ${
                              comparison!.rul.diff > 0 ? 'text-green-400' :
                              comparison!.rul.diff < 0 ? 'text-red-400' :
                              'text-slate-400'
                            }`}>
                              {comparison!.rul.diff > 0 ? '+' : ''}{comparison!.rul.diff.toLocaleString()} cycles
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-slate-400">
                          {battery1.name || battery1.id}: {battery1.rul.toLocaleString()} vs {battery2.name || battery2.id}: {battery2.rul.toLocaleString()}
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </TabsContent>

            {/* Efficiency Tab */}
            <TabsContent value="efficiency" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Efficiency Trends */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUpIcon className="h-5 w-5 text-blue-400" />
                      Efficiency Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={efficiencyData}>
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
                        <Area type="monotone" dataKey="b1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name={battery1.name || battery1.id} />
                        <Area type="monotone" dataKey="b2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name={battery2.name || battery2.id} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Efficiency Analysis */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ShieldIcon className="h-5 w-5 text-green-400" />
                      Efficiency Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-800/40 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300">Cycle Efficiency</span>
                          <div className="flex items-center gap-2">
                            {comparison!.efficiency.diff > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-400" />
                            ) : comparison!.efficiency.diff < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-400" />
                            ) : (
                              <Minus className="h-4 w-4 text-slate-400" />
                            )}
                            <span className={`font-bold ${
                              comparison!.efficiency.diff > 0 ? 'text-green-400' :
                              comparison!.efficiency.diff < 0 ? 'text-red-400' :
                              'text-slate-400'
                            }`}>
                              {comparison!.efficiency.diff > 0 ? '+' : ''}{comparison!.efficiency.diff.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-slate-400">
                          {battery1.name || battery1.id}: {comparison!.efficiency.b1.toFixed(1)} vs {battery2.name || battery2.id}: {comparison!.efficiency.b2.toFixed(1)}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-800/40 rounded-lg">
                        <div className="text-slate-300 font-medium mb-2">Degradation Rate</div>
                        <div className="text-sm text-slate-400">
                          {detailedAnalysis!.degradationRate.b1.toFixed(2)}% vs {detailedAnalysis!.degradationRate.b2.toFixed(2)}% per 1000 cycles
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Radar Tab */}
            <TabsContent value="radar" className="space-y-6">
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-yellow-400" />
                    Performance Radar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                        <PolarRadiusAxis stroke="#9CA3AF" />
                        <Radar
                          name={battery1.name || battery1.id}
                          dataKey="b1"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name={battery2.name || battery2.id}
                          dataKey="b2"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.3}
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
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No radar data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* All Insights */}
              <Card className="enhanced-card">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-400" />
                      Comparison Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                      {insights.map((insight, index) => (
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

              {/* Recommendations */}
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-400" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comparison!.soh.diff > 10 && (
                        <div className="p-3 bg-green-900/20 rounded-lg">
                          <div className="text-green-400 font-medium mb-1">Study Best Practices</div>
                          <div className="text-slate-400 text-sm">
                            {battery1.name || battery1.id} shows better health. Analyze usage patterns and maintenance schedules.
                          </div>
                    </div>
                      )}
                      
                      {comparison!.soh.diff < -10 && (
                        <div className="p-3 bg-yellow-900/20 rounded-lg">
                          <div className="text-yellow-400 font-medium mb-1">Investigate Degradation</div>
                          <div className="text-slate-400 text-sm">
                            {battery1.name || battery1.id} shows worse health. Review operating conditions and maintenance.
                          </div>
                        </div>
                      )}
                      
                      {comparison!.rul.diff < -500 && (
                        <div className="p-3 bg-red-900/20 rounded-lg">
                          <div className="text-red-400 font-medium mb-1">Plan Replacement</div>
                          <div className="text-slate-400 text-sm">
                            {battery1.name || battery1.id} has significantly lower RUL. Schedule replacement soon.
                          </div>
                  </div>
                      )}
                      
                      {battery1.chemistry !== battery2.chemistry && (
                        <div className="p-3 bg-blue-900/20 rounded-lg">
                          <div className="text-blue-400 font-medium mb-1">Chemistry Analysis</div>
                          <div className="text-slate-400 text-sm">
                            Different chemistries have varying characteristics. Review specifications and performance expectations.
                          </div>
                        </div>
                      )}

                      {comparison!.efficiency.diff > 5 && (
                        <div className="p-3 bg-green-900/20 rounded-lg">
                          <div className="text-green-400 font-medium mb-1">Efficiency Optimization</div>
                          <div className="text-slate-400 text-sm">
                            {battery1.name || battery1.id} shows better efficiency. Consider applying similar usage patterns.
                          </div>
                      </div>
                      )}
                  </div>
                </CardContent>
              </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="enhanced-card">
            <CardContent className="p-12 text-center">
              <GitCompare className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select Batteries to Compare</h3>
              <p className="text-slate-400">
                Choose two batteries from the dropdowns above to start comparing their performance metrics.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-white text-lg font-semibold mb-4">Export Comparison Data</h3>
              <p className="text-slate-400 mb-4">
                Export detailed comparison data including metrics, analysis, and insights.
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
                  onClick={handleExportComparison}
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
                      <Download className="h-4 w-4 mr-2" />
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
