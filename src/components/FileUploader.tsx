
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { batteryService } from '@/services/batteryService';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  batteryId?: string;
}

export default function FileUploader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileWithProgress[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Process each file
    newFiles.forEach((fileWithProgress, index) => {
      processFile(fileWithProgress, files.length + index);
    });
  }, [files.length]);

  const processFile = async (fileWithProgress: FileWithProgress, index: number) => {
    if (!user) {
      updateFileStatus(index, 'error', 'User not authenticated');
      return;
    }

    try {
      // Update progress to show uploading
      updateFileProgress(index, 25);
      updateFileStatus(index, 'processing');

      // Read file content
      const text = await fileWithProgress.file.text();
      updateFileProgress(index, 50);

      // Parse and process the data
      const result = await batteryService.uploadBatteryData(text, user.id);
      updateFileProgress(index, 75);

      // Complete the upload
      updateFileStatus(index, 'completed');
      updateFileProgress(index, 100);
      
      // Update the file with battery ID
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, batteryId: result.batteryId } : f
      ));

      toast({
        title: "Upload Successful",
        description: `Battery data processed successfully. Battery ID: ${result.batteryId}`,
      });

      // Trigger a battery data update event
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));

    } catch (error) {
      console.error('File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      updateFileStatus(index, 'error', errorMessage);
      updateFileProgress(index, 0);
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateFileProgress = (index: number, progress: number) => {
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, progress } : f
    ));
  };

  const updateFileStatus = (index: number, status: FileWithProgress['status'], error?: string) => {
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status, error } : f
    ));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const viewBattery = (batteryId: string) => {
    navigate(`/?battery=${batteryId}`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  const getStatusIcon = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileSpreadsheet className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = (file: FileWithProgress) => {
    switch (file.status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing data...';
      case 'completed':
        return 'Upload complete';
      case 'error':
        return file.error || 'Upload failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-white/20">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer transition-colors ${
              isDragActive ? 'bg-blue-500/10' : 'hover:bg-white/5'
            } p-8 rounded-lg`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {isDragActive ? 'Drop files here' : 'Upload Battery Data'}
            </h3>
            <p className="text-slate-400 mb-4">
              Drag and drop your battery data files here, or click to browse
            </p>
            <p className="text-sm text-slate-500">
              Supports .csv, .xlsx, and .xls files from Maccor, Arbin, and Neware systems
            </p>
            <Button variant="outline" className="mt-4">
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload Progress</h3>
            <div className="space-y-4">
              {files.map((fileWithProgress, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(fileWithProgress.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {fileWithProgress.file.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {getStatusText(fileWithProgress)}
                    </p>
                    {fileWithProgress.status !== 'error' && (
                      <Progress 
                        value={fileWithProgress.progress} 
                        className="mt-2 h-2"
                      />
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {fileWithProgress.status === 'completed' && fileWithProgress.batteryId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewBattery(fileWithProgress.batteryId!)}
                      >
                        View Battery
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
