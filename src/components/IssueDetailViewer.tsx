
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
  Critical: "text-red-500 bg-red-50",
  Warning: "text-yellow-500 bg-yellow-50",
  Info: "text-blue-500 bg-blue-50",
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-green-500" />
            No Issues Detected
          </CardTitle>
          <CardDescription>
            Battery {batteryId} is operating within normal parameters
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Battery Issues Analysis
        </CardTitle>
        <CardDescription>
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
                <h3 className="font-semibold">{severity} Issues ({severityIssues.length})</h3>
              </div>
              
              {severityIssues.map((issue) => {
                const isExpanded = expandedIssues.has(issue.id);
                
                return (
                  <Collapsible key={issue.id}>
                    <CollapsibleTrigger asChild>
                      <Card className={cn("cursor-pointer transition-colors hover:bg-gray-50", 
                        severityColors[issue.severity as keyof typeof severityColors])}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">
                                {issue.category}
                              </Badge>
                              <span className="font-medium">{issue.title}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleIssue(issue.id)}
                            >
                              {isExpanded ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {issue.description}
                          </p>
                        </CardContent>
                      </Card>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <Card className="ml-4 mt-2">
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Root Cause</h4>
                            <p className="text-sm text-muted-foreground">{issue.cause}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Recommended Solution</h4>
                            <p className="text-sm text-muted-foreground">{issue.solution}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Action Required</h4>
                            <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Affected Metrics</h4>
                            <div className="flex gap-1 flex-wrap">
                              {issue.affectedMetrics.map((metric) => (
                                <Badge key={metric} variant="secondary" className="text-xs">
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
