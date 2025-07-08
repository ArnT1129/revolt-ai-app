
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Battery, BatteryGrade, BatteryStatus } from "@/types";
import { useNavigate } from "react-router-dom";

interface ManualBatteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (battery: Battery) => void;
}

export default function ManualBatteryModal({ isOpen, onClose, onSave }: ManualBatteryModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    grade: 'A' as BatteryGrade,
    status: 'Healthy' as BatteryStatus,
    soh: '',
    rul: '',
    cycles: '',
    chemistry: 'NMC' as 'LFP' | 'NMC'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.soh || !formData.rul || !formData.cycles) {
      return;
    }

    const soh = parseFloat(formData.soh);
    const battery: Battery = {
      id: formData.id,
      grade: formData.grade,
      status: formData.status,
      soh,
      rul: parseInt(formData.rul),
      cycles: parseInt(formData.cycles),
      chemistry: formData.chemistry,
      uploadDate: new Date().toISOString().split('T')[0],
      sohHistory: Array.from({ length: 10 }, (_, i) => ({
        cycle: i * Math.floor(parseInt(formData.cycles) / 10),
        soh: soh + (Math.random() - 0.5) * 2
      }))
    };

    onSave(battery);
    setFormData({
      id: '',
      grade: 'A',
      status: 'Healthy',
      soh: '',
      rul: '',
      cycles: '',
      chemistry: 'NMC'
    });
    onClose();
    
    // Navigate to dashboard after creating battery
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Battery Manually</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="batteryId">Battery ID</Label>
            <Input
              id="batteryId"
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="e.g., NMC-001A"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={formData.grade} onValueChange={(value: BatteryGrade) => setFormData(prev => ({ ...prev, grade: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: BatteryStatus) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="soh">State of Health (%)</Label>
              <Input
                id="soh"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.soh}
                onChange={(e) => setFormData(prev => ({ ...prev, soh: e.target.value }))}
                placeholder="85.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="chemistry">Chemistry</Label>
              <Select value={formData.chemistry} onValueChange={(value: 'LFP' | 'NMC') => setFormData(prev => ({ ...prev, chemistry: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NMC">NMC</SelectItem>
                  <SelectItem value="LFP">LFP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rul">Remaining Useful Life (cycles)</Label>
              <Input
                id="rul"
                type="number"
                min="0"
                value={formData.rul}
                onChange={(e) => setFormData(prev => ({ ...prev, rul: e.target.value }))}
                placeholder="1500"
                required
              />
            </div>

            <div>
              <Label htmlFor="cycles">Total Cycles</Label>
              <Input
                id="cycles"
                type="number"
                min="0"
                value={formData.cycles}
                onChange={(e) => setFormData(prev => ({ ...prev, cycles: e.target.value }))}
                placeholder="500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Battery
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
