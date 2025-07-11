import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { batteryService } from '@/services/batteryService';
import { supabase } from '@/integrations/supabase/client';
import RootCauseAnalysis from './RootCauseAnalysis';
import { Battery, BatteryGrade, BatteryStatus, BatteryIssue } from '@/types';
import { 
  Battery as BatteryIcon, 
  Zap, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Save,
  Flag,
  X,
  Bot
} from 'lucide-react';

interface BatteryPassportModalProps {
  battery: Battery;
  isOpen: boolean;
  onClose: () => void;
  onSave: (battery: Battery) => void;
}

export default function BatteryPassportModal({ 
  battery, 
  isOpen, 
  onClose, 
  onSave 
}: BatteryPassportModalProps) {
  const [editedBattery, setEditedBattery] = useState<Battery>(battery);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingForReview, setMarkingForReview] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setEditedBattery(battery);
  }, [battery]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const success = await batteryService.updateBattery(editedBattery);
      if (success) {
        toast({
          title: "Success",
          description: "Battery updated successfully",
        });
        onSave(editedBattery);
        setIsEditing(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update battery",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkForReview = async () => {
    try {
      setMarkingForReview(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to mark batteries for review",
          variant: "destructive",
        });
        return;
      }

      const reviewNote = `[MARKED FOR REVIEW by ${user.email || user.id} on ${new Date().toISOString()}]`;
      const updatedNotes = editedBattery.notes ? 
        `${editedBattery.notes}\n\n${reviewNote}` : 
        reviewNote;
      
      const updatedBattery = { 
        ...editedBattery, 
        notes: updatedNotes 
      };

      const success = await batteryService.updateBattery(updatedBattery);
      if (success) {
        setEditedBattery(updatedBattery);
        onSave(updatedBattery);
        
        // Dispatch event to notify review page
        window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
        
        toast({
          title: "Success",
          description: "Battery marked for review successfully",
        });
      } else {
        throw new Error('Failed to mark battery for review');
      }
    } catch (error) {
      console.error('Error marking battery for review:', error);
      toast({
        title: "Error",
        description: "Failed to mark battery for review",
        variant: "destructive",
      });
    } finally {
      setMarkingForReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-600/80 text-green-100 border-green-600/50';
      case 'Degrading': return 'bg-yellow-600/80 text-yellow-100 border-yellow-600/50';
      case 'Critical': return 'bg-red-600/80 text-red-100 border-red-600/50';
      default: return 'bg-gray-600/80 text-gray-100 border-gray-600/50';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-blue-600/80 text-blue-100 border-blue-600/50';
      case 'B': return 'bg-green-600/80 text-green-100 border-green-600/50';
      case 'C': return 'bg-yellow-600/80 text-yellow-100 border-yellow-600/50';
      case 'D': return 'bg-red-600/80 text-red-100 border-red-600/50';
      default: return 'bg-gray-600/80 text-gray-100 border-gray-600/50';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="enhanced-card max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-white flex items-center gap-2">
            <BatteryIcon className="h-6 w-6 text-blue-400" />
            Battery Passport - {editedBattery.id}
            {editedBattery.id.startsWith('DEMO-') && (
              <Badge variant="outline" className="text-amber-300 border-amber-500/50">
                Demo
              </Badge>
            )}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 glass-button">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Technical Details</TabsTrigger>
            <TabsTrigger value="history">History & Issues</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Header with Status and Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Badge className={`${getStatusColor(editedBattery.status)} text-sm px-3 py-1`}>
                  {editedBattery.status}
                </Badge>
                <Badge className={`${getGradeColor(editedBattery.grade)} text-sm px-3 py-1`}>
                  Grade {editedBattery.grade}
                </Badge>
                <Badge variant="outline" className="text-slate-300">
                  {editedBattery.chemistry}
                </Badge>
              </div>
              <div className="flex gap-2">
                {!editedBattery.id.startsWith('DEMO-') && (
                  <>
                    <Button
                      onClick={handleMarkForReview}
                      disabled={markingForReview}
                      variant="outline"
                      className="glass-button"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      {markingForReview ? 'Marking...' : 'Mark for Review'}
                    </Button>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      className="glass-button"
                    >
                      {isEditing ? 'Cancel Edit' : 'Edit'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <BatteryIcon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{editedBattery.soh.toFixed(1)}%</p>
                  <p className="text-sm text-slate-400">State of Health</p>
                </CardContent>
              </Card>
              
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{editedBattery.rul.toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Remaining Useful Life</p>
                </CardContent>
              </Card>
              
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{editedBattery.cycles.toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Cycle Count</p>
                </CardContent>
              </Card>
              
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">
                    {new Date(editedBattery.uploadDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-400">Upload Date</p>
                </CardContent>
              </Card>
            </div>

            {/* Health Progress Bar */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Health Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">State of Health</span>
                    <span className="text-white">{editedBattery.soh.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        editedBattery.soh >= 90 ? 'bg-green-500' :
                        editedBattery.soh >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, editedBattery.soh))}%` }}
                    />
                  </div>
                </div>
                
                {editedBattery.issues && editedBattery.issues.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">Active Issues</h4>
                    <div className="space-y-2">
                      {editedBattery.issues.map((issue, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-300 text-sm">{issue.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Notes & Observations</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editedBattery.notes || ''}
                      onChange={(e) => setEditedBattery({ ...editedBattery, notes: e.target.value })}
                      placeholder="Add notes about this battery..."
                      className="glass-input min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving} className="glass-button">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline" className="glass-button">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {editedBattery.notes || 'No notes available'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Technical specifications editing form */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label className="text-slate-300">Battery ID</Label>
                        <Input
                          value={editedBattery.id}
                          onChange={(e) => setEditedBattery({ ...editedBattery, id: e.target.value })}
                          className="glass-input"
                          disabled={editedBattery.id.startsWith('DEMO-')}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-slate-300">Grade</Label>
                        <Select value={editedBattery.grade} onValueChange={(value) => setEditedBattery({ ...editedBattery, grade: value as BatteryGrade })}>
                          <SelectTrigger className="glass-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">Grade A</SelectItem>
                            <SelectItem value="B">Grade B</SelectItem>
                            <SelectItem value="C">Grade C</SelectItem>
                            <SelectItem value="D">Grade D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-slate-300">Status</Label>
                        <Select value={editedBattery.status} onValueChange={(value) => setEditedBattery({ ...editedBattery, status: value as BatteryStatus })}>
                          <SelectTrigger className="glass-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Healthy">Healthy</SelectItem>
                            <SelectItem value="Degrading">Degrading</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-slate-300">Chemistry</Label>
                        <Select value={editedBattery.chemistry} onValueChange={(value) => setEditedBattery({ ...editedBattery, chemistry: value as "LFP" | "NMC" })}>
                          <SelectTrigger className="glass-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LFP">LFP</SelectItem>
                            <SelectItem value="NMC">NMC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Battery ID:</span>
                        <span className="text-white">{editedBattery.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grade:</span>
                        <Badge className={getGradeColor(editedBattery.grade)}>
                          Grade {editedBattery.grade}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <Badge className={getStatusColor(editedBattery.status)}>
                          {editedBattery.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Chemistry:</span>
                        <span className="text-white">{editedBattery.chemistry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Upload Date:</span>
                        <span className="text-white">{new Date(editedBattery.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label className="text-slate-300">State of Health (%)</Label>
                        <Input
                          type="number"
                          value={editedBattery.soh}
                          onChange={(e) => setEditedBattery({ ...editedBattery, soh: parseFloat(e.target.value) || 0 })}
                          className="glass-input"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-slate-300">Remaining Useful Life</Label>
                        <Input
                          type="number"
                          value={editedBattery.rul}
                          onChange={(e) => setEditedBattery({ ...editedBattery, rul: parseInt(e.target.value) || 0 })}
                          className="glass-input"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-slate-300">Cycle Count</Label>
                        <Input
                          type="number"
                          value={editedBattery.cycles}
                          onChange={(e) => setEditedBattery({ ...editedBattery, cycles: parseInt(e.target.value) || 0 })}
                          className="glass-input"
                          min="0"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">State of Health:</span>
                        <span className="text-white">{editedBattery.soh.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Remaining Useful Life:</span>
                        <span className="text-white">{editedBattery.rul.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cycle Count:</span>
                        <span className="text-white">{editedBattery.cycles.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {/* SoH History Chart and Issues */}
            <div className="grid gap-6">
              {editedBattery.sohHistory && editedBattery.sohHistory.length > 0 && (
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white">State of Health History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {editedBattery.sohHistory.map((point, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-slate-800/40 rounded">
                          <span className="text-slate-400">Cycle {point.cycle}</span>
                          <span className="text-white">{point.soh.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {editedBattery.issues && editedBattery.issues.length > 0 && (
                <Card className="enhanced-card">
                  <CardHeader>
                    <CardTitle className="text-white">Issues & Alerts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editedBattery.issues.map((issue, index) => (
                      <div key={index} className="p-4 border border-yellow-500/30 bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          <h4 className="text-white font-medium">{issue.title}</h4>
                          <Badge className="bg-yellow-600/80 text-yellow-100">
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
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-4">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-400" />
                  AI-Powered Battery Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RootCauseAnalysis battery={editedBattery} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
