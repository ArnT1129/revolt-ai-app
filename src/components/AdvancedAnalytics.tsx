
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { TrendingDown, AlertTriangle, Download, FileText } from "lucide-react";
import { Battery } from "@/types";

interface AdvancedAnalyticsProps {
  batteries: Battery[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function AdvancedAnalytics({ batteries }: AdvancedAnalyticsProps) {
  const [degradationAnalysis, setDegradationAnalysis] = useState<any[]>([]);
  const [chemistryComparison, setChemistryComparison] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (batteries.length === 0) return;

    // Calculate degradation trends
    const degradationData = batteries.map(battery => ({
      id: battery.id,
      soh: battery.soh,
      cycles: battery.cycles,
      degradationRate: battery.cycles > 0 ? (100 - battery.soh) / battery.cycles : 0,
      chemistry: battery.chemistry
    })).sort((a, b) => a.cycles - b.cycles);

    setDegradationAnalysis(degradationData);

    // Chemistry comparison
    const chemistryStats = batteries.reduce((acc, battery) => {
      if (!acc[battery.chemistry]) {
        acc[battery.chemistry] = { avgSoH: 0, avgRUL: 0, count: 0, avgCycles: 0 };
      }
      acc[battery.chemistry].avgSoH += battery.soh;
      acc[battery.chemistry].avgRUL += battery.rul;
      acc[battery.chemistry].avgCycles += battery.cycles;
      acc[battery.chemistry].count++;
      return acc;
    }, {} as any);

    const chemistryData = Object.entries(chemistryStats).map(([chemistry, stats]: [string, any]) => ({
      chemistry,
      avgSoH: (stats.avgSoH / stats.count).toFixed(1),
      avgRUL: Math.round(stats.avgRUL / stats.count),
      avgCycles: Math.round(stats.avgCycles / stats.count),
      count: stats.count
    }));

    setChemistryComparison(chemistryData);

    // Grade distribution
    const gradeStats = batteries.reduce((acc, battery) => {
      acc[battery.grade] = (acc[battery.grade] || 0) + 1;
      return acc;
    }, {} as any);

    const gradeData = Object.entries(gradeStats).map(([grade, count]) => ({
      grade,
      count,
      percentage: ((count as number / batteries.length) * 100).toFixed(1)
    }));

    setGradeDistribution(gradeData);
  }, [batteries]);

  const exportAnalytics = () => {
    const data = {
      summary: {
        totalBatteries: batteries.length,
        avgSoH: (batteries.reduce((sum, b) => sum + b.soh, 0) / batteries.length).toFixed(1),
        criticalBatteries: batteries.filter(b => b.status === 'Critical').length,
        timestamp: new Date().toISOString()
      },
      degradationAnalysis,
      chemistryComparison,
      gradeDistribution
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battery-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
        <Button onClick={exportAnalytics} className="glass-button">
          <Download className="h-4 w-4 mr-2" />
          Export Analytics
        </Button>
      </div>

      {/* Degradation Trends */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingDown className="h-5 w-5 text-red-400" />
            Degradation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={degradationAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="cycles" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }} 
                />
                <Line type="monotone" dataKey="soh" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chemistry Comparison */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Chemistry Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chemistryComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="chemistry" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }} 
                  />
                  <Bar dataKey="avgSoH" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {chemistryComparison.map((chem, index) => (
                <div key={chem.chemistry} className="p-4 border border-white/10 rounded-lg bg-black/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{chem.chemistry}</h4>
                    <Badge variant="outline" className="text-slate-300 border-white/20">
                      {chem.count} batteries
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-slate-400">Avg SoH</p>
                      <p className="text-blue-400 font-medium">{chem.avgSoH}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Avg RUL</p>
                      <p className="text-cyan-400 font-medium">{chem.avgRUL}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Avg Cycles</p>
                      <p className="text-indigo-400 font-medium">{chem.avgCycles}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Battery Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {gradeDistribution.map((grade, index) => (
                <div key={grade.grade} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-white font-medium">Grade {grade.grade}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{grade.count}</p>
                    <p className="text-slate-400 text-sm">{grade.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
