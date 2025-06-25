
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_batteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batteries:', error);
        return [];
      }

      // If no batteries exist, seed with mock data for this user
      if (!data || data.length === 0) {
        await this.seedMockBatteries(user.id);
        // Re-fetch after seeding
        const { data: newData } = await supabase
          .from('user_batteries')
          .select('*')
          .order('created_at', { ascending: false });
        return (newData || []).map(transformBatteryFromDB);
      }

      // Transform database format to app format
      return (data || []).map(transformBatteryFromDB);
    } catch (error) {
      console.error('Error in getUserBatteries:', error);
      return [];
    }
  },

  async seedMockBatteries(userId: string): Promise<void> {
    const mockBatteries = [
      {
        id: `MOCK-${userId.slice(0, 8)}-001`,
        user_id: userId,
        grade: 'A',
        status: 'Healthy',
        soh: 98.5,
        rul: 1800,
        cycles: 150,
        chemistry: 'NMC',
        upload_date: new Date().toISOString(),
        soh_history: JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ cycle: i * 10, soh: 100 - i * 0.1 }))),
        issues: JSON.stringify([]),
        notes: 'High-performance NMC battery - Excellent condition'
      },
      {
        id: `MOCK-${userId.slice(0, 8)}-002`,
        user_id: userId,
        grade: 'B',
        status: 'Degrading',
        soh: 85.2,
        rul: 650,
        cycles: 1200,
        chemistry: 'LFP',
        upload_date: new Date().toISOString(),
        soh_history: JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ cycle: i * 60, soh: 98 - i * 0.7 }))),
        issues: JSON.stringify([{ type: 'Performance', description: 'Slight capacity degradation observed' }]),
        notes: 'LFP battery showing gradual degradation'
      },
      {
        id: `MOCK-${userId.slice(0, 8)}-003`,
        user_id: userId,
        grade: 'C',
        status: 'Critical',
        soh: 72.1,
        rul: 180,
        cycles: 2800,
        chemistry: 'NMC',
        upload_date: new Date().toISOString(),
        soh_history: JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ cycle: i * 140, soh: 95 - i * 1.2 }))),
        issues: JSON.stringify([
          { type: 'Safety', description: 'Low SoH threshold reached' },
          { type: 'Performance', description: 'Significant capacity loss' }
        ]),
        notes: 'Critical battery - Requires immediate attention'
      },
      {
        id: `MOCK-${userId.slice(0, 8)}-004`,
        user_id: userId,
        grade: 'A',
        status: 'Healthy',
        soh: 99.2,
        rul: 2100,
        cycles: 80,
        chemistry: 'LFP',
        upload_date: new Date().toISOString(),
        soh_history: JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ cycle: i * 4, soh: 100 - i * 0.04 }))),
        issues: JSON.stringify([]),
        notes: 'New LFP battery - Prime condition'
      },
      {
        id: `MOCK-${userId.slice(0, 8)}-005`,
        user_id: userId,
        grade: 'B',
        status: 'Healthy',
        soh: 91.8,
        rul: 1400,
        cycles: 600,
        chemistry: 'NMC',
        upload_date: new Date().toISOString(),
        soh_history: JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ cycle: i * 30, soh: 98 - i * 0.3 }))),
        issues: JSON.stringify([]),
        notes: 'Stable NMC battery - Good performance'
      }
    ];

    try {
      const { error } = await supabase
        .from('user_batteries')
        .insert(mockBatteries);

      if (error) {
        console.error('Error seeding mock batteries:', error);
      }
    } catch (error) {
      console.error('Error in seedMockBatteries:', error);
    }
  },

  async addBattery(battery: Battery): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const dbBattery = transformBatteryToDB(battery, user.id);

      const { error } = await supabase
        .from('user_batteries')
        .insert(dbBattery);

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
    grade: dbBattery.grade as 'A' | 'B' | 'C' | 'D',
    status: dbBattery.status as 'Healthy' | 'Degrading' | 'Critical' | 'Unknown',
    soh: Number(dbBattery.soh),
    rul: dbBattery.rul,
    cycles: dbBattery.cycles,
    chemistry: dbBattery.chemistry as 'LFP' | 'NMC',
    uploadDate: dbBattery.upload_date ? new Date(dbBattery.upload_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    sohHistory: dbBattery.soh_history ? (typeof dbBattery.soh_history === 'string' ? JSON.parse(dbBattery.soh_history) : dbBattery.soh_history) : [],
    issues: dbBattery.issues ? (typeof dbBattery.issues === 'string' ? JSON.parse(dbBattery.issues) : dbBattery.issues) : [],
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
