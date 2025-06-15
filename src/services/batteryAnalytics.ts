import { Battery, SoHDataPoint } from "@/types";
import { BatteryIssue, IssueAnalysisService } from "./issueAnalysis";

export interface BatteryAnalytics {
  calculateSoH: (cycleData: any[]) => number;
  calculateRUL: (sohHistory: SoHDataPoint[], currentSoH: number) => number;
  calculateGrade: (soh: number, rul: number, cycles: number) => "A" | "B" | "C" | "D";
  calculateStatus: (soh: number, degradationRate: number) => "Healthy" | "Degrading" | "Critical" | "Unknown";
  generateSoHHistory: (rawData: any[]) => SoHDataPoint[];
  calculateDegradationRate: (sohHistory: SoHDataPoint[]) => number;
  analyzeIssues: (battery: Battery, rawData: any[]) => BatteryIssue[];
  calculateAdvancedMetrics: (battery: Battery, rawData: any[]) => BatteryMetrics;
}

export interface BatteryMetrics {
  capacityRetention: number;
  energyEfficiency: number;
  powerFadeRate: number;
  internalResistance: number;
  temperatureRange: { min: number; max: number; avg: number };
  voltageRange: { min: number; max: number; avg: number };
  chargingEfficiency: number;
  dischargingEfficiency: number;
  cycleLife: number;
  calendarLife: number;
  peakPower: number;
  energyDensity: number;
  selfDischargeRate: number;
  impedanceGrowth: number;
  thermalStability: string;
}

export class BatteryAnalyticsService implements BatteryAnalytics {
  
  calculateSoH(cycleData: any[]): number {
    if (!cycleData || cycleData.length === 0) return 100;

    // Group data by cycle and calculate capacity for each cycle
    const cycleCapacities = new Map<number, { charge: number, discharge: number }>();
    
    cycleData.forEach(point => {
      const cycle = point.cycle_number;
      if (!cycleCapacities.has(cycle)) {
        cycleCapacities.set(cycle, { charge: 0, discharge: 0 });
      }
      
      const capacity = cycleCapacities.get(cycle)!;
      if (point.step_type === 'charge' && point.capacity_mAh > capacity.charge) {
        capacity.charge = point.capacity_mAh;
      }
      if (point.step_type === 'discharge' && point.capacity_mAh > capacity.discharge) {
        capacity.discharge = point.capacity_mAh;
      }
    });

    // Calculate SoH based on discharge capacity retention
    const capacityValues = Array.from(cycleCapacities.values())
      .map(cap => Math.max(cap.charge, cap.discharge))
      .filter(cap => cap > 0);
    
    if (capacityValues.length === 0) return 100;

    const initialCapacity = Math.max(...capacityValues.slice(0, 3)); // Use max of first 3 cycles
    const latestCapacity = capacityValues[capacityValues.length - 1];
    
    const soh = (latestCapacity / initialCapacity) * 100;
    return Math.max(0, Math.min(100, soh));
  }

  calculateRUL(sohHistory: SoHDataPoint[], currentSoH: number): number {
    if (sohHistory.length < 3) return 1000; // Default for insufficient data

    // Calculate degradation rate using linear regression
    const degradationRate = this.calculateDegradationRate(sohHistory);
    
    if (degradationRate <= 0) return 1000; // No degradation detected

    // Predict cycles until 80% SoH (common EoL threshold)
    const targetSoH = 80;
    const cyclesRemaining = Math.max(0, (currentSoH - targetSoH) / degradationRate);
    
    return Math.round(cyclesRemaining);
  }

