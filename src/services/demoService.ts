
import { Battery } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { aiAgentService } from "./aiAgentService";

// Demo batteries that appear only for demo users
export const DEMO_BATTERIES: Battery[] = [
  {
    id: "DEMO-NMC-001",
    name: "Tesla Model S Battery Pack",
    grade: "A",
    status: "Healthy",
    soh: 98.5,
    rul: 2100,
    cycles: 200,
    chemistry: "NMC",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 50, soh: 99.5 },
      { cycle: 100, soh: 99.0 },
      { cycle: 150, soh: 98.8 },
      { cycle: 200, soh: 98.5 }
    ],
    issues: [],
    notes: "Demo Battery - High-performance NMC demonstrating excellent health",
    manufacturer: "Tesla Motors",
    model: "Model S 100kWh",
    capacity: 100,
    voltage: 400,
    temperatureRange: { min: -20, max: 60 },
    chargeRate: 1.5,
    dischargeRate: 2.0,
    cellCount: 8256,
    cellConfiguration: "96S86P",
    weight: 540,
    dimensions: { length: 2100, width: 1500, height: 150 },
    operatingConditions: { temperature: 25, humidity: 60, altitude: 0 },
    application: "EV",
    environment: "Outdoor",
    attachments: [
      {
        id: "att_001_pcb",
        name: "Tesla_BMS_PCB_Design_v2.1.sch",
        type: "pcb_design",
        fileName: "Tesla_BMS_PCB_Design_v2.1.sch",
        fileSize: 2457600,
        uploadDate: new Date("2024-01-15"),
        description: "Tesla Model S BMS PCB schematic with advanced thermal management",
        tags: ["BMS", "thermal", "Tesla", "high-current"]
      },
      {
        id: "att_001_chem",
        name: "NMC_811_Chemistry_Specification.pdf",
        type: "chemistry_spec",
        fileName: "NMC_811_Chemistry_Specification.pdf",
        fileSize: 1843200,
        uploadDate: new Date("2024-01-10"),
        description: "NMC 811 cathode chemistry specifications and performance data",
        tags: ["NMC", "cathode", "811", "high-energy"]
      },
      {
        id: "att_001_design",
        name: "Model_S_Battery_Design_Specs.xlsx",
        type: "design_spec",
        fileName: "Model_S_Battery_Design_Specs.xlsx",
        fileSize: 921600,
        uploadDate: new Date("2024-01-12"),
        description: "Complete battery pack design specifications and engineering drawings",
        tags: ["design", "pack", "thermal", "structural"]
      },
      {
        id: "att_001_test",
        name: "Safety_Test_Report_2024.pdf",
        type: "test_report",
        fileName: "Safety_Test_Report_2024.pdf",
        fileSize: 3072000,
        uploadDate: new Date("2024-01-20"),
        description: "Comprehensive safety testing results including thermal runaway tests",
        tags: ["safety", "testing", "thermal", "compliance"]
      }
    ]
  },
  {
    id: "DEMO-LFP-002",
    name: "BYD Blade Battery Pack",
    grade: "B",
    status: "Degrading",
    soh: 89.2,
    rul: 650,
    cycles: 1500,
    chemistry: "LFP",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 500, soh: 96.0 },
      { cycle: 1000, soh: 92.5 },
      { cycle: 1500, soh: 89.2 }
    ],
    issues: [
      {
        id: "demo-issue-1",
        category: "Performance",
        title: "Capacity Fade Detected",
        description: "Demo issue showing gradual capacity degradation",
        severity: "Warning",
        cause: "Simulated aging process",
        recommendation: "Monitor performance trends",
        solution: "Consider replacement planning",
        affectedMetrics: ["soh", "rul"]
      }
    ],
    notes: "Demo Battery - LFP showing typical degradation patterns",
    manufacturer: "BYD",
    model: "Blade Battery 60kWh",
    capacity: 60,
    voltage: 320,
    temperatureRange: { min: -10, max: 55 },
    chargeRate: 1.0,
    dischargeRate: 1.5,
    cellCount: 4000,
    cellConfiguration: "80S50P",
    weight: 380,
    dimensions: { length: 1800, width: 1200, height: 120 },
    operatingConditions: { temperature: 30, humidity: 70, altitude: 100 },
    application: "EV",
    environment: "Indoor",
    attachments: [
      {
        id: "att_002_pcb",
        name: "BYD_Blade_BMS_Circuit.brd",
        type: "pcb_design",
        fileName: "BYD_Blade_BMS_Circuit.brd",
        fileSize: 1843200,
        uploadDate: new Date("2024-01-08"),
        description: "BYD Blade battery BMS circuit board layout with cell monitoring",
        tags: ["BMS", "monitoring", "BYD", "blade"]
      },
      {
        id: "att_002_chem",
        name: "LFP_Chemistry_Analysis.pdf",
        type: "chemistry_spec",
        fileName: "LFP_Chemistry_Analysis.pdf",
        fileSize: 1536000,
        uploadDate: new Date("2024-01-05"),
        description: "LFP cathode chemistry analysis and performance characteristics",
        tags: ["LFP", "cathode", "safety", "long-life"]
      },
      {
        id: "att_002_thermal",
        name: "Thermal_Analysis_Report.pdf",
        type: "thermal_analysis",
        fileName: "Thermal_Analysis_Report.pdf",
        fileSize: 2150400,
        uploadDate: new Date("2024-01-18"),
        description: "Thermal analysis of Blade battery pack under various conditions",
        tags: ["thermal", "analysis", "cooling", "efficiency"]
      },
      {
        id: "att_002_manufacturing",
        name: "Manufacturing_Process_Data.xlsx",
        type: "manufacturing_data",
        fileName: "Manufacturing_Process_Data.xlsx",
        fileSize: 768000,
        uploadDate: new Date("2024-01-22"),
        description: "Manufacturing process data and quality control metrics",
        tags: ["manufacturing", "quality", "process", "control"]
      }
    ]
  },
  {
    id: "DEMO-NMC-003",
    name: "LG Chem Grid Storage Battery",
    grade: "C",
    status: "Critical",
    soh: 78.1,
    rul: 150,
    cycles: 2800,
    chemistry: "NMC",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 1000, soh: 92.0 },
      { cycle: 2000, soh: 84.5 },
      { cycle: 2800, soh: 78.1 }
    ],
    issues: [
      {
        id: "demo-issue-2",
        category: "Safety",
        title: "Critical SoH Threshold",
        description: "Demo critical battery requiring immediate attention",
        severity: "Critical",
        cause: "Extensive cycling simulation",
        recommendation: "Replace immediately",
        solution: "Battery replacement required",
        affectedMetrics: ["soh", "rul", "cycles"]
      }
    ],
    notes: "Demo Battery - Critical condition demonstration",
    manufacturer: "LG Chem",
    model: "Grid Storage 200kWh",
    capacity: 200,
    voltage: 600,
    temperatureRange: { min: -5, max: 50 },
    chargeRate: 0.8,
    dischargeRate: 1.2,
    cellCount: 12000,
    cellConfiguration: "120S100P",
    weight: 1200,
    dimensions: { length: 3000, width: 2000, height: 200 },
    operatingConditions: { temperature: 35, humidity: 80, altitude: 50 },
    application: "Grid Storage",
    environment: "Harsh Environment",
    attachments: [
      {
        id: "att_003_pcb",
        name: "LG_Grid_BMS_Design.kicad_pcb",
        type: "pcb_design",
        fileName: "LG_Grid_BMS_Design.kicad_pcb",
        fileSize: 3686400,
        uploadDate: new Date("2024-01-03"),
        description: "LG Chem grid storage BMS PCB design with high-power handling",
        tags: ["BMS", "grid", "high-power", "LG"]
      },
      {
        id: "att_003_safety",
        name: "Safety_Compliance_Certificate.pdf",
        type: "safety_data",
        fileName: "Safety_Compliance_Certificate.pdf",
        fileSize: 1536000,
        uploadDate: new Date("2024-01-07"),
        description: "Safety compliance certificate and emergency shutdown procedures",
        tags: ["safety", "compliance", "emergency", "certificate"]
      },
      {
        id: "att_003_test",
        name: "Performance_Test_Results.pdf",
        type: "test_report",
        fileName: "Performance_Test_Results.pdf",
        fileSize: 2764800,
        uploadDate: new Date("2024-01-25"),
        description: "Comprehensive performance test results including cycle life analysis",
        tags: ["testing", "performance", "cycle-life", "degradation"]
      },
      {
        id: "att_003_design",
        name: "Grid_Storage_Design_Specs.pdf",
        type: "design_spec",
        fileName: "Grid_Storage_Design_Specs.pdf",
        fileSize: 1843200,
        uploadDate: new Date("2024-01-14"),
        description: "Grid storage system design specifications and integration requirements",
        tags: ["grid", "storage", "design", "integration"]
      }
    ]
  }
];

