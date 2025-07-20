
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Battery, BatteryGrade, BatteryStatus, BatteryAttachment } from "@/types";
import { Battery as BatteryIcon, Save, X, Paperclip } from "lucide-react";
import BatteryFileAttachments from './BatteryFileAttachments';

interface ManualBatteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (battery: Battery) => void;
}

export default function ManualBatteryModal({ isOpen, onClose, onSave }: ManualBatteryModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    grade: 'A' as BatteryGrade,
    status: 'Healthy' as BatteryStatus,
    soh: '',
    rul: '',
    cycles: '',
    chemistry: 'NMC' as 'LFP' | 'NMC' | 'LCO' | 'NCA',
    notes: ''
  });

  const [attachments, setAttachments] = useState<BatteryAttachment[]>([]);
  const [showSupportingDocuments, setShowSupportingDocuments] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = 'Battery ID is required';
    } else if (formData.id.length < 3) {
      newErrors.id = 'Battery ID must be at least 3 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Battery name is required';
    }

    if (!formData.soh) {
      newErrors.soh = 'State of Health is required';
    } else {
      const soh = parseFloat(formData.soh);
      if (isNaN(soh) || soh < 0 || soh > 100) {
        newErrors.soh = 'SoH must be between 0 and 100';
      }
    }

    if (!formData.rul) {
      newErrors.rul = 'Remaining Useful Life is required';
    } else {
      const rul = parseInt(formData.rul);
      if (isNaN(rul) || rul < 0) {
        newErrors.rul = 'RUL must be a positive number';
      }
    }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const soh = parseFloat(formData.soh);
    const battery: Battery = {
      id: formData.id.trim(),
      name: formData.name.trim(),
      grade: formData.grade,
      status: formData.status,
      soh,
      rul: parseInt(formData.rul),
      cycles: parseInt(formData.cycles),
      chemistry: formData.chemistry,
      uploadDate: new Date().toISOString().split('T')[0],
      notes: formData.notes.trim(),
      sohHistory: Array.from({ length: 10 }, (_, i) => ({
        cycle: i * Math.floor(parseInt(formData.cycles) / 10),
        soh: soh + (Math.random() - 0.5) * 2
      })),
      issues: [],
      attachments: attachments
    };

    onSave(battery);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      grade: 'A',
      status: 'Healthy',
      soh: '',
      rul: '',
      cycles: '',
      chemistry: 'NMC',
      notes: ''
    });
    setAttachments([]);
    setShowSupportingDocuments(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[520px] max-h-[90vh] enhanced-card overflow-hidden"
        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-white flex items-center gap-3 text-lg">
            <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BatteryIcon className="h-4 w-4 text-blue-400" />
            </div>
            Create Battery Passport
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
          {/* Battery Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
              <div className="w-5 h-5 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BatteryIcon className="h-3 w-3 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-sm">Battery Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batteryName" className="text-white">
                  Battery Name *
                  <span className="text-slate-400 text-xs ml-2">(Displayed prominently)</span>
                </Label>
                <Input
                  id="batteryName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Tesla Model S Battery Pack"
                  className={`glass-button h-10 ${errors.name ? 'border-red-400' : ''}`}
                />
                {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
                <p className="text-slate-400 text-xs">
                  Give your battery a descriptive name
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batteryId" className="text-white">Battery ID *</Label>
                  <Input
                    id="batteryId"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g., NMC-001A"
                    className={`glass-button h-10 ${errors.id ? 'border-red-400' : ''}`}
                  />
                  {errors.id && <p className="text-red-400 text-xs">{errors.id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chemistry" className="text-white">Chemistry</Label>
                  <Select value={formData.chemistry} onValueChange={(value: 'LFP' | 'NMC' | 'LCO' | 'NCA') => setFormData(prev => ({ ...prev, chemistry: value }))}>
                    <SelectTrigger className="glass-button h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NMC">NMC - Nickel Manganese Cobalt</SelectItem>
                      <SelectItem value="LFP">LFP - Lithium Iron Phosphate</SelectItem>
                      <SelectItem value="LCO">LCO - Lithium Cobalt Oxide</SelectItem>
                      <SelectItem value="NCA">NCA - Nickel Cobalt Aluminum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-white">Grade</Label>
                  <Select value={formData.grade} onValueChange={(value: BatteryGrade) => setFormData(prev => ({ ...prev, grade: value }))}>
                    <SelectTrigger className="glass-button h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Excellent</SelectItem>
                      <SelectItem value="B">B - Good</SelectItem>
                      <SelectItem value="C">C - Fair</SelectItem>
                      <SelectItem value="D">D - Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white">Status</Label>
                  <Select value={formData.status} onValueChange={(value: BatteryStatus) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="glass-button h-10">
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
          </div>

          {/* Performance Metrics Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
              <div className="w-5 h-5 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-xs">⚡</span>
              </div>
              <h3 className="text-white font-semibold text-sm">Performance Metrics</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soh" className="text-white">State of Health (%) *</Label>
                  <Input
                    id="soh"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.soh}
                    onChange={(e) => setFormData(prev => ({ ...prev, soh: e.target.value }))}
                    placeholder="85.5"
                    className={`glass-button h-10 ${errors.soh ? 'border-red-400' : ''}`}
                  />
                  {errors.soh && <p className="text-red-400 text-xs">{errors.soh}</p>}
                  <p className="text-slate-400 text-xs">Battery health percentage (0-100%)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rul" className="text-white">Remaining Useful Life (cycles) *</Label>
                  <Input
                    id="rul"
                    type="number"
                    min="0"
                    value={formData.rul}
                    onChange={(e) => setFormData(prev => ({ ...prev, rul: e.target.value }))}
                    placeholder="1500"
                    className={`glass-button h-10 ${errors.rul ? 'border-red-400' : ''}`}
                  />
                  {errors.rul && <p className="text-red-400 text-xs">{errors.rul}</p>}
                  <p className="text-slate-400 text-xs">Estimated remaining cycles</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycles" className="text-white">Total Cycles *</Label>
                <Input
                  id="cycles"
                  type="number"
                  min="0"
                  value={formData.cycles}
                  onChange={(e) => setFormData(prev => ({ ...prev, cycles: e.target.value }))}
                  placeholder="500"
                  className={`glass-button h-10 ${errors.cycles ? 'border-red-400' : ''}`}
                />
                {errors.cycles && <p className="text-red-400 text-xs">{errors.cycles}</p>}
                <p className="text-slate-400 text-xs">Total charge/discharge cycles</p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
              <div className="w-5 h-5 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-xs">📝</span>
              </div>
              <h3 className="text-white font-semibold text-sm">Additional Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this battery..."
                className="glass-button min-h-[80px] resize-none"
                rows={3}
              />
              <p className="text-slate-400 text-xs">Add relevant information about the battery</p>
            </div>
          </div>

          {/* Supporting Documents Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 text-xs">📄</span>
                </div>
                <Label className="text-white font-semibold text-sm">Supporting Documents (Optional)</Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSupportingDocuments(!showSupportingDocuments)}
                className="text-xs text-blue-400 hover:text-blue-300 p-1 h-6"
              >
                {showSupportingDocuments ? 'Hide' : 'Add Documents'}
              </Button>
            </div>
            
            {showSupportingDocuments && (
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <BatteryFileAttachments
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  maxFiles={3}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 flex-shrink-0 border-t border-slate-700/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="glass-button px-5 py-2"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit"
              className="glass-button bg-blue-600/70 hover:bg-blue-600/85 px-5 py-2"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Battery Passport
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
