
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Zap, Database, Cpu } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  target: number;
}

export default function PerformanceMetrics() {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    { name: "Load Time", value: 0, unit: "ms", icon: Clock, color: "text-blue-400", target: 1000 },
    { name: "Response Time", value: 0, unit: "ms", icon: Zap, color: "text-green-400", target: 500 },
    { name: "Data Processing", value: 0, unit: "MB/s", icon: Database, color: "text-purple-400", target: 50 },
    { name: "CPU Usage", value: 0, unit: "%", icon: Cpu, color: "text-orange-400", target: 70 },
  ]);

  useEffect(() => {
    // Skip animations if disabled in settings
    if (!settings.animationsEnabled) {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.target * (0.6 + Math.random() * 0.3)
      })));
      return;
    }

    // Simulate performance metrics with animation
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(metric.target * 1.2, 
          metric.value + (Math.random() - 0.5) * (metric.target * 0.1)
        ))
      })));
    }, 2000);

    // Initialize with realistic values
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      value: metric.target * (0.6 + Math.random() * 0.3)
    })));

    return () => clearInterval(interval);
  }, [settings.animationsEnabled]);

  const getAnimationClasses = () => {
    return settings.animationsEnabled ? "animate-fade-in" : "";
  };

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-400" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${settings.compactView ? 'space-y-2' : 'space-y-4'}`}>
        {metrics.map((metric, index) => (
          <div key={metric.name} className={`space-y-2 ${getAnimationClasses()}`} style={{ animationDelay: settings.animationsEnabled ? `${index * 100}ms` : '0ms' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className={`text-sm font-medium text-slate-300 ${settings.compactView ? 'text-xs' : 'text-sm'}`}>{metric.name}</span>
              </div>
              <span className={`text-sm font-bold ${metric.color} ${settings.compactView ? 'text-xs' : 'text-sm'}`}>
                {metric.value.toFixed(metric.unit === "ms" ? 0 : settings.decimalPlaces)}{metric.unit}
              </span>
            </div>
            <Progress 
              value={(metric.value / metric.target) * 100} 
              className={settings.compactView ? "h-1" : "h-2"}
            />
            <div className={`text-xs text-slate-400 ${settings.compactView ? 'text-[10px]' : 'text-xs'}`}>
              Target: {metric.target}{metric.unit}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
