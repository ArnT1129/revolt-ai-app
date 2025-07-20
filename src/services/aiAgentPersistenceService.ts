import { supabase } from '@/integrations/supabase/client';
import { AIAgent, AIAnalysisResult, AIAnalysisRequest } from './aiAgentService';
import { DemoService } from './demoService';

export interface AIAgentConfig {
  agentId: string;
  configData: any;
  isDemo: boolean;
}

export interface AIAnalysisHistoryEntry {
  batteryId: string;
  agentId: string;
  analysisType: string;
  resultData: any;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isDemo: boolean;
}

export interface AIAgentSetting {
  settingKey: string;
  settingValue: any;
  isDemo: boolean;
}

export interface AIAgentMetric {
  agentId: string;
  metricType: string;
  metricValue: number;
  metricData?: any;
  isDemo: boolean;
}

class AIAgentPersistenceService {
  private retryCount = 0;
  private maxRetries = 3;
  private lastErrorTime = 0;
  private errorCooldown = 30000; // 30 seconds
  private connectionCheckTime = 0;
  private connectionCheckInterval = 60000; // 1 minute

  /**
   * Check if we have a valid connection
   */
  private async checkConnection(): Promise<boolean> {
    const now = Date.now();
    if (now - this.connectionCheckTime < this.connectionCheckInterval) {
      return true; // Assume connection is good if we checked recently
    }

    try {
      // Simple connection test
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      this.connectionCheckTime = now;
      return !error;
    } catch (error) {
      console.error('Connection check failed:', error);
      this.connectionCheckTime = now;
      return false;
    }
  }

  /**
   * Check if we should attempt database operations
   */
  private async shouldAttemptOperation(): Promise<boolean> {
    const now = Date.now();
    if (this.retryCount >= this.maxRetries) {
      if (now - this.lastErrorTime < this.errorCooldown) {
        return false;
      }
      // Reset retry count after cooldown
      this.retryCount = 0;
    }

    // Check connection before attempting operation
    const hasConnection = await this.checkConnection();
    if (!hasConnection) {
      // Skipping database operation - no connection
      return false;
    }

    return true;
  }

  /**
   * Handle database operation with error handling
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T | null> {
    if (!(await this.shouldAttemptOperation())) {
      // Skipping database operation due to recent errors or no connection
      return null;
    }

    try {
      const result = await operation();
      this.retryCount = 0; // Reset on success
      return result;
    } catch (error) {
      this.retryCount++;
      this.lastErrorTime = Date.now();
      console.error(`Database operation failed (attempt ${this.retryCount}/${this.maxRetries}):`, error);
      
      if (this.retryCount >= this.maxRetries) {
        console.error('Max retries reached, will pause database operations for 30 seconds');
      }
      
      return null;
    }
  }

  /**
   * Save AI Agent configuration for a user
   */
  async saveAgentConfig(userId: string, config: AIAgentConfig): Promise<void> {
    await this.executeWithRetry(async () => {
      const isDemo = await DemoService.isDemoUser();
      
      const { error } = await supabase
        .from('ai_agent_configs')
        .upsert({
          user_id: userId,
          agent_id: config.agentId,
          config_data: config.configData,
          is_demo: isDemo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,agent_id'
        });

      if (error) {
        console.error('Error saving agent config:', error);
        // If table doesn't exist, create it or handle gracefully
        if (error.code === '42P01') { // Table doesn't exist
          // AI Agent configs table not found. Results will be saved locally only.
          return;
        }
        throw error;
      }
    });
  }

  /**
   * Get AI Agent configurations for a user (optimized)
   */
  async getAgentConfigs(userId: string): Promise<AIAgentConfig[]> {
    const result = await this.executeWithRetry(async () => {
      const isDemo = await DemoService.isDemoUser();
      
      const { data, error } = await supabase
        .from('ai_agent_configs')
        .select('agent_id, config_data, is_demo')
        .eq('user_id', userId)
        .eq('is_demo', isDemo)
        .limit(10); // Limit for performance

      if (error) throw error;
      
      return data?.map(row => ({
        agentId: row.agent_id,
        configData: row.config_data,
        isDemo: row.is_demo
      })) || [];
    });

    return result || [];
  }

  /**
   * Save analysis history entry
   */
  async saveAnalysisHistory(userId: string, entry: AIAnalysisHistoryEntry): Promise<void> {
    await this.executeWithRetry(async () => {
      const { error } = await supabase
        .from('ai_analysis_history')
        .insert({
          user_id: userId,
          battery_id: entry.batteryId,
          agent_id: entry.agentId,
          analysis_type: entry.analysisType,
          result_data: entry.resultData,
          confidence: entry.confidence,
          risk_level: entry.riskLevel,
          is_demo: entry.isDemo
        });

      if (error) {
        console.error('Error saving analysis history:', error);
        // If table doesn't exist, create it or handle gracefully
        if (error.code === '42P01') { // Table doesn't exist
          // AI Analysis history table not found. Results will be saved locally only.
          return;
        }
        throw error;
      }
    });
  }

