import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { BatteryIssue } from '@/services/issueAnalysis';

export interface ParsedBatteryData {
  id: string;
  soh: number;
  rul: number;
  cycles: number;
  chemistry: 'LFP' | 'NMC';
  grade: 'A' | 'B' | 'C' | 'D';
  status: 'Healthy' | 'Degrading' | 'Critical' | 'Unknown';
  uploadDate: string; // Changed to string to match Battery interface
  sohHistory: Array<{ cycle: number; soh: number }>;
  issues: BatteryIssue[]; // Updated to use proper BatteryIssue type
  rawData: any[];
  notes?: string;
}

export interface ParseResult {
  batteries: ParsedBatteryData[];
  errors: string[];
}

interface RawDataPoint {
  cycle?: number;
  voltage?: number;
  current?: number;
  capacity?: number;
  temperature?: number;
  time?: number;
  soh?: number;
  [key: string]: any;
}

export class ImprovedBatteryDataParser {
  private static fieldMappings = {
    cycle: ['cycle', 'cycle_number', 'cycle_index', 'cyc_no', 'step_number'],
    voltage: ['voltage', 'volt', 'v', 'voltage_v', 'cell_voltage', 'terminal_voltage'],
    current: ['current', 'curr', 'i', 'current_a', 'amp', 'amperage'],
    capacity: ['capacity', 'cap', 'ah', 'mah', 'capacity_ah', 'capacity_mah', 'discharge_capacity'],
    temperature: ['temperature', 'temp', 'celsius', 'temp_c', 'temperature_c', 'cell_temp'],
    time: ['time', 'timestamp', 'elapsed_time', 'test_time', 'time_s', 'time_seconds'],
    soh: ['soh', 'state_of_health', 'health', 'capacity_retention', 'soh_percent']
  };

  static async parseFile(file: File): Promise<ParseResult> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let rawData: RawDataPoint[] = [];

      switch (fileExtension) {
        case 'csv':
        case 'txt':
          rawData = await this.parseCSV(file);
          break;
        case 'json':
          rawData = await this.parseJSON(file);
          break;
        case 'xlsx':
        case 'xls':
          rawData = await this.parseExcel(file);
          break;
        default:
          // Try CSV as fallback
          rawData = await this.parseCSV(file);
      }

      const batteryData = this.processBatteryData(rawData, file.name);
      
