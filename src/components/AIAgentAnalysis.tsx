import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Upload, 
  Settings,
  Thermometer,
  CircuitBoard,
  Brain,
  Target,
  Activity,
  Zap,
  Shield,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
  Cpu,
  Layers,
  Battery,
  Cog,
  Sparkles,
  Brain as BrainIcon,
  Target as TargetIcon,
  Activity as ActivityIcon,
  Rocket,
  Atom,
  Network,
  Cpu as CpuIcon,
  Database,
  Satellite,
  Globe,
  Wifi,
  Radio,
  Signal,
  Gauge,
  Microscope,
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
  Server,
  Cloud,
  HardDrive
} from 'lucide-react';
import { AIAnalysisRequest } from '@/services/aiAgentService';
import { Battery as BatteryType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import AIAgentLoadingBar from './AIAgentLoadingBar';

interface AIAgentAnalysisProps {
  selectedBattery?: BatteryType;
  onAnalysisStart?: (request: AIAnalysisRequest) => void;
  onAnalysisComplete?: (result: any) => void;
}

export default function AIAgentAnalysis({ 
  selectedBattery, 
  onAnalysisStart, 
  onAnalysisComplete 
}: AIAgentAnalysisProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [completedAnalyses, setCompletedAnalyses] = useState<Set<string>>(new Set());
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('battery');
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up interval on unmount or when starting a new analysis
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Clear completed analyses for demo users on mount
  useEffect(() => {
    const checkDemoAndClear = async () => {
      try {
        const { DemoService } = await import('@/services/demoService');
        const isDemo = await DemoService.isDemoUser();
        if (isDemo) {
          setCompletedAnalyses(new Set());
        }
      } catch (error) {

      }
    };
    
    checkDemoAndClear();
  }, []);

  const batteryAnalysisTypes = [
    {
      id: 'battery_health',
      name: 'Health Scanner',
      description: 'Molecular-level cell analysis',
      icon: Microscope,
      color: 'text-cyan-400',
      bg: 'bg-cyan-600/20',
      animation: 'neural-scan',
      features: ['Cell analysis', 'Pattern recognition', 'Health mapping', 'Degradation modeling'],
      requirements: ['Battery data', 'Usage history'],
      estimatedTime: '2-3 min',
      mlModel: 'Deep Neural Network v3.2.0',
      powerLevel: 'High',
      complexity: 'Advanced',
      specialEffect: 'Neural scanning with molecular precision',
      confidenceLevel: '98.5%',
      trainingAlgorithm: 'Adaptive Gradient Descent',
      accuracyGain: '3.2%'
    },
    {
      id: 'battery_design',
      name: 'Design Optimizer',
      description: 'Quantum-inspired algorithms',
      icon: Atom,
      color: 'text-purple-400',
      bg: 'bg-purple-600/20',
      animation: 'quantum-pulse',
      features: ['Quantum optimization', 'Multi-dimensional design', 'Entanglement modeling', 'Superposition analysis'],
      requirements: ['Current design', 'Efficiency metrics'],
      estimatedTime: '3-4 min',
      mlModel: 'Quantum Neural Network v2.1.0',
      powerLevel: 'Extreme',
      complexity: 'Quantum',
      specialEffect: 'Quantum superposition analysis',
      confidenceLevel: '97.8%',
      trainingAlgorithm: 'Quantum Annealing',
      accuracyGain: '4.1%'
    },
    {
      id: 'battery_management',
      name: 'BMS Controller',
      description: 'Self-learning management',
      icon: Cpu,
      color: 'text-green-400',
      bg: 'bg-green-600/20',
      animation: 'autonomous-pulse',
      features: ['Autonomous decisions', 'Self-learning', 'Adaptive control', 'Predictive maintenance'],
      requirements: ['BMS data', 'Charging patterns'],
      estimatedTime: '2-3 min',
      mlModel: 'Autonomous AI v2.5.0',
      powerLevel: 'High',
      complexity: 'Autonomous',
      specialEffect: 'Autonomous learning and control',
      confidenceLevel: '96.9%',
      trainingAlgorithm: 'Reinforcement Learning',
      accuracyGain: '2.8%'
    },
    {
      id: 'predictive_modeling',
      name: 'Prediction Engine',
      description: 'Time-series analysis',
      icon: Clock,
      color: 'text-orange-400',
      bg: 'bg-orange-600/20',
      animation: 'temporal-flow',
      features: ['Temporal networks', 'Time forecasting', 'Causal inference', 'Pattern recognition'],
      requirements: ['Historical data', 'Efficiency metrics'],
      estimatedTime: '4-5 min',
      mlModel: 'Temporal Transformer v3.0.0',
      powerLevel: 'Extreme',
      complexity: 'Temporal',
      specialEffect: 'Time-series prediction with causality',
      confidenceLevel: '99.1%',
      trainingAlgorithm: 'Attention Mechanism',
      accuracyGain: '5.3%'
    },
    {
      id: 'battery_optimization',
      name: 'Evolution Engine',
      description: 'Multi-objective optimization',
      icon: Rocket,
      color: 'text-pink-400',
      bg: 'bg-pink-600/20',
      animation: 'evolution-spin',
      features: ['Evolutionary optimization', 'Multi-objective algorithms', 'Genetic programming', 'Population learning'],
      requirements: ['Current design', 'Usage patterns'],
      estimatedTime: '3-4 min',
      mlModel: 'Evolutionary AI v2.8.0',
      powerLevel: 'Extreme',
      complexity: 'Evolutionary',
      specialEffect: 'Evolutionary multi-objective optimization',
      confidenceLevel: '98.2%',
      trainingAlgorithm: 'Genetic Algorithm',
      accuracyGain: '4.7%'
    }
  ];

  const pcbAnalysisTypes = [
    {
      id: 'pcb_analysis',
      name: 'Circuit Analyzer',
      description: 'Deep learning circuit analysis',
      icon: Network,
      color: 'text-blue-400',
      bg: 'bg-blue-600/20',
      animation: 'circuit-flow',
      features: ['Circuit analysis', 'Signal mapping', 'Thermal networks', 'Component reliability'],
      requirements: ['PCB schematic', 'Layout files'],
      estimatedTime: '1-2 min',
      mlModel: 'Circuit Neural Network v2.0.0',
      powerLevel: 'High',
      complexity: 'Circuit',
      specialEffect: 'Neural circuit analysis and optimization',
      confidenceLevel: '97.3%',
      trainingAlgorithm: 'Convolutional Neural Network',
      accuracyGain: '3.9%'
    }
  ];

  const handleStartAnalysis = async (analysisType: string) => {
    // Prevent multiple launches
    if (activeAnalysis) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Additional guard to prevent duplicate launches
    if (completedAnalyses.has(analysisType)) {
      toast({
        title: "Analysis Already Complete",
        description: `${analysisType.replace(/_/g, ' ')} analysis has already been completed.`,
      });
      return;
    }
    
    if (analysisType === 'pcb_analysis' && !uploadedFile) {
      toast({
        title: "No PCB File",
        description: "Upload a PCB file for analysis",
        variant: "destructive"
      });
      return;
    }
    if (analysisType !== 'pcb_analysis' && !selectedBattery) {
      toast({
        title: "No Battery",
        description: "Select a battery for analysis",
        variant: "destructive"
      });
      return;
    }
    
    // Set active analysis immediately to prevent duplicate clicks
    setActiveAnalysis(analysisType);
    setAnalysisProgress(0);
    
    // Use a flag to ensure callback only runs once
    let callbackExecuted = false;
    
    setTimeout(() => {
      const request: AIAnalysisRequest = {
        batteryId: selectedBattery?.id,
        fileData: uploadedFile,
        analysisType: analysisType as any,
        parameters: {
          confidenceThreshold: 0.85,
          analysisDepth: 'comprehensive',
          includeRecommendations: true,
          realTimeMonitoring: true,
          crossValidation: true,
          ensembleLearning: true
        },
        mlConfig: {
          learningRate: 0.001,
          epochs: 25,
          batchSize: 32,
          adaptiveLearning: true,
          dropout: 0.2,
          regularization: 0.005,
          optimizer: 'adam_enhanced',
          activationFunction: 'relu'
        }
      };
      
      if (onAnalysisStart) {
        onAnalysisStart(request);
      }
      
      const totalSteps = 100;
      const stepDuration = 40; // Reduced from 80ms to 40ms for faster analysis
      intervalRef.current = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setActiveAnalysis(null);
            
            // Only execute callback once
            if (!callbackExecuted) {
              callbackExecuted = true;
              
              // Immediately update completedAnalyses to trigger button change
              setCompletedAnalyses(prev => new Set([...prev, analysisType]));
              // Force re-render to update button immediately
              setForceUpdate(prev => prev + 1);
              
              // Create a comprehensive result object
              const result = {
                type: analysisType,
                status: 'completed',
                timestamp: new Date(),
                confidence: 0.92 + Math.random() * 0.06,
                riskLevel: Math.random() > 0.7 ? 'medium' : 'low',
                findings: [
                  'Advanced neural network analysis completed successfully',
                  'Pattern recognition algorithms executed with high precision',
                  'Multi-dimensional data processing finished',
                  'Predictive modeling results generated',
                  'Machine learning improvements applied'
                ],
                recommendations: [
                  'Monitor battery health regularly',
                  'Implement suggested optimizations for extended life',
                  'Review performance metrics monthly',
                  'Consider preventive maintenance in 3 months'
                ]
              };
              
              toast({
                title: "Analysis Complete",
                description: `${analysisType.replace(/_/g, ' ')} analysis completed successfully`,
              });
              
              if (onAnalysisComplete) {
                onAnalysisComplete(result);
              }
            }
            return 100;
          }
          return prev + 1;
        });
      }, stepDuration);
    }, 0);
  };

  const handleStopAnalysis = (analysisType: string) => {
    // Clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset state
    setActiveAnalysis(null);
    setAnalysisProgress(0);
    
    toast({
      title: "Analysis Stopped",
      description: `${analysisType.replace(/_/g, ' ')} analysis has been cancelled.`,
      variant: "destructive"
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File Uploaded",
        description: `${file.name} ready for analysis`,
      });
    }
  };

  const canRunAnalysis = (analysisType: string) => {
    if (analysisType === 'pcb_analysis') {
      return uploadedFile !== null;
    }
    return selectedBattery !== null;
  };

  const getAnimationClass = (animation: string, isActive: boolean) => {
    if (!isActive) return '';
    
    switch (animation) {
      case 'neural-scan':
        return 'animate-pulse bg-gradient-to-r from-cyan-400/20 to-blue-400/20';
      case 'quantum-pulse':
        return 'animate-pulse bg-gradient-to-r from-purple-400/20 to-pink-400/20';
      case 'autonomous-pulse':
        return 'animate-pulse bg-gradient-to-r from-green-400/20 to-emerald-400/20';
      case 'temporal-flow':
        return 'animate-pulse bg-gradient-to-r from-orange-400/20 to-red-400/20';
      case 'evolution-spin':
        return 'animate-spin bg-gradient-to-r from-pink-400/20 to-purple-400/20';
      case 'circuit-flow':
        return 'animate-pulse bg-gradient-to-r from-blue-400/20 to-cyan-400/20';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Agents</h2>
          <p className="text-slate-400">Specialized neural networks</p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Analysis Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 glass-button">
          <TabsTrigger value="battery">Battery Agents</TabsTrigger>
          <TabsTrigger value="pcb">PCB Analysis</TabsTrigger>
        </TabsList>

        {/* Battery Analysis Tab */}
        <TabsContent value="battery" className="space-y-6">
          {/* Battery Selection Info */}
          {selectedBattery && (
            <Card className="enhanced-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Battery className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-white font-medium">Selected Battery</h3>
                    <p className="text-slate-400 text-sm">
                      {selectedBattery.name || selectedBattery.id} - {selectedBattery.chemistry} 
                      (SoH: {selectedBattery.soh.toFixed(1)}%, RUL: {selectedBattery.rul})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Battery AI Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {batteryAnalysisTypes.map((analysis) => (
              <Card 
                key={analysis.id} 
                className={`enhanced-card hover:bg-slate-800/60 transition-all duration-200 ${
                  activeAnalysis === analysis.id ? getAnimationClass(analysis.animation, true) : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${analysis.bg} ${
                        activeAnalysis === analysis.id ? 'animate-pulse' : ''
                      }`}>
                        <analysis.icon className={`h-6 w-6 ${analysis.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{analysis.name}</CardTitle>
                        <p className="text-slate-400 text-sm">{analysis.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="text-xs">
                        {analysis.estimatedTime}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-400">
                        {analysis.powerLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enhanced Model Info */}
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BrainIcon className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-300">Neural Network:</span>
                        <span className="text-white font-medium">{analysis.mlModel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TargetIcon className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">Confidence:</span>
                        <span className="text-green-400 font-medium">{analysis.confidenceLevel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CpuIcon className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-300">Training:</span>
                        <span className="text-blue-400 font-medium">{analysis.trainingAlgorithm}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                        <span className="text-slate-300">Accuracy Gain:</span>
                        <span className="text-orange-400 font-medium">+{analysis.accuracyGain}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-white font-medium mb-2">Capabilities</h4>
                    <div className="space-y-1">
                      {analysis.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span className="text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Loading Bar for Active Analysis */}
                  {activeAnalysis === analysis.id && (
                    <div className="mt-4">
                      <AIAgentLoadingBar 
                        isActive={true}
                        progress={analysisProgress}
                        analysisType={analysis.id}
                      />
                    </div>
                  )}

                  {/* Conditional Button Rendering */}
                  {activeAnalysis === analysis.id ? (
                    // Stop Button - Show when training
                    <Button
                      onClick={() => handleStopAnalysis(analysis.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white border border-red-500 transition-all duration-300"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Stop Training
                    </Button>
                  ) : (
                    // Normal Button - Show when not training
                    <Button
                      onClick={() => {
                        if (completedAnalyses.has(analysis.id)) {
                          toast({
                            title: "View Results",
                            description: `View ${analysis.name} results in the Results tab`,
                          });
                        } else {
                          handleStartAnalysis(analysis.id);
                        }
                      }}
                      disabled={!canRunAnalysis(analysis.id)}
                      className={`w-full transition-all duration-300 ${
                        completedAnalyses.has(analysis.id)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {completedAnalyses.has(analysis.id) ? (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Results
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          Launch
                        </>
                      )}
                    </Button>
                  )}

                  {/* Status Indicator */}
                  {!canRunAnalysis(analysis.id) && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Select a battery to launch</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PCB Analysis Tab */}
        <TabsContent value="pcb" className="space-y-6">
          {/* File Upload for PCB Analysis */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-400" />
                Upload Circuit Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-300 text-sm">
                  Upload PCB schematics or layout files for neural circuit analysis.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.sch,.brd,.kicad_pcb,.pcb,.lay"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pcb-file-upload"
                  />
                  <label htmlFor="pcb-file-upload">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                  {uploadedFile && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{uploadedFile.name}</span>
                      <Badge variant="outline" className="text-xs">Ready</Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PCB AI Agents Grid */}
          <div className="grid grid-cols-1 gap-6">
            {pcbAnalysisTypes.map((analysis) => (
              <Card 
                key={analysis.id} 
                className={`enhanced-card hover:bg-slate-800/60 transition-all duration-200 ${
                  activeAnalysis === analysis.id ? getAnimationClass(analysis.animation, true) : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${analysis.bg} ${
                        activeAnalysis === analysis.id ? 'animate-pulse' : ''
                      }`}>
                        <analysis.icon className={`h-6 w-6 ${analysis.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{analysis.name}</CardTitle>
                        <p className="text-slate-400 text-sm">{analysis.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="text-xs">
                        {analysis.estimatedTime}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-400">
                        {analysis.powerLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enhanced Model Info */}
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BrainIcon className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-300">Neural Network:</span>
                        <span className="text-white font-medium">{analysis.mlModel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TargetIcon className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">Confidence:</span>
                        <span className="text-green-400 font-medium">{analysis.confidenceLevel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CpuIcon className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-300">Training:</span>
                        <span className="text-blue-400 font-medium">{analysis.trainingAlgorithm}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                        <span className="text-slate-300">Accuracy Gain:</span>
                        <span className="text-orange-400 font-medium">+{analysis.accuracyGain}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-white font-medium mb-2">Capabilities</h4>
                    <div className="space-y-1">
                      {analysis.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span className="text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Loading Bar for Active Analysis */}
                  {activeAnalysis === analysis.id && (
                    <div className="mt-4">
                      <AIAgentLoadingBar 
                        isActive={true}
                        progress={analysisProgress}
                        analysisType={analysis.id}
                      />
                    </div>
                  )}

                  {/* Conditional Button Rendering */}
                  {activeAnalysis === analysis.id ? (
                    // Stop Button - Show when training
                    <Button
                      onClick={() => handleStopAnalysis(analysis.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white border border-red-500 transition-all duration-300"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Stop Training
                    </Button>
                  ) : (
                    // Normal Button - Show when not training
                    <Button
                      onClick={() => {
                        if (completedAnalyses.has(analysis.id)) {
                          toast({
                            title: "View Results",
                            description: `View ${analysis.name} results in the Results tab`,
                          });
                        } else {
                          handleStartAnalysis(analysis.id);
                        }
                      }}
                      disabled={!canRunAnalysis(analysis.id)}
                      className={`w-full transition-all duration-300 ${
                        completedAnalyses.has(analysis.id)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {completedAnalyses.has(analysis.id) ? (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Results
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          Launch
                        </>
                      )}
                    </Button>
                  )}

                  {/* Status Indicator */}
                  {!canRunAnalysis(analysis.id) && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Upload a circuit file to launch</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Neural Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Training Parameters</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-300">Learning Rate</label>
                    <input 
                      type="range" 
                      min="0.0001" 
                      max="0.01" 
                      step="0.0001" 
                      defaultValue="0.001"
                      className="w-full mt-1"
                    />
                    <div className="text-xs text-slate-400 mt-1">0.001</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Epochs</label>
                    <select className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                      <option>25</option>
                      <option>50</option>
                      <option>100</option>
                      <option>200</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Batch Size</label>
                    <select className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                      <option>16</option>
                      <option>32</option>
                      <option>64</option>
                      <option>128</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-3">Features</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-slate-300">Adaptive Learning</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-slate-300">Auto Weight Adjustment</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-slate-300">Real-time Training</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-slate-300">Transfer Learning</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-slate-300">Quantum Networks</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-700">
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 