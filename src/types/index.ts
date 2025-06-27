
import { BatteryIssue } from "@/services/issueAnalysis";
import { BatteryMetrics } from "@/services/batteryAnalytics";

export type BatteryGrade = "A" | "B" | "C" | "D";

export type BatteryStatus = "Healthy" | "Degrading" | "Critical" | "Unknown";

export interface SoHDataPoint {
  cycle: number;
  soh: number;
}

export interface Battery {
  id: string;
  grade: BatteryGrade;
  status: BatteryStatus;
  soh: number;
  rul: number;
  cycles: number;
  chemistry: "LFP" | "NMC";
  uploadDate: string;
  sohHistory: SoHDataPoint[];
  issues?: BatteryIssue[];
  rawData?: any[];
  metrics?: BatteryMetrics;
  notes?: string;
}

// Export BatteryIssue type using proper syntax for isolated modules
export type { BatteryIssue } from "@/services/issueAnalysis";
