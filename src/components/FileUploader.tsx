
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/hooks/use-toast";
import { BatteryDataParser } from '@/services/batteryDataParser';

interface UploadedFile extends File {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  metadata?: any;
  warnings?: string[];
}

export default function FileUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      ...file,
      id: Date.now() + Math.random().toString(),
      status: 'pending',
      progress: 0,
    }));
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    }
  });

  const removeFile = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
  };
  
  const processFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // Update status to processing
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing', progress: 10 } : f
    ));

    try {
      // Simulate progress updates
      for (let i = 20; i <= 80; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: i } : f
        ));
      }

      const result = await BatteryDataParser.parseFile(file);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          metadata: result.metadata,
          warnings: result.metadata.warnings
        } : f
      ));

      toast({
        title: "File Processed Successfully",
        description: `Parsed ${result.data.length} data points from ${result.metadata.totalCycles} cycles`,
      });

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
      ));

      toast({
        title: "Processing Failed",
        description: `Error processing ${file.name}: ${error}`,
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
    files.forEach(file => {
      if (file.status === 'pending') {
        processFile(file.id);
      }
    });
  };

  return (
    <div className="space-y-6">
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
        <p className="mt-1 text-sm text-muted-foreground">Supports: .csv, .xlsx</p>
      </div>

      {files.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Selected Files:</h3>
          <ul className="space-y-3">
            {files.map(file => (
              <li key={file.id} className="p-4 bg-card rounded-md border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.name}</span>
                    {file.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      file.status === 'completed' ? 'default' :
                      file.status === 'error' ? 'destructive' :
                      file.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {file.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {file.status === 'processing' && (
                  <Progress value={file.progress} className="mb-2" />
                )}
                
                {file.metadata && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Equipment: {file.metadata.equipment} | Chemistry: {file.metadata.chemistry}</p>
                    <p>Total Cycles: {file.metadata.totalCycles}</p>
                    {file.warnings && file.warnings.length > 0 && (
                      <p className="text-yellow-600">Warnings: {file.warnings.length}</p>
                    )}
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
  );
}
