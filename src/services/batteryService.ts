
import { Battery, BatteryGrade, BatteryStatus, BatteryIssue } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface BatteryUpdate {
  grade?: BatteryGrade;
  status?: BatteryStatus;
  soh?: number;
  rul?: number;
  cycles?: number;
  chemistry?: "LFP" | "NMC";
  uploadDate?: string;
  sohHistory?: { cycle: number; soh: number }[];
  issues?: BatteryIssue[];
  notes?: string;
}

class BatteryService {
  async getUserBatteries(): Promise<Battery[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticate user found');
        return [];
      }

      const { data: batteries, error } = await supabase
        .from('user_batteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batteries:', error);
        // Return empty array instead of throwing to prevent app crashes
        return [];
      }

      if (!batteries) {
        console.log('No batteries found for user');
        return [];
      }

      return batteries.map(battery => ({
        id: battery.id,
        grade: battery.grade as BatteryGrade,
        status: battery.status as BatteryStatus,
        soh: battery.soh,
        rul: battery.rul,
        cycles: battery.cycles,
        chemistry: battery.chemistry as "LFP" | "NMC",
        uploadDate: battery.upload_date || new Date().toISOString().split('T')[0],
        sohHistory: Array.isArray(battery.soh_history) ? 
          (battery.soh_history as unknown as { cycle: number; soh: number }[]) : [],
        issues: Array.isArray(battery.issues) ? 
          (battery.issues as unknown as BatteryIssue[]) : [],
        notes: battery.notes
      }));
    } catch (error) {
      console.error('Error in getUserBatteries:', error);
      return [];
    }
  }

  async addBattery(newBattery: Battery): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase.from('user_batteries').insert({
        id: newBattery.id,
        user_id: user.id,
        grade: newBattery.grade,
        status: newBattery.status,
        soh: newBattery.soh,
        rul: newBattery.rul,
        cycles: newBattery.cycles,
        chemistry: newBattery.chemistry,
        upload_date: newBattery.uploadDate,
        soh_history: JSON.parse(JSON.stringify(newBattery.sohHistory)),
        issues: JSON.parse(JSON.stringify(newBattery.issues || [])),
        notes: newBattery.notes
      });

      if (error) {
        console.error('Error adding battery:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addBattery:', error);
      return false;
    }
  }

  async updateBattery(updatedBattery: Battery): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('user_batteries')
        .update({
          grade: updatedBattery.grade,
          status: updatedBattery.status,
          soh: updatedBattery.soh,
          rul: updatedBattery.rul,
          cycles: updatedBattery.cycles,
          chemistry: updatedBattery.chemistry,
          upload_date: updatedBattery.uploadDate,
          soh_history: JSON.parse(JSON.stringify(updatedBattery.sohHistory)),
          issues: JSON.parse(JSON.stringify(updatedBattery.issues || [])),
          notes: updatedBattery.notes
        })
        .eq('id', updatedBattery.id)
        .eq('user_id', user.id);

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

  async deleteBattery(batteryId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('user_batteries')
        .delete()
        .eq('id', batteryId)
        .eq('user_id', user.id);

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

  async updateBatteryFields(batteryId: string, updates: BatteryUpdate): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const dbUpdates: any = {};
      if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.soh !== undefined) dbUpdates.soh = updates.soh;
      if (updates.rul !== undefined) dbUpdates.rul = updates.rul;
      if (updates.cycles !== undefined) dbUpdates.cycles = updates.cycles;
      if (updates.chemistry !== undefined) dbUpdates.chemistry = updates.chemistry;
      if (updates.uploadDate !== undefined) dbUpdates.upload_date = updates.uploadDate;
      if (updates.sohHistory !== undefined) dbUpdates.soh_history = JSON.parse(JSON.stringify(updates.sohHistory));
      if (updates.issues !== undefined) dbUpdates.issues = JSON.parse(JSON.stringify(updates.issues));
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('user_batteries')
        .update(dbUpdates)
        .eq('id', batteryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating battery fields:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateBatteryFields:', error);
      return false;
    }
  }
}

export const batteryService = new BatteryService();
