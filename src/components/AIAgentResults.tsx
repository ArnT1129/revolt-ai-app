import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Share, 
  Eye,
  Target,
  Shield,
  Zap,
  Activity,
  Thermometer,
  Battery,
  CircuitBoard,
  Brain,
  Cog,
  Sparkles,
  Trash2
} from 'lucide-react';
import { AIAnalysisResult } from '@/services/aiAgentService';

interface AIAgentResultsProps {
  results: AIAnalysisResult[];
  onExport?: (resultId: string) => void;
  onShare?: (resultId: string) => void;
  onDelete?: (resultId: string) => void;
}

export default function AIAgentResults({ results, onExport, onShare, onDelete }: AIAgentResultsProps) {
  const [selectedResult, setSelectedResult] = useState<AIAnalysisResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-400 bg-green-600/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-600/20';
      case 'high':
        return 'text-orange-400 bg-orange-600/20';
      case 'critical':
        return 'text-red-400 bg-red-600/20';
      default:
        return 'text-slate-400 bg-slate-600/20';
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'battery_health':
        return <Thermometer className="h-5 w-5 text-cyan-400" />;
      case 'battery_design':
        return <Target className="h-5 w-5 text-purple-400" />;
      case 'battery_management':
        return <Cog className="h-5 w-5 text-green-400" />;
      case 'predictive_modeling':
        return <Brain className="h-5 w-5 text-orange-400" />;
      case 'battery_optimization':
        return <Sparkles className="h-5 w-5 text-pink-400" />;
      case 'pcb_analysis':
        return <CircuitBoard className="h-5 w-5 text-blue-400" />;
      default:
        return <BarChart3 className="h-5 w-5 text-slate-400" />;
    }
  };

  const handleViewDetails = (result: AIAnalysisResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  if (results.length === 0) {
    return (
      <Card className="enhanced-card">
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Analysis Results</h3>
          <p className="text-slate-400">Run an analysis to see results here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{results.length}</div>
                <div className="text-sm text-slate-400">Total Analyses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {results.filter(r => r.riskLevel === 'low').length}
                </div>
                <div className="text-sm text-slate-400">Low Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-600/20">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {results.filter(r => r.riskLevel === 'medium' || r.riskLevel === 'high').length}
                </div>
                <div className="text-sm text-slate-400">Medium/High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                              <div className="text-2xl font-bold text-white">
                {results.length > 0 
                  ? (results.reduce((acc, r) => acc + r.confidence, 0) / results.length * 100).toFixed(1)
                  : '0.0'
                }%
              </div>
                <div className="text-sm text-slate-400">Avg Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index} className="bg-slate-800/40 hover:bg-slate-700/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getAnalysisIcon(result.type)}
                      <div>
                        <h4 className="text-white font-medium capitalize">
                          {result.type.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-slate-400 text-sm">
                          {result.timestamp.toLocaleDateString()} at {result.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getRiskColor(result.riskLevel)}>
                        {result.riskLevel.toUpperCase()}
                      </Badge>
                      
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Confidence</div>
                        <div className="text-white font-medium">
                          {(result.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(result.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onShare && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onShare(result.id)}
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Summary */}
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">{result.findings.length} findings</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-300">{result.recommendations.length} recommendations</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-300">
                          {result.metadata.analysisDuration || 'N/A'} duration
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent 
          className="max-w-4xl max-h-[80vh] overflow-y-auto"
          style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {selectedResult && getAnalysisIcon(selectedResult.type)}
              Analysis Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {(selectedResult.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {selectedResult.riskLevel.toUpperCase()}
                      </div>
                      <div className="text-sm text-slate-400">Risk Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {selectedResult.findings.length}
                      </div>
                      <div className="text-sm text-slate-400">Findings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {selectedResult.recommendations.length}
                      </div>
                      <div className="text-sm text-slate-400">Recommendations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Findings */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-400" />
                    Key Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedResult.findings.map((finding, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-200">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedResult.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-200">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-slate-400" />
                    Analysis Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {Object.entries(selectedResult.metadata).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-slate-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-white font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ML Improvements */}
              {selectedResult.mlImprovements && (
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      ML Model Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Accuracy Gain</div>
                        <div className="text-white font-medium">
                          +{(selectedResult.mlImprovements.accuracyGain * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Training Epochs</div>
                        <div className="text-white font-medium">
                          {selectedResult.mlImprovements.trainingEpochs}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Convergence Rate</div>
                        <div className="text-white font-medium">
                          {(selectedResult.mlImprovements.convergenceRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Weight Updates</div>
                        <div className="text-white font-medium">
                          {Object.keys(selectedResult.mlImprovements.newWeights).length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                {onExport && (
                  <Button variant="outline" onClick={() => onExport(selectedResult.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                )}
                {onShare && (
                  <Button variant="outline" onClick={() => onShare(selectedResult.id)}>
                    <Share className="h-4 w-4 mr-2" />
                    Share Results
                  </Button>
                )}
                <Button onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 