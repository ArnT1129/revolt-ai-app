import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Cpu, 
  Layers, 
  TrendingUp, 
  Zap, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  FileText,
  Download,
  Eye,
  Settings,
  Brain,
  Target,
  Activity,
  Thermometer,
  CircuitBoard,
  Rocket,
  Atom,
  Network,
  Microscope,
  Clock as ClockIcon,
  Cpu as CpuIcon,
  Brain as BrainIcon,
  Activity as ActivityIcon,
  Zap as ZapIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  Database,
  Server,
  Cloud,
  HardDrive,
  Gauge,
  TestTube,
  Beaker,
  Lightbulb,
  Key,
  Lock,
  Unlock,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  Hash,
  Binary,
  Code,
  Terminal,
  Wifi,
  Radio,
  Signal,
  Globe,
  Satellite,
  Users,
  Share2,
  Shield,
  AlertCircle,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Cpu as CpuIcon2,
  Database as DatabaseIcon,
  BarChart3 as BarChart3Icon,
  Activity as ActivityIcon2,
  Brain as BrainIcon2,
  Target as TargetIcon2,
  Zap as ZapIcon2,
  Clock as ClockIcon2,
  TrendingUp as TrendingUpIcon2,
  AlertTriangle as AlertTriangleIcon2,
  CheckCircle as CheckCircleIcon2,
  Play as PlayIcon2,
  Pause as PauseIcon2,
  Settings as SettingsIcon2,
  Download as DownloadIcon2,
  Eye as EyeIcon2,
  FileText as FileTextIcon2,
  Users as UsersIcon2,
  Share2 as Share2Icon2,
  Shield as ShieldIcon2,
  AlertCircle as AlertCircleIcon2,
  TrendingDown as TrendingDownIcon2,
  ArrowUp as ArrowUpIcon2,
  ArrowDown as ArrowDownIcon2,
  Minus as MinusIcon2,
  Sparkles as SparklesIcon2
} from 'lucide-react';
import { aiAgentService, AIAgent, AIAnalysisRequest, AIAnalysisResult } from '@/services/aiAgentService';
import { useToast } from '@/hooks/use-toast';

interface AIAgentDashboardProps {
  agents?: AIAgent[];
  onAgentUpdate?: (agents: AIAgent[]) => void;
}

