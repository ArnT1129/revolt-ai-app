
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