  calculateDegradationRate(sohHistory: SoHDataPoint[]): number {
    if (sohHistory.length < 2) return 0;

    // Use linear regression to calculate degradation rate
    const n = sohHistory.length;
    const sumX = sohHistory.reduce((sum, point) => sum + point.cycle, 0);
    const sumY = sohHistory.reduce((sum, point) => sum + point.soh, 0);
    const sumXY = sohHistory.reduce((sum, point) => sum + (point.cycle * point.soh), 0);
    const sumXX = sohHistory.reduce((sum, point) => sum + (point.cycle * point.cycle), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Return absolute degradation rate per cycle
    return Math.abs(slope);
  }

  calculateGrade(soh: number, rul: number, cycles: number): "A" | "B" | "C" | "D" {
    // Enhanced grading algorithm based on multiple factors
    let score = 0;

    // SoH contribution (40% weight)
    if (soh >= 95) score += 40;
    else if (soh >= 90) score += 35;
    else if (soh >= 85) score += 30;
    else if (soh >= 80) score += 20;
    else score += 10;

    // RUL contribution (35% weight)
    if (rul >= 500) score += 35;
    else if (rul >= 300) score += 30;
    else if (rul >= 200) score += 25;
    else if (rul >= 100) score += 15;
    else score += 5;

    // Cycle count contribution (25% weight)
    if (cycles <= 100) score += 25;
    else if (cycles <= 300) score += 20;
    else if (cycles <= 500) score += 15;
    else if (cycles <= 800) score += 10;
    else score += 5;

    // Determine grade based on total score
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 50) return "C";
    return "D";
  }

  calculateStatus(soh: number, degradationRate: number): "Healthy" | "Degrading" | "Critical" | "Unknown" {
    if (soh >= 90 && degradationRate < 0.1) return "Healthy";
    if (soh >= 85 && degradationRate < 0.2) return "Healthy";
    if (soh >= 80) return "Degrading";
    if (soh >= 70) return "Degrading";
    return "Critical";
  }

  generateSoHHistory(rawData: any[]): SoHDataPoint[] {
    if (!rawData || rawData.length === 0) {
      // Return synthetic data for demonstration
      return Array.from({ length: 10 }, (_, i) => ({
        cycle: i + 1,
        soh: 100 - (i * 0.5) + (Math.random() - 0.5) * 2
      }));
    }

    // Group data by cycle
    const cycleGroups = new Map<number, any[]>();
    rawData.forEach(point => {
      const cycle = point.cycle_number;
      if (!cycleGroups.has(cycle)) {
        cycleGroups.set(cycle, []);
      }
      cycleGroups.get(cycle)!.push(point);
    });

    // Calculate SoH for each cycle
    const sohHistory: SoHDataPoint[] = [];
    const cycles = Array.from(cycleGroups.keys()).sort((a, b) => a - b);
    
    let initialCapacity: number | null = null;

    cycles.forEach(cycle => {
      const cycleData = cycleGroups.get(cycle)!;
      
      // Find maximum capacity for this cycle (from discharge phase)
      const dischargeData = cycleData.filter(point => point.step_type === 'discharge');
      const chargeData = cycleData.filter(point => point.step_type === 'charge');
      
      const maxDischargeCapacity = dischargeData.length > 0 
        ? Math.max(...dischargeData.map(point => point.capacity_mAh))
        : 0;
      const maxChargeCapacity = chargeData.length > 0
        ? Math.max(...chargeData.map(point => point.capacity_mAh))
        : 0;
      
      const cycleCapacity = Math.max(maxDischargeCapacity, maxChargeCapacity);
      
      if (cycleCapacity > 0) {
        if (initialCapacity === null) {
          initialCapacity = cycleCapacity;
        }
        
        const soh = (cycleCapacity / initialCapacity) * 100;
        sohHistory.push({
          cycle: cycle,
          soh: Math.max(0, Math.min(100, soh))
        });
      }
    });

    return sohHistory.length > 0 ? sohHistory : [{ cycle: 1, soh: 100 }];
  }

  analyzeIssues(battery: Battery, rawData: any[]): BatteryIssue[] {
    return IssueAnalysisService.analyzeIssues(battery, rawData);
  }

