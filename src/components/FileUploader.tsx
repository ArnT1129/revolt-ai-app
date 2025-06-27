
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImprovedBatteryDataParser } from '@/services/improvedBatteryDataParser';
import { batteryService } from '@/services/batteryService';
import { Battery } from '@/types';

interface UploadResult {
  fileName: string;
  batteriesCount: number;
  errors: string[];
  status: 'success' | 'error' | 'partial';
}

export default function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);

  const convertToCompatibleBattery = (parsedData: any): Battery => {
    // Convert the parser's metrics format to match BatteryMetrics interface
    const compatibleMetrics = {
      capacityRetention: parsedData.soh,
      energyEfficiency: parsedData.metrics.coulombicEfficiency || 95,
      powerFadeRate: 0.02,
      internalResistance: parsedData.metrics.internalResistance || 50,
      temperatureRange: parsedData.metrics.temperatureProfile || { min: 20, max: 35, avg: 25 },
      voltageRange: { min: 2.5, max: 4.2, avg: 3.7 },
      chargingEfficiency: 94,
      dischargingEfficiency: 96,
      cycleLife: parsedData.rul + parsedData.cycles,
      calendarLife: Math.round((parsedData.rul + parsedData.cycles) * 1.2),
      peakPower: 180,
      energyDensity: parsedData.metrics.maxDischargeCapacity / 10 || 250,
      selfDischargeRate: 2.1,
      impedanceGrowth: parsedData.cycles * 0.006,
      thermalStability: parsedData.soh > 90 ? "Excellent" : parsedData.soh > 80 ? "Good" : "Poor"
    };

    return {
      id: parsedData.id,
      grade: parsedData.grade,
      status: parsedData.status,
      soh: parsedData.soh,
      rul: parsedData.rul,
      cycles: parsedData.cycles,
      chemistry: parsedData.chemistry,
      uploadDate: parsedData.uploadDate,
      sohHistory: parsedData.sohHistory,
      issues: parsedData.issues,
      rawData: parsedData.rawData,
      metrics: compatibleMetrics,
      notes: parsedData.notes
    };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setResults([]);

    const totalFiles = acceptedFiles.length;
    let processedFiles = 0;

    for (const file of acceptedFiles) {
      try {
        console.log(`Processing: ${file.name}`);
        
        const { batteries, errors } = await ImprovedBatteryDataParser.parseFile(file);
        
        let successCount = 0;
        const uploadErrors: string[] = [...errors];

        if (batteries.length > 0) {
          for (const parsedBattery of batteries) {
            try {
              const compatibleBattery = convertToCompatibleBattery(parsedBattery);
              const success = await batteryService.addBattery(compatibleBattery);
              if (success) {
                successCount++;
              } else {
                uploadErrors.push(`Failed to save battery ${parsedBattery.id}`);
              }
            } catch (error) {
              uploadErrors.push(`Error saving battery: ${error}`);
            }
          }
        }

        let status: 'success' | 'error' | 'partial' = 'error';
        if (successCount === batteries.length && uploadErrors.length === 0) {
          status = 'success';
        } else if (successCount > 0) {
          status = 'partial';
        }

        setResults(prev => [...prev, {
          fileName: file.name,
          batteriesCount: successCount,
          errors: uploadErrors,
          status
        }]);

        if (status === 'success') {
          toast({
            title: "File Processed",
            description: `${successCount} batteries uploaded from ${file.name}`,
          });
        }

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        setResults(prev => [...prev, {
          fileName: file.name,
          batteriesCount: 0,
          errors: [`Processing failed: ${error}`],
          status: 'error'
        }]);
      }

      processedFiles++;
      setUploadProgress((processedFiles / totalFiles) * 100);
    }

    window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
    setUploading(false);
    
    const totalSuccess = results.reduce((sum, r) => sum + r.batteriesCount, 0);
    if (totalSuccess > 0) {
      toast({
        title: "Upload Complete",
        description: `Successfully processed ${totalSuccess} batteries`,
      });
    }
  }, [results]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt']
    },
    maxSize: 500 * 1024 * 1024,
    disabled: uploading
  });

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-dashed border-2 border-slate-600 hover:border-slate-500 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'scale-105' : ''
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-blue-500/20 border border-blue-500/30">
                <Upload className="h-8 w-8 text-blue-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isDragActive ? 'Drop files here' : 'Upload Battery Data'}
                </h3>
                <p className="text-slate-400 mb-4">
                  {isDragActive 
                    ? 'Release to upload your files' 
                    : 'Drag & drop files or click to browse'
                  }
                </p>
                {!isDragActive && (
                  <Button variant="outline" className="glass-button" disabled={uploading}>
                    Choose Files
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {uploading && (
        <Card className="enhanced-card">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Processing Files...</span>
                <span className="text-slate-400 text-sm">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card className="enhanced-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-white">Results</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setResults([])}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-white">{result.fileName}</span>
                    </div>
                    
                    <p className="text-sm text-slate-300">
                      {result.batteriesCount > 0 
                        ? `${result.batteriesCount} batteries processed`
                        : 'Processing failed'
                      }
                    </p>
                    
                    {result.errors.length > 0 && (
                      <div className="mt-2 text-xs text-red-400">
                        {result.errors.slice(0, 2).map((error, i) => (
                          <div key={i}>• {error}</div>
                        ))}
                        {result.errors.length > 2 && (
                          <div>• ... and {result.errors.length - 2} more errors</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="enhanced-card">
        <CardContent className="p-6">
          <h4 className="font-medium text-white mb-3">Supported Formats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
            <div>
              <div className="font-medium text-slate-300 mb-1">File Types</div>
              <div>CSV, JSON, Excel, TXT</div>
            </div>
            <div>
              <div className="font-medium text-slate-300 mb-1">Equipment</div>
              <div>Maccor, Arbin, Neware, BioLogic</div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-300">
            Universal parser with comprehensive battery analysis
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
