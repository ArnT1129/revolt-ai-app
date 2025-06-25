
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImprovedBatteryDataParser } from '@/services/improvedBatteryDataParser';
import { batteryService } from '@/services/batteryService';

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setResults([]);

    const totalFiles = acceptedFiles.length;
    let processedFiles = 0;

    for (const file of acceptedFiles) {
      try {
        console.log(`Processing file: ${file.name}`);
        
        // Parse the file
        const { batteries, errors } = await ImprovedBatteryDataParser.parseFile(file);
        
        let successCount = 0;
        const uploadErrors: string[] = [...errors];

        // Upload batteries to database
        if (batteries.length > 0) {
          for (const battery of batteries) {
            try {
              const success = await batteryService.addBattery(battery);
              if (success) {
                successCount++;
              } else {
                uploadErrors.push(`Failed to save battery ${battery.id}`);
              }
            } catch (error) {
              uploadErrors.push(`Error saving battery ${battery.id}: ${error}`);
            }
          }
        }

        // Determine result status
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
            title: "File processed successfully",
            description: `${successCount} batteries uploaded from ${file.name}`,
          });
        } else if (status === 'partial') {
          toast({
            title: "File partially processed",
            description: `${successCount} of ${batteries.length} batteries uploaded from ${file.name}`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "File processing failed",
            description: `Failed to process ${file.name}`,
            variant: "destructive"
          });
        }

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setResults(prev => [...prev, {
          fileName: file.name,
          batteriesCount: 0,
          errors: [`Failed to process file: ${error}`],
          status: 'error'
        }]);
        
        toast({
          title: "File processing error",
          description: `Error processing ${file.name}: ${error}`,
          variant: "destructive"
        });
      }

      processedFiles++;
      setUploadProgress((processedFiles / totalFiles) * 100);
    }

    // Trigger data refresh
    window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
    
    setUploading(false);
    
    const totalSuccess = results.reduce((sum, r) => sum + r.batteriesCount, 0);
    if (totalSuccess > 0) {
      toast({
        title: "Upload completed",
        description: `Successfully uploaded ${totalSuccess} batteries total`,
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
    maxSize: 500 * 1024 * 1024, // 500MB limit
    disabled: uploading
  });

  const clearResults = () => {
    setResults([]);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
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
              
              {isDragActive ? (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop files here</h3>
                  <p className="text-slate-400">Release to upload your battery data files</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Upload Battery Data Files</h3>
                  <p className="text-slate-400 mb-4">
                    Drag & drop files here, or click to select files
                  </p>
                  <Button variant="outline" className="glass-button" disabled={uploading}>
                    Select Files
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Card className="enhanced-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Processing Files...</h4>
                <span className="text-sm text-slate-400">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {results.length > 0 && (
        <Card className="enhanced-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-white">Upload Results</h4>
              <Button variant="ghost" size="sm" onClick={clearResults}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex-shrink-0 mt-0.5">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : result.status === 'partial' ? (
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-white truncate">{result.fileName}</span>
                    </div>
                    
                    <p className="text-sm text-slate-300 mb-2">
                      {result.batteriesCount > 0 
                        ? `${result.batteriesCount} batteries uploaded successfully`
                        : 'No batteries uploaded'
                      }
                    </p>
                    
                    {result.errors.length > 0 && (
                      <div className="text-sm text-red-400">
                        <p className="font-medium mb-1">{result.errors.length} error(s):</p>
                        <ul className="list-disc list-inside space-y-1 max-h-24 overflow-y-auto">
                          {result.errors.slice(0, 5).map((error, i) => (
                            <li key={i} className="text-xs">{error}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li className="text-xs">... and {result.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Total batteries uploaded: {results.reduce((sum, r) => sum + r.batteriesCount, 0)}
                </span>
                <span className="text-slate-400">
                  Files processed: {results.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Formats Info */}
      <Card className="enhanced-card">
        <CardContent className="p-6">
          <h4 className="font-medium text-white mb-3">Supported File Formats</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-slate-300 mb-2">File Types</h5>
              <ul className="space-y-1 text-slate-400">
                <li>• CSV files (.csv)</li>
                <li>• JSON files (.json)</li>
                <li>• Excel files (.xlsx, .xls)</li>
                <li>• Text files (.txt)</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-slate-300 mb-2">Data Fields</h5>
              <ul className="space-y-1 text-slate-400">
                <li>• Battery ID/Identifier</li>
                <li>• State of Health (SoH)</li>
                <li>• Remaining Useful Life (RUL)</li>
                <li>• Cycle Count</li>
                <li>• Voltage, Current, Temperature</li>
                <li>• Chemistry (LFP, NMC)</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Large File Support:</strong> The parser can handle files up to 500MB with advanced 
              chunking and auto-detection of data formats. Missing fields will be automatically calculated 
              or estimated based on available data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