export default function AIAgentDashboard({ agents: propAgents, onAgentUpdate }: AIAgentDashboardProps) {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AIAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisResult[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Use prop agents if provided, otherwise load from service
  useEffect(() => {
    if (propAgents) {
      // Using prop agents
      setAgents(propAgents);
    } else {
      loadAgents();
    }
    loadAnalysisHistory();
  }, [propAgents]);

  const loadAgents = async () => {
    try {
      const agentList = await aiAgentService.getAgents();
      setAgents(agentList);
    } catch (error) {
      // Error loading agents
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const history = await aiAgentService.getAnalysisHistory();
      setAnalysisHistory(history);
    } catch (error) {
      // Error loading analysis history
    }
  };

  const handleStartAnalysis = async (agent: AIAgent) => {
    try {
      // Starting analysis for agent
      
      const request: AIAnalysisRequest = {
        analysisType: agent.type,
        parameters: {
          confidenceThreshold: 0.95, // Increased confidence threshold
          analysisDepth: 'comprehensive',
          includeRecommendations: true,
          realTimeMonitoring: true,
          crossValidation: true,
          ensembleLearning: true
        },
        mlConfig: {
          learningRate: 0.002, // Optimized learning rate
          epochs: 50, // Reduced epochs for faster training
          batchSize: 64, // Increased batch size for efficiency
          adaptiveLearning: true,
          dropout: 0.1, // Reduced dropout for better convergence
          regularization: 0.005, // Optimized regularization
          optimizer: 'adamw_enhanced',
          activationFunction: 'ReLU'
        },
        collaboration: {
          agents: agent.collaboration?.agents || [],
          sharedKnowledge: agent.collaboration?.sharedKnowledge || false
        }
      };

      await aiAgentService.startAnalysis(request);
      toast({
        title: "Agent Launched",
        description: `${agent.name} started optimized training`,
      });
      
      // Update the agent status locally immediately for better UX
      const updatedAgents = agents.map(a => 
        a.id === agent.id 
          ? { ...a, status: 'running' as const, progress: 0 }
          : a
      );
      setAgents(updatedAgents);
      onAgentUpdate?.(updatedAgents);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start agent",
        variant: "destructive"
      });
    }
  };

  const handleStopAnalysis = async (agent: AIAgent) => {
    try {
      await aiAgentService.stopAnalysis(agent.id);
      toast({
        title: "Analysis Stopped",
        description: `${agent.name} analysis has been stopped`,
      });
      
      // Update the agent status locally immediately for better UX
      const updatedAgents = agents.map(a => 
        a.id === agent.id 
          ? { ...a, status: 'idle' as const, progress: 0, error: undefined, results: undefined }
          : a
      );
      setAgents(updatedAgents);
      onAgentUpdate?.(updatedAgents);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop agent",
        variant: "destructive"
      });
    }
  };

  const handleViewResults = (agent: AIAgent) => {
    if (agent.results) {
      setSelectedResult(agent.results);
      setShowResults(true);
    } else {
      toast({
        title: "No Results",
        description: "This agent hasn't completed analysis yet",
        variant: "destructive"
      });
    }
  };

  const handleExportResults = async (analysisId: string) => {
    try {
      const report = await aiAgentService.exportResults(analysisId);
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exported",
        description: "Results exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export results",
        variant: "destructive"
      });
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'battery_health':
        return <Microscope className="h-6 w-6 text-cyan-400" />;
      case 'battery_design':
        return <Atom className="h-6 w-6 text-purple-400" />;
      case 'battery_management':
        return <Cpu className="h-6 w-6 text-green-400" />;
      case 'predictive_modeling':
        return <ClockIcon className="h-6 w-6 text-orange-400" />;
      case 'battery_optimization':
        return <Rocket className="h-6 w-6 text-pink-400" />;
      case 'pcb_analysis':
        return <Network className="h-6 w-6 text-blue-400" />;
      default:
        return <Bot className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'completed':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <ActivityIcon className="h-4 w-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };



  const getCapabilityCount = (agent: AIAgent) => {
    return agent.capabilities.filter(c => c.enabled).length;
  };

  const getActiveCollaborations = (agent: AIAgent) => {
    return agent.collaboration.enabled ? agent.collaboration.agents.length : 0;
  };

  const getMonitoringMetrics = (agent: AIAgent) => {
    return agent.realTimeMonitoring.enabled ? agent.realTimeMonitoring.metrics.length : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Neural Agents</h2>
          <p className="text-slate-400">Advanced AI with real-time monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {agents.filter(a => a.status === 'running').length} Active
          </Badge>
          <Badge variant="outline" className="text-xs">
            {agents.filter(a => a.status === 'completed').length} Done
          </Badge>
          <Badge variant="outline" className="text-xs">
            {agents.reduce((sum, a) => sum + a.performance.totalAnalyses, 0)} Total
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 glass-button">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card 
                key={agent.id} 
                className={`enhanced-card hover:bg-slate-800/60 transition-all duration-200 ${
                  agent.status === 'running' ? 'ring-2 ring-green-500/50 animate-pulse' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-slate-800/40 ${
                        agent.status === 'running' ? 'animate-pulse' : ''
                      }`}>
                        {getAgentIcon(agent.type)}
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                        <p className="text-slate-400 text-sm">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(agent.status)}`}
                      >
                        {agent.status}
                      </Badge>

                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Model Info */}
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                      <BrainIcon className="h-4 w-4 text-purple-400" />
                      <span className="text-white font-medium">
                        {agent.mlModel?.version || 'v1.0.0'}
                      </span>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/20 p-2 rounded">
                      <div className="text-slate-400">Analyses</div>
                      <div className="text-white font-medium">{agent.performance.totalAnalyses}</div>
                    </div>
                    <div className="bg-slate-800/20 p-2 rounded">
                      <div className="text-slate-400">Accuracy</div>
                      <div className="text-white font-medium">{(agent.performance.averageAccuracy * 100).toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {agent.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Training</span>
                        <span className="text-white">{agent.progress}%</span>
                      </div>
                      <Progress value={agent.progress} className="h-2" />
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2 text-sm">
                    {getStatusIcon(agent.status)}
                    <span className={getStatusColor(agent.status)}>
                      {agent.status === 'running' && 'Training...'}
                      {agent.status === 'completed' && 'Complete'}
                      {agent.status === 'error' && agent.error}
                      {agent.status === 'idle' && 'Ready'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {agent.status === 'idle' && (
                      <Button
                        onClick={() => handleStartAnalysis(agent)}
                        className="flex-1"
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Launch
                      </Button>
                    )}
                    
                    {agent.status === 'running' && (
                      <Button
                        onClick={() => handleStopAnalysis(agent)}
                        variant="outline"
                        className="flex-1"
                      >
                        <PauseIcon2 className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    )}

                    {agent.status === 'completed' && agent.results && (
                      <Button
                        onClick={() => handleViewResults(agent)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    )}

                    {agent.status === 'error' && (
                      <Button
                        onClick={() => handleStartAnalysis(agent)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}

                    {agent.status === 'completed' && agent.results && (
                      <Button
                        onClick={() => handleExportResults(agent.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="enhanced-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/40">
                      {getAgentIcon(agent.type)}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                      <p className="text-slate-400 text-sm">{getCapabilityCount(agent)} capabilities active</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-800/20 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          capability.enabled ? 'bg-green-400' : 'bg-slate-500'
                        }`} />
                        <span className="text-sm text-white">{capability.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {capability.complexity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Collaboration Tab */}
        <TabsContent value="collaboration" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="enhanced-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/40">
                      {getAgentIcon(agent.type)}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                      <p className="text-slate-400 text-sm">
                        {agent.collaboration.enabled ? `${getActiveCollaborations(agent)} collaborators` : 'No collaboration'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.collaboration.enabled ? (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                                                 <Share2 className="h-4 w-4 text-blue-400" />
                         <span className="text-slate-300">Shared Knowledge:</span>
                         <span className="text-white">{agent.collaboration.sharedKnowledge ? 'Enabled' : 'Disabled'}</span>
                       </div>
                       <div className="flex items-center gap-2 text-sm">
                         <Users className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">Cross Validation:</span>
                        <span className="text-white">{agent.collaboration.crossValidation ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <BrainIcon className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-300">Ensemble Learning:</span>
                        <span className="text-white">{agent.collaboration.ensembleLearning ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 text-sm">Collaboration disabled</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="enhanced-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/40">
                      {getAgentIcon(agent.type)}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                      <p className="text-slate-400 text-sm">
                        {agent.realTimeMonitoring.enabled ? `${getMonitoringMetrics(agent)} metrics` : 'Monitoring disabled'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.realTimeMonitoring.enabled ? (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <ActivityIcon className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">Real-time Updates:</span>
                        <span className="text-white">{agent.realTimeMonitoring.realTimeUpdates ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DatabaseIcon className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-300">Data Retention:</span>
                        <span className="text-white">{agent.realTimeMonitoring.dataRetention} days</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Metrics: {agent.realTimeMonitoring.metrics.join(', ')}
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 text-sm">Real-time monitoring disabled</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Results Modal */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent 
          className="max-w-4xl max-h-[80vh] overflow-y-auto"
          style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BrainIcon className="h-5 w-5 text-purple-400" />
              Analysis Results
            </DialogTitle>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ZapIcon className="h-5 w-5 text-yellow-400" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">Agent</div>
                      <div className="text-white font-medium">{selectedResult.type}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Confidence</div>
                      <div className="text-white font-medium">
                        {(selectedResult.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Risk</div>
                      <div className="text-white font-medium capitalize">{selectedResult.riskLevel}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Time</div>
                      <div className="text-white font-medium">
                        {new Date(selectedResult.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Findings */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedResult.findings.map((finding, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{finding}</span>
                      </div>
                    ))}
                  </div>
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
                  <div className="space-y-2">
                    {selectedResult.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Shield className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{recommendation}</span>
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
                      <BrainIcon className="h-5 w-5 text-purple-400" />
                      Model Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Model Gain</div>
                        <div className="text-white font-medium">
                          +{(selectedResult.mlImprovements.accuracyGain * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Epochs</div>
                        <div className="text-white font-medium">
                          {selectedResult.mlImprovements.trainingEpochs}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Convergence</div>
                        <div className="text-white font-medium">
                          {(selectedResult.mlImprovements.convergenceRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Updates</div>
                        <div className="text-white font-medium">
                          {Object.keys(selectedResult.mlImprovements.newWeights).length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Collaboration Results */}
              {selectedResult.collaborationResults && selectedResult.collaborationResults.length > 0 && (
                <Card className="enhanced-card">
                  <CardHeader>
                                         <CardTitle className="text-white flex items-center gap-2">
                       <Users className="h-5 w-5 text-green-400" />
                       Collaboration Results
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedResult.collaborationResults.map((result, index) => (
                        <div key={index} className="p-3 bg-slate-800/40 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{result.agentId}</span>
                            <Badge variant="outline" className="text-xs">
                              {(result.confidence * 100).toFixed(1)}% confidence
                            </Badge>
                          </div>
                          <p className="text-slate-300 text-sm mb-2">{result.contribution}</p>
                          <div className="space-y-1">
                            {result.insights.map((insight, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <Sparkles className="h-3 w-3 text-yellow-400" />
                                <span className="text-slate-400">{insight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => handleExportResults(selectedResult.id)}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setShowResults(false)}>
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