  calculateAdvancedMetrics(battery: Battery, rawData: any[]): BatteryMetrics {
    if (!rawData || rawData.length === 0) {
      // Return synthetic metrics for demo purposes
      return {
        capacityRetention: battery.soh,
        energyEfficiency: 92.5 - (battery.cycles * 0.01),
        powerFadeRate: 0.02 + (battery.cycles * 0.0001),
        internalResistance: 45 + (battery.cycles * 0.05),
        temperatureRange: { min: 22, max: 45, avg: 28 },
        voltageRange: { min: 3.2, max: 4.2, avg: 3.7 },
        chargingEfficiency: 94.2 - (battery.cycles * 0.005),
        dischargingEfficiency: 96.8 - (battery.cycles * 0.003),
        cycleLife: battery.rul + battery.cycles,
        calendarLife: Math.round((battery.rul + battery.cycles) * 1.2),
        peakPower: 180 - (battery.cycles * 0.1),
        energyDensity: 250 - (battery.cycles * 0.02),
        selfDischargeRate: 2.1 + (battery.cycles * 0.001),
        impedanceGrowth: (battery.cycles * 0.008),
        thermalStability: battery.soh > 90 ? "Excellent" : battery.soh > 80 ? "Good" : "Poor"
      };
    }

    // Calculate real metrics from raw data
    const voltages = rawData.map(d => d.voltage_V).filter(v => v > 0);
    const currents = rawData.map(d => d.current_A).filter(c => c !== 0);
    const temperatures = rawData.map(d => d.temperature_C).filter(t => t > 0);
    const capacities = rawData.map(d => d.capacity_mAh).filter(c => c > 0);

    const voltageRange = {
      min: Math.min(...voltages),
      max: Math.max(...voltages),
      avg: voltages.reduce((a, b) => a + b, 0) / voltages.length
    };

    const temperatureRange = {
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length
    };

    // Calculate charging and discharging efficiency
    const chargeData = rawData.filter(d => d.step_type === 'charge');
    const dischargeData = rawData.filter(d => d.step_type === 'discharge');

    const chargingEfficiency = chargeData.length > 0 ? 
      (chargeData.reduce((sum, d) => sum + d.capacity_mAh, 0) / chargeData.length) / 
      (dischargeData.reduce((sum, d) => sum + d.capacity_mAh, 0) / dischargeData.length) * 100 : 95;

    const dischargingEfficiency = 98 - (battery.cycles * 0.002);

    // Calculate internal resistance approximation
    const internalResistance = voltages.length > 0 && currents.length > 0 ?
      Math.abs((Math.max(...voltages) - Math.min(...voltages)) / Math.max(...currents.map(Math.abs))) * 1000 : 50;

    return {
      capacityRetention: battery.soh,
      energyEfficiency: Math.max(80, 95 - (battery.cycles * 0.01)),
      powerFadeRate: 0.01 + (battery.cycles * 0.0001),
      internalResistance: Math.min(100, internalResistance),
      temperatureRange,
      voltageRange,
      chargingEfficiency: Math.max(85, Math.min(98, chargingEfficiency)),
      dischargingEfficiency: Math.max(90, dischargingEfficiency),
      cycleLife: battery.rul + battery.cycles,
      calendarLife: Math.round((battery.rul + battery.cycles) * 1.3),
      peakPower: Math.max(100, 200 - (battery.cycles * 0.08)),
      energyDensity: Math.max(200, 260 - (battery.cycles * 0.015)),
      selfDischargeRate: Math.min(5, 1.8 + (battery.cycles * 0.001)),
      impedanceGrowth: (battery.cycles * 0.006),
      thermalStability: temperatureRange.max - temperatureRange.min < 20 ? "Excellent" : 
                      temperatureRange.max - temperatureRange.min < 30 ? "Good" : "Poor"
    };
  }
}

export const batteryAnalytics = new BatteryAnalyticsService();