      return {
        batteries: [batteryData], // Return as array
        errors: []
      };
    } catch (error) {
      console.error('Error parsing file:', error);
      return {
        batteries: [],
        errors: [`Failed to parse file: ${error}`]
      };
    }
  }

  private static parseCSV(file: File): Promise<RawDataPoint[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing completed with errors:', results.errors);
          }
          resolve(results.data as RawDataPoint[]);
        },
        error: (error) => reject(error)
      });
    });
  }

  private static async parseJSON(file: File): Promise<RawDataPoint[]> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else {
      return [data];
    }
  }

  private static async parseExcel(file: File): Promise<RawDataPoint[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null
    });
    
    if (jsonData.length === 0) return [];
    
    const headers = jsonData[0] as string[];
    return jsonData.slice(1).map((row: any[]) => {
      const obj: RawDataPoint = {};
      headers.forEach((header, index) => {
        if (row[index] !== null && row[index] !== undefined) {
          obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
        }
      });
      return obj;
    });
  }

  private static mapField(data: RawDataPoint[], fieldType: keyof typeof this.fieldMappings): number[] {
    const possibleFields = this.fieldMappings[fieldType];
    const values: number[] = [];

    for (const item of data) {
      const keys = Object.keys(item).map(k => k.toLowerCase());
      
      for (const possibleField of possibleFields) {
        const matchingKey = keys.find(key => 
          key.includes(possibleField) || possibleField.includes(key)
        );
        
        if (matchingKey) {
          const originalKey = Object.keys(item).find(k => k.toLowerCase() === matchingKey);
          if (originalKey && typeof item[originalKey] === 'number' && !isNaN(item[originalKey])) {
            values.push(item[originalKey]);
            break;
          }
        }
      }
    }

    return values;
  }

  private static calculateSoH(capacityData: number[]): number {
    if (capacityData.length === 0) return 85; // Default fallback

    // Find initial capacity (usually the maximum early in the dataset)
    const initialCapacity = Math.max(...capacityData.slice(0, Math.min(capacityData.length, 50)));
    
    // Find current capacity (average of last 10% of data)
    const recentCount = Math.max(1, Math.floor(capacityData.length * 0.1));
    const recentCapacities = capacityData.slice(-recentCount);
    const currentCapacity = recentCapacities.reduce((sum, val) => sum + val, 0) / recentCapacities.length;

    const soh = (currentCapacity / initialCapacity) * 100;
    return Math.min(100, Math.max(0, soh));
  }

  private static calculateRUL(sohHistory: Array<{ cycle: number; soh: number }>): number {
    if (sohHistory.length < 3) return 500; // Default fallback

    // Simple linear regression to predict when SoH will reach 80%
    const recentData = sohHistory.slice(-Math.min(sohHistory.length, 20));
    
    if (recentData.length < 2) return 500;

    const n = recentData.length;
    const sumX = recentData.reduce((sum, point) => sum + point.cycle, 0);
    const sumY = recentData.reduce((sum, point) => sum + point.soh, 0);
    const sumXY = recentData.reduce((sum, point) => sum + point.cycle * point.soh, 0);
    const sumX2 = recentData.reduce((sum, point) => sum + point.cycle * point.cycle, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    if (slope >= 0) return 1000; // Not degrading, return high RUL

    // Calculate cycles until 80% SoH
    const targetSoH = 80;
    const currentCycle = recentData[recentData.length - 1].cycle;
    const cyclesTo80Percent = (targetSoH - intercept) / slope;
    
    return Math.max(0, Math.round(cyclesTo80Percent - currentCycle));
  }

  private static determineGrade(soh: number): 'A' | 'B' | 'C' | 'D' {
    if (soh >= 95) return 'A';
    if (soh >= 85) return 'B';
    if (soh >= 75) return 'C';
    return 'D';
  }

  private static determineStatus(soh: number): 'Healthy' | 'Degrading' | 'Critical' | 'Unknown' {
    if (soh >= 90) return 'Healthy';
    if (soh >= 80) return 'Degrading';
    if (soh >= 70) return 'Critical';
    return 'Critical';
  }

  private static detectChemistry(data: RawDataPoint[]): 'LFP' | 'NMC' {
    const voltageData = this.mapField(data, 'voltage');
    
    if (voltageData.length === 0) return 'NMC'; // Default

    const maxVoltage = Math.max(...voltageData);
    const avgVoltage = voltageData.reduce((sum, val) => sum + val, 0) / voltageData.length;

    // LFP typically has lower voltage range (2.5-3.65V), NMC higher (2.5-4.2V)
    if (maxVoltage < 3.8 && avgVoltage < 3.3) {
      return 'LFP';
    }
    return 'NMC';
  }

  private static generateSoHHistory(data: RawDataPoint[], finalSoH: number): Array<{ cycle: number; soh: number }> {
    const cycleData = this.mapField(data, 'cycle');
    const capacityData = this.mapField(data, 'capacity');
    
    if (cycleData.length === 0 || capacityData.length === 0) {
      // Generate synthetic history
      const maxCycles = Math.max(100, Math.floor(Math.random() * 2000));
      return Array.from({ length: 20 }, (_, i) => ({
        cycle: Math.floor((i / 19) * maxCycles),
        soh: 100 - ((100 - finalSoH) * (i / 19))
      }));
    }

    // Create history from actual data
    const history: Array<{ cycle: number; soh: number }> = [];
    const maxCapacity = Math.max(...capacityData);
    
    for (let i = 0; i < Math.min(cycleData.length, capacityData.length); i += Math.floor(cycleData.length / 50) || 1) {
      const soh = (capacityData[i] / maxCapacity) * 100;
      history.push({
        cycle: cycleData[i],
        soh: Math.min(100, Math.max(0, soh))
      });
    }

    return history.length > 0 ? history : [{ cycle: 0, soh: finalSoH }];
  }

  private static analyzeIssues(soh: number, rul: number, cycles: number): BatteryIssue[] {
    const issues: BatteryIssue[] = [];

    if (soh < 75) {
      issues.push({
        id: `issue-${Date.now()}-1`,
        category: 'Safety',
        title: 'Low State of Health',
        description: 'Low State of Health detected - battery approaching end of life',
        severity: 'Critical',
        cause: 'Battery degradation due to aging and cycling',
        recommendation: 'Replace battery soon to avoid safety risks',
        solution: 'Battery replacement recommended',
        resolved: false,
        affectedMetrics: ['soh']
      });
    }

    if (rul < 200) {
      issues.push({
        id: `issue-${Date.now()}-2`,
        category: 'Performance',
        title: 'Critical RUL',
        description: 'Remaining Useful Life is critically low',
        severity: 'Critical',
        cause: 'Advanced battery degradation',
        recommendation: 'Plan for immediate replacement',
        solution: 'Schedule battery replacement',
        resolved: false,
        affectedMetrics: ['rul']
      });
    }

    if (cycles > 2000) {
      issues.push({
        id: `issue-${Date.now()}-3`,
        category: 'Maintenance',
        title: 'High Cycle Count',
        description: 'High cycle count - monitor for accelerated degradation',
        severity: 'Warning',
        cause: 'Extensive battery usage over time',
        recommendation: 'Increase monitoring frequency',
        solution: 'Enhanced monitoring protocol',
        resolved: false,
        affectedMetrics: ['cycles']
      });
    }

    return issues;
  }

  private static processBatteryData(rawData: RawDataPoint[], fileName: string): ParsedBatteryData {
    // Extract key metrics from raw data
    const capacityData = this.mapField(rawData, 'capacity');
    const cycleData = this.mapField(rawData, 'cycle');
    
    // Calculate metrics
    const soh = this.calculateSoH(capacityData);
    const maxCycles = cycleData.length > 0 ? Math.max(...cycleData) : Math.floor(Math.random() * 2000);
    const sohHistory = this.generateSoHHistory(rawData, soh);
    const rul = this.calculateRUL(sohHistory);
    const chemistry = this.detectChemistry(rawData);
    const grade = this.determineGrade(soh);
    const status = this.determineStatus(soh);
    const issues = this.analyzeIssues(soh, rul, maxCycles);

    // Generate unique ID based on file name and timestamp
    const id = `BAT-${fileName.replace(/\.[^/.]+$/, "").toUpperCase()}-${Date.now()}`;

    return {
      id,
      soh: Math.round(soh * 10) / 10,
      rul,
      cycles: maxCycles,
      chemistry,
      grade,
      status,
      uploadDate: new Date().toISOString().split('T')[0], // Convert to string format
      sohHistory,
      issues,
      rawData: rawData.slice(0, 1000), // Limit stored raw data for performance
      notes: `Parsed from ${fileName} - ${rawData.length} data points processed`
    };
  }
}

export default ImprovedBatteryDataParser;