  /**
   * Get analysis history for a user (optimized)
   */
  async getAnalysisHistory(userId: string): Promise<AIAnalysisHistoryEntry[]> {
    const result = await this.executeWithRetry(async () => {
      const isDemo = await DemoService.isDemoUser();
      
      const { data, error } = await supabase
        .from('ai_analysis_history')
        .select('battery_id, agent_id, analysis_type, result_data, confidence, risk_level, is_demo')
        .eq('user_id', userId)
        .eq('is_demo', isDemo)
        .order('created_at', { ascending: false })
        .limit(50); // Limit for performance

      if (error) throw error;
      
      return data?.map(row => ({
        batteryId: row.battery_id,
        agentId: row.agent_id,
        analysisType: row.analysis_type,
        resultData: row.result_data,
        confidence: row.confidence,
        riskLevel: row.risk_level,
        isDemo: row.is_demo
      })) || [];
    });

    return result || [];
  }

  /**
   * Save AI Agent setting
   */
  async saveAgentSetting(userId: string, setting: AIAgentSetting): Promise<void> {
    await this.executeWithRetry(async () => {
      const { error } = await supabase
        .from('ai_agent_settings')
        .upsert({
          user_id: userId,
          setting_key: setting.settingKey,
          setting_value: setting.settingValue,
          is_demo: setting.isDemo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,setting_key'
        });

      if (error) throw error;
    });
  }

  /**
   * Get AI Agent settings for a user
   */
  async getAgentSettings(userId: string): Promise<AIAgentSetting[]> {
    const result = await this.executeWithRetry(async () => {
      const isDemo = await DemoService.isDemoUser();
      
      const { data, error } = await supabase
        .from('ai_agent_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_demo', isDemo);

      if (error) throw error;
      
      return data?.map(row => ({
        settingKey: row.setting_key,
        settingValue: row.setting_value,
        isDemo: row.is_demo
      })) || [];
    });

    return result || [];
  }

  /**
   * Save AI Agent metric
   */
  async saveAgentMetric(userId: string, metric: AIAgentMetric): Promise<void> {
    await this.executeWithRetry(async () => {
      const { error } = await supabase
        .from('ai_agent_metrics')
        .insert({
          user_id: userId,
          agent_id: metric.agentId,
          metric_type: metric.metricType,
          metric_value: metric.metricValue,
          metric_data: metric.metricData,
          is_demo: metric.isDemo
        });

      if (error) {
        console.error('Error saving agent metric:', error);
        // If table doesn't exist, create it or handle gracefully
        if (error.code === '42P01') { // Table doesn't exist
          // AI Agent metrics table not found. Results will be saved locally only.
          return;
        }
        throw error;
      }
    });
  }

  /**
   * Get AI Agent metrics for a user
   */
  async getAgentMetrics(userId: string): Promise<AIAgentMetric[]> {
    const result = await this.executeWithRetry(async () => {
      const isDemo = await DemoService.isDemoUser();
      
      const { data, error } = await supabase
        .from('ai_agent_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('is_demo', isDemo)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data?.map(row => ({
        agentId: row.agent_id,
        metricType: row.metric_type,
        metricValue: row.metric_value,
        metricData: row.metric_data,
        isDemo: row.is_demo
      })) || [];
    });

    return result || [];
  }

  /**
   * Clear all demo data for a user (called on sign out)
   */
  async clearDemoData(userId: string): Promise<void> {
    await this.executeWithRetry(async () => {
      // Clear AI Agent configs for demo user
      const { error: configError } = await supabase
        .from('ai_agent_configs')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);

      if (configError && configError.code !== '42P01') {
        console.error('Error clearing demo agent configs:', configError);
      }

      // Clear AI Analysis history for demo user
      const { error: historyError } = await supabase
        .from('ai_analysis_history')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);

      if (historyError && historyError.code !== '42P01') {
        console.error('Error clearing demo analysis history:', historyError);
      }

      // Clear AI Agent settings for demo user
      const { error: settingsError } = await supabase
        .from('ai_agent_settings')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);

      if (settingsError && settingsError.code !== '42P01') {
        console.error('Error clearing demo agent settings:', settingsError);
      }

      // Clear AI Agent metrics for demo user
      const { error: metricsError } = await supabase
        .from('ai_agent_metrics')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);

      if (metricsError && metricsError.code !== '42P01') {
        console.error('Error clearing demo agent metrics:', metricsError);
      }


    });
  }

  /**
   * Load all AI Agent data for a user
   */
  async loadUserData(userId: string): Promise<{
    configs: AIAgentConfig[];
    history: AIAnalysisHistoryEntry[];
    settings: AIAgentSetting[];
    metrics: AIAgentMetric[];
  }> {
    try {
      // For performance, only load essential data initially
      const isDemo = await DemoService.isDemoUser();
      
      // Load configs and settings in parallel
      const [configs, settings] = await Promise.all([
        this.getAgentConfigs(userId),
        this.getAgentSettings(userId)
      ]);

      // Load history and metrics separately to avoid blocking
      const [history, metrics] = await Promise.all([
        this.getAnalysisHistory(userId),
        this.getAgentMetrics(userId)
      ]);

      return { configs, history, settings, metrics };
    } catch (error) {
      console.error('Error loading user AI agent data:', error);
      return { configs: [], history: [], settings: [], metrics: [] };
    }
  }
}

export const aiAgentPersistenceService = new AIAgentPersistenceService(); 