
import { Battery, BatteryGrade, BatteryStatus, BatteryAttachment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { DemoService } from "./demoService";

export interface BatteryUpdate {
  grade?: BatteryGrade;
  status?: BatteryStatus;
  soh?: number;
  rul?: number;
  cycles?: number;
  chemistry?: "LFP" | "NMC";
  uploadDate?: string;
  sohHistory?: { cycle: number; soh: number }[];
  issues?: any[];
  notes?: string;
}

class BatteryService {
  /**
   * Check if current user is a demo user
   */
  async isDemoUser(): Promise<boolean> {
    return await DemoService.isDemoUser();
  }

  /**
   * Get user batteries - returns demo batteries for demo users, real batteries for real users
   */
  async getUserBatteries(): Promise<Battery[]> {
    try {
      const isDemo = await this.isDemoUser();
      
      if (isDemo) {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Not signed in: only show hardcoded demo batteries
          return DemoService.getDemoBatteries();
        }
        // Signed in: show hardcoded + uploaded demo batteries
        return DemoService.getAllDemoBatteries();
      }

      // For normal users, clear any demo flags that might be lingering
      DemoService.clearDemoFlags();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data: batteries, error } = await supabase
        .from('user_batteries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batteries:', error);
        return [];
      }

      if (!batteries) {
        return [];
      }

      const mappedBatteries = batteries.map(battery => ({
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
          (battery.issues as unknown as any[]) : [],
        notes: battery.notes
      }));

      return mappedBatteries;
    } catch (error) {
      console.error('Error in getUserBatteries:', error);
      return [];
    }
  }

  /**
   * Add a battery - saves to database for real users, localStorage for demo users
   */
  async addBattery(newBattery: Battery): Promise<boolean> {
    const isDemo = await this.isDemoUser();
    
    if (isDemo) {
      // Demo users save to localStorage only
      try {
        DemoService.addDemoUploadedBattery(newBattery);
        return true;
      } catch (error) {
        console.error('Error adding demo battery:', error);
        return false;
      }
    }

    // Real users save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      // Check if battery already exists
      let existingBattery = null;
      let checkError = null;
      
      try {
        const result = await supabase
          .from('user_batteries')
          .select('id')
          .eq('id', newBattery.id)
          .eq('user_id', user.id)
          .single();
        existingBattery = result.data;
        checkError = result.error;
      } catch (error) {
        // Continue with insertion despite the error
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing battery:', checkError);
        return false;
      }

      if (existingBattery) {
        console.error(`Battery ${newBattery.id} already exists for user`);
        return false;
      }

      // Prepare the data for insertion
      const batteryData = {
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
        notes: newBattery.notes,
        attachments: newBattery.attachments ? JSON.parse(JSON.stringify(newBattery.attachments)) : null
      };

      const { data: insertedBattery, error } = await supabase
        .from('user_batteries')
        .insert(batteryData)
        .select()
        .single();

      if (error) {
        console.error('Error adding battery to database:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addBattery:', error);
      return false;
    }
  }

  /**
   * Update a battery - updates database for real users, localStorage for demo users
   */
  async updateBattery(updatedBattery: Battery): Promise<boolean> {
    const isDemo = await this.isDemoUser();
    
    if (isDemo) {
      if (DemoService.isHardcodedDemoBattery(updatedBattery.id)) {
        // Save edits to hardcoded demo batteries in localStorage
        try {
          DemoService.setDemoEditedBattery(updatedBattery);
          window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
          return true;
        } catch (error) {
          console.error('Error editing hardcoded demo battery:', error);
          return false;
        }
      } else {
        // Update uploaded demo batteries in localStorage
        try {
          DemoService.deleteDemoUploadedBattery(updatedBattery.id);
          DemoService.addDemoUploadedBattery(updatedBattery);
          window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
          return true;
        } catch (error) {
          console.error('Error updating demo battery:', error);
          return false;
        }
      }
    }

    // Real users update in database
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
          notes: updatedBattery.notes,
          attachments: updatedBattery.attachments ? JSON.parse(JSON.stringify(updatedBattery.attachments)) : null
        })
        .eq('id', updatedBattery.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating battery in database:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateBattery:', error);
      return false;
    }
  }

  /**
   * Delete a battery - deletes from database for real users, localStorage for demo users
   */
  async deleteBattery(batteryId: string): Promise<boolean> {
    const isDemo = await this.isDemoUser();
    
    if (isDemo) {
      // Demo users can only delete uploaded batteries, not hardcoded ones
      if (DemoService.isHardcodedDemoBattery(batteryId)) {
        return false;
      }
      
      // Delete from localStorage
      try {
        DemoService.deleteDemoUploadedBattery(batteryId);
        return true;
      } catch (error) {
        console.error('Error deleting demo battery:', error);
        return false;
      }
    }

    // Real users delete from database
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
        console.error('Error deleting battery from database:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteBattery:', error);
      return false;
    }
  }

  /**
   * Delete a battery for the current user
   */
  async deleteBatteryForUser(batteryId: string): Promise<boolean> {
    try {
      // Attempting to delete battery
      
      const isDemo = await this.isDemoUser();
      
      if (isDemo) {
        // Demo users can only delete uploaded demo batteries, not hardcoded ones
        if (DemoService.isHardcodedDemoBattery(batteryId)) {
          return false;
        }
        
        // Delete from localStorage
        try {
          DemoService.deleteDemoUploadedBattery(batteryId);
          // Demo battery deleted
          return true;
        } catch (error) {
          console.error('Error deleting demo battery:', error);
          return false;
        }
      }

      // Real users delete from database
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
        console.error('Error deleting battery from database:', error);
        return false;
      }
      
      // Dispatch event to update all components
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error in deleteBatteryForUser:', error);
      return false;
    }
  }

  /**
   * Update specific battery fields - updates database for real users, localStorage for demo users
   */
  async updateBatteryFields(batteryId: string, updates: BatteryUpdate): Promise<boolean> {
    const isDemo = await this.isDemoUser();
    
    if (isDemo) {
      // Demo users can only update uploaded batteries, not hardcoded ones
      if (DemoService.isHardcodedDemoBattery(batteryId)) {
        return false;
      }
      
      // Update in localStorage
      try {
        const uploads = DemoService.getDemoUploadedBatteries();
        const idx = uploads.findIndex(b => b.id === batteryId);
        if (idx === -1) {
          console.error(`Demo battery not found: ${batteryId}`);
          return false;
        }
        
        const updated = { ...uploads[idx], ...updates };
        uploads[idx] = updated;
        localStorage.setItem('demoUploadedBatteries', JSON.stringify(uploads));
        return true;
      } catch (error) {
        console.error('Error updating demo battery fields:', error);
        return false;
      }
    }

    // Real users update in database
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
        console.error('Error updating battery fields in database:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateBatteryFields:', error);
      return false;
    }
  }

  /**
   * Get battery by ID - works for both demo and real users
   */
  async getBatteryById(batteryId: string): Promise<Battery | null> {
    const isDemo = await this.isDemoUser();
    
    if (isDemo) {
      // Check hardcoded demo batteries first
      const demoBattery = DemoService.getDemoBatteryById(batteryId);
      if (demoBattery) return demoBattery;
      
      // Check uploaded demo batteries
      const uploadedBattery = DemoService.getDemoUploadedBatteries().find(b => b.id === batteryId);
      return uploadedBattery || null;
    }

    // Real users get from database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: battery, error } = await supabase
        .from('user_batteries')
        .select('*')
        .eq('id', batteryId)
        .eq('user_id', user.id)
        .single();

      if (error || !battery) return null;

      return {
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
          (battery.issues as unknown as any[]) : [],
        notes: battery.notes,
        attachments: (battery as any).attachments ? 
          ((battery as any).attachments as unknown as BatteryAttachment[]) : undefined
      };
    } catch (error) {
      console.error('Error in getBatteryById:', error);
      return null;
    }
  }

  /**
   * Check if a battery can be modified (not hardcoded demo battery)
   */
  async canModifyBattery(batteryId: string): Promise<boolean> {
    const isDemo = await this.isDemoUser();
    
    if (isDemo) {
      // Demo users cannot modify hardcoded demo batteries
      return !DemoService.isHardcodedDemoBattery(batteryId);
    }
    
    // Real users can modify their own batteries
    return true;
  }

  /**
   * Create a new battery passport after upload
   */
  async createBatteryPassport(battery: Battery): Promise<boolean> {
    // Add the battery using the existing addBattery method
    const success = await this.addBattery(battery);
    
    if (success) {
      // Dispatch event to update all components
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
    } else {
      console.error(`Failed to create battery passport: ${battery.id}`);
    }
    
    return success;
  }

  /**
   * Test database connectivity and user authentication
   */
  async testDatabaseConnection(): Promise<{
    authenticated: boolean;
    userId: string | null;
    isDemo: boolean;
    tableExists: boolean;
    canInsert: boolean;
  }> {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        return {
          authenticated: false,
          userId: null,
          isDemo: false,
          tableExists: false,
          canInsert: false
        };
      }

      if (!user) {
        return {
          authenticated: false,
          userId: null,
          isDemo: false,
          tableExists: false,
          canInsert: false
        };
      }

      // Check if user is demo
      const isDemo = await this.isDemoUser();

      // Test table access
      const { data: testData, error: tableError } = await supabase
        .from('user_batteries')
        .select('id')
        .limit(1);

      const tableExists = !tableError;
      const canInsert = !tableError; // If we can select, we should be able to insert

      return {
        authenticated: true,
        userId: user.id,
        isDemo,
        tableExists,
        canInsert
      };
    } catch (error) {
      console.error('Database connection test error:', error);
      return {
        authenticated: false,
        userId: null,
        isDemo: false,
        tableExists: false,
        canInsert: false
      };
    }
  }

  /**
   * Get battery statistics for the current user
   */
  async getBatteryStats(): Promise<{
    total: number;
    healthy: number;
    degrading: number;
    critical: number;
    averageSoH: number;
  }> {
    const batteries = await this.getUserBatteries();
    
    const total = batteries.length;
    const healthy = batteries.filter(b => b.status === 'Healthy').length;
    const degrading = batteries.filter(b => b.status === 'Degrading').length;
    const critical = batteries.filter(b => b.status === 'Critical').length;
    const averageSoH = total > 0 ? batteries.reduce((sum, b) => sum + b.soh, 0) / total : 0;
    
    return {
      total,
      healthy,
      degrading,
      critical,
      averageSoH
    };
  }
}

export const batteryService = new BatteryService();
