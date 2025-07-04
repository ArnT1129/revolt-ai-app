import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ScatterChart, Scatter } from "recharts";
import { Battery } from "@/types";
import { GitCompare, TrendingUp, AlertTriangle, Calculator, Clock, DollarSign, Thermometer, Zap, Target, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface BatteryComparisonProps {
  batteries: Battery[];
}

// Enhanced battery interface with real-world metrics
interface EnhancedBattery extends Battery {
  costPerKWh?: number;
  temperatureRange?: { min: number; max: number };
  chargingRate?: number; // C-rate
  dischargeRate?: number; // C-rate
  warranty?: number; // years
  cycleCount?: number;
  energyDensity?: number; // Wh/kg
  powerDensity?: number; // W/kg
  selfDischargeRate?: number; // %/month
  operatingTemp?: number; // current temp
  lastMaintenance?: Date;
  location?: string;
  application?: string;
}

export default function BatteryComparison({ batteries }: BatteryComparisonProps) {
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'soh' | 'cost' | 'temperature' | 'performance'>('soh');
  const [timeHorizon, setTimeHorizon] = useState<number>(12); // months
  const [useCase, setUseCase] = useState<'general' | 'backup' | 'grid' | 'mobile'>('general');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<any[]>([]);

  // Enhanced battery data with realistic defaults
  const enhancedBatteries: EnhancedBattery[] = useMemo(() => 
    batteries.map(battery => ({
      ...battery,
      costPerKWh: 150 + Math.random() * 100, // $150-250/kWh
      temperatureRange: { min: -20 + Math.random() * 10, max: 40 + Math.random() * 20 },
      chargingRate: 0.5 + Math.random() * 1.5, // 0.5-2C
      dischargeRate: 1 + Math.random() * 4, // 1-5C
      warranty: 2 + Math.floor(Math.random() * 8), // 2-10 years
      energyDensity: 100 + Math.random() * 150, // 100-250 Wh/kg
      powerDensity: 200 + Math.random() * 300, // 200-500 W/kg
      selfDischargeRate: 0.1 + Math.random() * 0.4, // 0.1-0.5%/month
      operatingTemp: 20 + Math.random() * 20, // 20-40°C
      lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      location: ['Warehouse A', 'Facility B', 'Mobile Unit', 'Backup Site'][Math.floor(Math.random() * 4)],
      application: ['Grid Storage', 'UPS', 'Mobile Power', 'Backup Power'][Math.floor(Math.random() * 4)]
    })), [batteries]);

  const handleBatterySelect = (batteryId: string) => {
    if (selectedBatteries.includes(batteryId)) {
      setSelectedBatteries(prev => prev.filter(id => id !== batteryId));
    } else if (selectedBatteries.length < 4) {
      setSelectedBatteries(prev => [...prev, batteryId]);
    }
  };

  const generateComparison = () => {
    const selected = enhancedBatteries.filter(b => selectedBatteries.includes(b.id));
    
    // Generate comparison data based on mode
    const maxCycles = Math.max(...selected.map(b => b.cycles));
    const chartData = [];
    
    const stepSize = Math.max(50, Math.ceil(maxCycles / 20));
    
    for (let cycle = 0; cycle <= maxCycles; cycle += stepSize) {
      const dataPoint: any = { cycle };
      
      selected.forEach(battery => {
        switch (comparisonMode) {
          case 'soh':
            if (battery.sohHistory && battery.sohHistory.length > 0) {
              const closestPoint = battery.sohHistory
                .filter(h => h.cycle <= cycle)
                .sort((a, b) => Math.abs(a.cycle - cycle) - Math.abs(b.cycle - cycle))[0];
              dataPoint[battery.id] = closestPoint ? closestPoint.soh : 100;
            } else {
              const degradationRate = (100 - battery.soh) / battery.cycles;
              const simulatedSoh = Math.max(80, 100 - (degradationRate * cycle));
              dataPoint[battery.id] = cycle <= battery.cycles ? simulatedSoh : battery.soh;
            }
            break;
          case 'cost':
            // Total cost of ownership over time
            const replacementCost = battery.costPerKWh || 200;
            const maintenanceCost = cycle * 0.5; // $0.5 per cycle
            const efficiencyLoss = (100 - (dataPoint[battery.id] || battery.soh)) / 100;
            const energyLossCost = efficiencyLoss * cycle * 0.1; // Energy loss cost
            dataPoint[battery.id] = replacementCost + maintenanceCost + energyLossCost;
            break;
          case 'temperature':
            // Temperature impact on performance
            const tempDegradation = Math.max(0, (battery.operatingTemp! - 25) * 0.5);
            const tempAdjustedSoh = battery.soh * (1 - tempDegradation / 100);
            dataPoint[battery.id] = Math.max(70, tempAdjustedSoh);
            break;
          case 'performance':
            // Performance score based on multiple factors
            const perfScore = (
              (battery.soh * 0.3) +
              (battery.energyDensity! / 250 * 25) +
              (battery.powerDensity! / 500 * 25) +
              ((1 - battery.selfDischargeRate!) * 20)
            );
            dataPoint[battery.id] = Math.min(100, Math.max(0, perfScore));
            break;
        }
      });
      
      chartData.push(dataPoint);
    }
    
    setComparisonData(chartData);
    generateRiskAnalysis(selected);
  };

  const generateRiskAnalysis = (selected: EnhancedBattery[]) => {
    const risks = selected.map(battery => {
      const risks = [];
      
      // Temperature risk
      if (battery.operatingTemp! > 35) {
        risks.push({ type: 'temperature', severity: 'high', message: 'Operating above optimal temperature' });
      }
      
      // Age risk
      const daysSinceMaintenance = (Date.now() - battery.lastMaintenance!.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceMaintenance > 60) {
        risks.push({ type: 'maintenance', severity: 'medium', message: 'Maintenance overdue' });
      }
      
      // Degradation risk
      const degradationRate = (100 - battery.soh) / battery.cycles;
      if (degradationRate > 0.01) {
        risks.push({ type: 'degradation', severity: 'high', message: 'Rapid degradation detected' });
      }
      
      // Cycle risk
      if (battery.cycles > 1500) {
        risks.push({ type: 'lifecycle', severity: 'medium', message: 'Approaching end of life' });
      }
      
      return {
        batteryId: battery.id,
        risks,
        riskScore: risks.reduce((sum, r) => sum + (r.severity === 'high' ? 3 : r.severity === 'medium' ? 2 : 1), 0)
      };
    });
    
    setRiskAnalysis(risks);
  };

  const getRecommendations = () => {
    const selected = enhancedBatteries.filter(b => selectedBatteries.includes(b.id));
    
    return selected.map(battery => {
      const recommendations = [];
      
      // Based on use case
      if (useCase === 'backup' && battery.selfDischargeRate! > 0.3) {
        recommendations.push('Consider battery with lower self-discharge for backup applications');
      }
      
      if (useCase === 'grid' && battery.powerDensity! < 300) {
        recommendations.push('May not be suitable for grid-scale rapid response');
      }
      
      if (useCase === 'mobile' && battery.energyDensity! < 150) {
        recommendations.push('Low energy density may limit mobile application runtime');
      }
      
      // Temperature recommendations
      if (battery.operatingTemp! > battery.temperatureRange!.max - 5) {
        recommendations.push('Implement cooling to prevent thermal damage');
      }
      
      // Maintenance recommendations
      const daysSinceMaintenance = (Date.now() - battery.lastMaintenance!.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceMaintenance > 30) {
        recommendations.push('Schedule preventive maintenance');
      }
      
      // Replacement recommendations
      if (battery.soh < 85) {
        recommendations.push('Consider replacement planning');
      }
      
      return {
        batteryId: battery.id,
        recommendations: recommendations.length > 0 ? recommendations : ['Battery operating within optimal parameters']
      };
    });
  };

  const getComparisonMetrics = () => {
    const selected = enhancedBatteries.filter(b => selectedBatteries.includes(b.id));
    return selected.map(battery => {
      const degradationRate = battery.cycles > 0 ? (100 - battery.soh) / battery.cycles : 0;
      const efficiencyScore = (battery.soh * 0.4) + ((battery.rul / 50) * 0.3) + (((2000 - battery.cycles) / 2000) * 0.3);
      
      // Calculate Total Cost of Ownership
      const yearsInService = battery.cycles / 365; // Assuming 1 cycle per day
      const annualMaintenanceCost = 50 + (battery.cycles * 0.01);
      const totalCostOfOwnership = (battery.costPerKWh || 200) + (annualMaintenanceCost * yearsInService);
      
      // Calculate expected replacement date
      const expectedReplacementCycles = (battery.soh - 80) / Math.max(0.001, degradationRate);
      const replacementDate = new Date(Date.now() + (expectedReplacementCycles * 24 * 60 * 60 * 1000));
      
      return {
        ...battery,
        degradationRate: Math.max(0, degradationRate),
        efficiencyScore: Math.min(100, Math.max(0, efficiencyScore)),
        totalCostOfOwnership,
        expectedReplacementDate: replacementDate
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
            Advanced Battery Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-600/20">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Analysis Mode</label>
              <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soh">State of Health</SelectItem>
                  <SelectItem value="cost">Total Cost of Ownership</SelectItem>
                  <SelectItem value="temperature">Temperature Impact</SelectItem>
                  <SelectItem value="performance">Performance Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Use Case</label>
              <Select value={useCase} onValueChange={(value: any) => setUseCase(value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Purpose</SelectItem>
                  <SelectItem value="backup">Backup Power</SelectItem>
                  <SelectItem value="grid">Grid Storage</SelectItem>
                  <SelectItem value="mobile">Mobile Applications</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Time Horizon (months)</label>
              <Select value={timeHorizon.toString()} onValueChange={(value) => setTimeHorizon(parseInt(value))}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Battery Selection */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">
              Select batteries to compare (max 4):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {enhancedBatteries.map(battery => {
                const isSelected = selectedBatteries.includes(battery.id);
                const selectedIndex = selectedBatteries.indexOf(battery.id);
                const riskScore = riskAnalysis.find(r => r.batteryId === battery.id)?.riskScore || 0;
                
                return (
                  <Button
                    key={battery.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBatterySelect(battery.id)}
                    disabled={!isSelected && selectedBatteries.length >= 4}
                    className={`text-xs transition-all duration-300 relative p-3 h-auto ${
                      isSelected
                        ? `bg-gradient-to-r from-blue-600/80 to-blue-500/80 border-2 text-white shadow-lg transform scale-105 ring-2 ring-blue-400/50` 
                        : 'bg-slate-700/50 border-slate-500/50 text-slate-300 hover:bg-slate-600/60 hover:border-slate-400/60'
                    }`}
                    style={isSelected ? {
                      borderColor: colors[selectedIndex],
                      boxShadow: `0 0 15px ${colors[selectedIndex]}40, 0 4px 12px rgba(0,0,0,0.3)`
                    } : {}}
                  >
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{battery.id}</span>
                        {riskScore > 0 && (
                          <AlertTriangle className={`h-3 w-3 ${
                            riskScore > 5 ? 'text-red-400' : riskScore > 3 ? 'text-yellow-400' : 'text-orange-400'
                          }`} />
                        )}
                      </div>
                      <div className="text-xs text-slate-400 w-full">
                        <div className="flex justify-between">
                          <span>SoH: {battery.soh.toFixed(1)}%</span>
                          <span>{battery.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Temp: {battery.operatingTemp?.toFixed(1)}°C</span>
                          <span>{battery.application}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-0 bg-white/20 text-white border-0"
                        >
                          #{selectedIndex + 1}
                        </Badge>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={generateComparison} 
              disabled={selectedBatteries.length < 2}
              className="bg-blue-600/70 hover:bg-blue-600/85 border-blue-400/50"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Generate Analysis
            </Button>
            
            <Button 
              onClick={() => setShowRecommendations(!showRecommendations)}
              disabled={selectedBatteries.length === 0}
              variant="outline"
              className="border-slate-500/50"
            >
              <Target className="h-4 w-4 mr-2" />
              {showRecommendations ? 'Hide' : 'Show'} Recommendations
            </Button>
          </div>

          {/* Risk Analysis Panel */}
          {riskAnalysis.length > 0 && (
            <Card className="bg-slate-800/20 border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riskAnalysis.map(analysis => (
                    <div key={analysis.batteryId} className="p-3 bg-slate-900/40 rounded-lg border border-slate-600/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-200">{analysis.batteryId}</h4>
                        <Badge className={`${
                          analysis.riskScore > 5 ? 'bg-red-600/80' : 
                          analysis.riskScore > 3 ? 'bg-yellow-600/80' : 
                          'bg-green-600/80'
                        } text-white border-0`}>
                          Risk: {analysis.riskScore > 5 ? 'High' : analysis.riskScore > 3 ? 'Medium' : 'Low'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {analysis.risks.map((risk: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            {risk.severity === 'high' ? (
                              <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                            ) : risk.severity === 'medium' ? (
                              <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            )}
                            <span className="text-slate-300">{risk.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations Panel */}
          {showRecommendations && (
            <Card className="bg-slate-800/20 border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getRecommendations().map(rec => (
                    <div key={rec.batteryId} className="p-3 bg-slate-900/40 rounded-lg border border-slate-600/20">
                      <h4 className="font-medium text-slate-200 mb-2">{rec.batteryId}</h4>
                      <ul className="space-y-1">
                        {rec.recommendations.map((recommendation, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {comparisonData.length > 0 && (
            <div className="space-y-6">
              {/* Chart */}
              <div className="w-full">
                <h3 className="text-lg font-medium text-slate-200 mb-4">
                  {comparisonMode === 'soh' ? 'State of Health Degradation' :
                   comparisonMode === 'cost' ? 'Total Cost of Ownership' :
                   comparisonMode === 'temperature' ? 'Temperature Impact Analysis' :
                   'Performance Score Comparison'}
                </h3>
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
                        label={{ 
                          value: comparisonMode === 'cost' ? 'Cost ($)' : 
                                 comparisonMode === 'temperature' ? 'Temp-Adjusted SoH (%)' :
                                 comparisonMode === 'performance' ? 'Performance Score' : 'SoH (%)', 
                          angle: -90, 
                          position: 'insideLeft', 
                          style: { fill: '#94a3b8' } 
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 22, 41, 0.95)', 
                          border: '1px solid rgba(71, 85, 105, 0.4)',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }} 
                        formatter={(value: any, name: string) => [
                          comparisonMode === 'cost' ? `$${Number(value).toFixed(0)}` : `${Number(value).toFixed(1)}${comparisonMode === 'cost' ? '' : '%'}`, 
                          name
                        ]}
                        labelFormatter={(cycle) => `Cycle: ${cycle}`}
                      />
                      <Legend />
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

              {/* Enhanced Comparison Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getComparisonMetrics().map((battery, index) => (
                  <Card key={battery.id} className="border border-slate-600/30 bg-slate-800/40 relative">
                    <div 
                      className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
                      style={{ backgroundColor: colors[index] }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-100">{battery.id}</h4>
                          <p className="text-xs text-slate-400">{battery.location} • {battery.application}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full shadow-lg"
                            style={{ 
                              backgroundColor: colors[index],
                              boxShadow: `0 0 8px ${colors[index]}60`
                            }}
                          />
                          <Badge variant="outline" className="text-slate-200 border-slate-500/50">
                            {battery.chemistry}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">SoH:</span>
                            <span className="text-blue-300 font-medium">{battery.soh.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Cycles:</span>
                            <span className="text-purple-300 font-medium">{battery.cycles.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">RUL:</span>
                            <span className="text-emerald-300 font-medium">{battery.rul}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Temp:</span>
                            <span className="text-orange-300 font-medium">{battery.operatingTemp?.toFixed(1)}°C</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">TCO:</span>
                            <span className="text-red-300 font-medium">${battery.totalCostOfOwnership.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Energy:</span>
                            <span className="text-cyan-300 font-medium">{battery.energyDensity?.toFixed(0)} Wh/kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Power:</span>
                            <span className="text-pink-300 font-medium">{battery.powerDensity?.toFixed(0)} W/kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Warranty:</span>
                            <span className="text-teal-300 font-medium">{battery.warranty}y</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-600/30">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Est. Replacement:</span>
                          <span className="text-amber-300 font-medium text-sm">
                            {battery.expectedReplacementDate.toLocaleDateString()}
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
