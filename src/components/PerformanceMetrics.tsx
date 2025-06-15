
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Zap, Database, Cpu } from "lucide-react";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  target: number;
}

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    { name: "Load Time", value: 0, unit: "ms", icon: Clock, color: "text-blue-400", target: 1000 },
    { name: "Response Time", value: 0, unit: "ms", icon: Zap, color: "text-green-400", target: 500 },
    { name: "Data Processing", value: 0, unit: "MB/s", icon: Database, color: "text-purple-400", target: 50 },
    { name: "CPU Usage", value: 0, unit: "%", icon: Cpu, color: "text-orange-400", target: 70 },
  ]);

  useEffect(() => {
    // Simulate performance metrics
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
  }, []);

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-400" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={metric.name} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-sm font-medium text-slate-300">{metric.name}</span>
              </div>
              <span className={`text-sm font-bold ${metric.color}`}>
                {metric.value.toFixed(metric.unit === "ms" ? 0 : 1)}{metric.unit}
              </span>
            </div>
            <Progress 
              value={(metric.value / metric.target) * 100} 
              className="h-2"
            />
            <div className="text-xs text-slate-400">
              Target: {metric.target}{metric.unit}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
