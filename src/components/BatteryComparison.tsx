
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Battery } from "@/types";
import { GitCompare, TrendingUp, AlertTriangle } from "lucide-react";

interface BatteryComparisonProps {
  batteries: Battery[];
}

export default function BatteryComparison({ batteries }: BatteryComparisonProps) {
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  const handleBatterySelect = (batteryId: string) => {
    if (selectedBatteries.includes(batteryId)) {
      setSelectedBatteries(prev => prev.filter(id => id !== batteryId));
    } else if (selectedBatteries.length < 4) {
      setSelectedBatteries(prev => [...prev, batteryId]);
    }
  };

  const generateComparison = () => {
    const selected = batteries.filter(b => selectedBatteries.includes(b.id));
    
    // Generate comparison chart data
    const maxCycles = Math.max(...selected.map(b => b.sohHistory.length > 0 ? Math.max(...b.sohHistory.map(h => h.cycle)) : b.cycles));
    const chartData = [];
    
    for (let cycle = 0; cycle <= maxCycles; cycle += Math.ceil(maxCycles / 20)) {
      const dataPoint: any = { cycle };
      
      selected.forEach(battery => {
        const sohPoint = battery.sohHistory.find(h => h.cycle <= cycle);
        dataPoint[battery.id] = sohPoint ? sohPoint.soh : 100;
      });
      
      chartData.push(dataPoint);
    }
    
    setComparisonData(chartData);
  };

  const getComparisonMetrics = () => {
    const selected = batteries.filter(b => selectedBatteries.includes(b.id));
    return selected.map(battery => ({
      ...battery,
      degradationRate: battery.cycles > 0 ? (100 - battery.soh) / battery.cycles : 0,
      efficiencyScore: (battery.soh * 0.4) + (battery.rul / 50 * 0.3) + ((2000 - battery.cycles) / 20 * 0.3)
    }));
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  return (
    <div className="space-y-6">
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <GitCompare className="h-5 w-5 text-blue-400" />
            Battery Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Select batteries to compare (max 4):
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {batteries.map(battery => (
                <Button
                  key={battery.id}
                  variant={selectedBatteries.includes(battery.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBatterySelect(battery.id)}
                  disabled={!selectedBatteries.includes(battery.id) && selectedBatteries.length >= 4}
                  className="text-xs"
                >
                  {battery.id}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={generateComparison} disabled={selectedBatteries.length < 2}>
            Generate Comparison
          </Button>

          {comparisonData.length > 0 && (
            <div className="space-y-6">
              {/* SoH Trends Comparison */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="cycle" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }} 
                    />
                    <Legend />
                    {selectedBatteries.map((batteryId, index) => (
                      <Line
                        key={batteryId}
                        type="monotone"
                        dataKey={batteryId}
                        stroke={colors[index]}
                        strokeWidth={2}
                        dot={{ fill: colors[index], strokeWidth: 0, r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {getComparisonMetrics().map((battery, index) => (
                  <Card key={battery.id} className="border border-white/10 bg-black/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white">{battery.id}</h4>
                        <Badge 
                          className="text-white"
                          style={{ backgroundColor: colors[index] }}
                        >
                          {battery.grade}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">SoH:</span>
                          <span className="text-blue-400 font-medium">{battery.soh.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">RUL:</span>
                          <span className="text-cyan-400 font-medium">{battery.rul}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cycles:</span>
                          <span className="text-indigo-400 font-medium">{battery.cycles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Degradation Rate:</span>
                          <span className="text-yellow-400 font-medium">{battery.degradationRate.toFixed(3)}/cycle</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Efficiency Score:</span>
                          <span className="text-green-400 font-medium">{battery.efficiencyScore.toFixed(1)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
