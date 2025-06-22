
import { supabase } from '@/integrations/supabase/client';
import { Battery } from '@/types';

export interface UserBattery {
  id: string;
  user_id: string;
  grade: 'A' | 'B' | 'C' | 'D';
  status: 'Healthy' | 'Degrading' | 'Critical' | 'Unknown';
  soh: number;
  rul: number;
  cycles: number;
  chemistry: 'LFP' | 'NMC';
  upload_date: string;
  soh_history: any[];
  issues: any[];
  raw_data?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const batteryService = {
  async getUserBatteries(): Promise<Battery[]> {
    try {
      const { data, error } = await supabase
        .from('user_batteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batteries:', error);
        return [];
      }

      // Transform database format to app format
      return data.map(transformBatteryFromDB);
    } catch (error) {
      console.error('Error in getUserBatteries:', error);
      return [];
    }
  },

  async addBattery(battery: Battery): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const dbBattery = transformBatteryToDB(battery, user.id);

      const { error } = await supabase
        .from('user_batteries')
        .insert([dbBattery]);

      if (error) {
        console.error('Error adding battery:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addBattery:', error);
      return false;
    }
  },

  async updateBattery(battery: Battery): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const dbBattery = transformBatteryToDB(battery, user.id);

      const { error } = await supabase
        .from('user_batteries')
        .update(dbBattery)
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
  },

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
};

function transformBatteryFromDB(dbBattery: UserBattery): Battery {
  return {
    id: dbBattery.id,
    grade: dbBattery.grade,
    status: dbBattery.status,
    soh: Number(dbBattery.soh),
    rul: dbBattery.rul,
    cycles: dbBattery.cycles,
    chemistry: dbBattery.chemistry,
    uploadDate: new Date(dbBattery.upload_date).toISOString().split('T')[0],
    sohHistory: dbBattery.soh_history || [],
    issues: dbBattery.issues || [],
    rawData: dbBattery.raw_data,
    notes: dbBattery.notes
  };
}

function transformBatteryToDB(battery: Battery, userId: string): Partial<UserBattery> {
  return {
    id: battery.id,
    user_id: userId,
    grade: battery.grade,
    status: battery.status,
    soh: battery.soh,
    rul: battery.rul,
    cycles: battery.cycles,
    chemistry: battery.chemistry,
    soh_history: battery.sohHistory || [],
    issues: battery.issues || [],
    raw_data: battery.rawData,
    notes: battery.notes
  };
}
