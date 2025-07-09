
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
    
    // Generate more accurate comparison chart data
    const maxCycles = Math.max(...selected.map(b => b.cycles));
    const chartData = [];
    
    // Create data points every 50 cycles or based on available history
    const stepSize = Math.max(50, Math.ceil(maxCycles / 20));
    
    for (let cycle = 0; cycle <= maxCycles; cycle += stepSize) {
      const dataPoint: any = { cycle };
      
      selected.forEach(battery => {
        // If battery has SoH history, use it; otherwise simulate degradation
        if (battery.sohHistory && battery.sohHistory.length > 0) {
          const closestPoint = battery.sohHistory
            .filter(h => h.cycle <= cycle)
            .sort((a, b) => Math.abs(a.cycle - cycle) - Math.abs(b.cycle - cycle))[0];
          dataPoint[battery.id] = closestPoint ? closestPoint.soh : 100;
        } else {
          // Simulate realistic degradation based on current state
          const degradationRate = (100 - battery.soh) / battery.cycles;
          const simulatedSoh = Math.max(80, 100 - (degradationRate * cycle));
          dataPoint[battery.id] = cycle <= battery.cycles ? simulatedSoh : battery.soh;
        }
      });
      
      chartData.push(dataPoint);
    }
    
    setComparisonData(chartData);
  };

  const getComparisonMetrics = () => {
    const selected = batteries.filter(b => selectedBatteries.includes(b.id));
    return selected.map(battery => {
      const degradationRate = battery.cycles > 0 ? (100 - battery.soh) / battery.cycles : 0;
      const efficiencyScore = (battery.soh * 0.4) + ((battery.rul / 50) * 0.3) + (((2000 - battery.cycles) / 2000) * 0.3);
      
      return {
        ...battery,
        degradationRate: Math.max(0, degradationRate),
        efficiencyScore: Math.min(100, Math.max(0, efficiencyScore))
      };
    });
  };

  const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171'];

  return (
    <div className="space-y-6">
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <GitCompare className="h-5 w-5 text-blue-300" />
            Battery Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">
              Select batteries to compare (max 4):
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {batteries.map(battery => {
                const isSelected = selectedBatteries.includes(battery.id);
                const selectedIndex = selectedBatteries.indexOf(battery.id);
                
                return (
                  <Button
                    key={battery.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBatterySelect(battery.id)}
                    disabled={!isSelected && selectedBatteries.length >= 4}
                    className={`text-xs transition-all duration-300 relative ${
                      isSelected
                        ? `bg-gradient-to-r from-blue-600/80 to-blue-500/80 border-2 text-white shadow-lg transform scale-105 ring-2 ring-blue-400/50` 
                        : 'bg-slate-700/50 border-slate-500/50 text-slate-300 hover:bg-slate-600/60 hover:border-slate-400/60'
                    }`}
                    style={isSelected ? {
                      borderColor: colors[selectedIndex],
                      boxShadow: `0 0 15px ${colors[selectedIndex]}40, 0 4px 12px rgba(0,0,0,0.3)`
                    } : {}}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div 
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ backgroundColor: colors[selectedIndex] }}
                        />
                      )}
                      {battery.id}
                      {isSelected && (
                        <Badge 
                          variant="secondary" 
                          className="ml-1 text-xs px-1 py-0 bg-white/20 text-white border-0"
                        >
                          {selectedIndex + 1}
                        </Badge>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <Button 
            onClick={generateComparison} 
            disabled={selectedBatteries.length < 2}
            className="bg-blue-600/70 hover:bg-blue-600/85 border-blue-400/50"
          >
            Generate Comparison
          </Button>

          {comparisonData.length > 0 && (
            <div className="space-y-6">
              {/* SoH Trends Comparison */}
              <div className="w-full">
                <h3 className="text-lg font-medium text-slate-200 mb-4">State of Health Degradation Over Cycles</h3>
                <div className="h-80 w-full bg-slate-900/20 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                      <XAxis 
                        dataKey="cycle" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        label={{ value: 'Cycle Count', position: 'insideBottom', offset: -10, style: { fill: '#94a3b8' } }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12}
                        label={{ value: 'SoH (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
                        domain={[75, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 22, 41, 0.95)', 
                          border: '1px solid rgba(71, 85, 105, 0.4)',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }} 
                        formatter={(value: any, name: string) => [`${Number(value).toFixed(1)}%`, name]}
                        labelFormatter={(cycle) => `Cycle: ${cycle}`}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          paddingTop: '15px',
                          position: 'relative',
                          marginTop: '10px'
                        }}
                        iconType="line"
                        verticalAlign="bottom"
                        height={36}
                      />
                      {selectedBatteries.map((batteryId, index) => (
                        <Line
                          key={batteryId}
                          type="monotone"
                          dataKey={batteryId}
                          stroke={colors[index]}
                          strokeWidth={2.5}
                          dot={{ fill: colors[index], strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, stroke: colors[index], strokeWidth: 2, fill: '#fff' }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparison Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {getComparisonMetrics().map((battery, index) => (
                  <Card key={battery.id} className="border border-slate-600/30 bg-slate-800/40 relative">
                    <div 
                      className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
                      style={{ backgroundColor: colors[index] }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-100">{battery.id}</h4>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full shadow-lg"
                            style={{ 
                              backgroundColor: colors[index],
                              boxShadow: `0 0 8px ${colors[index]}60`
                            }}
                          />
                          <Badge 
                            variant="outline"
                            className="text-slate-200 border-slate-500/50"
                          >
                            Grade {battery.grade}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current SoH:</span>
                          <span className="text-blue-300 font-medium">{battery.soh.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Remaining Life:</span>
                          <span className="text-emerald-300 font-medium">{battery.rul} cycles</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Cycles:</span>
                          <span className="text-purple-300 font-medium">{battery.cycles.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Degradation Rate:</span>
                          <span className="text-amber-300 font-medium">{(battery.degradationRate * 100).toFixed(3)}%/cycle</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Chemistry:</span>
                          <span className="text-cyan-300 font-medium">{battery.chemistry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className={`font-medium ${
                            battery.status === 'Healthy' ? 'text-green-400' :
                            battery.status === 'Degrading' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {battery.status}
                          </span>
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
