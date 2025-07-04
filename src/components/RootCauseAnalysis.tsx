
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Battery } from "@/types";
import { AlertTriangle, Search, Zap, Thermometer, Activity } from "lucide-react";

interface RootCauseAnalysisProps {
  battery: Battery;
}

interface DegradationMechanism {
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  probability: number;
  description: string;
  indicators: string[];
  recommendations: string[];
}

export default function RootCauseAnalysis({ battery }: RootCauseAnalysisProps) {
  const [mechanisms, setMechanisms] = useState<DegradationMechanism[]>([]);

  useEffect(() => {
    const analyzeDegradationMechanisms = (): DegradationMechanism[] => {
      const analysis: DegradationMechanism[] = [];

      // SEI Layer Growth Analysis
      const seiProbability = battery.chemistry === 'NMC' && battery.cycles > 500 ? 
        Math.min(85, 30 + (battery.cycles / 100) * 10) : 
        Math.min(70, 20 + (battery.cycles / 100) * 8);

      analysis.push({
        type: 'SEI Layer Growth',
        severity: seiProbability > 70 ? 'High' : seiProbability > 50 ? 'Medium' : 'Low',
        probability: seiProbability,
        description: 'Solid Electrolyte Interphase layer thickening reduces lithium ion mobility',
        indicators: [
          `${battery.cycles} charge cycles completed`,
          `${battery.chemistry} chemistry characteristics`,
          battery.soh < 90 ? 'Capacity fade pattern consistent with SEI growth' : 'Normal capacity retention'
        ],
        recommendations : [
          'Optimize charging voltage to reduce SEI formation',
          'Implement temperature control during charging',
          'Consider electrolyte additives to stabilize SEI'
        ]
      });

      // Lithium Plating Analysis
      const platingRisk = battery.rawData ? 
        battery.rawData.some((d: any) => d.voltage_V > 4.2) ? 80 : 
        battery.cycles > 1000 ? 60 : 30 : 40;

      analysis.push({
        type: 'Lithium Plating',
        severity: platingRisk > 70 ? 'Critical' : platingRisk > 50 ? 'High' : 'Medium',
        probability: platingRisk,
        description: 'Metallic lithium deposits on anode causing capacity loss and safety risks',
        indicators: [
          battery.rawData?.some((d: any) => d.voltage_V > 4.2) ? 'High voltage charging detected' : 'Normal voltage range',
          battery.cycles > 1000 ? 'High cycle count increases plating risk' : 'Moderate cycle count',
          battery.status === 'Critical' ? 'Critical status indicates potential plating' : 'Status within normal range'
        ],
        recommendations: [
          'Reduce charging current (C-rate)',
          'Implement voltage limits below 4.2V',
          'Add temperature monitoring during fast charging',
          'Consider pulse charging protocols'
        ]
      });

      // Active Material Loss
      const materialLoss = battery.soh < 85 ? 
        Math.min(90, 40 + (100 - battery.soh) * 2) : 
        Math.min(50, 20 + (battery.cycles / 200));

      analysis.push({
        type: 'Active Material Loss',
        severity: materialLoss > 70 ? 'High' : materialLoss > 50 ? 'Medium' : 'Low',
        probability: materialLoss,
        description: 'Loss of active material through particle cracking and dissolution',
        indicators: [
          `SoH at ${battery.soh.toFixed(1)}%`,
          battery.chemistry === 'NMC' ? 'NMC cathodes susceptible to transition metal dissolution' : 'LFP shows good structural stability',
          battery.cycles > 1500 ? 'High cycle stress on active materials' : 'Moderate cycle stress'
        ],
        recommendations: [
          'Optimize depth of discharge (avoid deep cycling)',
          'Implement gentler charging profiles',
          'Monitor internal resistance trends',
          'Consider material coating improvements'
        ]
      });

      // Electrolyte Decomposition
      const electrolyteRisk = battery.chemistry === 'NMC' && battery.cycles > 800 ? 65 :
        battery.chemistry === 'LFP' && battery.cycles > 1200 ? 45 : 25;

      analysis.push({
        type: 'Electrolyte Decomposition',
        severity: electrolyteRisk > 60 ? 'Medium' : 'Low',
        probability: electrolyteRisk,
        description: 'Electrolyte breakdown products interfere with ion transport',
        indicators: [
          `${battery.chemistry} electrolyte stability characteristics`,
          battery.cycles > 800 ? 'Extended cycling accelerates decomposition' : 'Limited decomposition expected',
          battery.soh < 88 ? 'Capacity fade consistent with electrolyte issues' : 'Normal electrolyte function'
        ],
        recommendations: [
          'Monitor gas evolution during cycling',
          'Consider electrolyte additives for stability',
          'Implement controlled atmosphere storage',
          'Regular impedance spectroscopy analysis'
        ]
      });

      return analysis.sort((a, b) => b.probability - a.probability);
    };

    setMechanisms(analyzeDegradationMechanisms());
  }, [battery]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-400 bg-red-900/20 border-red-500/20';
      case 'High': return 'text-orange-400 bg-orange-900/20 border-orange-500/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/20';
      case 'Low': return 'text-green-400 bg-green-900/20 border-green-500/20';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/20';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SEI Layer Growth': return Activity;
      case 'Lithium Plating': return Zap;
      case 'Active Material Loss': return AlertTriangle;
      case 'Electrolyte Decomposition': return Thermometer;
      default: return Search;
    }
  };

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Search className="h-5 w-5 text-blue-400" />
          Root Cause Analysis - {battery.id}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-500/20 bg-blue-900/10">
          <AlertTriangle className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-400">Degradation Mechanism Analysis</AlertTitle>
          <AlertDescription className="text-slate-300">
            AI-powered analysis of potential root causes based on battery chemistry, cycle count, and performance data.
          </AlertDescription>
        </Alert>

        {mechanisms.map((mechanism, index) => {
          const Icon = getIcon(mechanism.type);
          
          return (
            <Card key={mechanism.type} className={`border ${getSeverityColor(mechanism.severity)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg text-white">{mechanism.type}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getSeverityColor(mechanism.severity)}>
                      {mechanism.severity}
                    </Badge>
                    <span className="text-sm font-medium text-slate-300">
                      {mechanism.probability.toFixed(0)}% probability
                    </span>
                  </div>
                </div>
                <Progress value={mechanism.probability} className="w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">{mechanism.description}</p>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">Key Indicators:</h4>
                  <ul className="space-y-1">
                    {mechanism.indicators.map((indicator, idx) => (
                      <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Recommended Actions:</h4>
                  <ul className="space-y-1">
                    {mechanism.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
