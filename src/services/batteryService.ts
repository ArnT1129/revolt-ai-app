
import { supabase } from '@/integrations/supabase/client';
import { Battery, BatteryGrade, BatteryStatus } from '@/types';
import { batteryAnalytics } from './batteryAnalytics';

export interface UploadResult {
  batteryId: string;
  message: string;
}

class BatteryService {
  async getUserBatteries(userId: string): Promise<Battery[]> {
    try {
      const { data, error } = await supabase
        .from('batteries')
        .select(`
          *,
          soh_history(*),
          battery_issues(*),
          raw_data(*),
          battery_metrics(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batteries:', error);
        throw error;
      }

      return data?.map(this.transformDatabaseBattery) || [];
    } catch (error) {
      console.error('Error in getUserBatteries:', error);
      return [];
    }
  }

  async getBattery(batteryId: string): Promise<Battery | null> {
    try {
      const { data, error } = await supabase
        .from('batteries')
        .select(`
          *,
          soh_history(*),
          battery_issues(*),
          raw_data(*),
          battery_metrics(*)
        `)
        .eq('id', batteryId)
        .single();

      if (error) {
        console.error('Error fetching battery:', error);
        return null;
      }

      return this.transformDatabaseBattery(data);
    } catch (error) {
      console.error('Error in getBattery:', error);
      return null;
    }
  }

  async createBattery(batteryData: any): Promise<Battery> {
    try {
      const { data, error } = await supabase
        .from('batteries')
        .insert({
          battery_id: batteryData.id,
          user_id: batteryData.user_id,
          grade: batteryData.grade,
          status: batteryData.status,
          soh: batteryData.soh,
          rul: batteryData.rul,
          cycles: batteryData.cycles,
          chemistry: batteryData.chemistry,
          notes: batteryData.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating battery:', error);
        throw error;
      }

      // Create initial SoH history entry
      await supabase
        .from('soh_history')
        .insert({
          battery_id: data.id,
          cycle_number: 1,
          soh: batteryData.soh,
        });

      return this.transformDatabaseBattery(data);
    } catch (error) {
      console.error('Error in createBattery:', error);
      throw error;
    }
  }

  async updateBattery(batteryId: string, updates: Partial<Battery>): Promise<Battery> {
    try {
      const { data, error } = await supabase
        .from('batteries')
        .update({
          grade: updates.grade,
          status: updates.status,
          soh: updates.soh,
          rul: updates.rul,
          cycles: updates.cycles,
          notes: updates.notes,
        })
        .eq('id', batteryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating battery:', error);
        throw error;
      }

      return this.transformDatabaseBattery(data);
    } catch (error) {
      console.error('Error in updateBattery:', error);
      throw error;
    }
  }

  async deleteBattery(batteryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('batteries')
        .delete()
        .eq('id', batteryId);

      if (error) {
        console.error('Error deleting battery:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteBattery:', error);
      throw error;
    }
  }

  async uploadBatteryData(csvData: string, userId: string): Promise<UploadResult> {
    try {
      // Parse the CSV data
      const parsedData = this.parseCSV(csvData);
      
      if (!parsedData || parsedData.length === 0) {
        throw new Error('No valid data found in the uploaded file');
      }

      // Generate a unique battery ID
      const batteryId = `BAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Analyze the data to calculate metrics
      const sohHistory = batteryAnalytics.generateSoHHistory(parsedData);
      const currentSoH = batteryAnalytics.calculateSoH(parsedData);
      const rul = batteryAnalytics.calculateRUL(sohHistory, currentSoH);
      const degradationRate = batteryAnalytics.calculateDegradationRate(sohHistory);
      const totalCycles = Math.max(...parsedData.map(d => d.cycle_number || 0));
      
      const grade = batteryAnalytics.calculateGrade(currentSoH, rul, totalCycles);
      const status = batteryAnalytics.calculateStatus(currentSoH, degradationRate);

      // Create the battery record
      const { data: battery, error: batteryError } = await supabase
        .from('batteries')
        .insert({
          battery_id: batteryId,
          user_id: userId,
          grade,
          status,
          soh: currentSoH,
          rul,
          cycles: totalCycles,
          chemistry: this.detectChemistry(parsedData),
        })
        .select()
        .single();

      if (batteryError) {
        throw batteryError;
      }

      // Insert raw data
      const rawDataInserts = parsedData.map(point => ({
        battery_id: battery.id,
        cycle_number: point.cycle_number,
        step_type: point.step_type,
        time_seconds: point.time_seconds,
        voltage_v: point.voltage_V,
        current_a: point.current_A,
        capacity_mah: point.capacity_mAh,
        temperature_c: point.temperature_C,
      }));

      await supabase
        .from('raw_data')
        .insert(rawDataInserts);

      // Insert SoH history
      const sohInserts = sohHistory.map(point => ({
        battery_id: battery.id,
        cycle_number: point.cycle,
        soh: point.soh,
      }));

      await supabase
        .from('soh_history')
        .insert(sohInserts);

      // Calculate and store advanced metrics
      const metrics = batteryAnalytics.calculateAdvancedMetrics(
        this.transformDatabaseBattery(battery),
        parsedData
      );

      await supabase
        .from('battery_metrics')
        .insert({
          battery_id: battery.id,
          capacity_retention: metrics.capacityRetention,
          energy_efficiency: metrics.energyEfficiency,
          power_fade_rate: metrics.powerFadeRate,
          internal_resistance: metrics.internalResistance,
          temp_min: metrics.temperatureRange.min,
          temp_max: metrics.temperatureRange.max,
          temp_avg: metrics.temperatureRange.avg,
          voltage_min: metrics.voltageRange.min,
          voltage_max: metrics.voltageRange.max,
          voltage_avg: metrics.voltageRange.avg,
          charging_efficiency: metrics.chargingEfficiency,
          discharging_efficiency: metrics.dischargingEfficiency,
          cycle_life: metrics.cycleLife,
          calendar_life: metrics.calendarLife,
          peak_power: metrics.peakPower,
          energy_density: metrics.energyDensity,
          self_discharge_rate: metrics.selfDischargeRate,
          impedance_growth: metrics.impedanceGrowth,
          thermal_stability: metrics.thermalStability,
        });

      // Analyze and store issues
      const issues = batteryAnalytics.analyzeIssues(
        this.transformDatabaseBattery(battery),
        parsedData
      );

      if (issues.length > 0) {
        const issueInserts = issues.map(issue => ({
          battery_id: battery.id,
          severity: issue.severity,
          category: issue.category,
          title: issue.title,
          description: issue.description,
          cause: issue.cause,
          solution: issue.solution,
          recommendation: issue.recommendation,
          affected_metrics: issue.affectedMetrics,
        }));

        await supabase
          .from('battery_issues')
          .insert(issueInserts);
      }

      return {
        batteryId: battery.battery_id,
        message: `Successfully processed ${parsedData.length} data points`,
      };
    } catch (error) {
      console.error('Error uploading battery data:', error);
      throw error;
    }
  }

  private parseCSV(csvData: string): any[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        
        // Map common column names to our standard format
        if (header.includes('cycle')) {
          row.cycle_number = parseInt(value) || 0;
        } else if (header.includes('step')) {
          row.step_type = value.toLowerCase().includes('charge') ? 'charge' : 'discharge';
        } else if (header.includes('time')) {
          row.time_seconds = parseFloat(value) || 0;
        } else if (header.includes('voltage') || header.includes('volt')) {
          row.voltage_V = parseFloat(value) || 0;
        } else if (header.includes('current') || header.includes('amp')) {
          row.current_A = parseFloat(value) || 0;
        } else if (header.includes('capacity') || header.includes('cap')) {
          row.capacity_mAh = parseFloat(value) || 0;
        } else if (header.includes('temperature') || header.includes('temp')) {
          row.temperature_C = parseFloat(value) || 25;
        }
      });

