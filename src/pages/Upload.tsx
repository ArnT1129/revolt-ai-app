
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, CheckCircle, AlertCircle, Plus, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploader from "@/components/FileUploader";
import ManualBatteryModal from "@/components/ManualBatteryModal";
import { toast } from "@/hooks/use-toast";
import { batteryService } from "@/services/batteryService";
import { Battery } from "@/types";

export default function Upload() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedBatteries, setUploadedBatteries] = useState<Battery[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadedBatteries([]);
  };

  const handleManualBatteryAdd = async (battery: Battery) => {
    const success = await batteryService.addBattery(battery);
    if (success) {
      toast({
        title: "Battery Passport Created",
        description: `Battery ${battery.id} has been created successfully`,
      });
      setUploadedBatteries([battery]);
      setUploadStatus('success');
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
    } else {
      toast({
        title: "Error",
        description: "Failed to create battery passport",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Create Battery Passport</h1>
          <p className="text-slate-400 mt-2">
            Upload raw battery data files or manually create a battery passport
          </p>
        </div>
        {uploadStatus === 'success' && (
          <Button onClick={resetUpload} variant="outline" className="glass-button">
            Create More
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {uploadStatus === 'idle' || uploadStatus === 'uploading' ? (
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="text-white">Create Battery Passport</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-white/10 mb-6">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <UploadIcon className="h-4 w-4" />
                    Upload Data
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                  <FileUploader />
                </TabsContent>

                <TabsContent value="manual">
                  <div className="text-center py-8">
                    <div className="p-4 rounded-full bg-green-500/20 border border-green-500/30 w-fit mx-auto mb-4">
                      <FileText className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Create Manual Passport
                    </h3>
                    <p className="text-slate-400 mb-4">
                      Manually enter battery information to create a passport
                    </p>
                    <Button 
                      onClick={() => setIsManualModalOpen(true)}
                      className="glass-button border-green-500/40 hover:border-green-400"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Passport
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : uploadStatus === 'success' ? (
          <Card className="enhanced-card border-green-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Passport Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Successfully created {uploadedBatteries.length} battery passport(s).
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
                  Create More
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
                Creation Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                There was an error creating your battery passport. Please check the information and try again.
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
          <CardTitle className="text-white">How to Create Passports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-white flex items-center gap-2">
                <UploadIcon className="h-4 w-4" />
                Upload Raw Data
              </h4>
              <ul className="text-sm text-slate-300 space-y-1 ml-4">
                <li>• CSV files with battery test data</li>
                <li>• Excel files (.xlsx, .xls)</li>
                <li>• JSON data from test equipment</li>
                <li>• Maximum file size: 50MB per file</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manual Entry
              </h4>
              <ul className="text-sm text-slate-300 space-y-1 ml-4">
                <li>• Enter battery specifications directly</li>
                <li>• Set SoH, RUL, and cycle data</li>
                <li>• Add notes and observations</li>
                <li>• Perfect for single batteries</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Battery Modal */}
      <ManualBatteryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleManualBatteryAdd}
      />
    </div>
  );
}
