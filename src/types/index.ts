
import { BatteryIssue } from "@/services/issueAnalysis";
import { BatteryMetrics } from "@/services/batteryAnalytics";

export type BatteryGrade = "A" | "B" | "C" | "D";

export type BatteryStatus = "Healthy" | "Degrading" | "Critical" | "Unknown";

export interface SoHPoint {
  cycle: number;
  soh: number;
}

export interface BatteryAttachment {
  id: string;
  name: string;
  type: 'pcb_design' | 'chemistry_spec' | 'design_spec' | 'test_report' | 'manufacturing_data' | 'safety_data' | 'thermal_analysis' | 'other';
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ParsedBatteryData {
  id: string;
  grade: BatteryGrade;
  status: BatteryStatus;
  soh: number;
  rul: number;
  cycles: number;
  chemistry: 'LFP' | 'NMC' | 'LCO' | 'NCA';
  uploadDate: string;
  sohHistory: SoHPoint[];
  issues: BatteryIssue[];
  notes?: string;
  attachments?: BatteryAttachment[];
}

export interface Battery {
  id: string;
  name?: string;
  grade: BatteryGrade;
  status: BatteryStatus;
  soh: number;
  rul: number;
  cycles: number;
  chemistry: 'LFP' | 'NMC' | 'LCO' | 'NCA';
  uploadDate: string;
  sohHistory: SoHPoint[];
  issues: BatteryIssue[];
  notes?: string;
  attachments?: BatteryAttachment[];
  // Enhanced fields for better AI analysis
  manufacturer?: string;
  model?: string;
  capacity?: number; // Ah
  voltage?: number; // V
  temperatureRange?: {
    min: number;
    max: number;
  };
  chargeRate?: number; // C-rate
  dischargeRate?: number; // C-rate
  cellCount?: number;
  cellConfiguration?: string; // e.g., "4S2P"
  weight?: number; // kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  operatingConditions?: {
    temperature: number;
    humidity: number;
    altitude: number;
  };
  application?: string; // e.g., "EV", "Grid Storage", "Consumer Electronics"
  environment?: string; // e.g., "Indoor", "Outdoor", "Harsh Environment"
}

// Re-export BatteryIssue type
export type { BatteryIssue } from "@/services/issueAnalysis";
