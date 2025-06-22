
import { supabase } from '@/integrations/supabase/client';
import { Battery } from '@/types';

// Update interface to match the actual database schema
export interface UserBattery {
  id: string;
  user_id: string;
  grade: string; // Changed from union type to string to match DB
  status: string; // Changed from union type to string to match DB
  soh: number;
  rul: number;
  cycles: number;
  chemistry: string; // Changed from union type to string to match DB
  upload_date: string | null;
  soh_history: any;
  issues: any;
  raw_data?: any;
  notes?: string | null;
  created_at: string | null;
  updated_at: string | null;
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
      return (data || []).map(transformBatteryFromDB);
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
        .insert(dbBattery); // Insert single object, not array

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
    grade: dbBattery.grade as 'A' | 'B' | 'C' | 'D', // Type assertion
    status: dbBattery.status as 'Healthy' | 'Degrading' | 'Critical' | 'Unknown', // Type assertion
    soh: Number(dbBattery.soh),
    rul: dbBattery.rul,
    cycles: dbBattery.cycles,
    chemistry: dbBattery.chemistry as 'LFP' | 'NMC', // Type assertion
    uploadDate: dbBattery.upload_date ? new Date(dbBattery.upload_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    sohHistory: dbBattery.soh_history || [],
    issues: dbBattery.issues || [],
    rawData: dbBattery.raw_data,
    notes: dbBattery.notes || undefined
  };
}

function transformBatteryToDB(battery: Battery, userId: string): Omit<UserBattery, 'created_at' | 'updated_at'> {
  return {
    id: battery.id,
    user_id: userId,
    grade: battery.grade,
    status: battery.status,
    soh: battery.soh,
    rul: battery.rul,
    cycles: battery.cycles,
    chemistry: battery.chemistry,
    upload_date: battery.uploadDate,
    soh_history: battery.sohHistory || [],
    issues: battery.issues || [],
    raw_data: battery.rawData,
    notes: battery.notes || null
  };
}
