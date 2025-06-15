
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, RefreshCw, Settings, FileText, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";

export default function QuickActions() {
  const { settings } = useSettings();

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
      description: `Download as ${settings.exportFormat.toUpperCase()}`,
      icon: Download,
      onClick: () => {
        console.log(`Exporting data as ${settings.exportFormat} with ${settings.decimalPlaces} decimal places`);
        window.dispatchEvent(new CustomEvent('exportData', { 
          detail: { 
            format: settings.exportFormat, 
            includeMetadata: settings.includeMetadata,
            decimalPlaces: settings.decimalPlaces
          } 
        }));
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
        console.log("Generating comprehensive report with settings:", {
          format: settings.exportFormat,
          includeMetadata: settings.includeMetadata,
          decimalPlaces: settings.decimalPlaces
        });
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

  const getAnimationClasses = () => {
    return settings.animationsEnabled ? "animate-fade-in" : "";
  };

  const getButtonPadding = () => {
    return settings.compactView ? "p-3" : "p-4";
  };

  const getTextSize = () => {
    return settings.compactView ? "text-[10px]" : "text-xs";
  };

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-2 gap-3 ${settings.compactView ? 'gap-2' : 'gap-3'}`}>
          {actions.map((action, index) => (
            action.href ? (
              <Link key={action.title} to={action.href}>
                <Button
                  variant="outline"
                  className={`w-full h-auto ${getButtonPadding()} flex flex-col items-center gap-2 glass-button transition-all duration-200 ${getAnimationClasses()} ${action.color}`}
                  style={{ animationDelay: settings.animationsEnabled ? `${index * 50}ms` : '0ms' }}
                >
                  <action.icon className="h-5 w-5" />
                  <div className="text-center">
                    <div className={`font-medium ${getTextSize()}`}>{action.title}</div>
                    <div className={`${getTextSize()} text-muted-foreground`}>{action.description}</div>
                  </div>
                </Button>
              </Link>
            ) : (
              <Button
                key={action.title}
                variant="outline"
                onClick={action.onClick}
                className={`w-full h-auto ${getButtonPadding()} flex flex-col items-center gap-2 glass-button transition-all duration-200 ${getAnimationClasses()} ${action.color}`}
                style={{ animationDelay: settings.animationsEnabled ? `${index * 50}ms` : '0ms' }}
              >
                <action.icon className="h-5 w-5" />
                <div className="text-center">
                  <div className={`font-medium ${getTextSize()}`}>{action.title}</div>
                  <div className={`${getTextSize()} text-muted-foreground`}>{action.description}</div>
                </div>
              </Button>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
