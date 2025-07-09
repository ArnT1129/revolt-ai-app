
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Wrench,
  TrendingUp
} from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'Warning' | 'Info';
  category: string;
  cause?: string;
  recommendation?: string;
  solution?: string;
  affectedMetrics?: string[];
  resolved?: boolean;
}

interface IssueDetailViewerProps {
  issue: Issue;
  onClose?: () => void;
  onResolve?: (issueId: string) => void;
}

export default function IssueDetailViewer({ issue, onClose, onResolve }: IssueDetailViewerProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <XCircle className="h-5 w-5 text-red-400" />;
      case 'Warning': return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'Info': return <CheckCircle className="h-5 w-5 text-blue-400" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400';
      case 'Warning': return 'bg-orange-500/20 text-orange-400';
      case 'Info': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getSeverityIcon(issue.severity)}
            Issue Details
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Issue Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">{issue.title}</h3>
            <div className="flex items-center gap-2">
              <Badge className={getSeverityColor(issue.severity)}>
                {issue.severity}
              </Badge>
              <Badge variant="outline" className="text-slate-300">
                {issue.category}
              </Badge>
            </div>
          </div>
          
          <p className="text-slate-300 leading-relaxed">{issue.description}</p>
        </div>

        {/* Affected Metrics */}
        {issue.affectedMetrics && issue.affectedMetrics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Affected Metrics
            </h4>
            <div className="flex flex-wrap gap-2">
              {issue.affectedMetrics.map((metric, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {metric}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Root Cause */}
        {issue.cause && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Root Cause
            </h4>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-slate-300 text-sm">{issue.cause}</p>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {issue.recommendation && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendation
            </h4>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-300 text-sm">{issue.recommendation}</p>
            </div>
          </div>
        )}

        {/* Solution */}
        {issue.solution && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Solution
            </h4>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-300 text-sm">{issue.solution}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            Issue ID: {issue.id}
          </div>
          
          {onResolve && !issue.resolved && (
            <Button
              onClick={() => onResolve(issue.id)}
              className="glass-button"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Resolved
            </Button>
          )}
          
          {issue.resolved && (
            <Badge className="bg-green-500/20 text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolved
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
