
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle, AlertCircle, FileText, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/hooks/use-toast";
import { BatteryDataParser } from '@/services/batteryDataParser';
import BatteryPassportModal from './BatteryPassportModal';
import ManualBatteryModal from './ManualBatteryModal';
import { Battery } from '@/types';
import { useNavigate } from 'react-router-dom';

interface UploadedFile {
  id: string;
  file: File; // Store the original File object separately
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  metadata?: any;
  warnings?: string[];
  batteryData?: Battery;
  errorMessage?: string;
}

export default function FileUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Date.now() + Math.random().toString(),
      file: file, // Store the original File object
      status: 'pending',
      progress: 0,
    }));
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
    }
  });

  const removeFile = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  const generateBatteryFromAnalysis = (result: any, filename: string): Battery => {
    const batteryId = filename.replace(/\.(csv|xlsx|xls|txt|json)$/i, '').toUpperCase();
    
    // Calculate SoH based on capacity degradation with more robust logic
    let soh = 85; // Default fallback
    
    if (result.data.length > 0) {
      const capacities = result.data.map((row: any) => row.capacity_mAh).filter(Boolean);
      if (capacities.length > 0) {
        const avgCapacity = capacities.reduce((sum: number, cap: number) => sum + cap, 0) / capacities.length;
        const maxCapacity = Math.max(...capacities);
        
        if (maxCapacity > 0) {
          soh = Math.min(99.8, Math.max(70, (avgCapacity / maxCapacity) * 100));
        }
      }
    }
    
    // Estimate RUL based on degradation rate
    const rul = Math.max(50, Math.floor(2000 - (result.metadata.totalCycles * 0.8)));
    
    // Determine grade based on SoH
    let grade: 'A' | 'B' | 'C' | 'D' = 'D';
    if (soh >= 95) grade = 'A';
    else if (soh >= 85) grade = 'B';
    else if (soh >= 75) grade = 'C';
    
    // Determine status
    let status: 'Healthy' | 'Degrading' | 'Critical' | 'Unknown' = 'Unknown';
    if (soh >= 90) status = 'Healthy';
    else if (soh >= 80) status = 'Degrading';
    else status = 'Critical';

    // Generate SoH history
    const sohHistory = Array.from({ length: Math.min(20, Math.max(10, result.metadata.totalCycles)) }, (_, i) => ({
      cycle: i * Math.floor(Math.max(1, result.metadata.totalCycles) / 20),
      soh: soh + (Math.random() - 0.5) * 2
    }));

    return {
      id: batteryId,
      grade,
      status,
      soh: parseFloat(soh.toFixed(1)),
      rul,
      cycles: Math.max(1, result.metadata.totalCycles),
      chemistry: result.metadata.chemistry === 'LFP' ? 'LFP' : 'NMC',
      uploadDate: new Date().toISOString().split('T')[0],
      sohHistory
    };
  };
  
  const processFile = async (fileId: string) => {
    const uploadedFile = files.find(f => f.id === fileId);
    if (!uploadedFile || !uploadedFile.file) {
      console.error('File not found or file object is missing');
      return;
    }

    const file = uploadedFile.file;
    console.log(`Processing file: ${file.name} (size: ${file.size} bytes)`);

    // Validate file
    if (!file.name || file.size === 0) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          errorMessage: 'Invalid file: File name or size is missing'
        } : f
      ));
      return;
    }

    // Update status to processing
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing', progress: 10 } : f
    ));

    try {
      // Simulate progress updates
      for (let i = 20; i <= 60; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: i } : f
        ));
      }

      console.log('Calling BatteryDataParser.parseFile with:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const result = await BatteryDataParser.parseFile(file);
      
      // Update progress to 80%
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 80 } : f
      ));

      console.log('Parse result:', result);

      if (!result.data || result.data.length === 0) {
        throw new Error('No valid data found in file. Please check the file format and content.');
      }

      const batteryData = generateBatteryFromAnalysis(result, file.name);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          metadata: result.metadata,
          warnings: result.metadata.warnings,
          batteryData
        } : f
      ));

      toast({
        title: "File Processed Successfully",
        description: `Analyzed ${result.data.length} data points from ${result.metadata.totalCycles} cycles`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          errorMessage
        } : f
      ));

      toast({
        title: "Processing Failed",
        description: `Error processing ${file.name}: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive"
      });
      return;
    }

    // Process all pending files
    files.forEach(uploadedFile => {
      if (uploadedFile.status === 'pending') {
        processFile(uploadedFile.id);
      }
    });
  };

  const handleViewPassport = (battery: Battery) => {
    setSelectedBattery(battery);
    setIsModalOpen(true);
  };

  const handleAddManualBattery = (newBattery: Battery) => {
    // Store battery data in localStorage for dashboard access
    const existingBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const updatedBatteries = existingBatteries.filter((b: Battery) => b.id !== newBattery.id);
    updatedBatteries.push(newBattery);
    localStorage.setItem('uploadedBatteries', JSON.stringify(updatedBatteries));
    
    toast({
      title: "Battery Added Manually",
      description: `${newBattery.id} has been added to the system`,
    });
  };

  const handleViewInDashboard = (battery: Battery) => {
    // Store battery data in localStorage for dashboard access
    const existingBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const updatedBatteries = existingBatteries.filter((b: Battery) => b.id !== battery.id);
    updatedBatteries.push(battery);
    localStorage.setItem('uploadedBatteries', JSON.stringify(updatedBatteries));
    
    toast({
      title: "Battery Added to Dashboard",
      description: `${battery.id} is now available in the dashboard`,
    });
    
    navigate('/');
  };

  const handleSaveBattery = (updatedBattery: Battery) => {
    // Update the file's battery data
    setFiles(prev => prev.map(f => 
      f.batteryData?.id === updatedBattery.id 
        ? { ...f, batteryData: updatedBattery }
        : f
    ));
    setSelectedBattery(updatedBattery);
    
    // Also update localStorage
    const existingBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const updatedBatteries = existingBatteries.map((b: Battery) => 
      b.id === updatedBattery.id ? updatedBattery : b
    );
    localStorage.setItem('uploadedBatteries', JSON.stringify(updatedBatteries));
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setIsManualModalOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Battery Manually
          </Button>
        </div>

        <div
          {...getRootProps()}
          className={`p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">
            {isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to select'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Supports: .csv, .xlsx, .txt, .json</p>
        </div>

        {files.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Selected Files:</h3>
            <ul className="space-y-3">
              {files.map(uploadedFile => (
                <li key={uploadedFile.id} className="p-4 bg-card rounded-md border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{uploadedFile.file.name}</span>
                      {uploadedFile.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {uploadedFile.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        uploadedFile.status === 'completed' ? 'default' :
                        uploadedFile.status === 'error' ? 'destructive' :
                        uploadedFile.status === 'processing' ? 'secondary' : 'outline'
                      }>
                        {uploadedFile.status}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(uploadedFile.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {uploadedFile.status === 'processing' && (
                    <Progress value={uploadedFile.progress} className="mb-2" />
                  )}
                  
                  {uploadedFile.status === 'error' && uploadedFile.errorMessage && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                      Error: {uploadedFile.errorMessage}
                    </div>
                  )}
                  
                  {uploadedFile.metadata && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Equipment: {uploadedFile.metadata.equipment} | Chemistry: {uploadedFile.metadata.chemistry}</p>
                      <p>Total Cycles: {uploadedFile.metadata.totalCycles}</p>
                      {uploadedFile.warnings && uploadedFile.warnings.length > 0 && (
                        <p className="text-yellow-600">Warnings: {uploadedFile.warnings.length}</p>
                      )}
                    </div>
                  )}

                  {uploadedFile.status === 'completed' && uploadedFile.batteryData && (
                    <div className="mt-3 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewPassport(uploadedFile.batteryData!)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Passport
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleViewInDashboard(uploadedFile.batteryData!)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View in Dashboard
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleUpload} disabled={files.length === 0 || files.every(f => f.status !== 'pending')}>
            Analyze {files.filter(f => f.status === 'pending').length} {files.filter(f => f.status === 'pending').length === 1 ? 'File' : 'Files'}
          </Button>
        </div>
      </div>

      <BatteryPassportModal
        battery={selectedBattery}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBattery}
      />

      <ManualBatteryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleAddManualBattery}
      />
    </>
  );
}
