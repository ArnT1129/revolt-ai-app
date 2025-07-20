import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Battery, BatteryGrade, BatteryStatus, BatteryAttachment } from "@/types";
import { Save, X, Edit3, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BatteryFileAttachments from "./BatteryFileAttachments";

interface EditBatteryModalProps {
  battery: Battery | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBattery: Battery) => Promise<boolean>;
}

export default function EditBatteryModal({ battery, isOpen, onClose, onSave }: EditBatteryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    soh: '',
    rul: '',
    cycles: '',
    chemistry: 'LFP' as 'LFP' | 'NMC' | 'LCO' | 'NCA',
    grade: 'B' as BatteryGrade,
    status: 'Healthy' as BatteryStatus,
    notes: ''
  });
  const [attachments, setAttachments] = useState<BatteryAttachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form data when battery changes
  useEffect(() => {
    if (battery) {
      setFormData({
        name: battery.name || '',
        soh: battery.soh.toString(),
        rul: battery.rul.toString(),
        cycles: battery.cycles.toString(),
        chemistry: battery.chemistry,
        grade: battery.grade,
        status: battery.status,
        notes: battery.notes || ''
      });
      setAttachments(battery.attachments || []);
      setErrors({});
    }
  }, [battery]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate SoH
    if (!formData.soh) {
      newErrors.soh = 'State of Health is required';
    } else {
      const soh = parseFloat(formData.soh);
      if (isNaN(soh) || soh < 0 || soh > 100) {
        newErrors.soh = 'SoH must be between 0 and 100';
      }
    }

    // Validate RUL
    if (!formData.rul) {
      newErrors.rul = 'Remaining Useful Life is required';
    } else {
      const rul = parseInt(formData.rul);
      if (isNaN(rul) || rul < 0) {
        newErrors.rul = 'RUL must be a positive number';
      }
    }

    // Validate cycles
    if (!formData.cycles) {
      newErrors.cycles = 'Total Cycles is required';
    } else {
      const cycles = parseInt(formData.cycles);
      if (isNaN(cycles) || cycles < 0) {
        newErrors.cycles = 'Cycles must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !battery) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedBattery: Battery = {
        ...battery,
        name: formData.name.trim(),
        soh: parseFloat(formData.soh),
        rul: parseInt(formData.rul),
        cycles: parseInt(formData.cycles),
        chemistry: formData.chemistry,
        grade: formData.grade,
        status: formData.status,
        notes: formData.notes.trim(),
        attachments: attachments
      };

      const success = await onSave(updatedBattery);
      
      if (success) {
        toast({
          title: "Battery Updated",
          description: `Battery passport for ${updatedBattery.name || updatedBattery.id} has been updated successfully.`,
        });
        onClose();
      } else {
        throw new Error('Failed to update battery');
      }
    } catch (error) {
      console.error('Error updating battery:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update battery passport. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!battery) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto enhanced-card"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0,
          zIndex: 50,
          borderRadius: '12px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: 'auto',
          minWidth: '320px'
        }}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white flex items-center gap-2 text-xl">
            <Edit3 className="h-6 w-6 text-blue-400" />
            Edit Battery Passport
            {battery.name && (
              <span className="text-slate-400 text-lg font-normal">
                ({battery.name})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Battery Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter battery name"
                  className="glass-button"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chemistry" className="text-slate-300">Chemistry</Label>
                <Select value={formData.chemistry} onValueChange={(value) => handleInputChange('chemistry', value)}>
                  <SelectTrigger className="glass-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LFP">LFP</SelectItem>
                    <SelectItem value="NMC">NMC</SelectItem>
                    <SelectItem value="LCO">LCO</SelectItem>
                    <SelectItem value="NCA">NCA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="soh" className="text-slate-300">State of Health (%)</Label>
                <Input
                  id="soh"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.soh}
                  onChange={(e) => handleInputChange('soh', e.target.value)}
                  className={`glass-button ${errors.soh ? 'border-red-500' : ''}`}
                />
                {errors.soh && <p className="text-red-400 text-sm">{errors.soh}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rul" className="text-slate-300">RUL (cycles)</Label>
                <Input
                  id="rul"
                  type="number"
                  min="0"
                  value={formData.rul}
                  onChange={(e) => handleInputChange('rul', e.target.value)}
                  className={`glass-button ${errors.rul ? 'border-red-500' : ''}`}
                />
                {errors.rul && <p className="text-red-400 text-sm">{errors.rul}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycles" className="text-slate-300">Total Cycles</Label>
                <Input
                  id="cycles"
                  type="number"
                  min="0"
                  value={formData.cycles}
                  onChange={(e) => handleInputChange('cycles', e.target.value)}
                  className={`glass-button ${errors.cycles ? 'border-red-500' : ''}`}
                />
                {errors.cycles && <p className="text-red-400 text-sm">{errors.cycles}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade" className="text-slate-300">Grade</Label>
                <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value as BatteryGrade)}>
                  <SelectTrigger className="glass-button">
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

              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-300">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as BatteryStatus)}>
                  <SelectTrigger className="glass-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Healthy">Healthy</SelectItem>
                    <SelectItem value="Degrading">Degrading</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add notes about this battery..."
              className="glass-button min-h-[100px]"
            />
          </div>

          {/* File Attachments */}
          <div className="space-y-4">
            <BatteryFileAttachments
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              maxFiles={5}
            />
          </div>

          {/* Warning for critical changes */}
          {(parseFloat(formData.soh) < 70 || formData.status === 'Critical') && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-300 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Critical Battery Status</span>
              </div>
              <p className="text-xs text-red-200">
                This battery has critical health indicators. Consider replacement or immediate maintenance.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="glass-button"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 