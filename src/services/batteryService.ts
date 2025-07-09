
import { supabase } from '@/integrations/supabase/client';
import { Battery, SoHDataPoint, BatteryIssue } from '@/types';

class BatteryService {
  async getUserBatteries(): Promise<Battery[]> {
    try {
      console.log('Fetching user batteries...');
      
      const { data: batteries, error } = await supabase
        .from('user_batteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batteries:', error);
        return [];
      }

      console.log('Raw batteries from database:', batteries);

      if (!batteries || batteries.length === 0) {
        console.log('No batteries found in database');
        return [];
      }

      // Transform database data to Battery type
      const transformedBatteries: Battery[] = batteries.map(battery => ({
        id: battery.id,
        grade: battery.grade as 'A' | 'B' | 'C' | 'D',
        status: battery.status as 'Healthy' | 'Degrading' | 'Critical' | 'Unknown',
        soh: Number(battery.soh),
        rul: battery.rul,
        cycles: battery.cycles,
        chemistry: battery.chemistry as 'LFP' | 'NMC',
        uploadDate: battery.upload_date || new Date().toISOString().split('T')[0],
        sohHistory: Array.isArray(battery.soh_history) ? 
          (battery.soh_history as SoHDataPoint[]) : [],
        issues: Array.isArray(battery.issues) ? 
          (battery.issues as BatteryIssue[]) : [],
        notes: battery.notes || '',
        rawData: Array.isArray(battery.raw_data) ? battery.raw_data : []
      }));

      console.log('Transformed batteries:', transformedBatteries);
      return transformedBatteries;
    } catch (error) {
      console.error('Error in getUserBatteries:', error);
      return [];
    }
  }

  async addBattery(battery: Battery): Promise<boolean> {
    try {
      console.log('Adding battery to database:', battery);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const batteryData = {
        id: battery.id,
        user_id: user.id,
        grade: battery.grade,
        status: battery.status,
        soh: battery.soh,
        rul: battery.rul,
        cycles: battery.cycles,
        chemistry: battery.chemistry,
        upload_date: battery.uploadDate,
        soh_history: battery.sohHistory as any, // Cast to Json type
        issues: battery.issues as any, // Cast to Json type
        notes: battery.notes || '',
        raw_data: battery.rawData || []
      };

      const { error } = await supabase
        .from('user_batteries')
        .insert(batteryData);

      if (error) {
        console.error('Error inserting battery:', error);
        return false;
      }

      console.log('Battery added successfully');
      return true;
    } catch (error) {
      console.error('Error in addBattery:', error);
      return false;
    }
  }

  async deleteBattery(batteryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_batteries')
        .delete()
        .eq('id', batteryId);

      if (error) {
        console.error('Error deleting battery:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteBattery:', error);
      return false;
    }
  }

  async updateBattery(battery: Battery): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_batteries')
        .update({
          grade: battery.grade,
          status: battery.status,
          soh: battery.soh,
          rul: battery.rul,
          cycles: battery.cycles,
          chemistry: battery.chemistry,
          soh_history: battery.sohHistory as any, // Cast to Json type
          issues: battery.issues as any, // Cast to Json type
          notes: battery.notes,
          raw_data: battery.rawData,
          updated_at: new Date().toISOString()
        })
        .eq('id', battery.id);

      if (error) {
        console.error('Error updating battery:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateBattery:', error);
      return false;
    }
  }
}

export const batteryService = new BatteryService();
