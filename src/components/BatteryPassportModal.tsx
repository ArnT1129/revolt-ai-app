
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Battery } from "@/types";
import { Calendar, Zap, Thermometer, Activity, FileText, AlertCircle, Users, Flag, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import BatteryAlertSystem from "./BatteryAlertSystem";

interface BatteryPassportModalProps {
  battery: Battery | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (battery: Battery) => void;
}

export default function BatteryPassportModal({ battery, isOpen, onClose, onSave }: BatteryPassportModalProps) {
  const [activeTab, setActiveTab] = useState<'passport' | 'alerts'>('passport');
  const [isMarkedForReview, setIsMarkedForReview] = useState(false);
  const { toast } = useToast();
  const { isCompanyMode } = useCompany();

  if (!battery) return null;

  const markForReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Add a review flag to the battery's notes or create a review record
      const reviewNote = `[MARKED FOR REVIEW by ${user.email} on ${new Date().toISOString()}]`;
      const updatedNotes = battery.notes ? `${battery.notes}\n\n${reviewNote}` : reviewNote;
      
      const updatedBattery = { ...battery, notes: updatedNotes };
      
      if (onSave) {
        await onSave(updatedBattery);
      }

      setIsMarkedForReview(true);
      toast({
        title: "Success",
        description: "Battery passport marked for review",
      });
    } catch (error) {
      console.error('Error marking for review:', error);
      toast({
        title: "Error",
        description: "Failed to mark battery for review",
        variant: "destructive",
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-600">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Battery Passport - {battery.id}
            {isAlreadyMarkedForReview && (
              <Badge className="bg-orange-600/80 text-orange-100 border-0 ml-2">
                <Flag className="h-3 w-3 mr-1" />
                Marked for Review
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('passport')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'passport'
                ? 'bg-blue-600/80 text-white'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Passport Details
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'bg-blue-600/80 text-white'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Team Alerts
          </button>
        </div>

        {activeTab === 'passport' ? (
          <div className="space-y-6">
            {/* Header Information with Review Button */}
            <Card className="bg-slate-800/40 border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center justify-between">
                  <span>Battery Overview</span>
                  <div className="flex gap-2 items-center">
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
                    <Badge className={`${getStatusColor(battery.status)} border-0`}>
                      {battery.status}
                    </Badge>
                    <Badge className={`${getGradeColor(battery.grade)} border-0`}>
                      Grade {battery.grade}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-300">{battery.soh.toFixed(1)}%</div>
                    <div className="text-sm text-slate-400">State of Health</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-300">{battery.rul}</div>
                    <div className="text-sm text-slate-400">Remaining Useful Life</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-300">{battery.cycles.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Cycle Count</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-300">{battery.chemistry}</div>
                    <div className="text-sm text-slate-400">Chemistry Type</div>
                  </div>
                </div>

                {isCompanyMode && (
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-300">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">Company Mode Active</span>
                    </div>
                    <p className="text-xs text-blue-200 mt-1">
                      This battery passport can be reviewed by team members with appropriate permissions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance History */}
            {battery.sohHistory && battery.sohHistory.length > 0 && (
              <Card className="bg-slate-800/40 border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    Performance History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {battery.sohHistory.slice(-5).map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-slate-300">Cycle {point.cycle}</span>
                        </div>
                        <div className="text-green-300 font-medium">{point.soh.toFixed(1)}% SoH</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues and Alerts */}
            {battery.issues && battery.issues.length > 0 && (
              <Card className="bg-slate-800/40 border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                    Active Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {battery.issues.map((issue, index) => (
                      <div key={index} className="p-4 bg-slate-900/40 rounded-lg border-l-4 border-amber-400">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-200">{issue.title}</h4>
                          <Badge className={`${
                            issue.severity === 'Critical' ? 'bg-red-600/80 text-red-100' :
                            issue.severity === 'Warning' ? 'bg-yellow-600/80 text-yellow-100' :
                            'bg-blue-600/80 text-blue-100'
                          } border-0`}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{issue.description}</p>
                        {issue.recommendation && (
                          <p className="text-blue-300 text-sm">
                            <strong>Recommendation:</strong> {issue.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Specifications */}
            <Card className="bg-slate-800/40 border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-slate-300 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Battery ID:</span>
                        <span className="text-slate-200">{battery.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Chemistry:</span>
                        <span className="text-slate-200">{battery.chemistry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grade:</span>
                        <span className="text-slate-200">{battery.grade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-slate-200">{battery.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-300 mb-2">Performance Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">State of Health:</span>
                        <span className="text-slate-200">{battery.soh.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">RUL:</span>
                        <span className="text-slate-200">{battery.rul} cycles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Cycles:</span>
                        <span className="text-slate-200">{battery.cycles.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Upload Date:</span>
                        <span className="text-slate-200">{new Date(battery.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {battery.notes && (
                  <>
                    <Separator className="my-4 bg-slate-600/30" />
                    <div>
                      <h4 className="font-medium text-slate-300 mb-2">Notes</h4>
                      <p className="text-slate-400 text-sm whitespace-pre-wrap">{battery.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <BatteryAlertSystem batteryId={battery.id} />
        )}
      </DialogContent>
    </Dialog>
  );
}
