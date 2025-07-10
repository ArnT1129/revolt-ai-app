
import { Battery } from "@/types";

// Demo batteries that appear only for demo users or when no real batteries exist
export const DEMO_BATTERIES: Battery[] = [
  {
    id: "DEMO-NMC-001",
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
    notes: "Demo Battery - High-performance NMC demonstrating excellent health"
  },
  {
    id: "DEMO-LFP-002",
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
    notes: "Demo Battery - LFP showing typical degradation patterns"
  },
  {
    id: "DEMO-NMC-003",
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
    notes: "Demo Battery - Critical condition demonstration"
  }
];

export class DemoService {
  /**
   * Get demo batteries for display purposes
   */
  static getDemoBatteries(): Battery[] {
    return DEMO_BATTERIES;
  }

  /**
   * Check if we should show demo batteries (only for demo users with no real batteries)
   */
  static shouldShowDemoBatteries(userBatteries: Battery[], isDemo: boolean): boolean {
    return isDemo && userBatteries.length === 0;
  }

  /**
   * Combine real user batteries with demo batteries when appropriate
   * For demo users: always show real batteries + demo batteries if no real batteries exist
   * For regular users: only show real batteries
   */
  static getCombinedBatteries(userBatteries: Battery[], isDemo: boolean): Battery[] {
    if (isDemo) {
      // For demo users, always include real batteries they've uploaded
      // Only add demo batteries if they have no real batteries
      if (userBatteries.length === 0) {
        return DEMO_BATTERIES;
      } else {
        // Show both real batteries and demo batteries for demo users
        return [...userBatteries, ...DEMO_BATTERIES];
      }
    }
    // For regular users, only show their real batteries
    return userBatteries;
  }
}