export class DemoService {
  /**
   * Check if current user is a demo user
   */
  static async isDemoUser(): Promise<boolean> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }
      
      // Check if user has demo flag in localStorage
      const demoFlag = localStorage.getItem('isDemoUser');
      
      if (demoFlag === 'true') {
        return true;
      }
      
      // Check if user email is demo@revolt.ai
      if (user.email === 'demo@revolt.ai') {
        return true;
      }
      
      // For non-demo users, check database
      try {
        const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_demo')
        .eq('id', user.id)
        .single();
      
        if (error) {
          return false;
        }
        
        return profile?.is_demo || false;
      } catch (dbError) {

        return false;
      }
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Mark user as demo user in database
   */
  static async markAsDemoUser(userId: string): Promise<void> {
    try {
      // Set localStorage flag for immediate effect
      localStorage.setItem('isDemoUser', 'true');
      
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        // Update existing profile
        await supabase
          .from('profiles')
          .update({ is_demo: true })
          .eq('id', userId);
      } else {
        // Create new profile with demo flag
        await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: 'demo@revolt.ai',
            is_demo: true,
            full_name: 'Demo User'
          });
      }
    } catch (error) {
      
      // Even if database fails, localStorage flag will work
      localStorage.setItem('isDemoUser', 'true');
    }
  }

  /**
   * Clear demo user data when they sign out
   */
  static async clearDemoUserData(userId: string): Promise<void> {
    try {
      // Clear localStorage demo flag
      localStorage.removeItem('isDemoUser');
      
      // Clear demo batteries from database
      await supabase
        .from('user_batteries')
        .delete()
        .eq('user_id', userId);
      
      // Clear AI Agent demo data
      await supabase
        .from('ai_agent_configs')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);
      
      await supabase
        .from('ai_analysis_history')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);
      
      await supabase
        .from('ai_agent_settings')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);
      
      await supabase
        .from('ai_agent_metrics')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);
      
      // Clear localStorage demo data
      localStorage.removeItem('demoUploadedBatteries');
      localStorage.removeItem('demoEditedBatteries');
      localStorage.removeItem('demoAIAgentData');
      
      // Reset AI Agent service for demo user
      await aiAgentService.resetForDemo();
      
      // Mark user as no longer demo
      await supabase
        .from('profiles')
        .update({ is_demo: false })
        .eq('id', userId);
    } catch (error) {
      
      // Even if database fails, clear localStorage and reset AI service
      localStorage.removeItem('isDemoUser');
      localStorage.removeItem('demoUploadedBatteries');
      localStorage.removeItem('demoEditedBatteries');
      localStorage.removeItem('demoAIAgentData');
      
      // Still try to reset AI service
      try {
        await aiAgentService.resetForDemo();
      } catch (resetError) {

      }
    }
  }

  /**
   * Clear demo flags for normal users
   */
  static clearDemoFlags(): void {
    localStorage.removeItem('isDemoUser');
    localStorage.removeItem('demoUploadedBatteries');
  }

  /**
   * Get hardcoded demo batteries (only for demo users)
   */
  static getDemoBatteries(): Battery[] {
    return DEMO_BATTERIES;
  }

  /**
   * Get uploaded demo batteries from localStorage (only for demo users)
   */
  static getDemoUploadedBatteries(): Battery[] {
    try {
      const data = localStorage.getItem('demoUploadedBatteries');
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        // If corrupted, reset
        localStorage.removeItem('demoUploadedBatteries');
        return [];
      }
    } catch {
      localStorage.removeItem('demoUploadedBatteries');
      return [];
    }
  }

  /**
   * Add a battery to demo uploads in localStorage (only for demo users)
   */
  static addDemoUploadedBattery(battery: Battery): void {
    try {
    const uploads = this.getDemoUploadedBatteries();
    uploads.push(battery);
    localStorage.setItem('demoUploadedBatteries', JSON.stringify(uploads));
    } catch (error) {
      console.error('Error adding demo battery:', error);
      throw error;
    }
  }

  /**
   * Delete a battery from demo uploads in localStorage (only for demo users)
   */
  static deleteDemoUploadedBattery(batteryId: string): void {
    try {
    const uploads = this.getDemoUploadedBatteries().filter(b => b.id !== batteryId);
    localStorage.setItem('demoUploadedBatteries', JSON.stringify(uploads));
    } catch (error) {
      console.error('Error deleting demo battery:', error);
      throw error;
    }
  }

  /**
   * Clear all demo uploads from localStorage (only for demo users)
   */
  static clearDemoUploadedBatteries(): void {
    try {
    localStorage.removeItem('demoUploadedBatteries');
    } catch (error) {
      console.error('Error clearing demo uploads:', error);
    }
  }

  /**
   * Get edited hardcoded demo batteries from localStorage (only for demo users)
   */
  static getDemoEditedBatteries(): Battery[] {
    try {
      const data = localStorage.getItem('demoEditedBatteries');
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        localStorage.removeItem('demoEditedBatteries');
        return [];
      }
    } catch {
      localStorage.removeItem('demoEditedBatteries');
      return [];
    }
  }

  /**
   * Set or update an edited hardcoded demo battery in localStorage (only for demo users)
   */
  static setDemoEditedBattery(battery: Battery): void {
    try {
      const edits = this.getDemoEditedBatteries();
      const idx = edits.findIndex(b => b.id === battery.id);
      if (idx !== -1) {
        edits[idx] = battery;
      } else {
        edits.push(battery);
      }
      localStorage.setItem('demoEditedBatteries', JSON.stringify(edits));
    } catch (error) {
      console.error('Error setting demo edited battery:', error);
      throw error;
    }
  }

  /**
   * Clear all edited hardcoded demo batteries from localStorage (only for demo users)
   */
  static clearDemoEditedBatteries(): void {
    try {
      localStorage.removeItem('demoEditedBatteries');
    } catch (error) {
      console.error('Error clearing demo edited batteries:', error);
    }
  }

  /**
   * Get all batteries for demo user: hardcoded (with edits) + uploaded (only for demo users)
   */
  static getAllDemoBatteries(): Battery[] {
    try {
    const uploads = this.getDemoUploadedBatteries();
      const edits = this.getDemoEditedBatteries();
      // Merge edits into hardcoded demo batteries
      const merged = DEMO_BATTERIES.map(b => {
        const edit = edits.find(e => e.id === b.id);
        return edit ? { ...b, ...edit } : b;
      });
      return [...merged, ...uploads];
    } catch (error) {
      console.error('Error getting all demo batteries:', error);
      return DEMO_BATTERIES; // Return only hardcoded batteries if error
    }
  }

  /**
   * Create demo account and mark as demo user
   */
  static async createDemoAccount(): Promise<{ user: any; error: any }> {
    const demoEmail = 'demo@revolt.ai';
    const demoPassword = 'demo123456';

    try {
      // Try to sign in first
      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error && error.message.includes('Invalid login credentials')) {
        // Create demo account if it doesn't exist
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: 'Demo',
              last_name: 'User',
              full_name: 'Demo User',
              account_type: 'individual'
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user) {
          // Mark as demo user
          await this.markAsDemoUser(signUpData.user.id);
          
          // Sign in the demo user
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });
          
          if (signInError) throw signInError;
          return { user: signInData.user, error: null };
        }
      } else if (error) {
        throw error;
      }

      // If sign in was successful, ensure user is marked as demo
      if (data.user) {
        await this.markAsDemoUser(data.user.id);
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Demo account creation error:', error);
      return { user: null, error };
    }
  }

  /**
   * Reset demo account data (clear uploads but keep hardcoded batteries)
   */
  static async resetDemoAccount(): Promise<void> {
    try {
      localStorage.removeItem('demoUploadedBatteries');
      localStorage.removeItem('demoEditedBatteries');
      
      // Reset AI Agent service for demo user
      await aiAgentService.resetForDemo();
      
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
    } catch (error) {
      console.error('Error resetting demo account:', error);
    }
  }

  /**
   * Check if a battery ID is a hardcoded demo battery
   */
  static isHardcodedDemoBattery(batteryId: string): boolean {
    return DEMO_BATTERIES.some(battery => battery.id === batteryId);
  }

  /**
   * Get demo battery by ID (only for hardcoded demo batteries)
   */
  static getDemoBatteryById(batteryId: string): Battery | null {
    return DEMO_BATTERIES.find(battery => battery.id === batteryId) || null;
  }

  /**
   * Validate demo user access
   */
  static async validateDemoAccess(): Promise<boolean> {
    const isDemo = await this.isDemoUser();
    if (!isDemo) {
      // Attempted to access demo functionality by non-demo user
      return false;
    }
    return true;
  }
}
