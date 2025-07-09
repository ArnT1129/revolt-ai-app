import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { batteryService } from '@/services/batteryService';
import { ImprovedBatteryDataParser } from '@/services/improvedBatteryDataParser';
import { Battery } from '@/types';
import BatteryPassportModal from './BatteryPassportModal';

interface FileUploadResult {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  battery?: Battery;
  error?: string;
  progress: number;
}

export default function FileUploader() {
  const [uploadResults, setUploadResults] = useState<FileUploadResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const processFile = async (file: File): Promise<FileUploadResult> => {
    try {
      const result: FileUploadResult = {
        file,
        status: 'processing',
        progress: 0
      };

      // Update progress to show processing started
      setUploadResults(prev => prev.map(r => 
        r.file === file ? { ...r, status: 'processing', progress: 25 } : r
      ));

      // Parse the file
      const parseResult = await ImprovedBatteryDataParser.parseFile(file);
      
      // Update progress
      setUploadResults(prev => prev.map(r => 
        r.file === file ? { ...r, progress: 50 } : r
      ));

      if (!parseResult || parseResult.batteries.length === 0) {
        throw new Error('Failed to parse battery data from file');
      }

      const parsedData = parseResult.batteries[0];

      // Convert parsed data to Battery type
      const batteryData: Battery = {
        id: parsedData.id,
        grade: parsedData.grade,
        status: parsedData.status,
        soh: parsedData.soh,
        rul: parsedData.rul,
        cycles: parsedData.cycles,
        chemistry: parsedData.chemistry,
        uploadDate: parsedData.uploadDate,
        sohHistory: parsedData.sohHistory,
        issues: parsedData.issues || [],
        notes: parsedData.notes,
        rawData: parsedData.rawData,
        metrics: {
          capacityRetention: parsedData.soh,
          energyEfficiency: parsedData.metrics.coulombicEfficiency,
          powerFadeRate: parsedData.computedMetrics.capacityFadeRate,
          internalResistance: parsedData.metrics.internalResistance,
          temperatureRange: {
            min: parsedData.metrics.temperatureProfile.min,
            max: parsedData.metrics.temperatureProfile.max,
            avg: parsedData.metrics.temperatureProfile.mean
          },
          voltageRange: {
            min: parsedData.computedMetrics.averageMaxVoltage * 0.8,
            max: parsedData.computedMetrics.averageMaxVoltage,
            avg: parsedData.computedMetrics.averageMaxVoltage * 0.9
          },
          chargingEfficiency: parsedData.metrics.coulombicEfficiency,
          dischargingEfficiency: parsedData.metrics.coulombicEfficiency * 0.95,
          cycleLife: parsedData.computedMetrics.totalCycles,
          calendarLife: Math.round(parsedData.computedMetrics.totalCycles * 1.5),
          peakPower: 100,
          energyDensity: 250,
          selfDischargeRate: 2.5,
          impedanceGrowth: 15,
          thermalStability: 'Good'
        }
      };

      // Update progress
      setUploadResults(prev => prev.map(r => 
        r.file === file ? { ...r, progress: 75 } : r
      ));

      // Save to database
      const success = await batteryService.addBattery(batteryData);
      
      if (!success) {
        throw new Error('Failed to save battery data to database');
      }

      // Complete
      result.status = 'success';
      result.battery = batteryData;
      result.progress = 100;

      return result;
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        file,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        progress: 0
      };
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    
    // Initialize upload results
    const initialResults: FileUploadResult[] = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0
    }));
    
    setUploadResults(initialResults);

    try {
      // Process files sequentially to avoid overwhelming the system
      const results: FileUploadResult[] = [];
      
      for (const file of acceptedFiles) {
        const result = await processFile(file);
        results.push(result);
        
        // Update the results state after each file
        setUploadResults(prev => prev.map(r => 
          r.file === file ? result : r
        ));
      }

      // Check if any files were processed successfully
      const successfulUploads = results.filter(r => r.status === 'success');
      const failedUploads = results.filter(r => r.status === 'error');

      if (successfulUploads.length > 0) {
        // Dispatch events to update dashboard and other components
        window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
        window.dispatchEvent(new CustomEvent('passportCreated'));
        
        // Show the first successful battery passport
        const firstBattery = successfulUploads[0].battery;
        if (firstBattery) {
          setSelectedBattery(firstBattery);
          setShowPassportModal(true);
        }

        toast({
          title: "Upload Successful",
          description: `Successfully processed ${successfulUploads.length} battery file(s)`,
        });
      }

      if (failedUploads.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failedUploads.length} file(s) could not be processed`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error during file upload:', error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isProcessing
  });

  const removeFile = (fileToRemove: File) => {
    setUploadResults(prev => prev.filter(result => result.file !== fileToRemove));
  };

  const clearAll = () => {
    setUploadResults([]);
  };

  const handleViewPassport = (battery: Battery) => {
    setSelectedBattery(battery);
    setShowPassportModal(true);
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="enhanced-card border-dashed border-2 border-white/20 hover:border-white/40 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer transition-all duration-200 ${
              isDragActive 
                ? 'scale-105 text-white' 
                : 'text-slate-300 hover:text-white'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full bg-blue-500/20 border border-blue-500/30 ${
                isDragActive ? 'animate-pulse' : ''
              }`}>
                <Upload className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive 
                    ? 'Drop files here to upload' 
                    : 'Upload Battery Data Files'
                  }
                </h3>
                <p className="text-sm text-slate-400 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  Supports CSV, Excel (.xlsx, .xls), and JSON files up to 50MB
                </p>
              </div>
              {!isProcessing && (
                <Button className="glass-button border-blue-500/40 hover:border-blue-400">
                  Select Files
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card className="enhanced-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Upload Results</CardTitle>
            <div className="flex gap-2">
              {uploadResults.some(r => r.status === 'success') && (
                <Button 
                  onClick={handleGoToDashboard}
                  className="glass-button bg-green-600/70 hover:bg-green-600/85"
                >
                  See on Dashboard
                </Button>
              )}
              {!isProcessing && (
                <Button 
                  onClick={clearAll} 
                  variant="outline" 
                  size="sm"
                  className="glass-button"
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadResults.map((result, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {result.file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(result.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {result.status === 'processing' && (
                      <div className="mt-2">
                        <Progress value={result.progress} className="h-2" />
                        <p className="text-xs text-slate-400 mt-1">
                          Processing... {result.progress}%
                        </p>
                      </div>
                    )}
                    
                    {result.status === 'error' && result.error && (
                      <Alert className="mt-2 p-2">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-xs">{result.error}</p>
                      </Alert>
                    )}
                    
                    {result.status === 'success' && result.battery && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className="text-xs bg-green-600/80 text-green-100">
                          {result.battery.id}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {result.battery.chemistry}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${
                          result.battery.status === 'Healthy' 
                            ? 'border-green-500/50 text-green-400' 
                            : result.battery.status === 'Degrading'
                            ? 'border-yellow-500/50 text-yellow-400'
                            : 'border-red-500/50 text-red-400'
                        }`}>
                          {result.battery.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {result.status === 'success' && (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      {result.battery && (
                        <Button
                          onClick={() => handleViewPassport(result.battery!)}
                          size="sm"
                          variant="outline"
                          className="glass-button"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {result.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  {result.status === 'processing' && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  )}
                  
                  {!isProcessing && (
                    <Button
                      onClick={() => removeFile(result.file)}
                      size="sm"
                      variant="outline"
                      className="glass-button p-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Battery Passport Modal */}
      {selectedBattery && (
        <BatteryPassportModal
          isOpen={showPassportModal}
          onClose={() => {
            setShowPassportModal(false);
            setSelectedBattery(null);
          }}
          battery={selectedBattery}
        />
      )}
    </div>
  );
}
