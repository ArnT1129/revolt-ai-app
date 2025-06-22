
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, CheckCircle, AlertCircle } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import { toast } from "@/hooks/use-toast";
import { batteryService } from "@/services/batteryService";
import { Battery } from "@/types";

export default function Upload() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedBatteries, setUploadedBatteries] = useState<Battery[]>([]);

  const handleFileUpload = async (batteries: Battery[]) => {
    setUploadStatus('uploading');
    
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const battery of batteries) {
        const success = await batteryService.addBattery(battery);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        setUploadStatus('success');
        setUploadedBatteries(batteries);
        toast({
          title: "Upload successful!",
          description: `Successfully uploaded ${successCount} batteries to your account.`,
        });
      } else {
        setUploadStatus('error');
        toast({
          title: "Partial upload",
          description: `${successCount} batteries uploaded successfully, ${errorCount} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setUploadStatus('error');
      toast({
        title: "Upload failed",
        description: "Failed to upload battery data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadedBatteries([]);
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Upload Battery Data</h1>
          <p className="text-slate-400 mt-2">
            Upload CSV files containing battery test data to analyze performance metrics
          </p>
        </div>
        {uploadStatus === 'success' && (
          <Button onClick={resetUpload} variant="outline" className="glass-button">
            Upload More Files
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {uploadStatus === 'idle' || uploadStatus === 'uploading' ? (
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UploadIcon className="h-5 w-5" />
                File Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader
                onUpload={handleFileUpload}
                isUploading={uploadStatus === 'uploading'}
              />
            </CardContent>
          </Card>
        ) : uploadStatus === 'success' ? (
          <Card className="enhanced-card border-green-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Upload Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Successfully uploaded {uploadedBatteries.length} batteries to your account.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedBatteries.map((battery) => (
                  <div key={battery.id} className="p-3 rounded-lg bg-slate-800/50 border border-green-500/30">
                    <h4 className="font-medium text-white">{battery.id}</h4>
                    <p className="text-sm text-slate-400">
                      Grade {battery.grade} • {battery.chemistry} • {battery.soh.toFixed(1)}% SoH
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={resetUpload} className="glass-button">
                  Upload More Files
                </Button>
                <Button variant="outline" className="glass-button" asChild>
                  <a href="/">View Dashboard</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="enhanced-card border-red-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                Upload Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                There was an error uploading your battery data. Please check the file format and try again.
              </p>
              <Button onClick={resetUpload} className="glass-button">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-white">Supported File Formats</h4>
            <ul className="text-sm text-slate-300 space-y-1 ml-4">
              <li>• CSV files with battery test data</li>
              <li>• Excel files (.xlsx, .xls)</li>
              <li>• Maximum file size: 50MB per file</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-white">Required Data Columns</h4>
            <ul className="text-sm text-slate-300 space-y-1 ml-4">
              <li>• Battery ID or identifier</li>
              <li>• State of Health (SoH) percentage</li>
              <li>• Remaining Useful Life (RUL) in cycles</li>
              <li>• Total cycle count</li>
              <li>• Battery chemistry (LFP, NMC, etc.)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
