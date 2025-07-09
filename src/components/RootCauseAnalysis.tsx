
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, Zap, Clock, ChevronRight } from 'lucide-react';
import { Battery } from '@/types';

interface DegradationMechanism {
  mechanism: string;
  likelihood: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  indicators: string[];
  recommendations: string[];
  timeframe: string;
}

interface RootCauseAnalysisProps {
  battery: Battery;
  onClose?: () => void;
}

export default function RootCauseAnalysis({ battery, onClose }: RootCauseAnalysisProps) {
  const [analysis, setAnalysis] = useState<DegradationMechanism[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate analysis based on battery data
    const performAnalysis = () => {
      const mechanisms: DegradationMechanism[] = [];

      // Analyze based on SoH
      if (battery.soh < 80) {
        mechanisms.push({
          mechanism: 'Capacity Fade',
          likelihood: 85,
          severity: 'High',
          indicators: ['Low State of Health', 'High cycle count', 'Gradual capacity loss'],
          recommendations: ['Monitor charging patterns', 'Consider replacement planning', 'Reduce deep discharge cycles'],
          timeframe: 'Immediate attention required'
        });
      }

      // Analyze based on cycles
      if (battery.cycles > 2000) {
        mechanisms.push({
          mechanism: 'Electrode Degradation',
          likelihood: 70,
          severity: 'Medium',
          indicators: ['High cycle count', 'Increased internal resistance'],
          recommendations: ['Implement cycle optimization', 'Monitor voltage patterns', 'Schedule maintenance'],
          timeframe: '3-6 months'
        });
      }

      // Analyze based on chemistry
      if (battery.chemistry === 'NMC' && battery.soh < 85) {
        mechanisms.push({
          mechanism: 'Thermal Stress',
          likelihood: 60,
          severity: 'Medium',
          indicators: ['NMC chemistry sensitivity', 'Reduced SoH'],
          recommendations: ['Improve thermal management', 'Monitor operating temperature', 'Optimize charging rates'],
          timeframe: '1-3 months'
        });
      }

      if (mechanisms.length === 0) {
        mechanisms.push({
          mechanism: 'Normal Aging',
          likelihood: 30,
          severity: 'Low',
          indicators: ['Standard wear patterns', 'Expected degradation'],
          recommendations: ['Continue regular monitoring', 'Maintain optimal operating conditions'],
          timeframe: 'Long-term monitoring'
        });
      }

      setAnalysis(mechanisms);
      setLoading(false);
    };

    performAnalysis();
  }, [battery]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400';
      case 'High': return 'bg-orange-500/20 text-orange-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'Low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            Root Cause Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Analyzing battery degradation patterns...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            Root Cause Analysis - {battery.id}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysis.map((mechanism, index) => (
          <div key={index} className="border border-white/10 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{mechanism.mechanism}</h3>
              <div className="flex items-center gap-2">
                <Badge className={getSeverityColor(mechanism.severity)}>
                  {mechanism.severity}
                </Badge>
                <span className="text-sm text-slate-400">{mechanism.likelihood}% likely</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  Key Indicators
                </h4>
                <ul className="space-y-1">
                  {mechanism.indicators.map((indicator, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {mechanism.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-slate-300">Timeframe:</span>
              <span className="text-blue-400">{mechanism.timeframe}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
