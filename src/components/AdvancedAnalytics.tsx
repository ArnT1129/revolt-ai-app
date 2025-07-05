import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, ScatterChart, Scatter, ComposedChart, Area, AreaChart } from "recharts";
import { TrendingDown, AlertTriangle, Download, FileText, Battery, Zap, Activity, Clock, DollarSign, Thermometer, Calendar, Target, Shuffle, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Battery as BatteryType } from "@/types";

interface AdvancedAnalyticsProps {
  batteries: BatteryType[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AdvancedAnalytics({ batteries }: AdvancedAnalyticsProps) {
  const [degradationAnalysis, setDegradationAnalysis] = useState<any[]>([]);
  const [chemistryComparison, setChemistryComparison] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [cycleVsSoH, setCycleVsSoH] = useState<any[]>([]);
  const [fleetHealthTrend, setFleetHealthTrend] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  
  // New unique features
  const [replacementPrediction, setReplacementPrediction] = useState<any[]>([]);
  const [financialImpact, setFinancialImpact] = useState<any>(null);
  const [batchAnalysis, setBatchAnalysis] = useState<any[]>([]);
  const [warrantyClaims, setWarrantyClaims] = useState<any[]>([]);
  const [loadBalancing, setLoadBalancing] = useState<any[]>([]);
  const [temperatureCorrelation, setTemperatureCorrelation] = useState<any[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([]);
  const [capacityFading, setCapacityFading] = useState<any[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<any[]>([]);

  useEffect(() => {
    if (batteries.length === 0) return;

    // Original analysis (keeping existing code)
    const degradationData = batteries.map(battery => ({
      id: battery.id,
      soh: battery.soh,
      cycles: battery.cycles,
      degradationRate: battery.cycles > 0 ? (100 - battery.soh) / battery.cycles * 100 : 0,
      chemistry: battery.chemistry,
      grade: battery.grade,
      rul: battery.rul
    })).sort((a, b) => a.cycles - b.cycles);

    setDegradationAnalysis(degradationData);

    const scatterData = batteries.map(battery => ({
      cycles: battery.cycles,
      soh: battery.soh,
      chemistry: battery.chemistry,
      id: battery.id,
      grade: battery.grade
    }));
    setCycleVsSoH(scatterData);

    const chemistryStats = batteries.reduce((acc, battery) => {
      if (!acc[battery.chemistry]) {
        acc[battery.chemistry] = { 
          totalSoH: 0, 
          totalRUL: 0, 
          totalCycles: 0, 
          count: 0,
          gradeA: 0,
          gradeB: 0,
          gradeC: 0,
          gradeD: 0,
          healthy: 0,
          degrading: 0,
          critical: 0
        };
      }
      const stats = acc[battery.chemistry];
      stats.totalSoH += battery.soh;
      stats.totalRUL += battery.rul;
      stats.totalCycles += battery.cycles;
      stats.count++;
      stats[`grade${battery.grade}`]++;
      
      if (battery.status === 'Healthy') stats.healthy++;
      else if (battery.status === 'Degrading') stats.degrading++;
      else if (battery.status === 'Critical') stats.critical++;
      
      return acc;
    }, {} as any);

    const chemistryData = Object.entries(chemistryStats).map(([chemistry, stats]: [string, any]) => ({
      chemistry,
      avgSoH: Number((stats.totalSoH / stats.count).toFixed(1)),
      avgRUL: Math.round(stats.totalRUL / stats.count),
      avgCycles: Math.round(stats.totalCycles / stats.count),
      count: stats.count,
      healthyPercent: Math.round((stats.healthy / stats.count) * 100),
      degradingPercent: Math.round((stats.degrading / stats.count) * 100),
      criticalPercent: Math.round((stats.critical / stats.count) * 100),
      gradeAPercent: Math.round((stats.gradeA / stats.count) * 100)
    }));

    setChemistryComparison(chemistryData);

    const gradeStats = batteries.reduce((acc, battery) => {
      if (!acc[battery.grade]) {
        acc[battery.grade] = { count: 0, avgSoH: 0, avgRUL: 0, avgCycles: 0 };
      }
      acc[battery.grade].count++;
      acc[battery.grade].avgSoH += battery.soh;
      acc[battery.grade].avgRUL += battery.rul;
      acc[battery.grade].avgCycles += battery.cycles;
      return acc;
    }, {} as any);

    const gradeData = Object.entries(gradeStats).map(([grade, stats]: [string, any]) => ({
      grade,
      count: stats.count,
      percentage: Number(((stats.count / batteries.length) * 100).toFixed(1)),
      avgSoH: Number((stats.avgSoH / stats.count).toFixed(1)),
      avgRUL: Math.round(stats.avgRUL / stats.count),
      avgCycles: Math.round(stats.avgCycles / stats.count)
    })).sort((a, b) => a.grade.localeCompare(b.grade));

    setGradeDistribution(gradeData);

    const currentDate = new Date();
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const simulatedAvgSoH = batteries.reduce((sum, battery) => {
        const degradationFactor = (i * 0.5);
        return sum + Math.max(80, battery.soh + degradationFactor);
      }, 0) / batteries.length;

      monthlyData.push({
        month: monthName,
        avgSoH: Number(simulatedAvgSoH.toFixed(1)),
        healthyCount: Math.round(batteries.filter(b => b.status === 'Healthy').length * (1 - i * 0.02)),
        degradingCount: Math.round(batteries.filter(b => b.status === 'Degrading').length * (1 + i * 0.01)),
        criticalCount: Math.round(batteries.filter(b => b.status === 'Critical').length * (1 + i * 0.03))
      });
    }
    setFleetHealthTrend(monthlyData);

    const metrics = {
      totalBatteries: batteries.length,
      avgSoH: Number((batteries.reduce((sum, b) => sum + b.soh, 0) / batteries.length).toFixed(1)),
      avgRUL: Math.round(batteries.reduce((sum, b) => sum + b.rul, 0) / batteries.length),
      totalCycles: batteries.reduce((sum, b) => sum + b.cycles, 0),
      healthyPercent: Math.round((batteries.filter(b => b.status === 'Healthy').length / batteries.length) * 100),
      criticalCount: batteries.filter(b => b.status === 'Critical').length,
      bestPerformer: batteries.reduce((best, current) => 
        current.soh > best.soh ? current : best, batteries[0]),
      worstPerformer: batteries.reduce((worst, current) => 
        current.soh < worst.soh ? current : worst, batteries[0]),
      avgDegradationRate: Number((degradationData.reduce((sum, b) => sum + b.degradationRate, 0) / degradationData.length).toFixed(3))
    };
    setPerformanceMetrics(metrics);

    // NEW UNIQUE FEATURES

    // 1. Replacement Prediction & Planning
    const replacementData = batteries.map(battery => {
      const monthsToReplacement = Math.max(0, Math.round(battery.rul / 30)); // Assuming 30 cycles per month
      const replacementMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthsToReplacement, 1);
      const urgencyScore = battery.soh < 85 ? 'High' : battery.soh < 90 ? 'Medium' : 'Low';
      
      return {
        id: battery.id,
        monthsToReplacement,
        replacementDate: replacementMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        urgencyScore,
        soh: battery.soh,
        estimatedCost: battery.chemistry === 'LFP' ? 1200 : 1800, // Estimated replacement costs
        chemistry: battery.chemistry,
        grade: battery.grade
      };
    }).sort((a, b) => a.monthsToReplacement - b.monthsToReplacement);

    setReplacementPrediction(replacementData);

    // 2. Financial Impact Analysis
    const totalReplacementCost = replacementData.reduce((sum, b) => sum + b.estimatedCost, 0);
    const criticalBatteriesCost = replacementData.filter(b => b.urgencyScore === 'High').reduce((sum, b) => sum + b.estimatedCost, 0);
    const downtimeCost = batteries.filter(b => b.status === 'Critical').length * 5000; // $5k per day downtime
    const energyLoss = batteries.reduce((sum, b) => sum + (100 - b.soh), 0) * 50; // $50 per % SoH loss

    setFinancialImpact({
      totalReplacementCost,
      criticalBatteriesCost,
      downtimeCost,
      energyLoss,
      totalFinancialRisk: totalReplacementCost + downtimeCost + energyLoss,
      savingsOpportunity: batteries.filter(b => b.soh > 95).length * 200 // Extended life savings
    });

    // 3. Batch Analysis (Manufacturing lot tracking)
    const batchData = batteries.reduce((acc, battery) => {
      const batch = battery.id.split('-')[0] || 'Unknown'; // Assuming batch is in ID prefix
      if (!acc[batch]) {
        acc[batch] = { batteries: [], avgSoH: 0, variance: 0, count: 0 };
      }
      acc[batch].batteries.push(battery);
      acc[batch].count++;
      return acc;
    }, {} as any);

    const batchAnalysisData = Object.entries(batchData).map(([batch, data]: [string, any]) => {
      const avgSoH = data.batteries.reduce((sum: number, b: any) => sum + b.soh, 0) / data.count;
      const variance = data.batteries.reduce((sum: number, b: any) => sum + Math.pow(b.soh - avgSoH, 2), 0) / data.count;
      const qualityScore = avgSoH > 95 ? 'Excellent' : avgSoH > 90 ? 'Good' : avgSoH > 85 ? 'Fair' : 'Poor';
      
      return {
        batch,
        count: data.count,
        avgSoH: Number(avgSoH.toFixed(1)),
        variance: Number(variance.toFixed(1)),
        qualityScore,
        consistencyRating: variance < 5 ? 'High' : variance < 10 ? 'Medium' : 'Low'
      };
    });

    setBatchAnalysis(batchAnalysisData);

    // 4. Warranty Claims Prediction
    const warrantyData = batteries.map(battery => {
      const warrantyExpiry = new Date(battery.uploadDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 3); // 3-year warranty
      const isUnderWarranty = new Date() < warrantyExpiry;
      const claimProbability = battery.soh < 85 ? 0.8 : battery.soh < 90 ? 0.4 : 0.1;
      
      return {
        id: battery.id,
        isUnderWarranty,
        claimProbability,
        soh: battery.soh,
        status: battery.status,
        estimatedClaimCost: claimProbability * 1500
      };
    });

    setWarrantyClaims(warrantyData);

    // 5. Load Balancing Optimization
    const loadBalancingData = batteries.map(battery => {
      const utilizationScore = (battery.cycles / 5000) * 100; // Assuming 5000 is max cycles
      const balancingRecommendation = battery.soh > 95 ? 'Increase Load' : battery.soh < 85 ? 'Reduce Load' : 'Maintain';
      
      return {
        id: battery.id,
        soh: battery.soh,
        utilizationScore: Math.min(100, Number(utilizationScore.toFixed(1))),
        balancingRecommendation,
        priority: battery.soh < 85 ? 1 : battery.soh < 90 ? 2 : 3
      };
    }).sort((a, b) => a.priority - b.priority);

    setLoadBalancing(loadBalancingData);

    // 6. Temperature Correlation Analysis
    const temperatureData = batteries.map(battery => {
      const simulatedTemp = 25 + (Math.random() - 0.5) * 20; // Simulated temperature
      const tempImpact = simulatedTemp > 35 ? 'High Risk' : simulatedTemp > 30 ? 'Medium Risk' : 'Low Risk';
      
      return {
        id: battery.id,
        temperature: Number(simulatedTemp.toFixed(1)),
        soh: battery.soh,
        tempImpact,
        degradationAcceleration: simulatedTemp > 35 ? 1.5 : simulatedTemp > 30 ? 1.2 : 1.0
      };
    });

    setTemperatureCorrelation(temperatureData);

    // 7. Maintenance Schedule Optimization
    const maintenanceData = batteries.map(battery => {
      const daysSinceLastMaintenance = Math.floor(Math.random() * 90); // Random days 0-90
      const maintenanceUrgency = daysSinceLastMaintenance > 60 ? 'Overdue' : daysSinceLastMaintenance > 30 ? 'Due Soon' : 'Not Due';
      const nextMaintenanceDate = new Date();
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + (90 - daysSinceLastMaintenance));
      
      return {
        id: battery.id,
        daysSinceLastMaintenance,
        maintenanceUrgency,
        nextMaintenanceDate: nextMaintenanceDate.toLocaleDateString(),
        soh: battery.soh,
        estimatedMaintenanceCost: battery.status === 'Critical' ? 500 : 200
      };
    }).sort((a, b) => a.daysSinceLastMaintenance - b.daysSinceLastMaintenance);

    setMaintenanceSchedule(maintenanceData);

    // 8. Capacity Fading Analysis
    const capacityData = batteries.map(battery => {
      const initialCapacity = 100; // Assumed initial capacity
      const currentCapacity = battery.soh;
      const fadingRate = (100 - battery.soh) / battery.cycles * 1000; // Per 1000 cycles
      
      return {
        id: battery.id,
        initialCapacity,
        currentCapacity,
        capacityLoss: Number((100 - battery.soh).toFixed(1)),
        fadingRate: Number(fadingRate.toFixed(3)),
        cycles: battery.cycles,
        chemistry: battery.chemistry
      };
    });

    setCapacityFading(capacityData);

    // 9. Risk Assessment Matrix
    const riskData = batteries.map(battery => {
      const ageRisk = battery.cycles > 4000 ? 'High' : battery.cycles > 2000 ? 'Medium' : 'Low';
      const performanceRisk = battery.soh < 85 ? 'High' : battery.soh < 90 ? 'Medium' : 'Low';
      const overallRisk = (ageRisk === 'High' || performanceRisk === 'High') ? 'High' : 
                         (ageRisk === 'Medium' || performanceRisk === 'Medium') ? 'Medium' : 'Low';
      
      return {
        id: battery.id,
        ageRisk,
        performanceRisk,
        overallRisk,
        soh: battery.soh,
        cycles: battery.cycles,
        riskScore: battery.soh < 85 ? 9 : battery.soh < 90 ? 6 : 3
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    setRiskAssessment(riskData);

  }, [batteries]);

  const exportAnalytics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      fleetSummary: performanceMetrics,
      degradationAnalysis,
      chemistryComparison,
      gradeDistribution,
      cycleVsSoHData: cycleVsSoH,
      fleetHealthTrend,
      // New exports
      replacementPrediction,
      financialImpact,
      batchAnalysis,
      warrantyClaims,
      loadBalancing,
      temperatureCorrelation,
      maintenanceSchedule,
      capacityFading,
      riskAssessment,
      batteryDetails: batteries.map(b => ({
        id: b.id,
        soh: b.soh,
        rul: b.rul,
        cycles: b.cycles,
        chemistry: b.chemistry,
        grade: b.grade,
        status: b.status,
        uploadDate: b.uploadDate
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive-fleet-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (batteries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Battery className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Battery Data Available</h3>
          <p className="text-muted-foreground">Upload battery data to view advanced analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Fleet Analytics Dashboard</h2>
        <Button onClick={exportAnalytics} className="glass-button">
          <Download className="h-4 w-4 mr-2" />
          Export Analytics
        </Button>
      </div>

      {/* Fleet Overview Cards */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="enhanced-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-slate-400">Fleet Size</span>
              </div>
              <p className="text-2xl font-bold text-white">{performanceMetrics.totalBatteries}</p>
              <p className="text-xs text-slate-500">Total Batteries</p>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-green-400" />
                <span className="text-sm text-slate-400">Avg SoH</span>
              </div>
              <p className="text-2xl font-bold text-white">{performanceMetrics.avgSoH}%</p>
              <p className="text-xs text-slate-500">{performanceMetrics.healthyPercent}% Healthy</p>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-slate-400">Avg RUL</span>
              </div>
              <p className="text-2xl font-bold text-white">{performanceMetrics.avgRUL}</p>
              <p className="text-xs text-slate-500">Cycles Remaining</p>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-sm text-slate-400">Critical</span>
              </div>
              <p className="text-2xl font-bold text-white">{performanceMetrics.criticalCount}</p>
              <p className="text-xs text-slate-500">Need Attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Impact Overview */}
      {financialImpact && (
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5 text-green-400" />
              Financial Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-red-500/20 rounded-lg bg-red-500/10">
                <h4 className="text-red-400 font-medium mb-2">Total Financial Risk</h4>
                <p className="text-2xl font-bold text-white">${financialImpact.totalFinancialRisk.toLocaleString()}</p>
                <p className="text-sm text-slate-300">Replacement + Downtime + Energy Loss</p>
              </div>
              <div className="p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/10">
                <h4 className="text-yellow-400 font-medium mb-2">Critical Replacements</h4>
                <p className="text-2xl font-bold text-white">${financialImpact.criticalBatteriesCost.toLocaleString()}</p>
                <p className="text-sm text-slate-300">Immediate attention needed</p>
              </div>
              <div className="p-4 border border-green-500/20 rounded-lg bg-green-500/10">
                <h4 className="text-green-400 font-medium mb-2">Savings Opportunity</h4>
                <p className="text-2xl font-bold text-white">${financialImpact.savingsOpportunity.toLocaleString()}</p>
                <p className="text-sm text-slate-300">Extended life optimization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replacement Planning */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-blue-400" />
            Replacement Planning & Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">Replacement Timeline</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {replacementPrediction.slice(0, 8).map((battery, index) => (
                  <div key={battery.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20">
                    <div>
                      <p className="text-white font-medium">{battery.id}</p>
                      <p className="text-sm text-slate-400">{battery.replacementDate}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={battery.urgencyScore === 'High' ? 'destructive' : 
                               battery.urgencyScore === 'Medium' ? 'default' : 'secondary'}
                      >
                        {battery.urgencyScore}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">${battery.estimatedCost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={replacementPrediction.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="id" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="avgSoH" fill="#8B5CF6" name="Avg SoH %" />
                  <Bar dataKey="variance" fill="#F59E0B" name="Variance" />
                  <Bar dataKey="monthsToReplacement" fill="#3B82F6" name="Months to Replacement" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Balancing & Risk Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shuffle className="h-5 w-5 text-cyan-400" />
              Load Balancing Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {loadBalancing.slice(0, 6).map((battery, index) => (
                <div key={battery.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20">
                  <div>
                    <p className="text-white font-medium">{battery.id}</p>
                    <p className="text-sm text-slate-400">SoH: {battery.soh}%</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={battery.balancingRecommendation === 'Reduce Load' ? 'destructive' : 
                             battery.balancingRecommendation === 'Increase Load' ? 'default' : 'secondary'}
                    >
                      {battery.balancingRecommendation}
                    </Badge>
                    <p className="text-xs text-slate-400 mt-1">Utilization: {battery.utilizationScore}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Risk Assessment Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {riskAssessment.slice(0, 6).map((battery, index) => (
                <div key={battery.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20">
                  <div>
                    <p className="text-white font-medium">{battery.id}</p>
                    <p className="text-sm text-slate-400">Score: {battery.riskScore}/10</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={battery.overallRisk === 'High' ? 'destructive' : 
                             battery.overallRisk === 'Medium' ? 'default' : 'secondary'}
                    >
                      {battery.overallRisk} Risk
                    </Badge>
                    <p className="text-xs text-slate-400 mt-1">Age: {battery.ageRisk} | Perf: {battery.performanceRisk}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Correlation & Capacity Fading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Thermometer className="h-5 w-5 text-red-400" />
              Temperature Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={temperatureCorrelation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="temperature" stroke="#9CA3AF" />
                  <YAxis dataKey="soh" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value, name) => [
                      name === 'soh' ? `${value}%` : `${value}°C`,
                      name === 'soh' ? 'SoH' : 'Temperature'
                    ]}
                  />
                  <Scatter 
                    name="Low Risk" 
                    data={temperatureCorrelation.filter(d => d.tempImpact === 'Low Risk')} 
                    fill="#10B981" 
                  />
                  <Scatter 
                    name="Medium Risk" 
                    data={temperatureCorrelation.filter(d => d.tempImpact === 'Medium Risk')} 
                    fill="#F59E0B" 
                  />
                  <Scatter 
                    name="High Risk" 
                    data={temperatureCorrelation.filter(d => d.tempImpact === 'High Risk')} 
                    fill="#EF4444" 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingDown className="h-5 w-5 text-indigo-400" />
              Capacity Fading Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityFading.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="id" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="fadingRate" fill="#8B5CF6" name="Fading Rate (%/1000 cycles)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Schedule */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-blue-400" />
            Maintenance Schedule Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {maintenanceSchedule.slice(0, 8).map((battery, index) => (
                <div key={battery.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20">
                  <div>
                    <p className="text-white font-medium">{battery.id}</p>
                    <p className="text-sm text-slate-400">Next: {battery.nextMaintenanceDate}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={battery.maintenanceUrgency === 'Overdue' ? 'destructive' : 
                             battery.maintenanceUrgency === 'Due Soon' ? 'default' : 'secondary'}
                    >
                      {battery.maintenanceUrgency}
                    </Badge>
                    <p className="text-xs text-slate-400 mt-1">Cost: ${battery.estimatedMaintenanceCost}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceSchedule.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="id" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="daysSinceLastMaintenance" fill="#06B6D4" name="Days Since Last Maintenance" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warranty Claims Analysis */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-green-400" />
            Warranty Claims Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border border-white/10 rounded-lg bg-black/20">
              <h4 className="text-slate-300 font-medium mb-2">Under Warranty</h4>
              <p className="text-2xl font-bold text-green-400">
                {warrantyClaims.filter(w => w.isUnderWarranty).length}
              </p>
              <p className="text-sm text-slate-400">Batteries covered</p>
            </div>
            <div className="p-4 border border-white/10 rounded-lg bg-black/20">
              <h4 className="text-slate-300 font-medium mb-2">High Claim Risk</h4>
              <p className="text-2xl font-bold text-yellow-400">
                {warrantyClaims.filter(w => w.claimProbability > 0.5).length}
              </p>
              <p className="text-sm text-slate-400">Likely claims</p>
            </div>
            <div className="p-4 border border-white/10 rounded-lg bg-black/20">
              <h4 className="text-slate-300 font-medium mb-2">Estimated Claims Cost</h4>
              <p className="text-2xl font-bold text-red-400">
                ${warrantyClaims.reduce((sum, w) => sum + w.estimatedClaimCost, 0).toFixed(0)}
              </p>
              <p className="text-sm text-slate-400">Potential liability</p>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {warrantyClaims
              .filter(w => w.claimProbability > 0.3)
              .slice(0, 6)
              .map((battery, index) => (
                <div key={battery.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20">
                  <div>
                    <p className="text-white font-medium">{battery.id}</p>
                    <p className="text-sm text-slate-400">SoH: {battery.soh}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{(battery.claimProbability * 100).toFixed(0)}%</p>
                    <p className="text-xs text-slate-400">${battery.estimatedClaimCost.toFixed(0)} risk</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Original Analysis - SoH vs Cycles Correlation */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingDown className="h-5 w-5 text-blue-400" />
            Battery Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">SoH vs Cycle Count</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={cycleVsSoH}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="cycles" stroke="#9CA3AF" />
                    <YAxis dataKey="soh" domain={[75, 100]} stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value, name) => [
                        name === 'soh' ? `${value}%` : value,
                        name === 'soh' ? 'SoH' : 'Cycles'
                      ]}
                      labelFormatter={(label, payload) => 
                        payload?.[0]?.payload ? `${payload[0].payload.id} (${payload[0].payload.chemistry})` : ''
                      }
                    />
                    <Scatter 
                      name="LFP" 
                      data={cycleVsSoH.filter(d => d.chemistry === 'LFP')} 
                      fill="#10B981" 
                    />
                    <Scatter 
                      name="NMC" 
                      data={cycleVsSoH.filter(d => d.chemistry === 'NMC')} 
                      fill="#3B82F6" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Degradation Rate by Battery</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={degradationAnalysis.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="id" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value) => [`${Number(value).toFixed(3)}%`, 'Degradation Rate']}
                    />
                    <Bar dataKey="degradationRate" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chemistry Comparison */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Chemistry Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chemistryComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  <Bar dataKey="avgSoH" fill="#10B981" name="Avg SoH %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {chemistryComparison.map((chem, index) => (
                <div key={chem.chemistry} className="p-4 border border-white/10 rounded-lg bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">{chem.chemistry}</h4>
                    <Badge variant="outline" className="text-slate-300 border-white/20">
                      {chem.count} batteries
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Avg SoH</p>
                      <p className="text-blue-400 font-medium">{chem.avgSoH}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Avg RUL</p>
                      <p className="text-cyan-400 font-medium">{chem.avgRUL}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Healthy</p>
                      <p className="text-green-400 font-medium">{chem.healthyPercent}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Grade A</p>
                      <p className="text-indigo-400 font-medium">{chem.gradeAPercent}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution & Fleet Health Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
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
            <div className="space-y-2">
              {gradeDistribution.map((grade, index) => (
                <div key={grade.grade} className="flex items-center justify-between p-2 border border-white/10 rounded bg-black/20">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-white font-medium">Grade {grade.grade}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">{grade.count} ({grade.percentage}%)</p>
                    <p className="text-slate-400 text-xs">Avg SoH: {grade.avgSoH}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Fleet Health Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fleetHealthTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }} 
                  />
                  <Line type="monotone" dataKey="avgSoH" stroke="#60A5FA" strokeWidth={2} name="Avg SoH %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-green-400 font-medium">{fleetHealthTrend[fleetHealthTrend.length - 1]?.healthyCount || 0}</p>
                <p className="text-xs text-slate-400">Healthy</p>
              </div>
              <div>
                <p className="text-yellow-400 font-medium">{fleetHealthTrend[fleetHealthTrend.length - 1]?.degradingCount || 0}</p>
                <p className="text-xs text-slate-400">Degrading</p>
              </div>
              <div>
                <p className="text-red-400 font-medium">{fleetHealthTrend[fleetHealthTrend.length - 1]?.criticalCount || 0}</p>
                <p className="text-xs text-slate-400">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {performanceMetrics && (
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Fleet Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 border border-green-500/20 rounded-lg bg-green-500/10">
                  <h4 className="text-green-400 font-medium mb-2">Best Performer</h4>
                  <p className="text-white font-medium">{performanceMetrics.bestPerformer.id}</p>
                  <p className="text-sm text-slate-300">
                    SoH: {performanceMetrics.bestPerformer.soh}% | 
                    RUL: {performanceMetrics.bestPerformer.rul} | 
                    Grade: {performanceMetrics.bestPerformer.grade}
                  </p>
                </div>
                
                <div className="p-4 border border-red-500/20 rounded-lg bg-red-500/10">
                  <h4 className="text-red-400 font-medium mb-2">Needs Attention</h4>
                  <p className="text-white font-medium">{performanceMetrics.worstPerformer.id}</p>
                  <p className="text-sm text-slate-300">
                    SoH: {performanceMetrics.worstPerformer.soh}% | 
                    RUL: {performanceMetrics.worstPerformer.rul} | 
                    Grade: {performanceMetrics.worstPerformer.grade}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-white/10 rounded-lg bg-black/20">
                  <h4 className="text-slate-300 font-medium mb-2">Fleet Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Cycles:</span>
                      <span className="text-white">{performanceMetrics.totalCycles.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Degradation Rate:</span>
                      <span className="text-white">{performanceMetrics.avgDegradationRate}%/cycle</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fleet Health:</span>
                      <span className="text-white">{performanceMetrics.healthyPercent}% Healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
