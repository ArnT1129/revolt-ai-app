
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, RefreshCw, Settings, FileText, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuickActions() {
  const actions = [
    {
      title: "Upload Data",
      description: "Import new battery data",
      icon: Upload,
      href: "/upload",
      color: "hover:bg-blue-500/10 hover:border-blue-400"
    },
    {
      title: "Export Report",
      description: "Download analysis report",
      icon: Download,
      onClick: () => {
        // Trigger export functionality
        window.dispatchEvent(new CustomEvent('exportData'));
      },
      color: "hover:bg-green-500/10 hover:border-green-400"
    },
    {
      title: "Refresh Data",
      description: "Update all metrics",
      icon: RefreshCw,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
      },
      color: "hover:bg-purple-500/10 hover:border-purple-400"
    },
    {
      title: "View Analytics",
      description: "Advanced insights",
      icon: BarChart3,
      onClick: () => {
        // Switch to analytics tab
        const tabTrigger = document.querySelector('[value="analytics"]') as HTMLElement;
        tabTrigger?.click();
      },
      color: "hover:bg-cyan-500/10 hover:border-cyan-400"
    },
    {
      title: "Generate Report",
      description: "Create detailed report",
      icon: FileText,
      onClick: () => {
        // Generate comprehensive report
        console.log("Generating comprehensive report...");
      },
      color: "hover:bg-yellow-500/10 hover:border-yellow-400"
    },
    {
      title: "Settings",
      description: "Configure preferences",
      icon: Settings,
      href: "/settings",
      color: "hover:bg-gray-500/10 hover:border-gray-400"
    }
  ];

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            action.href ? (
              <Link key={action.title} to={action.href}>
                <Button
                  variant="outline"
                  className={`w-full h-auto p-4 flex flex-col items-center gap-2 glass-button transition-all duration-200 animate-fade-in ${action.color}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <action.icon className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium text-xs">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              </Link>
            ) : (
              <Button
                key={action.title}
                variant="outline"
                onClick={action.onClick}
                className={`w-full h-auto p-4 flex flex-col items-center gap-2 glass-button transition-all duration-200 animate-fade-in ${action.color}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <action.icon className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium text-xs">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
