
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronRight } from "lucide-react";
import { BatteryIssue } from "@/services/issueAnalysis";
import { cn } from "@/lib/utils";

interface IssueDetailViewerProps {
  issues: BatteryIssue[];
  batteryId: string;
}

const severityIcons = {
  Critical: AlertTriangle,
  Warning: AlertCircle,
  Info: Info,
};

const severityColors = {
  Critical: "text-red-400 bg-red-900/20 border-red-500/20",
  Warning: "text-yellow-400 bg-yellow-900/20 border-yellow-500/20",
  Info: "text-blue-400 bg-blue-900/20 border-blue-500/20",
};

export default function IssueDetailViewer({ issues, batteryId }: IssueDetailViewerProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const groupedIssues = issues.reduce((groups, issue) => {
    if (!groups[issue.severity]) {
      groups[issue.severity] = [];
    }
    groups[issue.severity].push(issue);
    return groups;
  }, {} as Record<string, BatteryIssue[]>);

  if (issues.length === 0) {
    return (
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Info className="h-5 w-5 text-green-400" />
            No Issues Detected
          </CardTitle>
          <CardDescription className="text-slate-300">
            Battery {batteryId} is operating within normal parameters
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          Battery Issues Analysis
        </CardTitle>
        <CardDescription className="text-slate-300">
          Detailed analysis of {issues.length} issues detected for battery {batteryId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedIssues).map(([severity, severityIssues]) => {
          const SeverityIcon = severityIcons[severity as keyof typeof severityIcons];
          
          return (
            <div key={severity} className="space-y-2">
              <div className="flex items-center gap-2">
                <SeverityIcon className={cn("h-4 w-4", severityColors[severity as keyof typeof severityColors].split(' ')[0])} />
                <h3 className="font-semibold text-white">{severity} Issues ({severityIssues.length})</h3>
              </div>
              
              {severityIssues.map((issue) => {
                const isExpanded = expandedIssues.has(issue.id);
                
                return (
                  <Collapsible key={issue.id}>
                    <CollapsibleTrigger asChild>
                      <Card className={cn("cursor-pointer transition-colors hover:bg-white/5 border", 
                        severityColors[issue.severity as keyof typeof severityColors])}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs border-white/20 text-slate-300">
                                {issue.category}
                              </Badge>
                              <span className="font-medium text-white">{issue.title}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleIssue(issue.id)}
                              className="text-slate-300 hover:text-white"
                            >
                              {isExpanded ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            {issue.description}
                          </p>
                        </CardContent>
                      </Card>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <Card className="ml-4 mt-2 border border-white/10 bg-black/20">
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-1 text-white">Root Cause</h4>
                            <p className="text-sm text-slate-300">{issue.cause}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-1 text-white">Recommended Solution</h4>
                            <p className="text-sm text-slate-300">{issue.solution}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-1 text-white">Action Required</h4>
                            <p className="text-sm text-slate-300">{issue.recommendation}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-1 text-white">Affected Metrics</h4>
                            <div className="flex gap-1 flex-wrap">
                              {issue.affectedMetrics.map((metric) => (
                                <Badge key={metric} variant="secondary" className="text-xs bg-white/10 text-slate-300 border-white/20">
                                  {metric}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
