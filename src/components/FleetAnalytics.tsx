
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Battery, TrendIcon, AlertTriangle, Zap, Activity } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface FleetMetrics {
  totalBatteries: number;
  averageSoH: number;
  averageRUL: number;
  healthyCount: number;
  degradingCount: number;
  criticalCount: number;
  totalEnergy: number;
  averageAge: number;
  costSavings: number;
  efficiency: number;
}

interface BatteryDistribution {
  grade: string;
  count: number;
  percentage: number;
  color: string;
}

interface TrendData {
  month: string;
  avgSoH: number;
  newBatteries: number;
  replacements: number;
  maintenance: number;
}

export default function FleetAnalytics() {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<FleetMetrics>({
    totalBatteries: 0,
    averageSoH: 0,
    averageRUL: 0,
    healthyCount: 0,
    degradingCount: 0,
    criticalCount: 0,
    totalEnergy: 0,
    averageAge: 0,
    costSavings: 0,
    efficiency: 0
  });

  const [distribution, setDistribution] = useState<BatteryDistribution[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  useEffect(() => {
    // Simulate fleet analytics data
    const generateFleetData = () => {
      const total = 150 + Math.floor(Math.random() * 50);
      const avgSoH = 85 + Math.random() * 10;
      const avgRUL = 300 + Math.random() * 200;
      
      const healthy = Math.floor(total * 0.6);
      const degrading = Math.floor(total * 0.3);
      const critical = total - healthy - degrading;
      
      setMetrics({
        totalBatteries: total,
        averageSoH: avgSoH,
        averageRUL: avgRUL,
        healthyCount: healthy,
        degradingCount: degrading,
        criticalCount: critical,
        totalEnergy: total * 3.7 * 2.5, // V * Ah
        averageAge: 18 + Math.random() * 12,
        costSavings: total * 1200,
        efficiency: 92 + Math.random() * 6
      });

      // Grade distribution
      setDistribution([
        { grade: 'A', count: Math.floor(total * 0.35), percentage: 35, color: '#22c55e' },
        { grade: 'B', count: Math.floor(total * 0.40), percentage: 40, color: '#3b82f6' },
        { grade: 'C', count: Math.floor(total * 0.20), percentage: 20, color: '#f59e0b' },
        { grade: 'D', count: Math.floor(total * 0.05), percentage: 5, color: '#ef4444' }
      ]);

      // Trend data for last 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const trends = months.map(month => ({
        month,
        avgSoH: 90 - Math.random() * 15,
        newBatteries: Math.floor(Math.random() * 10),
        replacements: Math.floor(Math.random() * 8),
        maintenance: Math.floor(Math.random() * 15)
      }));
      setTrendData(trends);
    };

    generateFleetData();
    
    if (settings.animationsEnabled) {
      const interval = setInterval(generateFleetData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [settings.animationsEnabled]);

  const getAnimationClasses = () => {
    return settings.animationsEnabled ? "animate-fade-in" : "";
  };

  return (
    <div className={`space-y-6 ${getAnimationClasses()}`}>
      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Batteries</p>
                <p className="text-2xl font-bold text-white">{metrics.totalBatteries}</p>
              </div>
              <Battery className="h-8 w-8 text-blue-400" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Active Fleet
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Health</p>
                <p className="text-2xl font-bold text-white">{metrics.averageSoH.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
            <Progress value={metrics.averageSoH} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. RUL</p>
                <p className="text-2xl font-bold text-white">{Math.round(metrics.averageRUL)}</p>
              </div>
              <TrendIcon className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">cycles remaining</p>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold text-white">{metrics.efficiency.toFixed(1)}%</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-400" />
            </div>
            <p className="text-xs text-green-400 mt-2">+2.3% vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Status Distribution */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Health Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-400">Healthy</span>
                    <span className="text-sm font-medium text-white">{metrics.healthyCount}</span>
                  </div>
                  <Progress value={(metrics.healthyCount / metrics.totalBatteries) * 100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-yellow-400">Degrading</span>
                    <span className="text-sm font-medium text-white">{metrics.degradingCount}</span>
                  </div>
                  <Progress value={(metrics.degradingCount / metrics.totalBatteries) * 100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-400">Critical</span>
                    <span className="text-sm font-medium text-white">{metrics.criticalCount}</span>
                  </div>
                  <Progress value={(metrics.criticalCount / metrics.totalBatteries) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Key Fleet Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Energy</p>
                    <p className="text-lg font-bold text-white">{(metrics.totalEnergy / 1000).toFixed(1)} kWh</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Age</p>
                    <p className="text-lg font-bold text-white">{metrics.averageAge.toFixed(1)} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cost Savings</p>
                    <p className="text-lg font-bold text-green-400">${(metrics.costSavings / 1000).toFixed(0)}k</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance Due</p>
                    <p className="text-lg font-bold text-orange-400">{Math.floor(Math.random() * 12)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution Pie Chart */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="count"
                    >
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Breakdown */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Grade Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {distribution.map((item) => (
                  <div key={item.grade} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-white">Grade {item.grade}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{item.count} units</span>
                      <Badge variant="secondary">{item.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white">Fleet Health Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Line type="monotone" dataKey="avgSoH" stroke="#3b82f6" strokeWidth={2} name="Avg SoH %" />
                  <Line type="monotone" dataKey="newBatteries" stroke="#22c55e" strokeWidth={2} name="New Batteries" />
                  <Line type="monotone" dataKey="replacements" stroke="#ef4444" strokeWidth={2} name="Replacements" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { type: 'warning', message: '5 batteries approaching 80% SoH threshold', time: '2 hours ago' },
                { type: 'info', message: 'Maintenance scheduled for Battery Bank A', time: '4 hours ago' },
                { type: 'critical', message: '2 batteries require immediate attention', time: '6 hours ago' },
                { type: 'success', message: '12 batteries successfully recalibrated', time: '1 day ago' }
              ].map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'critical' ? 'bg-red-400' :
                    alert.type === 'warning' ? 'bg-orange-400' :
                    alert.type === 'info' ? 'bg-blue-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-white">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
