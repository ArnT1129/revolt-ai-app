import React, { useState, useEffect } from "react";
import { LargeDialog, LargeDialogContent, LargeDialogHeader, LargeDialogTitle } from "@/components/ui/large-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Battery } from "@/types";
import { Calendar, Zap, Thermometer, Activity, FileText, AlertCircle, Users, Flag, Eye, Search, Edit3, Download, HardDrive, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import BatteryAlertSystem from "./BatteryAlertSystem";
import RootCauseAnalysis from "./RootCauseAnalysis";
import EditBatteryModal from "./EditBatteryModal";
import { batteryService } from "@/services/batteryService";
import { DemoService } from "@/services/demoService";

interface BatteryPassportModalProps {
  battery: Battery | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (battery: Battery) => Promise<boolean>;
}

export default function BatteryPassportModal({ battery, isOpen, onClose, onSave }: BatteryPassportModalProps) {
  const [activeTab, setActiveTab] = useState<'passport' | 'alerts' | 'insights'>('passport');
  const [isMarkedForReview, setIsMarkedForReview] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { isCompanyMode } = useCompany();

  if (!battery) return null;

  const markForReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const reviewNote = `[MARKED FOR REVIEW by ${user.email} on ${new Date().toISOString()}]`;
      const updatedNotes = battery.notes ? `${battery.notes}\n\n${reviewNote}` : reviewNote;
      
      const updatedBattery = { ...battery, notes: updatedNotes };
      
      // Always try the battery service first, then fallback to onSave if provided
      let success = false;
      
      try {
        success = await batteryService.updateBattery(updatedBattery);
      } catch (serviceError) {

        
        if (onSave) {
          try {
            success = await onSave(updatedBattery);
          } catch (onSaveError) {
            console.error('onSave also failed:', onSaveError);
            success = false;
          }
        }
      }

      if (!success) {
        throw new Error('Failed to save battery');
      }

      setIsMarkedForReview(true);
      // Update the battery object to reflect the new notes
      battery.notes = updatedBattery.notes;
      toast({
        title: "Success",
        description: "Battery passport marked for review",
      });
    } catch (error) {
      console.error('Error marking for review:', error);
      toast({
        title: "Error",
        description: "Failed to mark battery for review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBattery = async () => {
    setIsDeleting(true);
    try {
      const success = await batteryService.deleteBatteryForUser(battery.id);
      
      if (success) {
        toast({
          title: "Battery Deleted",
          description: `Battery passport ${battery.name || battery.id} has been deleted successfully.`,
        });
        onClose();
        // Trigger a refresh of battery data
        window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
      } else {
        // Check if it's a hardcoded demo battery
        if (DemoService.isHardcodedDemoBattery(battery.id)) {
          toast({
            title: "Cannot Delete",
            description: "Demo batteries cannot be deleted. You can only delete batteries you've uploaded.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Delete Failed",
            description: "Failed to delete battery passport. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error deleting battery:', error);
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the battery passport.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-600/80 text-green-100';
      case 'Degrading': return 'bg-yellow-600/80 text-yellow-100';
      case 'Critical': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-600/80 text-green-100';
      case 'B': return 'bg-blue-600/80 text-blue-100';
      case 'C': return 'bg-yellow-600/80 text-yellow-100';
      case 'D': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const isAlreadyMarkedForReview = battery.notes?.includes('[MARKED FOR REVIEW') || isMarkedForReview;
  
  // Update the check when the component re-renders
  useEffect(() => {
    if (battery.notes?.includes('[MARKED FOR REVIEW')) {
      setIsMarkedForReview(true);
    } else {
      setIsMarkedForReview(false);
    }
  }, [battery.notes]);

  return (
    <LargeDialog open={isOpen} onOpenChange={onClose}>
      <LargeDialogContent 
        className="max-h-[90vh] overflow-y-auto enhanced-card w-[90vw]"
      >
        <LargeDialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LargeDialogTitle className="text-white flex items-center gap-2 text-xl">
                <FileText className="h-6 w-6 text-blue-400" />
                Battery Passport - {battery.id}
                {battery.name && (
                  <span className="text-slate-400 text-lg font-normal">
                    ({battery.name})
                  </span>
                )}
                {isAlreadyMarkedForReview && (
                  <Badge className="bg-orange-600/80 text-orange-100 border-0 ml-2">
                    <Flag className="h-3 w-3 mr-1" />
                    Marked for Review
                  </Badge>
                )}
              </LargeDialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditModalOpen(true)}
                size="sm"
                variant="outline"
                className="glass-button"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                size="sm"
                variant="outline"
                className="glass-button text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </LargeDialogHeader>

        {/* Tab Navigation */}
        <div className="flex justify-center items-center mb-6">
          <div className="inline-flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('passport')}
              className={`px-8 py-3 rounded-md text-sm font-medium whitespace-nowrap ${
                activeTab === 'passport'
                  ? 'bg-blue-600/80 text-white'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Passport Details
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-8 py-3 rounded-md text-sm font-medium whitespace-nowrap ${
                activeTab === 'insights'
                  ? 'bg-blue-600/80 text-white'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Search className="h-4 w-4 inline mr-2" />
              AI Insights
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-8 py-3 rounded-md text-sm font-medium whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'bg-blue-600/80 text-white'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Team Alerts
            </button>
          </div>
        </div>

        {activeTab === 'passport' ? (
          <div className="space-y-6">
            {/* Header Information with Review Button */}
            <Card className="enhanced-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="text-lg">Battery Overview</span>
                  <div className="flex gap-3 items-center flex-wrap">
                    {!isAlreadyMarkedForReview && (
                      <Button
                        onClick={markForReview}
                        size="sm"
                        className="bg-orange-600/70 hover:bg-orange-600/85"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Mark for Review
                      </Button>
                    )}
                    <Badge className={`${getStatusColor(battery.status)} border-0 text-sm px-3 py-1`}>
                      {battery.status}
                    </Badge>
                    <Badge className={`${getGradeColor(battery.grade)} border-0 text-sm px-3 py-1`}>
                      Grade {battery.grade}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-slate-800/40 rounded-lg">
                    <div className="text-3xl font-bold text-blue-300 mb-1">{battery.soh.toFixed(1)}%</div>
                    <div className="text-sm text-slate-400">State of Health</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/40 rounded-lg">
                    <div className="text-3xl font-bold text-emerald-300 mb-1">{battery.rul.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Remaining Useful Life</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/40 rounded-lg">
                    <div className="text-3xl font-bold text-purple-300 mb-1">{battery.cycles.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Cycle Count</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/40 rounded-lg">
                    <div className="text-3xl font-bold text-orange-300 mb-1">{battery.chemistry}</div>
                    <div className="text-sm text-slate-400">Chemistry Type</div>
                  </div>
                </div>

                {isCompanyMode && (
                  <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-300 mb-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">Company Mode Active</span>
                    </div>
                    <p className="text-xs text-blue-200">
                      This battery passport can be reviewed by team members with appropriate permissions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance History */}
            {battery.sohHistory && battery.sohHistory.length > 0 && (
              <Card className="enhanced-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    Performance History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {battery.sohHistory.slice(-5).map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-slate-300 font-medium">Cycle {point.cycle.toLocaleString()}</span>
                        </div>
                        <div className="text-green-300 font-bold text-lg">{point.soh.toFixed(1)}% SoH</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues and Alerts */}
            {battery.issues && battery.issues.length > 0 && (
              <Card className="enhanced-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                    Active Issues ({battery.issues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {battery.issues.map((issue, index) => (
                      <div key={index} className="p-4 bg-slate-800/40 rounded-lg border-l-4 border-amber-400">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-200 text-lg">{issue.title}</h4>
                          <Badge className={`${
                            issue.severity === 'Critical' ? 'bg-red-600/80 text-red-100' :
                            issue.severity === 'Warning' ? 'bg-yellow-600/80 text-yellow-100' :
                            'bg-blue-600/80 text-blue-100'
                          } border-0`}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-3 leading-relaxed">{issue.description}</p>
                        {issue.recommendation && (
                          <div className="bg-blue-900/20 p-3 rounded-lg">
                          <p className="text-blue-300 text-sm">
                            <strong>Recommendation:</strong> {issue.recommendation}
                          </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Specifications */}
            <Card className="enhanced-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-slate-300 mb-4 text-lg">Basic Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400 font-medium">Battery ID:</span>
                        <span className="text-slate-200 font-semibold">{battery.id}</span>
                      </div>
                      {battery.name && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                          <span className="text-slate-400 font-medium">Battery Name:</span>
                          <span className="text-slate-200 font-semibold">{battery.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400 font-medium">Chemistry:</span>
                        <span className="text-slate-200 font-semibold">{battery.chemistry}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400 font-medium">Grade:</span>
                        <span className="text-slate-200 font-semibold">{battery.grade}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400 font-medium">Status:</span>
                        <span className="text-slate-200 font-semibold">{battery.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-300 mb-4 text-lg">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400 font-medium">State of Health:</span>
                        <span className="text-slate-200 font-semibold">{battery.soh.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400 font-medium">RUL:</span>
                        <span className="text-slate-200 font-semibold">{battery.rul.toLocaleString()} cycles</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400 font-medium">Total Cycles:</span>
                        <span className="text-slate-200 font-semibold">{battery.cycles.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400 font-medium">Upload Date:</span>
                        <span className="text-slate-200 font-semibold">{new Date(battery.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {battery.notes && (
                  <>
                    <Separator className="my-6 bg-slate-600/30" />
                    <div>
                      <h4 className="font-medium text-slate-300 mb-3 text-lg">Notes</h4>
                      <div className="bg-slate-800/40 p-4 rounded-lg">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{battery.notes}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* File Attachments */}
                {battery.attachments && battery.attachments.length > 0 && (
                  <>
                    <Separator className="my-6 bg-slate-600/30" />
                    <div>
                      <h4 className="font-medium text-slate-300 mb-3 text-lg flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-blue-400" />
                        Attachments ({battery.attachments.length})
                      </h4>
                      <div className="space-y-3">
                        {battery.attachments.map((attachment) => (
                          <Card key={attachment.id} className="bg-slate-800/40 hover:bg-slate-700/40 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="p-2 rounded-lg bg-slate-700/50">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-white font-medium truncate">{attachment.name}</h5>
                                      <Badge variant="outline" className="text-xs">
                                        {attachment.type.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                      <span>{attachment.fileName}</span>
                                      <span>{(attachment.fileSize / 1024).toFixed(1)} KB</span>
                                      <span>{attachment.uploadDate.toLocaleDateString()}</span>
                                    </div>
                                    {attachment.description && (
                                      <p className="text-slate-300 text-sm mt-2">{attachment.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      toast({
                                        title: "Download Started",
                                        description: `Downloading ${attachment.fileName}`,
                                      });
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'insights' ? (
          <RootCauseAnalysis battery={battery} />
        ) : (
          <BatteryAlertSystem batteryId={battery.id} />
        )}
      </LargeDialogContent>

      {/* Edit Battery Modal */}
      <EditBatteryModal
        battery={battery}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (updatedBattery) => {
          if (onSave) {
            const success = await onSave(updatedBattery);
            if (success) {
              setIsEditModalOpen(false);
            }
            return success || false;
          }
          return false;
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Battery Passport
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-slate-300 mb-4">
                Are you sure you want to delete this battery passport?
              </div>
              <div className="bg-slate-800/40 p-4 rounded-lg">
                <div className="text-white font-medium">{battery.name || battery.id}</div>
                <div className="text-slate-400 text-sm">
                  {battery.chemistry} • SoH: {battery.soh.toFixed(1)}% • Grade: {battery.grade}
                </div>
              </div>
              <div className="text-red-400 text-sm mt-4">
                This action cannot be undone. All battery data and attachments will be permanently deleted.
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteBattery}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LargeDialog>
  );
}