      if (row.cycle_number && row.voltage_V) {
        data.push(row);
      }
    }

    return data;
  }

  private detectChemistry(data: any[]): 'LFP' | 'NMC' {
    // Simple heuristic based on voltage range
    const voltages = data.map(d => d.voltage_V).filter(v => v > 0);
    const maxVoltage = Math.max(...voltages);
    
    // LFP typically has lower voltage (3.6V max), NMC higher (4.2V max)
    return maxVoltage < 3.8 ? 'LFP' : 'NMC';
  }

  private transformDatabaseBattery(dbBattery: any): Battery {
    return {
      id: dbBattery.battery_id || dbBattery.id,
      grade: dbBattery.grade as BatteryGrade,
      status: dbBattery.status as BatteryStatus,
      soh: dbBattery.soh,
      rul: dbBattery.rul,
      cycles: dbBattery.cycles,
      chemistry: dbBattery.chemistry,
      uploadDate: dbBattery.upload_date || dbBattery.created_at,
      sohHistory: dbBattery.soh_history?.map((h: any) => ({
        cycle: h.cycle_number,
        soh: h.soh,
      })) || [],
      issues: dbBattery.battery_issues?.map((issue: any) => ({
        id: issue.id,
        severity: issue.severity,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        cause: issue.cause,
        solution: issue.solution,
        recommendation: issue.recommendation,
        affectedMetrics: issue.affected_metrics || [],
      })) || [],
      rawData: dbBattery.raw_data || [],
      metrics: dbBattery.battery_metrics?.[0] ? {
        capacityRetention: dbBattery.battery_metrics[0].capacity_retention,
        energyEfficiency: dbBattery.battery_metrics[0].energy_efficiency,
        powerFadeRate: dbBattery.battery_metrics[0].power_fade_rate,
        internalResistance: dbBattery.battery_metrics[0].internal_resistance,
        temperatureRange: {
          min: dbBattery.battery_metrics[0].temp_min,
          max: dbBattery.battery_metrics[0].temp_max,
          avg: dbBattery.battery_metrics[0].temp_avg,
        },
        voltageRange: {
          min: dbBattery.battery_metrics[0].voltage_min,
          max: dbBattery.battery_metrics[0].voltage_max,
          avg: dbBattery.battery_metrics[0].voltage_avg,
        },
        chargingEfficiency: dbBattery.battery_metrics[0].charging_efficiency,
        dischargingEfficiency: dbBattery.battery_metrics[0].discharging_efficiency,
        cycleLife: dbBattery.battery_metrics[0].cycle_life,
        calendarLife: dbBattery.battery_metrics[0].calendar_life,
        peakPower: dbBattery.battery_metrics[0].peak_power,
        energyDensity: dbBattery.battery_metrics[0].energy_density,
        selfDischargeRate: dbBattery.battery_metrics[0].self_discharge_rate,
        impedanceGrowth: dbBattery.battery_metrics[0].impedance_growth,
        thermalStability: dbBattery.battery_metrics[0].thermal_stability,
      } : undefined,
      notes: dbBattery.notes,
    };
  }
}

export const batteryService = new BatteryService();
