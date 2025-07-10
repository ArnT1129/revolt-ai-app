import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, Zap, Clock, ChevronRight, Search, CheckCircle, Activity, Thermometer } from 'lucide-react';
import { Battery } from '@/types';

interface DegradationMechanism {
  id: string;
  mechanism: string;
  probability: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  indicators: string[];
  recommendations: string[];
  timeframe: string;
  icon: React.ReactNode;
  color: string;
}

interface RootCauseAnalysisProps {
  battery: Battery;
  onClose?: () => void;
}

export default function RootCauseAnalysis({ battery, onClose }: RootCauseAnalysisProps) {
  const [analysis, setAnalysis] = useState<DegradationMechanism[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    // Simulate AI-powered analysis based on battery data
    const performAdvancedAnalysis = () => {
      const mechanisms: DegradationMechanism[] = [];

      // SEI Layer Growth Analysis
      const seiProbability = calculateSEIProbability(battery);
      if (seiProbability > 30) {
        mechanisms.push({
          id: 'sei-growth',
          mechanism: 'SEI Layer Growth',
          probability: seiProbability,
          severity: seiProbability > 60 ? 'Medium' : 'Low',
          description: 'Solid Electrolyte Interphase layer thickening reduces lithium ion mobility',
          indicators: [
            `${battery.cycles} charge cycles completed`,
            `${battery.chemistry} chemistry characteristics`,
            'Capacity fade pattern consistent with SEI growth'
          ],
          recommendations: [
            'Optimize charging voltage to reduce SEI formation',
            'Implement temperature control during charging',
            'Consider electrolyte additives to stabilize SEI'
          ],
          timeframe: 'Long-term degradation process',
          icon: <Activity className="h-4 w-4" />,
          color: 'amber'
        });
      }

      // Electrolyte Decomposition Analysis
      const electrolyteProbability = calculateElectrolyteProbability(battery);
      if (electrolyteProbability > 25) {
        mechanisms.push({
          id: 'electrolyte-decomposition',
          mechanism: 'Electrolyte Decomposition',
          probability: electrolyteProbability,
          severity: 'Low',
          description: 'Electrolyte breakdown products interfere with ion transport',
          indicators: [
            `${battery.chemistry} electrolyte stability characteristics`,
            'Extended cycling accelerates decomposition',
            'Normal electrolyte function'
          ],
          recommendations: [
            'Monitor gas evolution during cycling',
            'Consider electrolyte additives for stability',
            'Implement controlled atmosphere storage',
            'Regular impedance spectroscopy analysis'
          ],
          timeframe: 'Gradual process over years',
          icon: <TrendingDown className="h-4 w-4" />,
          color: 'teal'
        });
      }

      // Lithium Plating Analysis
      const platingProbability = calculateLithiumPlatingProbability(battery);
      if (platingProbability > 20) {
        mechanisms.push({
          id: 'lithium-plating',
          mechanism: 'Lithium Plating',
          probability: platingProbability,
          severity: 'Medium',
          description: 'Metallic lithium deposits on anode causing capacity loss and safety risks',
          indicators: [
            'Normal voltage range',
            'High cycle count increases plating risk',
            'Status within normal range'
          ],
          recommendations: [
            'Reduce charging current (C-rate)',
            'Implement voltage limits below 4.2V',
            'Add temperature monitoring during fast charging',
            'Consider pulse charging protocols'
          ],
          timeframe: 'Risk increases with fast charging',
          icon: <Zap className="h-4 w-4" />,
          color: 'blue'
        });
      }

      // Active Material Loss Analysis
      const materialLossProbability = calculateActiveMaterialLoss(battery);
      if (materialLossProbability > 15) {
        mechanisms.push({
          id: 'active-material-loss',
          mechanism: 'Active Material Loss',
          probability: materialLossProbability,
          severity: 'Low',
          description: 'Loss of active material through particle cracking and dissolution',
          indicators: [
            `SoH at ${battery.soh}%`,
            `${battery.chemistry} shows good structural stability`,
            'Moderate cycle stress'
          ],
          recommendations: [
            'Optimize depth of discharge (avoid deep cycling)',
            'Implement gentler charging profiles',
            'Monitor internal resistance trends',
            'Consider material coating improvements'
          ],
          timeframe: 'Gradual with cycling',
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'green'
        });
      }

      // Thermal Degradation Analysis
      const thermalProbability = calculateThermalDegradation(battery);
      if (thermalProbability > 35) {
        mechanisms.push({
          id: 'thermal-degradation',
          mechanism: 'Thermal Degradation',
          probability: thermalProbability,
          severity: battery.chemistry === 'NMC' ? 'Medium' : 'Low',
          description: 'Elevated temperatures accelerate multiple degradation pathways',
          indicators: [
            `${battery.chemistry} chemistry thermal sensitivity`,
            'Operating temperature history',
            'Accelerated aging patterns'
          ],
          recommendations: [
            'Implement active thermal management',
            'Monitor cell temperature during operation',
            'Optimize charging rates for temperature',
            'Consider cooling system upgrades'
          ],
          timeframe: 'Temperature-dependent acceleration',
          icon: <Thermometer className="h-4 w-4" />,
          color: 'red'
        });
      }

      // Calendar Aging Analysis
      const calendarAgingProbability = calculateCalendarAging(battery);
      if (calendarAgingProbability > 25) {
        mechanisms.push({
          id: 'calendar-aging',
          mechanism: 'Calendar Aging',
          probability: calendarAgingProbability,
          severity: 'Low',
          description: 'Time-dependent degradation occurring even during storage',
          indicators: [
            'Age-related capacity loss',
            'Storage conditions impact',
            'Independent of cycling'
          ],
          recommendations: [
            'Optimize storage state of charge (40-60%)',
            'Control storage temperature',
            'Periodic maintenance cycling',
            'Monitor self-discharge rates'
          ],
          timeframe: 'Continuous time-based process',
          icon: <Clock className="h-4 w-4" />,
          color: 'purple'
        });
      }

      // Sort by probability (highest first)
      mechanisms.sort((a, b) => b.probability - a.probability);

      setAnalysis(mechanisms);
      setLoading(false);
      setAnalysisComplete(true);
    };

    // Simulate analysis delay
    const timer = setTimeout(() => {
      performAdvancedAnalysis();
    }, 2000);

    return () => clearTimeout(timer);
  }, [battery]);

  // AI Analysis Functions
  const calculateSEIProbability = (battery: Battery): number => {
    let probability = 20; // Base probability
    
    // Cycle count impact
    if (battery.cycles > 1000) probability += 30;
    if (battery.cycles > 2000) probability += 20;
    
    // Chemistry impact
    if (battery.chemistry === 'LFP') probability += 20;
    if (battery.chemistry === 'NMC') probability += 15;
    
    // SoH impact
    if (battery.soh < 80) probability += 15;
    if (battery.soh < 90) probability += 10;
    
    return Math.min(probability, 85);
  };

  const calculateElectrolyteProbability = (battery: Battery): number => {
    let probability = 15;
    
    if (battery.cycles > 1500) probability += 20;
    if (battery.chemistry === 'NMC') probability += 10;
    if (battery.soh < 85) probability += 10;
    
    return Math.min(probability, 65);
  };

  const calculateLithiumPlatingProbability = (battery: Battery): number => {
    let probability = 10;
    
    if (battery.cycles > 1000) probability += 15;
    if (battery.cycles > 2000) probability += 15;
    if (battery.chemistry === 'NMC') probability += 5;
    
    return Math.min(probability, 50);
  };

  const calculateActiveMaterialLoss = (battery: Battery): number => {
    let probability = 10;
    
    if (battery.soh < 90) probability += 10;
    if (battery.soh < 80) probability += 8;
    if (battery.cycles > 1500) probability += 7;
    
    return Math.min(probability, 35);
  };

  const calculateThermalDegradation = (battery: Battery): number => {
    let probability = 20;
    
    if (battery.chemistry === 'NMC') probability += 20;
    if (battery.soh < 85) probability += 15;
    if (battery.cycles > 1000) probability += 10;
    
    return Math.min(probability, 75);
  };

  const calculateCalendarAging = (battery: Battery): number => {
    let probability = 15;
    
    // Assume some age-based calculation
    if (battery.cycles > 500) probability += 15;
    if (battery.soh < 95) probability += 10;
    
    return Math.min(probability, 45);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      amber: 'border-amber-500/30 bg-amber-500/5',
      teal: 'border-teal-500/30 bg-teal-500/5',
      blue: 'border-blue-500/30 bg-blue-500/5',
      green: 'border-green-500/30 bg-green-500/5',
      red: 'border-red-500/30 bg-red-500/5',
      purple: 'border-purple-500/30 bg-purple-500/5'
    };
    return colorMap[color as keyof typeof colorMap] || 'border-gray-500/30 bg-gray-500/5';
  };

  if (loading) {
    return (
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-400" />
            Root Cause Analysis - {battery.id}
          </CardTitle>
          <p className="text-sm text-slate-400">
            AI-powered analysis of potential root causes based on battery chemistry, cycle count, and performance data.
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-400 mb-2">Analyzing degradation mechanisms...</p>
            <div className="text-xs text-slate-500">
              Processing battery chemistry, cycle data, and performance metrics
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-400" />
              Root Cause Analysis - {battery.id}
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              AI-powered analysis of potential root causes based on battery chemistry, cycle count, and performance data.
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisComplete && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 rounded-lg p-3">
            <CheckCircle className="h-4 w-4" />
            <span>Degradation Mechanism Analysis Complete</span>
          </div>
        )}

        {analysis.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Battery Health Optimal</h3>
            <p className="text-slate-400">
              No significant degradation mechanisms detected. Continue regular monitoring.
            </p>
          </div>
        )}

        {analysis.map((mechanism, index) => (
          <div key={mechanism.id} className={`border rounded-lg p-4 space-y-4 ${getColorClasses(mechanism.color)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {mechanism.icon}
                  <h3 className="text-lg font-semibold text-white">{mechanism.mechanism}</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getSeverityColor(mechanism.severity)}>
                  {mechanism.severity}
                </Badge>
                <span className="text-sm font-medium text-white">{mechanism.probability}% probability</span>
              </div>
            </div>

            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${mechanism.probability}%` }}
              />
            </div>

            <p className="text-slate-300 text-sm">{mechanism.description}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  Key Indicators:
                </h4>
                <ul className="space-y-2">
                  {mechanism.indicators.map((indicator, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Recommended Actions:
                </h4>
                <ul className="space-y-2">
                  {mechanism.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm pt-2 border-t border-white/10">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-slate-300">Analysis Timeframe:</span>
              <span className="text-blue-400">{mechanism.timeframe}</span>
            </div>
          </div>
        ))}

        {analysis.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-300 mb-2">Analysis Summary</h4>
            <p className="text-sm text-slate-300">
              {analysis.length} potential degradation mechanism{analysis.length > 1 ? 's' : ''} identified. 
              Focus on the highest probability mechanisms first. Regular monitoring and preventive maintenance 
              can significantly extend battery life.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
