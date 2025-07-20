
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, CheckCircle, AlertCircle, Plus, FileText, Battery } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FileUploader from "@/components/FileUploader";
import ManualBatteryModal from "@/components/ManualBatteryModal";
import { toast } from "@/hooks/use-toast";
import { batteryService } from "@/services/batteryService";
import { DemoService } from "@/services/demoService";
import { Battery as BatteryType } from "@/types";

export default function Upload() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedBatteries, setUploadedBatteries] = useState<BatteryType[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'manual'>('file');

  // Check if user is demo on component mount
  useEffect(() => {
    const checkDemoStatus = async () => {
      const demoStatus = await DemoService.isDemoUser();
      setIsDemo(demoStatus);
    };
    checkDemoStatus();
  }, []);

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadedBatteries([]);
  };

  const handleManualBatteryAdd = async (battery: BatteryType) => {
    const success = await batteryService.createBatteryPassport(battery);
    if (success) {
      const userType = isDemo ? 'demo account' : 'your account';
      toast({
        title: "Battery Passport Created",
        description: `Battery ${battery.name || battery.id} has been created successfully in ${userType}`,
      });
      setUploadedBatteries([battery]);
      setUploadStatus('success');
    } else {
      toast({
        title: "Error",
        description: "Failed to create battery passport",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Upload Battery Data</h1>
            <p className="text-slate-400 mt-1">
              Upload battery cycling data files or manually create battery passports
            </p>
          </div>
          {isDemo && (
            <Badge variant="outline" className="text-amber-300 border-amber-500/50">
              <Battery className="h-3 w-3 mr-1" />
              Demo Mode
            </Badge>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all duration-200 ${
              activeTab === 'file'
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <UploadIcon className="h-4 w-4" />
            File Upload
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all duration-200 ${
              activeTab === 'manual'
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <Plus className="h-4 w-4" />
            Manual Entry
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
          {activeTab === 'file' && (
            <FileUploader />
          )}
          
          {activeTab === 'manual' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Create Battery Passport Manually</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                Enter battery specifications manually to create a new battery passport with custom names and detailed information
              </p>
              {isDemo && (
                <div className="mb-6 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg max-w-sm mx-auto">
                  <p className="text-amber-300 text-sm">
                    Demo mode: Manually created batteries will be stored locally and cleared on sign out
                  </p>
                </div>
              )}
              <Button 
                onClick={() => setIsManualModalOpen(true)}
                className="glass-button px-6 py-2 text-base hover:scale-105 transition-transform"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Battery Passport
              </Button>
            </div>
          )}
        </div>

        {/* Feature Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* File Upload Description */}
          <div className="bg-blue-900/10 border border-blue-500/20 hover:border-blue-500/30 transition-colors rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <UploadIcon className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">File Upload Feature</h4>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  Upload CSV, XLS, or XLSX files containing battery cycling data. The system will automatically 
                  parse the data, calculate performance metrics, and create comprehensive battery passports.
                </p>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Supports CSV, XLS, and XLSX formats</p>
                  <p>• Automatic data parsing and analysis</p>
                  <p>• Optional custom battery names</p>
                  <p>• Supporting document attachments</p>
                </div>
                {isDemo && (
                  <div className="mt-3 p-2 bg-amber-900/20 border border-amber-500/30 rounded text-xs">
                    <p className="text-amber-300">
                      Demo mode: Uploaded batteries will be stored locally and cleared on sign out
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Manual Entry Description */}
          <div className="bg-green-900/10 border border-green-500/20 hover:border-green-500/30 transition-colors rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">Manual Entry Feature</h4>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  Create battery passports manually by entering specifications like chemistry type, state of health, 
                  remaining useful life, and cycle count.
                </p>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Custom battery names and IDs</p>
                  <p>• Detailed performance metrics</p>
                  <p>• Chemistry and grade specifications</p>
                  <p>• Optional notes and attachments</p>
                </div>
                {isDemo && (
                  <div className="mt-3 p-2 bg-amber-900/20 border border-amber-500/30 rounded text-xs">
                    <p className="text-amber-300">
                      Demo mode: Manually created batteries will be stored locally and cleared on sign out
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success State */}
        {uploadStatus === 'success' && uploadedBatteries.length > 0 && (
          <div className="border border-green-500/50 bg-green-900/20 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Battery Passport Created Successfully
              </h3>
            </div>
            <div className="space-y-4">
              {uploadedBatteries.map((battery) => (
                <div key={battery.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div>
                    <h4 className="font-semibold text-white">{battery.name || battery.id}</h4>
                    <p className="text-slate-400 text-sm">
                      {battery.chemistry} • Grade {battery.grade} • {battery.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">{battery.soh.toFixed(1)}%</div>
                    <div className="text-slate-400 text-sm">State of Health</div>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button onClick={resetUpload} variant="outline" className="glass-button">
                  Create Another Battery
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {uploadStatus === 'error' && (
          <div className="border border-red-500/50 bg-red-900/20 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
                <AlertCircle className="h-5 w-5 text-red-400" />
                Upload Failed
              </h3>
            </div>
            <div>
              <p className="text-slate-300 mb-4">
                There was an error creating the battery passport. Please try again.
              </p>
              <Button onClick={resetUpload} variant="outline" className="glass-button">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Manual Battery Modal */}
        {isManualModalOpen && (
          <ManualBatteryModal
            isOpen={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
            onSave={handleManualBatteryAdd}
          />
        )}
      </div>
    </div>
  );
}
