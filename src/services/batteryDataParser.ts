
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
    /cycle/i, /cyc/i, /loop/i, /count/i, /nummer/i, /num/i, /^c$/i, /c_/i
  ];

  private static VOLTAGE_PATTERNS = [
    /voltage/i, /volt/i, /^v$/i, /v_/i, /potential/i, /spannung/i, /tension/i
  ];

  private static CURRENT_PATTERNS = [
    /current/i, /curr/i, /^i$/i, /i_/i, /amp/i, /strom/i, /courant/i
  ];

  private static CAPACITY_PATTERNS = [
    /capacity/i, /cap/i, /^q$/i, /q_/i, /charge/i, /ah/i, /mah/i, /kapazit/i
  ];

  private static STEP_PATTERNS = [
    /step/i, /stage/i, /phase/i, /mode/i, /schritt/i, /etape/i
  ];

  static async parseFile(file: File): Promise<ParseResult> {
    console.log(`Starting to parse file: ${file.name}`);
    const warnings: string[] = [];
    let rawData: any[] = [];
    
    try {
      // Handle different file types
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        rawData = await this.parseCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For now, treat as CSV - in production you'd use a library like xlsx
        rawData = await this.parseCSV(file);
        warnings.push('XLSX file treated as CSV - some formatting may be lost');
      } else if (file.name.endsWith('.json')) {
        rawData = await this.parseJSON(file);
      } else {
        // Try to parse as text anyway
        rawData = await this.parseCSV(file);
        warnings.push(`Unknown file format ${file.name} - attempting CSV parsing`);
      }

      if (rawData.length === 0) {
        throw new Error('No data found in file');
      }

      console.log(`Parsed ${rawData.length} raw rows`);

      // Auto-detect column mapping
      const columnMapping = this.detectColumns(rawData[0] || {});
      console.log('Detected column mapping:', columnMapping);

      // Clean and normalize data
      const cleanedData = this.cleanAndNormalizeData(rawData, columnMapping, warnings);
      console.log(`Cleaned data to ${cleanedData.length} valid rows`);

      // Extract metadata
      const metadata = this.extractMetadata(file, cleanedData, warnings);

      return {
        data: cleanedData,
        metadata
      };
    } catch (error) {
      console.error('Parse error:', error);
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
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) return [];
    
    // Try different delimiters
    let delimiter = ',';
    const firstLine = lines[0];
    if (firstLine.split(';').length > firstLine.split(',').length) {
      delimiter = ';';
    } else if (firstLine.split('\t').length > firstLine.split(',').length) {
      delimiter = '\t';
    }

    const headers = this.parseCSVLine(lines[0], delimiter).map(h => h.trim().replace(/['"]/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      if (values.length === 0) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Skip empty rows
      if (Object.values(row).some(val => val && String(val).trim())) {
        data.push(row);
      }
    }
    
    return data;
  }

  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static async parseJSON(file: File): Promise<any[]> {
    const text = await file.text();
    const jsonData = JSON.parse(text);
    
    if (Array.isArray(jsonData)) {
      return jsonData;
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      return jsonData.data;
    } else {
      return [jsonData];
    }
  }

  private static detectColumns(sampleRow: any): Record<string, string> {
    const mapping: Record<string, string> = {};
    const headers = Object.keys(sampleRow).map(h => h.toLowerCase());

    // More comprehensive column detection
    for (const header of Object.keys(sampleRow)) {
      const lowerHeader = header.toLowerCase();
      
      // Detect cycle column
      if (this.CYCLE_PATTERNS.some(pattern => pattern.test(lowerHeader)) && !mapping.cycle_number) {
        mapping.cycle_number = header;
      }
      
      // Detect voltage column
      if (this.VOLTAGE_PATTERNS.some(pattern => pattern.test(lowerHeader)) && !mapping.voltage_V) {
        mapping.voltage_V = header;
      }
      
      // Detect current column
      if (this.CURRENT_PATTERNS.some(pattern => pattern.test(lowerHeader)) && !mapping.current_A) {
        mapping.current_A = header;
      }
      
      // Detect capacity column
      if (this.CAPACITY_PATTERNS.some(pattern => pattern.test(lowerHeader)) && !mapping.capacity_mAh) {
        mapping.capacity_mAh = header;
      }
      
      // Detect step column
      if (this.STEP_PATTERNS.some(pattern => pattern.test(lowerHeader)) && !mapping.step_index) {
        mapping.step_index = header;
      }
    }

    return mapping;
  }

  private static cleanAndNormalizeData(rawData: any[], mapping: Record<string, string>, warnings: string[]): ParsedBatteryData[] {
    const cleanedData: ParsedBatteryData[] = [];
    let cycleCounter = 1;
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        const voltage = this.parseNumber(row[mapping.voltage_V]);
        const current = this.parseNumber(row[mapping.current_A]);
        const capacity = this.parseNumber(row[mapping.capacity_mAh]);
        
        // Skip rows with no meaningful data
        if (voltage === 0 && current === 0 && capacity === 0) continue;
        
        const cleaned: ParsedBatteryData = {
          cycle_number: this.parseNumber(row[mapping.cycle_number]) || cycleCounter,
          step_index: this.parseNumber(row[mapping.step_index]) || 1,
          step_type: this.normalizeStepType(row[mapping.step_index] || row[mapping.step_type] || 'unknown'),
          voltage_V: voltage,
          current_A: this.normalizeCurrentToAmps(current),
          capacity_mAh: this.normalizeCapacityToMAh(capacity),
        };

        // Update cycle counter for next row if needed
        if (cleaned.cycle_number > cycleCounter) {
          cycleCounter = cleaned.cycle_number;
        }

        cleanedData.push(cleaned);
      } catch (error) {
        warnings.push(`Skipped invalid row ${i + 1}: ${error}`);
      }
    }

    return cleanedData;
  }

  private static parseNumber(value: any): number {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (value === null || value === undefined || value === '') return 0;
    
    const str = String(value).replace(/[^\d.-]/g, '');
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  }

  private static normalizeCurrentToAmps(value: any): number {
    const num = Math.abs(this.parseNumber(value));
    // If value is very large, assume it's in mA
    return num > 10 ? num / 1000 : num;
  }

  private static normalizeCapacityToMAh(value: any): number {
    const num = this.parseNumber(value);
    // If value is very small, assume it's in Ah
    return Math.abs(num) < 10 ? Math.abs(num) * 1000 : Math.abs(num);
  }

  private static normalizeStepType(value: any): string {
    const str = String(value).toLowerCase();
    if (str.includes('charge') || str.includes('chg') || str.includes('cc') || str.includes('cv')) return 'charge';
    if (str.includes('discharge') || str.includes('dchg') || str.includes('disch')) return 'discharge';
    if (str.includes('rest') || str.includes('pause') || str.includes('relax')) return 'rest';
    return 'unknown';
  }

  private static extractMetadata(file: File, data: ParsedBatteryData[], warnings: string[]): ParsedMetadata {
    const cycles = new Set(data.map(d => d.cycle_number));
    
    // Try to detect equipment from filename
    let equipment = 'Unknown';
    const filename = file.name.toLowerCase();
    if (filename.includes('maccor')) equipment = 'Maccor';
    else if (filename.includes('arbin')) equipment = 'Arbin';
    else if (filename.includes('neware')) equipment = 'Neware';
    else if (filename.includes('biologic')) equipment = 'BioLogic';

    // Try to detect chemistry from voltage ranges
    let chemistry = 'Unknown';
    if (data.length > 0) {
      const maxVoltage = Math.max(...data.map(d => d.voltage_V));
      const minVoltage = Math.min(...data.filter(d => d.voltage_V > 0).map(d => d.voltage_V));
      
      if (maxVoltage > 4.1 && maxVoltage < 4.3) chemistry = 'NMC';
      else if (maxVoltage > 3.5 && maxVoltage < 3.8) chemistry = 'LFP';
      else if (maxVoltage > 2.0 && maxVoltage < 2.8) chemistry = 'LTO';
    }

    return {
      equipment,
      chemistry,
      filename: file.name,
      totalCycles: cycles.size,
      warnings
    };
  }
}
