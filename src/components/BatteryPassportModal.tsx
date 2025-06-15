
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Battery } from "@/types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";
import { Edit, Save, X, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface BatteryPassportModalProps {
  battery: Battery | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBattery: Battery) => void;
}

const gradeColor: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-yellow-500", 
  C: "bg-orange-500",
  D: "bg-red-500",
};

const statusColor: Record<string, string> = {
  Healthy: "text-green-400",
  Degrading: "text-yellow-400",
  Critical: "text-red-400",
  Unknown: "text-gray-400"
};

export default function BatteryPassportModal({ battery, isOpen, onClose, onSave }: BatteryPassportModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBattery, setEditedBattery] = useState<Battery | null>(null);

  if (!battery) return null;

  const handleEdit = () => {
    setEditedBattery({ ...battery });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedBattery) {
      onSave(editedBattery);
      setIsEditing(false);
      toast({
        title: "Battery Updated",
        description: "Battery passport information has been saved.",
      });
    }
  };

  const handleCancel = () => {
    setEditedBattery(null);
    setIsEditing(false);
  };

  const handleExportPDF = () => {
    toast({
      title: "Export Started",
      description: "Battery passport PDF is being generated...",
    });
  };

  const currentBattery = isEditing ? editedBattery! : battery;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold">Digital Battery Passport</DialogTitle>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batteryId">Battery ID</Label>
                {isEditing ? (
                  <Input
                    id="batteryId"
                    value={currentBattery.id}
                    onChange={(e) => setEditedBattery({ ...currentBattery, id: e.target.value })}
                  />
                ) : (
                  <p className="font-mono text-sm bg-muted p-2 rounded">{currentBattery.id}</p>
                )}
              </div>
              <div>
                <Label htmlFor="chemistry">Chemistry</Label>
                {isEditing ? (
                  <select
                    id="chemistry"
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
                    value={currentBattery.chemistry}
                    onChange={(e) => setEditedBattery({ ...currentBattery, chemistry: e.target.value as "LFP" | "NMC" })}
                  >
                    <option value="LFP">LFP</option>
                    <option value="NMC">NMC</option>
                  </select>
                ) : (
                  <p className="font-semibold p-2">{currentBattery.chemistry}</p>
                )}
              </div>
              <div>
                <Label>Grade</Label>
                <div className="mt-2">
                  <Badge className={cn("text-white", gradeColor[currentBattery.grade])}>
                    Grade {currentBattery.grade}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <p className={cn("font-semibold mt-2", statusColor[currentBattery.status])}>
                  {currentBattery.status}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="uploadDate">Upload Date</Label>
              <p className="text-sm text-muted-foreground mt-1">{currentBattery.uploadDate}</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs text-muted-foreground">State of Health</Label>
                <p className="text-2xl font-bold">{currentBattery.soh.toFixed(1)}%</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs text-muted-foreground">Remaining Useful Life</Label>
                <p className="text-2xl font-bold">{currentBattery.rul}</p>
                <p className="text-xs text-muted-foreground">cycles</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs text-muted-foreground">Total Cycles</Label>
                <p className="text-2xl font-bold">{currentBattery.cycles}</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs text-muted-foreground">Degradation Rate</Label>
                <p className="text-2xl font-bold">0.05%</p>
                <p className="text-xs text-muted-foreground">per cycle</p>
              </div>
            </div>
          </div>

          {/* SoH Chart */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">State of Health History</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentBattery.sohHistory}>
                  <defs>
                    <linearGradient id="colorSoh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="cycle" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="soh" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorSoh)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Notes Section */}
          <div className="lg:col-span-2">
            <Label htmlFor="notes">Notes & Observations</Label>
            {isEditing ? (
              <Textarea
                id="notes"
                placeholder="Add any notes or observations about this battery..."
                className="mt-2"
                rows={4}
              />
            ) : (
              <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                No notes available. Click Edit to add observations.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
