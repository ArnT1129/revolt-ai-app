
import { BatteryDataParser } from './batteryDataParser';

export interface DataChunk {
  id: string;
  data: any[];
  startIndex: number;
  endIndex: number;
  processed: boolean;
}

export interface ProcessingProgress {
  totalSize: number;
  processedSize: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  estimatedTimeRemaining: number;
}

export interface StreamingResult {
  processedData: any[];
  metadata: any;
  progress: ProcessingProgress;
  warnings: string[];
}

export class LargeDatasetHandler {
  private readonly CHUNK_SIZE = 10000; // Process 10k rows at a time
  private readonly MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB max memory
  private readonly PROGRESS_CALLBACK_INTERVAL = 1000; // Update progress every 1000 rows

  async processLargeDataset(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void,
    onChunkComplete?: (chunk: DataChunk) => void
  ): Promise<StreamingResult> {
    console.log(`Starting large dataset processing for ${file.name} (${file.size} bytes)`);
    
    const startTime = Date.now();
    const warnings: string[] = [];
    
    if (file.size > 100 * 1024 * 1024) {
      warnings.push(`Large file detected (${Math.round(file.size / 1024 / 1024)}MB) - using streaming processing`);
    }

    try {
      // Use streaming approach for very large files
      if (file.size > 50 * 1024 * 1024) {
        return await this.streamProcessFile(file, onProgress, onChunkComplete, warnings);
      } else {
        // Use regular processing for smaller files
        return await this.regularProcessFile(file, onProgress, warnings);
      }
    } catch (error) {
      console.error('Large dataset processing error:', error);
      throw new Error(`Failed to process large dataset: ${error}`);
    }
  }

  private async streamProcessFile(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void,
    onChunkComplete?: (chunk: DataChunk) => void,
    warnings: string[] = []
  ): Promise<StreamingResult> {
    const reader = file.stream().getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let lineCount = 0;
    let processedData: any[] = [];
    let headers: string[] = [];
    let headerDetected = false;
    
    const totalSize = file.size;
    let processedSize = 0;
    let currentChunk = 0;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Update processed size
        processedSize += value.length;
        
        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          lineCount++;
          
          // Detect headers
          if (!headerDetected && this.looksLikeHeader(line)) {
            headers = this.parseCSVLine(line);
            headerDetected = true;
            continue;
          }
          
          // Skip if no headers detected yet
          if (!headerDetected) continue;
          
          // Parse data line
          const values = this.parseCSVLine(line);
          if (values.length === headers.length) {
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            processedData.push(row);
          }
          
          // Process chunk when it reaches chunk size
          if (processedData.length >= this.CHUNK_SIZE) {
            const chunk: DataChunk = {
              id: `chunk_${currentChunk}`,
              data: [...processedData],
              startIndex: currentChunk * this.CHUNK_SIZE,
              endIndex: currentChunk * this.CHUNK_SIZE + processedData.length,
              processed: true
            };
            
            onChunkComplete?.(chunk);
            currentChunk++;
            
            // Clear processed data to free memory
            processedData = [];
            
            // Force garbage collection hint
            if (global.gc) global.gc();
          }
          
          // Update progress
          if (lineCount % this.PROGRESS_CALLBACK_INTERVAL === 0) {
            const progress: ProcessingProgress = {
              totalSize,
              processedSize,
              percentage: (processedSize / totalSize) * 100,
              currentChunk,
              totalChunks: Math.ceil(totalSize / (this.CHUNK_SIZE * 100)), // Estimate
              estimatedTimeRemaining: this.estimateTimeRemaining(
                Date.now() - Date.now(),
                processedSize,
                totalSize
              )
            };
            onProgress?.(progress);
          }
        }
      }
      
      // Process remaining data in buffer
      if (buffer.trim() && headerDetected) {
        const values = this.parseCSVLine(buffer);
        if (values.length === headers.length) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          processedData.push(row);
        }
      }
      
      // Process final chunk
      if (processedData.length > 0) {
        const chunk: DataChunk = {
          id: `chunk_${currentChunk}`,
          data: [...processedData],
          startIndex: currentChunk * this.CHUNK_SIZE,
          endIndex: currentChunk * this.CHUNK_SIZE + processedData.length,
          processed: true
        };
        onChunkComplete?.(chunk);
      }
      
      // Generate metadata
      const metadata = {
        equipment: 'Unknown',
        chemistry: 'Unknown',
        filename: file.name,
        totalCycles: this.estimateCycles(processedData),
        warnings,
        fileSize: file.size,
        dataPoints: lineCount,
        processingTime: Date.now() - Date.now(),
        chunksProcessed: currentChunk + 1
      };
      
      const finalProgress: ProcessingProgress = {
        totalSize,
        processedSize: totalSize,
        percentage: 100,
        currentChunk: currentChunk + 1,
        totalChunks: currentChunk + 1,
        estimatedTimeRemaining: 0
      };
      
      return {
        processedData: [], // Data is processed in chunks
        metadata,
        progress: finalProgress,
        warnings
      };
      
    } finally {
      reader.releaseLock();
    }
  }

  private async regularProcessFile(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void,
    warnings: string[] = []
  ): Promise<StreamingResult> {
    // Use existing parser for smaller files
    const result = await BatteryDataParser.parseFile(file);
    
    const progress: ProcessingProgress = {
      totalSize: file.size,
      processedSize: file.size,
      percentage: 100,
      currentChunk: 1,
      totalChunks: 1,
      estimatedTimeRemaining: 0
    };
    
    onProgress?.(progress);
    
    return {
      processedData: result.data,
      metadata: result.metadata,
      progress,
      warnings: [...warnings, ...result.metadata.warnings]
    };
  }

  private looksLikeHeader(line: string): boolean {
    const fields = line.toLowerCase().split(',');
    const headerKeywords = ['cycle', 'voltage', 'current', 'capacity', 'time', 'step'];
    
    return fields.some(field => 
      headerKeywords.some(keyword => field.includes(keyword))
    );
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
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

  private estimateCycles(data: any[]): number {
    if (data.length === 0) return 0;
    
    const cycles = new Set();
    data.forEach(row => {
      if (row.cycle || row.cycle_number || row.Cycle) {
        cycles.add(row.cycle || row.cycle_number || row.Cycle);
      }
    });
    
    return cycles.size || Math.floor(data.length / 100);
  }

  private estimateTimeRemaining(elapsed: number, processed: number, total: number): number {
    if (processed === 0) return 0;
    const rate = processed / elapsed;
    const remaining = total - processed;
    return remaining / rate;
  }

  // Memory-efficient data processing utilities
  async processInBatches<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }

  // Virtual scrolling data provider
  createVirtualDataProvider(data: any[], chunkSize: number = 1000) {
    return {
      total: data.length,
      getChunk: (startIndex: number, endIndex: number) => {
        return data.slice(startIndex, Math.min(endIndex, data.length));
      },
      search: (query: string) => {
        return data.filter(item => 
          JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
        );
      }
    };
  }
}

export const largeDatasetHandler = new LargeDatasetHandler();
