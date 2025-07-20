import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Eye, Battery as BatteryIcon, Edit3 } from 'lucide-react';
import { batteryService } from '@/services/batteryService';
import { DemoService } from '@/services/demoService';
import { ImprovedBatteryDataParser } from '@/services/improvedBatteryDataParser';
import BatteryPassportModal from './BatteryPassportModal';
import BatteryFileAttachments from './BatteryFileAttachments';
import type { Battery, BatteryAttachment } from '@/types';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  battery?: Battery;
  batteryName?: string;
  supportingDocuments?: BatteryAttachment[];
}

export default function FileUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [showSupportingDocuments, setShowSupportingDocuments] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Check if user is demo on component mount
  useEffect(() => {
    const checkDemoStatus = async () => {
      const demoStatus = await DemoService.isDemoUser();
      setIsDemo(demoStatus);
    };
    checkDemoStatus();
  }, []);

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

  const handleBatteryNameChange = (fileId: string, name: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, batteryName: name } : f
    ));
  };

  const handleSupportingDocumentsChange = (fileId: string, documents: BatteryAttachment[]) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, supportingDocuments: documents } : f
    ));
  };

  const toggleSupportingDocuments = (fileId: string) => {
    setShowSupportingDocuments(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

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
        
        // Check for parsing errors first
        if (parseResult.errors.length > 0) {
          const errorMessage = parseResult.errors.join('\n• ');
          throw new Error(`File parsing failed:\n• ${errorMessage}`);
        }
        
        // Get the first battery from the parse result
        const parsedBattery = parseResult.batteries[0];
        
        if (!parsedBattery) {
          throw new Error('No battery data found in file. Please ensure the file contains valid battery test data.');
        }
        
        // Convert ParsedBatteryData to Battery type
        const battery: Battery = {
          id: parsedBattery.id,
          name: fileData.batteryName || `${parsedBattery.chemistry} Battery from ${fileData.file.name}`,
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
          attachments: fileData.supportingDocuments || []
        };
        
        // Create battery passport using the new method
        const success = await batteryService.createBatteryPassport(battery);
        
        if (!success) {
          throw new Error('Failed to create battery passport');
        }
        
        // Update status to success
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'success', progress: 100, battery }
            : f
        ));

        // Show success message with appropriate context
        const userType = isDemo ? 'demo account' : 'your account';
        toast({
          title: "Battery Passport Created!",
          description: `Battery ${battery.name} has been processed and added to ${userType}.`,
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
          description: `Failed to process ${fileData.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  const handleSaveBattery = async (updatedBattery: Battery): Promise<boolean> => {
    // Check if battery can be modified
    const canModify = await batteryService.canModifyBattery(updatedBattery.id);
    if (!canModify) {
      toast({
        title: "Demo Battery",
        description: "Cannot modify demo batteries",
        variant: "destructive",
      });
      return false;
    }

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
      return true;
    } else {
      toast({
        title: "Error",
        description: "Failed to update battery information.",
        variant: "destructive",
      });
      return false;
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
      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer
          ${isDragActive 
            ? 'border-blue-400 bg-blue-900/20 scale-[1.02] shadow-lg shadow-blue-500/20' 
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 hover:scale-[1.01]'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className={`w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${isDragActive ? 'bg-blue-900/30' : ''}`}>
          <Upload className={`h-8 w-8 transition-colors ${isDragActive ? 'text-blue-400' : 'text-slate-400'}`} />
        </div>
        {isDragActive ? (
          <p className="text-blue-400 text-lg font-medium mb-2">Drop the files here...</p>
        ) : (
          <p className="text-white text-lg font-medium mb-2">Drag & drop files here, or click to select</p>
        )}
        <p className="text-slate-400 text-sm mb-2">
          Supports CSV, XLS, and XLSX files containing battery cycling data
        </p>
        {isDemo && (
          <p className="text-amber-300 text-xs">
            Demo mode: Uploaded batteries will be stored locally and cleared on sign out
          </p>
        )}
      </div>

      {/* Supporting Documents Information */}
      <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400 text-sm">📄</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium mb-2">Supporting Documents</h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              You can optionally add supporting documents to your battery passport:
            </p>
            <div className="text-xs text-slate-400 space-y-1 mb-2">
              <p>• PCB designs, chemistry specs, test reports</p>
              <p>• Manufacturing data, safety documentation</p>
              <p>• Thermal analysis, design specifications</p>
            </div>
            <p className="text-green-300 text-sm">
              💡 Documents help provide complete battery documentation
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          {/* File Summary */}
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
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
            <div className="flex gap-3">
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

          {/* File Items */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {files.map((fileData) => (
              <div 
                key={fileData.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${getStatusColor(fileData.status)}`}
              >
                {getStatusIcon(fileData.status)}
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <p className="text-white font-medium truncate">
                      {fileData.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{(fileData.file.size / 1024).toFixed(1)} KB</span>
                      {fileData.status === 'success' && fileData.battery && (
                        <>
                          <span>•</span>
                          <span>Battery: {fileData.battery.name || fileData.battery.id}</span>
                          {fileData.supportingDocuments && fileData.supportingDocuments.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-blue-400">{fileData.supportingDocuments.length} document{fileData.supportingDocuments.length !== 1 ? 's' : ''}</span>
                            </>
                          )}
                          {isDemo && (
                            <>
                              <span>•</span>
                              <span className="text-amber-300">Demo</span>
                            </>
                          )}
                        </>
                      )}
                      {fileData.error && (
                        <>
                          <span>•</span>
                          <div className="text-red-400 text-xs max-w-xs">
                            <div className="font-medium">Error:</div>
                            <div className="whitespace-pre-line text-red-300">
                              {fileData.error}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Battery Name Input for Pending Files */}
                  {fileData.status === 'pending' && (
                    <div className="space-y-2">
                      <Label htmlFor={`battery-name-${fileData.id}`} className="text-xs text-slate-400">
                        Battery Name (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`battery-name-${fileData.id}`}
                          placeholder="Enter battery name..."
                          value={fileData.batteryName || ''}
                          onChange={(e) => handleBatteryNameChange(fileData.id, e.target.value)}
                          className="glass-button text-sm h-8"
                        />
                        <Edit3 className="h-4 w-4 text-slate-400 mt-2" />
                      </div>
                    </div>
                  )}

                  {/* Supporting Documents Section for Pending Files */}
                  {fileData.status === 'pending' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-400">
                          Supporting Documents (Optional)
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSupportingDocuments(fileData.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 p-1 h-6"
                        >
                          {showSupportingDocuments[fileData.id] ? 'Hide' : 'Add Documents'}
                        </Button>
                      </div>
                      
                      {showSupportingDocuments[fileData.id] && (
                        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                          <BatteryFileAttachments
                            attachments={fileData.supportingDocuments || []}
                            onAttachmentsChange={(documents) => handleSupportingDocumentsChange(fileData.id, documents)}
                            maxFiles={3}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {fileData.status === 'processing' && (
                    <div className="space-y-2">
                      <Progress 
                        value={fileData.progress} 
                        className="h-2"
                      />
                      <p className="text-xs text-slate-400">Processing battery data...</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {fileData.status === 'success' && fileData.battery && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewBattery(fileData.battery!)}
                      className="glass-button h-8 w-8 p-0 hover:scale-105 transition-transform"
                      title="View battery details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFile(fileData.id)}
                    className="glass-button h-8 w-8 p-0 hover:bg-red-600/20 hover:scale-105 transition-transform"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
