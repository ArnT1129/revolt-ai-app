
import { supabase } from '@/integrations/supabase/client';
import { Battery, BatteryGrade, BatteryStatus } from '@/types';
import { batteryAnalytics } from './batteryAnalytics';

export interface UploadResult {
  batteryId: string;
  message: string;
}

class BatteryService {
  async uploadBatteryData(fileContent: string, userId: string): Promise<UploadResult> {
    try {
      // Parse the CSV/Excel data
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Simple parsing - look for common battery data columns
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          data.push(row);
        }
      }

      if (data.length === 0) {
        throw new Error('No valid data found in file');
      }

      // Generate a unique battery ID
      const batteryId = `BAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate basic metrics from the data
      const cycles = data.length;
      const voltages = data.map(row => parseFloat(row.Voltage || row.voltage || row['Voltage(V)'] || '0')).filter(v => !isNaN(v));
      const capacities = data.map(row => parseFloat(row.Capacity || row.capacity || row['Capacity(mAh)'] || '0')).filter(c => !isNaN(c));
      
      // Calculate SoH (simplified - capacity retention)
      const initialCapacity = capacities[0] || 1000;
      const currentCapacity = capacities[capacities.length - 1] || initialCapacity;
      const soh = (currentCapacity / initialCapacity) * 100;
      
      // Determine grade based on SoH
      let grade: BatteryGrade = 'A';
      if (soh < 80) grade = 'C';
      else if (soh < 90) grade = 'B';
      
      // Determine status
      let status: BatteryStatus = 'Healthy';
      if (soh < 70) status = 'Degrading';
      else if (soh < 50) status = 'Critical';
      
      // Calculate RUL (simplified)
      const rul = Math.max(0, Math.floor((soh - 70) * 10));
      
      // Create battery record
      const { data: battery, error } = await supabase
        .from('batteries')
        .insert({
          battery_id: batteryId,
          user_id: userId,
          grade,
          status,
          soh: Number(soh.toFixed(2)),
          rul,
          cycles,
          chemistry: 'Li-ion', // Default
          notes: `Uploaded from file data with ${data.length} data points`,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating battery:', error);
        throw error;
      }

      // Store raw data
      const rawDataEntries = data.slice(0, 100).map((row, index) => ({ // Limit to first 100 rows
        battery_id: battery.id,
        cycle_number: index + 1,
        voltage_v: parseFloat(row.Voltage || row.voltage || row['Voltage(V)'] || '0') || null,
        current_a: parseFloat(row.Current || row.current || row['Current(A)'] || '0') || null,
        capacity_mah: parseFloat(row.Capacity || row.capacity || row['Capacity(mAh)'] || '0') || null,
        temperature_c: parseFloat(row.Temperature || row.temperature || row['Temperature(C)'] || '25') || null,
        time_seconds: parseFloat(row.Time || row.time || row['Time(s)'] || (index * 60).toString()) || null,
        step_type: row.Step || row.step || row['Step Type'] || 'charge',
      }));

      if (rawDataEntries.length > 0) {
        await supabase
          .from('raw_data')
          .insert(rawDataEntries);
      }

      // Create initial SoH history entry
      await supabase
        .from('soh_history')
        .insert({
          battery_id: battery.id,
          cycle_number: cycles,
          soh: Number(soh.toFixed(2)),
        });

      // Calculate and store metrics
      await supabase
        .from('battery_metrics')
        .insert({
          battery_id: battery.id,
          capacity_retention: Number(soh.toFixed(2)),
          energy_efficiency: 85 + Math.random() * 10, // Simulated
          power_fade_rate: (100 - soh) / cycles * 100, // Simplified calculation
          internal_resistance: 50 + Math.random() * 20, // Simulated
          temp_min: Math.min(...data.map(r => parseFloat(r.Temperature || '25')).filter(t => !isNaN(t))),
          temp_max: Math.max(...data.map(r => parseFloat(r.Temperature || '25')).filter(t => !isNaN(t))),
          temp_avg: data.reduce((sum, r) => sum + (parseFloat(r.Temperature || '25') || 25), 0) / data.length,
          voltage_min: Math.min(...voltages),
          voltage_max: Math.max(...voltages),
          voltage_avg: voltages.reduce((a, b) => a + b, 0) / voltages.length,
          charging_efficiency: 90 + Math.random() * 5,
          discharging_efficiency: 85 + Math.random() * 10,
          cycle_life: Math.floor(rul * 10),
          calendar_life: Math.floor(rul * 365),
          peak_power: Math.max(...voltages) * Math.max(...data.map(r => Math.abs(parseFloat(r.Current || '1')))),
          energy_density: currentCapacity * Math.max(...voltages) / 1000,
          self_discharge_rate: 2 + Math.random() * 3,
          impedance_growth: (100 - soh) / 100,
          thermal_stability: soh > 80 ? 'good' : soh > 60 ? 'fair' : 'poor',
        });

      return {
        batteryId: batteryId,
        message: `Battery data uploaded successfully. SoH: ${soh.toFixed(1)}%, Grade: ${grade}`,
      };
    } catch (error) {
      console.error('Error uploading battery data:', error);
      throw error;
    }
  }

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
