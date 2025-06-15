
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatteryFull, BatteryMedium, AlertTriangle } from "lucide-react";

const stats = [
  { name: "Total Batteries Analyzed", value: "1,204", icon: BatteryFull },
  { name: "Avg. State of Health (SoH)", value: "94.7%", icon: BatteryMedium },
  { name: "Critical Issues Flagged", value: "32", icon: AlertTriangle },
];

export default function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={stat.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
