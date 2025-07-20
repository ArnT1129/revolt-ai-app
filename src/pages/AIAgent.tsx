import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FlaskConical, 
  Bot, 
  Cpu, 
  Layers, 
  Brain, 
  Target, 
  Activity, 
  Zap, 
  Shield, 
  TrendingUp,
  FileText,
  Upload,
  Search,
  Settings,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Download,
  BarChart3,
  Thermometer,
  Battery,
  CircuitBoard,
  Sparkles,
  Users,
  Share2,
  Beaker,
  Hexagon,
  Network,
  CpuIcon,
  Gauge
} from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import { aiAgentService, AIAgent, AIAnalysisResult, AIAnalysisRequest } from '@/services/aiAgentService';
import { Battery as BatteryType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import AIAgentDashboard from '@/components/AIAgentDashboard';
import AIAgentAnalysis from '@/components/AIAgentAnalysis';
import AIAgentResults from '@/components/AIAgentResults';
import LiquidGlassTabButton from '@/components/LiquidGlassTabButton';
import { useAuth } from '@/contexts/AuthContext';

export default function AgentModePage() {
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [selectedBattery, setSelectedBattery] = useState<BatteryType | null>(null);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBatterySelector, setShowBatterySelector] = useState(false);
  const [lastAnalysisCount, setLastAnalysisCount] = useState(0);
  const [isRetraining, setIsRetraining] = useState(false);
  const [batteryAnalysisCache, setBatteryAnalysisCache] = useState<Map<string, {
    lastAnalyzed: Date;
    agentStates: AIAgent[];
    analysisHistory: AIAnalysisResult[];
    batteryHash: string;
  }>>(new Map());
  const { toast } = useToast();
  const { user } = useAuth();

  // Load initial data after demo reset
  useEffect(() => {
    const initializeData = async () => {
      // First check if demo user and reset if needed
      try {
        const { DemoService } = await import('@/services/demoService');
        const isDemo = await DemoService.isDemoUser();
        if (isDemo) {
    
          
          // Use aggressive reset that forces ALL agents to idle
          await aiAgentService.resetDemoState();
          
          // Reset local state to ensure fresh start
          setAnalysisHistory([]);
          setLastAnalysisCount(0);
          
          // Force reset all agents to idle state with Launch buttons
          const freshAgents = await aiAgentService.getAgents();
          const resetAgents = freshAgents.map(agent => ({
            ...agent,
            status: 'idle' as const,
            progress: 0,
            error: undefined,
            results: undefined
          }));
          
          // Force UI update with reset agents
          setAgents(resetAgents);
          
          // Clear any cached battery analysis data for demo users
          setBatteryAnalysisCache(new Map());
          
          
        }
      } catch (error) {
        console.warn('Could not check demo status:', error);
      }
      
      // Then load the rest of the data
      await loadData();
    };
    
    initializeData();
  }, []);

  // Real-time agent status updates (only for non-demo users)
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    const setupPolling = async () => {
      const { DemoService } = await import('@/services/demoService');
      const isDemo = await DemoService.isDemoUser();
      if (isDemo) {

        return;
      }

      const updateAgentStatus = async () => {
        try {
          const currentAgents = await aiAgentService.getAgents();
          setAgents(currentAgents);
        } catch (error) {
          console.warn('Error updating agent status:', error);
        }
      };

      // Update immediately
      updateAgentStatus();

      // Set up interval for real-time updates
      interval = setInterval(updateAgentStatus, 1000); // Update every second
    };

    setupPolling();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Set up analysis completion callback
  useEffect(() => {
    aiAgentService.setAnalysisCompleteCallback((agent, result) => {
      // Update agents state immediately
      setAgents(prevAgents => 
        prevAgents.map(a => 
          a.id === agent.id 
            ? { ...a, status: 'completed' as const, progress: 100, results: result }
            : a
        )
      );
      
      // Add to analysis history
      setAnalysisHistory(prev => [result, ...prev]);
      
      // Show completion toast
      toast({
        title: "Analysis Complete",
        description: `${agent.name} analysis completed successfully. Results saved to database and Results tab.`,
      });
    });
  }, []);

  // Function to immediately reset all agents (for debugging stuck states)
  const handleImmediateReset = async () => {
    try {
      
      await aiAgentService.immediateReset();
      const freshAgents = await aiAgentService.getAgents();
      
      // Force reset all agents to idle in UI
      const resetAgents = freshAgents.map(agent => ({
        ...agent,
        status: 'idle' as const,
        progress: 0,
        error: undefined,
        results: undefined
      }));
      
      setAgents(resetAgents);
      setAnalysisHistory([]);
      
      
      
      toast({
        title: "Agents Reset",
        description: "All agents have been reset to Launch state.",
      });
    } catch (error) {
      console.error('Error during immediate reset:', error);
    }
  };

  // Function to force refresh UI state
  const forceRefreshUI = async () => {
    try {
      
      
      // Get fresh agents from service
      const freshAgents = await aiAgentService.getAgents();
      
      // Force all to idle state
      const resetAgents = freshAgents.map(agent => ({
        ...agent,
        status: 'idle' as const,
        progress: 0,
        error: undefined,
        results: undefined
      }));
      
      // Update UI state
      setAgents(resetAgents);
      setAnalysisHistory([]);
      
      
      
      toast({
        title: "UI Refreshed",
        description: "All agents reset to Launch state.",
      });
    } catch (error) {
      console.error('Error refreshing UI:', error);
    }
  };

  // Listen for auth state changes and reset demo state on sign in
  useEffect(() => {
    const checkAndResetDemo = async () => {
      if (user) {
        try {
          const { DemoService } = await import('@/services/demoService');
          const isDemo = await DemoService.isDemoUser();
          if (isDemo) {
            // Use aggressive reset when demo user signs in
            await aiAgentService.resetDemoState();
            setAnalysisHistory([]);
            setLastAnalysisCount(0);
            setBatteryAnalysisCache(new Map());
            
            // Force reset all agents to idle state with Launch buttons
            const freshAgents = await aiAgentService.getAgents();
            const resetAgents = freshAgents.map(agent => ({
              ...agent,
              status: 'idle' as const,
              progress: 0,
              error: undefined,
              results: undefined
            }));
            setAgents(resetAgents);
            
    
          }
        } catch (error) {
          console.warn('Could not check demo status on auth change:', error);
        }
      }
    };
    
    checkAndResetDemo();
  }, [user]);

  // Generate a hash for battery state to detect changes
  const generateBatteryHash = (battery: BatteryType): string => {
    const batteryData = {
      id: battery.id,
      name: battery.name,
      chemistry: battery.chemistry,
      soh: battery.soh,
      rul: battery.rul,
      grade: battery.grade,
      // Add file attachments if they exist
      attachments: battery.attachments || []
    };
    return btoa(JSON.stringify(batteryData));
  };

  // Check if battery has been modified since last analysis
  const hasBatteryChanged = (battery: BatteryType, cachedHash: string): boolean => {
    const currentHash = generateBatteryHash(battery);
    return currentHash !== cachedHash;
  };

  // Check if battery has new file attachments
  const hasNewAttachments = (battery: BatteryType, cachedHash: string): boolean => {
    try {
      const currentHash = generateBatteryHash(battery);
      const currentData = JSON.parse(atob(currentHash));
      const cachedData = JSON.parse(atob(cachedHash));
      
      return (currentData.attachments?.length || 0) > (cachedData.attachments?.length || 0);
    } catch (error) {
      // Error comparing attachments, treating as unchanged
      return false;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Check if demo user
      const { DemoService } = await import('@/services/demoService');
      const isDemo = await DemoService.isDemoUser();

      // Load batteries first
      const batteryData = await batteryService.getUserBatteries();
      setBatteries(batteryData);

      // Auto-select first battery if available
      if (batteryData.length > 0 && !selectedBattery) {
        setSelectedBattery(batteryData[0]);
        // Initialize agents for the first battery
        const firstBattery = batteryData[0];
        const batteryId = firstBattery.id;
        const currentHash = generateBatteryHash(firstBattery);

        // Only restore cached agent state if NOT demo user
        if (!isDemo) {
          const cachedData = batteryAnalysisCache.get(batteryId);
          if (cachedData) {
            const resetAgents = cachedData.agentStates.map(agent => ({
              ...agent,
              status: 'idle' as const,
              progress: 0,
              error: undefined,
              results: undefined
            }));
            setAgents(resetAgents);
            setAnalysisHistory(cachedData.analysisHistory);
            setLastAnalysisCount(cachedData.analysisHistory.length);
          }
        }
      }

      // Load agents with timeout
      const agentPromise = aiAgentService.getAgents();
      const timeoutPromise = new Promise<AIAgent[]>((_, reject) =>
        setTimeout(() => reject(new Error('Agent loading timeout')), 10000)
      );

      const agentData = await Promise.race([agentPromise, timeoutPromise]);
      // For demo users, force all agents to idle
      if (isDemo) {
        setAgents(agentData.map(agent => ({
          ...agent,
          status: 'idle' as const,
          progress: 0,
          error: undefined,
          results: undefined
        })));
        setAnalysisHistory([]);
        setLastAnalysisCount(0);
      } else {
        setAgents(agentData);
        // Load analysis history
        try {
          const history = await aiAgentService.getAnalysisHistory();
          setAnalysisHistory(history);
        } catch (error) {
          toast({
            title: "Error Loading Results",
            description: "Failed to load analysis results. Please try again later.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Loading Error",
        description: "Failed to load agent data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatterySelect = async (battery: BatteryType) => {
    try {
      const batteryId = battery.id;
      const currentHash = generateBatteryHash(battery);
      const cachedData = batteryAnalysisCache.get(batteryId);
      
      // Check if we have cached data for this battery
              if (cachedData) {
          try {
            const hasChanged = hasBatteryChanged(battery, cachedData.batteryHash);
            const hasNewFiles = hasNewAttachments(battery, cachedData.batteryHash);
            
            if (!hasChanged && !hasNewFiles) {
              // Battery hasn't changed, restore cached state but reset agents to idle
              setSelectedBattery(battery);
              setShowBatterySelector(false);
              
              // Reset agents to idle status but keep their trained models
              const resetAgents = cachedData.agentStates.map(agent => ({
                ...agent,
                status: 'idle' as const,
                progress: 0,
                error: undefined,
                // Clear any previous results to ensure Launch button shows
                results: undefined
              }));
              // Restoring cached agents with reset status
              setAgents(resetAgents);
              setAnalysisHistory(cachedData.analysisHistory);
              setLastAnalysisCount(cachedData.analysisHistory.length);
              
              toast({
                title: "Battery Restored",
                description: `${battery.name || battery.id} loaded. AI agents are ready for new analysis.`,
              });
              return;
            } else {
              // Battery has changed or has new files, need to retrain
              const changeReason = hasNewFiles ? "new file attachments" : "battery modifications";
              toast({
                title: "Battery Modified",
                description: `Detected ${changeReason}. Retraining AI agents...`,
              });
            }
          } catch (error) {
            // Error checking battery changes, treating as new battery
            // Fall through to treat as new battery
          }
        } else {
        // New battery, need to train
        toast({
          title: "New Battery",
          description: "Training AI agents for new battery...",
        });
      }

      // Reset all agents to idle state for retraining
      const resetAgents = agents.map(agent => ({
        ...agent,
        status: 'idle' as const,
        progress: 0,
        error: undefined,
        results: undefined
      }));
      setAgents(resetAgents);

      // Clear previous analysis history for this battery
      setAnalysisHistory([]);
      setLastAnalysisCount(0);

      // Update selected battery
      setSelectedBattery(battery);
      setShowBatterySelector(false);

      // Retrain agents for the new battery
      await retrainAgentsForBattery(battery);

      // Cache the new state (without results to ensure Launch button shows)
      const newCachedData = {
        lastAnalyzed: new Date(),
        agentStates: agents.map(agent => ({
          ...agent,
          results: undefined // Ensure no results are cached
        })),
        analysisHistory: [],
        batteryHash: currentHash
      };
      setBatteryAnalysisCache(prev => new Map(prev).set(batteryId, newCachedData));

      toast({
        title: "Battery Ready",
        description: `${battery.name || battery.id} selected. AI agents are ready for analysis.`,
      });
    } catch (error) {
      // Error switching battery
      toast({
        title: "Error",
        description: "Failed to switch battery. Please try again.",
        variant: "destructive"
      });
    }
  };

  const retrainAgentsForBattery = async (battery: BatteryType) => {
    try {
      setIsRetraining(true);
      
      // Simulate retraining process for each agent
      const updatedAgents = await Promise.all(
        agents.map(async (agent) => {
          // Update agent with battery-specific training
          const updatedAgent = {
            ...agent,
            status: 'running' as const,
            progress: 0,
            error: undefined,
            results: undefined
          };

          // Simulate progressive training - much faster now
          for (let progress = 0; progress <= 100; progress += 20) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Reduced from 200ms to 50ms
            updatedAgent.progress = progress;
            
            // Update the agent in the state
            setAgents(prev => prev.map(a => 
              a.id === agent.id ? { ...updatedAgent, progress } : a
            ));
          }

          // Complete training and set to idle for new analysis
          return {
            ...updatedAgent,
            status: 'idle' as const,
            progress: 100,
            // Update ML model with battery-specific improvements
            mlModel: {
              ...updatedAgent.mlModel!,
              accuracy: Math.min(0.99, (updatedAgent.mlModel?.accuracy || 0.8) + 0.02),
              lastTrained: new Date(),
              version: `${updatedAgent.mlModel?.version || 'v1.0'}-${(battery.chemistry || 'unknown').toLowerCase()}`
            }
          };
        })
      );

      setAgents(updatedAgents);
      
      // Update cache with the final trained agent states
      if (selectedBattery) {
        const batteryId = selectedBattery.id;
        const currentHash = generateBatteryHash(selectedBattery);
        const cachedData = batteryAnalysisCache.get(batteryId);
        
        const newCachedData = {
          lastAnalyzed: new Date(),
          agentStates: updatedAgents.map(agent => ({
            ...agent,
            results: undefined // Ensure no results are cached
          })),
          analysisHistory: cachedData?.analysisHistory || [],
          batteryHash: currentHash
        };
        setBatteryAnalysisCache(prev => new Map(prev).set(batteryId, newCachedData));
      }
    } catch (error) {
      // Error retraining agents
      throw error;
      } finally {
      setIsRetraining(false);
    }
  };

  const handleAnalysisStart = (request: AIAnalysisRequest) => {
    toast({
      title: "Analysis Started",
      description: "Neural agents are processing your battery data",
    });
  };

  const handleAnalysisComplete = (result: any) => {
    setAnalysisHistory(prev => [result, ...prev]);
    
    // Update cache with new analysis results
    if (selectedBattery) {
      const batteryId = selectedBattery.id;
      const currentHash = generateBatteryHash(selectedBattery);
      const cachedData = batteryAnalysisCache.get(batteryId);
      
      if (cachedData) {
        const updatedCachedData = {
          ...cachedData,
          analysisHistory: [result, ...cachedData.analysisHistory],
          lastAnalyzed: new Date()
        };
        setBatteryAnalysisCache(prev => new Map(prev).set(batteryId, updatedCachedData));
      }
    }
    
    toast({
      title: "Analysis Complete",
      description: `${result.type.replace(/_/g, ' ')} analysis completed successfully. Results saved to database and Results tab.`,
    });
  };

  const handleClearResults = () => {
    setAnalysisHistory([]);
    toast({
      title: "Results Cleared",
      description: "All AI Agent analysis results have been cleared.",
    });
  };

  const handleDeleteResult = async (resultId: string) => {
    try {
      // Remove from local state immediately for better UX
      setAnalysisHistory(prev => prev.filter(result => result.id !== resultId));
      
      // Delete from database via AI agent service (this will handle errors gracefully)
      await aiAgentService.deleteAnalysisResult(resultId);
      
      toast({
        title: "Result Deleted",
        description: "Analysis result has been removed.",
      });
    } catch (error) {
      console.error('Error deleting analysis result:', error);
      // Don't show error toast since the local deletion succeeded
      // The service method now handles database errors gracefully
    }
  };

  const getAgentStats = () => {
    const running = agents.filter(agent => agent.status === 'running').length;
    const completed = agents.filter(agent => agent.status === 'completed').length;
    const idle = agents.filter(agent => agent.status === 'idle').length;
    const error = agents.filter(agent => agent.status === 'error').length;
    return { running, completed, idle, error };
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/10 rounded"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      {/* Global Header - Always Visible */}
      <div className="bg-gradient-to-r from-slate-900/95 via-purple-900/20 to-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            {/* Left Side - Title and Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Brain className="h-8 w-8 text-purple-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Neural Agents</h1>
                  <p className="text-slate-400 text-sm">
                    {isRetraining ? 'Retraining for new battery...' : 'Advanced AI with real-time monitoring'}
                  </p>
                </div>
      </div>

              {/* Agent Status Pills */}
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600/20 text-green-400 border border-green-500/30">
                  <Activity className="h-3 w-3 mr-1" />
                  {getAgentStats().running} Active
                </Badge>
                <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {getAgentStats().completed} Done
                </Badge>
                <Badge className="bg-slate-600/20 text-slate-400 border border-slate-500/30">
                  <Clock className="h-3 w-3 mr-1" />
                  {agents.length} Total
                </Badge>
                
                {/* Temporary Reset Button for Demo Users */}
                <Button
                  onClick={forceRefreshUI}
                  variant="outline"
                  size="sm"
                  className="bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30"
                >
                  🔄 Force Reset
                </Button>
              </div>
            </div>

            {/* Right Side - Battery Selection */}
            <div className="flex items-center gap-3">
              {selectedBattery ? (
                <div className={`flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 ${
                  isRetraining ? 'border-purple-500/50 bg-purple-900/20' : ''
                }`}>
                  <Battery className={`h-5 w-5 ${isRetraining ? 'text-purple-400 animate-pulse' : 'text-blue-400'}`} />
                  <div className="text-right">
                    <div className="text-white font-medium text-sm">
                      {selectedBattery.name || selectedBattery.id}
          </div>
                    <div className="text-slate-400 text-xs">
                      {selectedBattery.chemistry || 'Unknown'} • SoH: {selectedBattery.soh?.toFixed(1) || 'N/A'}% • RUL: {selectedBattery.rul || 'N/A'}
                      {isRetraining && (
                        <span className="block text-purple-400 text-xs mt-1">
                          🔄 Retraining agents...
                        </span>
        )}
      </div>
            </div>
          <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBatterySelector(true)}
                    disabled={isRetraining}
                    className="text-slate-400 hover:text-white h-8 w-8 p-0 disabled:opacity-50"
                  >
                    <Eye className="h-4 w-4" />
          </Button>
        </div>
              ) : (
                <Button 
                  onClick={() => setShowBatterySelector(true)} 
                  variant="outline"
                  className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
                >
                  <Battery className="h-4 w-4 mr-2" />
                  Select Battery
                </Button>
              )}
            </div>
          </div>
            </div>
          </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Global Stats Cards - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {(() => {
              const stats = getAgentStats();
              return [
                { 
                  label: 'Active Agents', 
                  value: stats.running, 
                  icon: Activity, 
                  color: 'text-green-400', 
                  bg: 'bg-green-600/20',
                  border: 'border-green-500/30',
                  gradient: 'from-green-600/10 to-emerald-600/10'
                },
                { 
                  label: 'Completed Tasks', 
                  value: stats.completed, 
                  icon: CheckCircle, 
                  color: 'text-blue-400', 
                  bg: 'bg-blue-600/20',
                  border: 'border-blue-500/30',
                  gradient: 'from-blue-600/10 to-cyan-600/10'
                },
                { 
                  label: 'Idle Agents', 
                  value: stats.idle, 
                  icon: Clock, 
                  color: 'text-slate-400', 
                  bg: 'bg-slate-600/20',
                  border: 'border-slate-500/30',
                  gradient: 'from-slate-600/10 to-gray-600/10'
                },
                { 
                  label: 'Errors', 
                  value: stats.error, 
                  icon: AlertTriangle, 
                  color: 'text-red-400', 
                  bg: 'bg-red-600/20',
                  border: 'border-red-500/30',
                  gradient: 'from-red-600/10 to-pink-600/10'
                }
              ].map((stat, index) => (
                <Card key={index} className={`enhanced-card border ${stat.border} bg-gradient-to-br ${stat.gradient}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${stat.bg} border ${stat.border}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
              </div>
                  </CardContent>
            </Card>
              ));
            })()}
          </div>

          {/* Tab Navigation - Modern Liquid Glass Style */}
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-3 p-1 bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <LiquidGlassTabButton
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon={<BarChart3 className="h-4 w-4" />}
                className="h-12"
              >
                <div className="text-center">
                  <div className="font-medium text-sm">Overview</div>
                </div>
              </LiquidGlassTabButton>
              
              <LiquidGlassTabButton
                isActive={activeTab === 'agent-mode'}
                onClick={() => setActiveTab('agent-mode')}
                icon={<Sparkles className="h-4 w-4" />}
                className="h-12"
              >
                <div className="text-center">
                  <div className="font-medium text-sm">Agent Mode</div>
              </div>
              </LiquidGlassTabButton>
              
              <LiquidGlassTabButton
                isActive={activeTab === 'results'}
                onClick={() => setActiveTab('results')}
                icon={<FileText className="h-4 w-4" />}
                className="h-12"
              >
                <div className="text-center">
                  <div className="font-medium text-sm">Results</div>
              </div>
              </LiquidGlassTabButton>
              
              <LiquidGlassTabButton
                isActive={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                icon={<Settings className="h-4 w-4" />}
                className="h-12"
              >
                <div className="text-center">
                  <div className="font-medium text-sm">Settings</div>
                </div>
              </LiquidGlassTabButton>
            </div>
              </div>

          {/* Tab Content - Tab-Specific Information */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {selectedBattery ? (
                  <AIAgentDashboard agents={agents} onAgentUpdate={setAgents} />
                ) : (
                  <Card className="enhanced-card">
                    <CardContent className="p-12 text-center">
                      <div className="relative mb-6">
                        <Battery className="h-16 w-16 text-slate-400 mx-auto" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Brain className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">No Battery Selected</h3>
                      <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Select a battery to start AI analysis and view detailed metrics
                      </p>
                      <Button 
                        onClick={() => setShowBatterySelector(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Battery className="h-4 w-4 mr-2" />
                        Select Battery
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Agent Mode Tab */}
            {activeTab === 'agent-mode' && (
              <div className="space-y-6">
                <AIAgentAnalysis 
                  selectedBattery={selectedBattery}
                  onAnalysisStart={handleAnalysisStart}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Analysis Results</h3>
                    <p className="text-slate-400 text-sm">
                      {analysisHistory.length} analysis result{analysisHistory.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  {analysisHistory.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={handleClearResults}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Clear All Results
                    </Button>
                  )}
                </div>
                <AIAgentResults 
                  results={analysisHistory}
                  onExport={(resultId) => {
                    // Handle export
                  }}
                  onShare={(resultId) => {
                    // Handle share
                  }}
                  onDelete={handleDeleteResult}
                />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5 text-slate-400" />
                      Agent Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-medium mb-3">Model Settings</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-slate-300">Confidence Threshold</label>
                            <input 
                              type="range" 
                              min="0.5" 
                              max="0.95" 
                              step="0.05" 
                              defaultValue="0.85"
                              className="w-full mt-1"
                            />
                            <div className="text-xs text-slate-400 mt-1">85% (Optimized)</div>
                          </div>
                          <div>
                            <label className="text-sm text-slate-300">Analysis Depth</label>
                            <select className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                              <option>Standard</option>
                              <option>Detailed</option>
                              <option>Comprehensive</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-3">Notification Settings</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm text-slate-300">Analysis completion notifications</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm text-slate-300">High-risk findings alerts</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm text-slate-300">Weekly summary reports</span>
                          </label>
                        </div>
                      </div>
          </div>

                    <div className="pt-4 border-t border-slate-700">
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <Settings className="h-4 w-4 mr-2" />
                        Save Settings
            </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Battery Selector Modal */}
      <Dialog open={showBatterySelector} onOpenChange={setShowBatterySelector}>
        <DialogContent className="max-w-2xl enhanced-card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Battery className="h-5 w-5 text-blue-400" />
              Select Battery for Analysis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {batteries.length === 0 ? (
              <div className="text-center py-8">
                <Battery className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Batteries Available</h3>
                <p className="text-slate-400 mb-4">Upload or create a battery passport first</p>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Battery Data
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {batteries.map((battery) => (
                  <Card 
                    key={battery.id} 
                    className="enhanced-card cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                    onClick={() => handleBatterySelect(battery)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Battery className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="text-white font-medium">
                              {battery.name || battery.id}
                            </div>
                            <div className="text-sm text-slate-400">
                              {battery.chemistry || 'Unknown'} • SoH: {battery.soh?.toFixed(1) || 'N/A'}% • RUL: {battery.rul || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={battery.grade === 'A' ? 'default' : battery.grade === 'B' ? 'secondary' : 'destructive'}>
                            Grade {battery.grade}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
        </div>
      )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}