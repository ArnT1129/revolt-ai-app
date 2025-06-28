
import { Battery, BatteryGrade, BatteryStatus, BatteryIssue } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const MOCK_BATTERIES: Battery[] = [
  {
    id: "NMC-001A",
    grade: "A",
    status: "Healthy",
    soh: 99.1,
    rul: 1850,
    cycles: 150,
    chemistry: "NMC",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 50, soh: 99.8 },
      { cycle: 100, soh: 99.5 },
      { cycle: 150, soh: 99.1 }
    ],
    issues: [],
    notes: "New high-performance NMC battery with excellent health metrics"
  },
  {
    id: "LFP-002B",
    grade: "B",
    status: "Degrading",
    soh: 92.5,
    rul: 820,
    cycles: 1180,
    chemistry: "LFP",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 500, soh: 97.2 },
      { cycle: 1000, soh: 94.1 },
      { cycle: 1180, soh: 92.5 }
    ],
    issues: [
      {
        id: "issue-1",
        category: "Performance",
        title: "Gradual Capacity Loss",
        description: "Battery showing signs of gradual capacity degradation",
        severity: "Warning",
        cause: "Normal aging process accelerated by frequent deep cycles",
        recommendation: "Monitor closely and consider replacement planning",
        solution: "Implement gentler charging profile",
        affectedMetrics: ["soh", "rul"]
      }
    ],
    notes: "LFP battery with moderate degradation - monitor performance"
  },
  {
    id: "NMC-003C",
    grade: "C",
    status: "Critical",
    soh: 84.3,
    rul: 210,
    cycles: 2400,
    chemistry: "NMC",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 800, soh: 95.2 },
      { cycle: 1600, soh: 89.8 },
      { cycle: 2400, soh: 84.3 }
    ],
    issues: [
      {
        id: "issue-2",
        category: "Safety",
        title: "Critical SoH Level",
        description: "State of Health has dropped below safe operational threshold",
        severity: "Critical",
        cause: "Extensive cycling and aging beyond recommended limits",
        recommendation: "Replace immediately to avoid safety risks",
        solution: "Battery replacement required",
        affectedMetrics: ["soh", "rul", "cycles"]
      },
      {
        id: "issue-3",
        category: "Performance",
        title: "High Cycle Count",
        description: "Battery has exceeded recommended cycle life",
        severity: "Warning",
        cause: "Extended use beyond typical lifecycle",
        recommendation: "Schedule replacement and review usage patterns",
        solution: "Replacement and usage optimization",
        affectedMetrics: ["cycles"]
      }
    ],
    notes: "Critical battery requiring immediate attention and replacement"
  },
  {
    id: "LFP-004A",
    grade: "A",
    status: "Healthy",
    soh: 99.8,
    rul: 2800,
    cycles: 50,
    chemistry: "LFP",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 25, soh: 99.9 },
      { cycle: 50, soh: 99.8 }
    ],
    issues: [],
    notes: "Excellent condition LFP battery with minimal usage"
  }
];

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
  private async initializeMockDataIfNeeded(): Promise<void> {
    try {
      const { data: existingBatteries } = await supabase
        .from('user_batteries')
        .select('id')
        .limit(1);

      if (!existingBatteries || existingBatteries.length === 0) {
        // Insert mock batteries for new users
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const mockBatteriesForDb = MOCK_BATTERIES.map(battery => ({
            id: battery.id,
            user_id: user.id,
            grade: battery.grade,
            status: battery.status,
            soh: battery.soh,
            rul: battery.rul,
            cycles: battery.cycles,
            chemistry: battery.chemistry,
            upload_date: battery.uploadDate,
            soh_history: JSON.parse(JSON.stringify(battery.sohHistory)),
            issues: JSON.parse(JSON.stringify(battery.issues || [])),
            notes: battery.notes
          }));

          await supabase.from('user_batteries').insert(mockBatteriesForDb);
        }
      }
    } catch (error) {
      console.error('Error initializing mock data:', error);
    }
  }

  async getUserBatteries(): Promise<Battery[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return [];
      }

      // Initialize mock data for new users
      await this.initializeMockDataIfNeeded();

      const { data: batteries, error } = await supabase
        .from('user_batteries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batteries:', error);
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
        sohHistory: Array.isArray(battery.soh_history) ? (battery.soh_history as unknown as { cycle: number; soh: number }[]) : [],
        issues: Array.isArray(battery.issues) ? (battery.issues as unknown as BatteryIssue[]) : [],
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
