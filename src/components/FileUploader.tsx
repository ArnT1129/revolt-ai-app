import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Eye } from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import { ImprovedBatteryDataParser } from '@/services/improvedBatteryDataParser';
import BatteryPassportModal from './BatteryPassportModal';
import type { Battery } from '@/types';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  battery?: Battery;
}

export default function FileUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const,
      progress: 0,
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
  });

  const processFiles = async () => {
    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (const fileData of pendingFiles) {
      try {
        // Update status to processing
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'processing', progress: 20 }
            : f
        ));

        // Simulate progress
        for (let progress = 40; progress <= 80; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 500));
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, progress } : f
          ));
        }

        // Parse the file
        const parseResult = await ImprovedBatteryDataParser.parseFile(fileData.file);
        
        // Get the first battery from the parse result
        const parsedBattery = parseResult.batteries[0];
        
        if (!parsedBattery) {
          throw new Error('No battery data found in file');
        }
        
        // Convert ParsedBatteryData to Battery type
        const battery: Battery = {
          id: parsedBattery.id,
          grade: parsedBattery.grade,
          status: parsedBattery.status,
          soh: parsedBattery.soh,
          rul: parsedBattery.rul,
          cycles: parsedBattery.cycles,
          chemistry: parsedBattery.chemistry,
          uploadDate: parsedBattery.uploadDate,
          sohHistory: parsedBattery.sohHistory,
          issues: parsedBattery.issues,
          notes: parsedBattery.notes || '',
        };
        
        // Add to service
        const success = await batteryService.addBattery(battery);
        
        if (!success) {
          throw new Error('Failed to save battery to database');
        }
        
        // Update status to success
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'success', progress: 100, battery }
            : f
        ));

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('batteryDataUpdated'));

        toast({
          title: "Upload Successful",
          description: `Battery ${battery.id} has been processed and added.`,
        });

      } catch (error) {
        console.error('Error processing file:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : f
        ));

        toast({
          title: "Upload Failed",
          description: `Failed to process ${fileData.file.name}`,
          variant: "destructive",
        });
      }
    }
    
    setIsProcessing(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status === 'pending' || f.status === 'processing'));
  };

  const viewBattery = (battery: Battery) => {
    setSelectedBattery(battery);
    setIsPassportOpen(true);
  };

  const handleSaveBattery = async (updatedBattery: Battery) => {
    // Update the battery in the service
    const success = await batteryService.updateBattery(updatedBattery);
    
    if (success) {
      // Update the file record
      setFiles(prev => prev.map(f => 
        f.battery?.id === updatedBattery.id 
          ? { ...f, battery: updatedBattery }
          : f
      ));

      toast({
        title: "Battery Updated",
        description: "Battery information has been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update battery information.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-500/50 bg-green-900/20';
      case 'error': return 'border-red-500/50 bg-red-900/20';
      case 'processing': return 'border-blue-500/50 bg-blue-900/20';
      default: return 'border-slate-600/50 bg-slate-800/40';
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Battery Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragActive 
                ? 'border-blue-400 bg-blue-900/20' 
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-400 text-lg mb-2">Drop the files here...</p>
            ) : (
              <p className="text-white text-lg mb-2">Drag & drop files here, or click to select</p>
            )}
            <p className="text-slate-400 text-sm">
              Supports CSV, XLS, and XLSX files containing battery cycling data
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-300">
                    {files.length} file{files.length !== 1 ? 's' : ''} total
                  </span>
                  {pendingCount > 0 && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      {pendingCount} pending
                    </Badge>
                  )}
                  {successCount > 0 && (
                    <Badge className="bg-green-600/80 text-green-100">
                      {successCount} success
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge className="bg-red-600/80 text-red-100">
                      {errorCount} error
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {pendingCount > 0 && (
                    <Button 
                      onClick={processFiles}
                      disabled={isProcessing}
                      className="glass-button"
                    >
                      {isProcessing ? 'Processing...' : `Process ${pendingCount} Files`}
                    </Button>
                  )}
                  {(successCount > 0 || errorCount > 0) && (
                    <Button 
                      onClick={clearCompleted}
                      variant="outline"
                      className="glass-button"
                    >
                      Clear Completed
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((fileData) => (
                  <div 
                    key={fileData.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(fileData.status)}`}
                  >
                    {getStatusIcon(fileData.status)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {fileData.file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{(fileData.file.size / 1024).toFixed(1)} KB</span>
                        {fileData.status === 'success' && fileData.battery && (
                          <>
                            <span>•</span>
                            <span>Battery ID: {fileData.battery.id}</span>
                          </>
                        )}
                        {fileData.error && (
                          <>
                            <span>•</span>
                            <span className="text-red-400">{fileData.error}</span>
                          </>
                        )}
                      </div>
                      
                      {fileData.status === 'processing' && (
                        <Progress 
                          value={fileData.progress} 
                          className="mt-2 h-2"
                        />
                      )}
                    </div>

                    <div className="flex gap-1">
                      {fileData.status === 'success' && fileData.battery && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewBattery(fileData.battery!)}
                          className="glass-button h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFile(fileData.id)}
                        className="glass-button h-8 w-8 p-0 hover:bg-red-600/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Battery Passport Modal */}
      {selectedBattery && (
        <BatteryPassportModal
          battery={selectedBattery}
          isOpen={isPassportOpen}
          onClose={() => {
            setIsPassportOpen(false);
            setSelectedBattery(null);
          }}
          onSave={handleSaveBattery}
        />
      )}
    </div>
  );
}
