
interface ParsedBatteryData {
  cycle_number: number;
  step_index: number;
  step_type: string;
  voltage_V: number;
  current_A: number;
  capacity_mAh: number;
  energy_Wh?: number;
  timestamp?: string;
  internal_resistance_mOhm?: number;
}

interface ParsedMetadata {
  equipment: string;
  chemistry: string;
  filename: string;
  totalCycles: number;
  warnings: string[];
}

interface ParseResult {
  data: ParsedBatteryData[];
  metadata: ParsedMetadata;
}

export class BatteryDataParser {
  private static CYCLE_PATTERNS = [
    /cycle/i, /cyc/i, /loop/i, /count/i
  ];

  private static VOLTAGE_PATTERNS = [
    /voltage/i, /volt/i, /^v$/i, /v_/i, /potential/i
  ];

  private static CURRENT_PATTERNS = [
    /current/i, /curr/i, /^i$/i, /i_/i, /amp/i
  ];

  private static CAPACITY_PATTERNS = [
    /capacity/i, /cap/i, /^q$/i, /q_/i, /charge/i, /ah/i, /mah/i
  ];

  private static STEP_PATTERNS = [
    /step/i, /stage/i, /phase/i, /mode/i
  ];

  static async parseFile(file: File): Promise<ParseResult> {
    const warnings: string[] = [];
    let rawData: any[] = [];
    
    try {
      if (file.name.endsWith('.csv')) {
        rawData = await this.parseCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        warnings.push('XLSX parsing not fully implemented - treating as CSV');
        rawData = await this.parseCSV(file);
      } else {
        throw new Error(`Unsupported file format: ${file.name}`);
      }

      const columnMapping = this.detectColumns(rawData[0] || {});
      const cleanedData = this.cleanAndNormalizeData(rawData, columnMapping);
      const metadata = this.extractMetadata(file, cleanedData, warnings);

      return {
        data: cleanedData,
        metadata
      };
    } catch (error) {
      warnings.push(`Parse error: ${error}`);
      return {
        data: [],
        metadata: {
          equipment: 'Unknown',
          chemistry: 'Unknown',
          filename: file.name,
          totalCycles: 0,
          warnings
        }
      };
    }
  }

  private static async parseCSV(file: File): Promise<any[]> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  }

  private static detectColumns(sampleRow: any): Record<string, string> {
    const mapping: Record<string, string> = {};
    const headers = Object.keys(sampleRow);

    // Detect cycle column
    const cycleCol = headers.find(h => 
      this.CYCLE_PATTERNS.some(pattern => pattern.test(h))
    );
    if (cycleCol) mapping.cycle_number = cycleCol;

    // Detect voltage column
    const voltageCol = headers.find(h => 
      this.VOLTAGE_PATTERNS.some(pattern => pattern.test(h))
    );
    if (voltageCol) mapping.voltage_V = voltageCol;

    // Detect current column
    const currentCol = headers.find(h => 
      this.CURRENT_PATTERNS.some(pattern => pattern.test(h))
    );
    if (currentCol) mapping.current_A = currentCol;

    // Detect capacity column
    const capacityCol = headers.find(h => 
      this.CAPACITY_PATTERNS.some(pattern => pattern.test(h))
    );
    if (capacityCol) mapping.capacity_mAh = capacityCol;

    // Detect step column
    const stepCol = headers.find(h => 
      this.STEP_PATTERNS.some(pattern => pattern.test(h))
    );
    if (stepCol) mapping.step_index = stepCol;

    return mapping;
  }

  private static cleanAndNormalizeData(rawData: any[], mapping: Record<string, string>): ParsedBatteryData[] {
    return rawData.map((row, index) => {
      const cleaned: ParsedBatteryData = {
        cycle_number: this.parseNumber(row[mapping.cycle_number] || index + 1),
        step_index: this.parseNumber(row[mapping.step_index] || 1),
        step_type: this.normalizeStepType(row[mapping.step_index] || 'unknown'),
        voltage_V: this.parseNumber(row[mapping.voltage_V] || 0),
        current_A: this.normalizeCurrentToAmps(row[mapping.current_A] || 0),
        capacity_mAh: this.normalizeCapacityToMAh(row[mapping.capacity_mAh] || 0),
      };

      return cleaned;
    }).filter(row => row.voltage_V > 0); // Filter out invalid rows
  }

  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }

  private static normalizeCurrentToAmps(value: any): number {
    const num = this.parseNumber(value);
    // If value is very large, assume it's in mA
    return Math.abs(num) > 10 ? num / 1000 : num;
  }

  private static normalizeCapacityToMAh(value: any): number {
    const num = this.parseNumber(value);
    // If value is very small, assume it's in Ah
    return num < 10 ? num * 1000 : num;
  }

  private static normalizeStepType(value: any): string {
    const str = String(value).toLowerCase();
    if (str.includes('charge') || str.includes('chg')) return 'charge';
    if (str.includes('discharge') || str.includes('dchg')) return 'discharge';
    if (str.includes('rest') || str.includes('pause')) return 'rest';
    return 'unknown';
  }

  private static extractMetadata(file: File, data: ParsedBatteryData[], warnings: string[]): ParsedMetadata {
    const cycles = new Set(data.map(d => d.cycle_number));
    
    // Try to detect equipment from filename
    let equipment = 'Unknown';
    if (file.name.toLowerCase().includes('maccor')) equipment = 'Maccor';
    else if (file.name.toLowerCase().includes('arbin')) equipment = 'Arbin';
    else if (file.name.toLowerCase().includes('neware')) equipment = 'Neware';

    // Try to detect chemistry from voltage ranges
    let chemistry = 'Unknown';
    const maxVoltage = Math.max(...data.map(d => d.voltage_V));
    if (maxVoltage > 4.1 && maxVoltage < 4.3) chemistry = 'NMC';
    else if (maxVoltage > 3.5 && maxVoltage < 3.8) chemistry = 'LFP';

    return {
      equipment,
      chemistry,
      filename: file.name,
      totalCycles: cycles.size,
      warnings
    };
  }
}
