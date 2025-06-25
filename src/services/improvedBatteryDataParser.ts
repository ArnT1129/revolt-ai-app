
import { Battery } from '@/types';

interface ParsedData {
  batteries: Battery[];
  errors: string[];
}

interface RawBatteryData {
  id?: string;
  batteryId?: string;
  battery_id?: string;
  soh?: number;
  soh_percent?: number;
  state_of_health?: number;
  rul?: number;
  remaining_useful_life?: number;
  cycles?: number;
  cycle_count?: number;
  total_cycles?: number;
  chemistry?: string;
  battery_chemistry?: string;
  grade?: string;
  battery_grade?: string;
  status?: string;
  battery_status?: string;
  voltage?: number;
  current?: number;
  temperature?: number;
  capacity?: number;
  time?: number;
  timestamp?: string;
  step?: string;
  step_type?: string;
  [key: string]: any;
}

export class ImprovedBatteryDataParser {
  private static readonly CHUNK_SIZE = 10000; // Process 10k rows at a time
  private static readonly MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit

  static async parseFile(file: File): Promise<ParsedData> {
    console.log(`Starting to parse file: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        batteries: [],
        errors: [`File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`]
      };
    }

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      switch (extension) {
        case 'csv':
          return await this.parseCSV(file);
        case 'xlsx':
        case 'xls':
          return await this.parseExcel(file);
        case 'json':
          return await this.parseJSON(file);
        default:
          // Try to auto-detect format
          return await this.autoDetectAndParse(file);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      return {
        batteries: [],
        errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private static async parseCSV(file: File): Promise<ParsedData> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { batteries: [], errors: ['Empty file'] };
    }

    const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    console.log('CSV Headers detected:', headers);

    const batteries: Battery[] = [];
    const errors: string[] = [];
    const batteryMap = new Map<string, RawBatteryData[]>();

    // Process in chunks to handle large files
    for (let i = 1; i < lines.length; i += this.CHUNK_SIZE) {
      const chunk = lines.slice(i, Math.min(i + this.CHUNK_SIZE, lines.length));
      
      for (let j = 0; j < chunk.length; j++) {
        const line = chunk[j].trim();
        if (!line) continue;

        try {
          const values = this.parseCSVLine(line);
          const rowData: RawBatteryData = {};
          
          headers.forEach((header, index) => {
            if (values[index] !== undefined) {
              rowData[header] = this.parseValue(values[index]);
            }
          });

          const batteryId = this.extractBatteryId(rowData);
          if (batteryId) {
            if (!batteryMap.has(batteryId)) {
              batteryMap.set(batteryId, []);
            }
            batteryMap.get(batteryId)!.push(rowData);
          }
        } catch (error) {
          errors.push(`Error parsing line ${i + j + 1}: ${error}`);
        }
      }

      // Show progress for large files
      if (lines.length > 50000) {
        console.log(`Processed ${Math.min(i + this.CHUNK_SIZE, lines.length)} of ${lines.length} lines`);
      }
    }

    // Convert grouped data to batteries
    for (const [batteryId, dataPoints] of batteryMap) {
      try {
        const battery = this.createBatteryFromDataPoints(batteryId, dataPoints);
        if (battery) {
          batteries.push(battery);
        }
      } catch (error) {
        errors.push(`Error creating battery ${batteryId}: ${error}`);
      }
    }

    console.log(`Parsed ${batteries.length} batteries with ${errors.length} errors`);
    return { batteries, errors };
  }

  private static async parseJSON(file: File): Promise<ParsedData> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    const batteries: Battery[] = [];
    const errors: string[] = [];

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        try {
          const battery = this.createBatteryFromObject(data[i]);
          if (battery) batteries.push(battery);
        } catch (error) {
          errors.push(`Error parsing item ${i}: ${error}`);
        }
      }
    } else if (typeof data === 'object') {
      try {
        const battery = this.createBatteryFromObject(data);
        if (battery) batteries.push(battery);
      } catch (error) {
        errors.push(`Error parsing object: ${error}`);
      }
    }

    return { batteries, errors };
  }

  private static async parseExcel(file: File): Promise<ParsedData> {
    // For now, return an error for Excel files
    // In a real implementation, you'd use a library like xlsx
    return {
      batteries: [],
      errors: ['Excel parsing not yet implemented. Please convert to CSV format.']
    };
  }

  private static async autoDetectAndParse(file: File): Promise<ParsedData> {
    const text = await file.text();
    
    // Try to detect if it's JSON
    try {
      JSON.parse(text);
      return await this.parseJSON(file);
    } catch {
      // Not JSON, try CSV
      return await this.parseCSV(file);
    }
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static parseValue(value: string): any {
    value = value.trim();
    
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Try to parse as number
    if (!isNaN(Number(value)) && value !== '') {
      return Number(value);
    }
    
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    return value;
  }

  private static extractBatteryId(data: RawBatteryData): string | null {
    // Try different possible battery ID fields
    const idFields = ['id', 'batteryId', 'battery_id', 'battery_identifier', 'cell_id', 'unit_id'];
    
    for (const field of idFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field] as string;
      }
    }

    // If no explicit ID, create one from available data
    if (data.timestamp || data.time) {
      return `BATTERY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    return null;
  }

  private static createBatteryFromDataPoints(batteryId: string, dataPoints: RawBatteryData[]): Battery | null {
    if (dataPoints.length === 0) return null;

    // Aggregate data from all points
    const firstPoint = dataPoints[0];
    const lastPoint = dataPoints[dataPoints.length - 1];

    // Calculate SoH from capacity data if available
    let soh = this.extractValue(dataPoints, ['soh', 'soh_percent', 'state_of_health']);
    if (!soh && dataPoints.some(p => p.capacity)) {
      const capacities = dataPoints.filter(p => p.capacity).map(p => p.capacity as number);
      if (capacities.length > 1) {
        const initialCapacity = Math.max(...capacities);
        const currentCapacity = capacities[capacities.length - 1];
        soh = (currentCapacity / initialCapacity) * 100;
      }
    }

    // Calculate cycles
    let cycles = this.extractValue(dataPoints, ['cycles', 'cycle_count', 'total_cycles']);
    if (!cycles && dataPoints.length > 0) {
      // Estimate from data points
      cycles = Math.floor(dataPoints.length / 100); // Rough estimate
    }

    // Calculate RUL (Remaining Useful Life)
    let rul = this.extractValue(dataPoints, ['rul', 'remaining_useful_life']);
    if (!rul && soh && cycles) {
      // Simple RUL estimation based on SoH decline
      const sohDeclineRate = (100 - soh) / cycles;
      rul = Math.max(0, Math.floor((soh - 70) / Math.max(sohDeclineRate, 0.01)));
    }

    // Determine chemistry
    let chemistry = this.extractValue(dataPoints, ['chemistry', 'battery_chemistry']) as 'LFP' | 'NMC';
    if (!chemistry) {
      // Try to infer from voltage patterns
      const voltages = dataPoints.filter(p => p.voltage).map(p => p.voltage as number);
      if (voltages.length > 0) {
        const maxVoltage = Math.max(...voltages);
        chemistry = maxVoltage > 4.0 ? 'NMC' : 'LFP';
      } else {
        chemistry = 'NMC'; // Default
      }
    }

    // Determine status and grade
    let status: 'Healthy' | 'Degrading' | 'Critical' | 'Unknown' = 'Unknown';
    let grade: 'A' | 'B' | 'C' | 'D' = 'D';

    if (soh !== undefined) {
      if (soh >= 95) {
        status = 'Healthy';
        grade = 'A';
      } else if (soh >= 85) {
        status = soh >= 90 ? 'Healthy' : 'Degrading';
        grade = 'B';
      } else if (soh >= 70) {
        status = 'Degrading';
        grade = 'C';
      } else {
        status = 'Critical';
        grade = 'D';
      }
    }

    // Create SoH history from data points
    const sohHistory = dataPoints
      .filter(p => p.soh || p.soh_percent || p.state_of_health)
      .map((p, index) => ({
        cycle: index * 10,
        soh: p.soh || p.soh_percent || p.state_of_health || soh || 0
      }))
      .slice(0, 50); // Limit to 50 points for performance

    return {
      id: batteryId,
      grade,
      status,
      soh: soh || 50,
      rul: rul || 0,
      cycles: cycles || 0,
      chemistry,
      uploadDate: new Date().toISOString().split('T')[0],
      sohHistory: sohHistory.length > 0 ? sohHistory : [{ cycle: 0, soh: soh || 50 }],
      issues: status === 'Critical' ? [
        { type: 'Performance', description: 'Low State of Health detected', severity: 'Critical' }
      ] : [],
      rawData: {
        dataPoints: dataPoints.length,
        firstTimestamp: firstPoint.timestamp || firstPoint.time,
        lastTimestamp: lastPoint.timestamp || lastPoint.time,
        temperatureRange: this.getRange(dataPoints, 'temperature'),
        voltageRange: this.getRange(dataPoints, 'voltage'),
        currentRange: this.getRange(dataPoints, 'current')
      },
      notes: `Parsed from ${dataPoints.length} data points. Auto-generated analysis.`
    };
  }

  private static createBatteryFromObject(obj: any): Battery | null {
    if (!obj || typeof obj !== 'object') return null;

    const batteryId = obj.id || obj.batteryId || obj.battery_id || `GEN_${Date.now()}`;
    
    return {
      id: batteryId,
      grade: obj.grade || 'C',
      status: obj.status || 'Unknown',
      soh: obj.soh || obj.soh_percent || 50,
      rul: obj.rul || obj.remaining_useful_life || 0,
      cycles: obj.cycles || obj.cycle_count || 0,
      chemistry: obj.chemistry || 'NMC',
      uploadDate: new Date().toISOString().split('T')[0],
      sohHistory: obj.sohHistory || [{ cycle: 0, soh: obj.soh || 50 }],
      issues: obj.issues || [],
      rawData: obj.rawData || obj,
      notes: obj.notes || 'Imported from JSON data'
    };
  }

  private static extractValue(dataPoints: RawBatteryData[], fields: string[]): any {
    for (const point of dataPoints) {
      for (const field of fields) {
        if (point[field] !== undefined && point[field] !== null) {
          return point[field];
        }
      }
    }
    return undefined;
  }

  private static getRange(dataPoints: RawBatteryData[], field: string): { min: number; max: number } | undefined {
    const values = dataPoints
      .filter(p => p[field] !== undefined && typeof p[field] === 'number')
      .map(p => p[field] as number);
    
    if (values.length === 0) return undefined;
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}
