import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Battery } from "@/types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";
import { Edit, Save, X, Download, FileText, Thermometer, Zap, Activity, Battery as BatteryIcon } from "lucide-react";
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
  const [notes, setNotes] = useState("");

  if (!battery) return null;

  const handleEdit = () => {
    setEditedBattery({ ...battery });
    setNotes(battery.notes || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedBattery) {
      const updatedBattery = { ...editedBattery, notes };
      onSave(updatedBattery);
      setIsEditing(false);
      toast({
        title: "Battery Updated",
        description: "Battery passport information has been saved.",
      });
    }
  };

  const handleCancel = () => {
    setEditedBattery(null);
    setNotes("");
    setIsEditing(false);
  };

  const handleExportPDF = () => {
    toast({
      title: "Export Started",
      description: "Battery passport PDF is being generated...",
    });
  };

  const updateEditedBattery = (field: string, value: any) => {
    if (editedBattery) {
      setEditedBattery({ ...editedBattery, [field]: value });
    }
  };

  const updateMetrics = (field: string, value: any) => {
    if (editedBattery && editedBattery.metrics) {
      setEditedBattery({
        ...editedBattery,
        metrics: { ...editedBattery.metrics, [field]: value }
      });
    }
  };

  const currentBattery = isEditing ? editedBattery! : battery;
  const metrics = currentBattery.metrics;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batteryId">Battery ID</Label>
                {isEditing ? (
                  <Input
                    id="batteryId"
                    value={currentBattery.id}
                    onChange={(e) => updateEditedBattery('id', e.target.value)}
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
                    onChange={(e) => updateEditedBattery('chemistry', e.target.value)}
                  >
                    <option value="LFP">LFP</option>
                    <option value="NMC">NMC</option>
                    <option value="LCO">LCO</option>
                    <option value="NCA">NCA</option>
                  </select>
                ) : (
                  <p className="font-semibold p-2">{currentBattery.chemistry}</p>
                )}
              </div>
              <div>
                <Label>Grade</Label>
                {isEditing ? (
                  <select
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
                    value={currentBattery.grade}
                    onChange={(e) => updateEditedBattery('grade', e.target.value)}
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="D">Grade D</option>
                  </select>
                ) : (
                  <div className="mt-2">
                    <Badge className={cn("text-white", gradeColor[currentBattery.grade])}>
                      Grade {currentBattery.grade}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label>Status</Label>
                {isEditing ? (
                  <select
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
                    value={currentBattery.status}
                    onChange={(e) => updateEditedBattery('status', e.target.value)}
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Degrading">Degrading</option>
                    <option value="Critical">Critical</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                ) : (
                  <p className={cn("font-semibold mt-2", statusColor[currentBattery.status])}>
                    {currentBattery.status}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="uploadDate">Upload Date</Label>
              <p className="text-sm text-muted-foreground mt-1">{currentBattery.uploadDate}</p>
            </div>
          </div>

          {/* Core Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BatteryIcon className="h-5 w-5" />
              Core Performance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs text-muted-foreground">State of Health</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.1"
                    value={currentBattery.soh}
                    onChange={(e) => updateEditedBattery('soh', parseFloat(e.target.value))}
                    className="text-2xl font-bold h-auto p-1 mt-1"
                  />
                ) : (
                  <p className="text-2xl font-bold">{currentBattery.soh.toFixed(1)}%</p>
                )}
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs text-muted-foreground">Remaining Useful Life</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={currentBattery.rul}
                    onChange={(e) => updateEditedBattery('rul', parseInt(e.target.value))}
                    className="text-2xl font-bold h-auto p-1 mt-1"
                  />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{currentBattery.rul}</p>
                    <p className="text-xs text-muted-foreground">cycles</p>
                  </>
                )}
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs text-muted-foreground">Total Cycles</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={currentBattery.cycles}
                    onChange={(e) => updateEditedBattery('cycles', parseInt(e.target.value))}
                    className="text-2xl font-bold h-auto p-1 mt-1"
                  />
                ) : (
                  <p className="text-2xl font-bold">{currentBattery.cycles}</p>
                )}
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs text-muted-foreground">Capacity Retention</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.1"
                    value={metrics?.capacityRetention || 0}
                    onChange={(e) => updateMetrics('capacityRetention', parseFloat(e.target.value))}
                    className="text-2xl font-bold h-auto p-1 mt-1"
                  />
                ) : (
                  <p className="text-2xl font-bold">{metrics?.capacityRetention?.toFixed(1) || 'N/A'}%</p>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Analytics */}
          {metrics && (
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Advanced Analytics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Energy Efficiency</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={metrics.energyEfficiency}
                      onChange={(e) => updateMetrics('energyEfficiency', parseFloat(e.target.value))}
                      className="text-xl font-bold h-auto p-1 mt-1"
                    />
                  ) : (
                    <p className="text-xl font-bold">{metrics.energyEfficiency.toFixed(1)}%</p>
                  )}
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Power Fade Rate</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.001"
                      value={metrics.powerFadeRate}
                      onChange={(e) => updateMetrics('powerFadeRate', parseFloat(e.target.value))}
                      className="text-xl font-bold h-auto p-1 mt-1"
                    />
                  ) : (
                    <>
                      <p className="text-xl font-bold">{(metrics.powerFadeRate * 100).toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground">per cycle</p>
                    </>
                  )}
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Internal Resistance</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={metrics.internalResistance}
                      onChange={(e) => updateMetrics('internalResistance', parseFloat(e.target.value))}
                      className="text-xl font-bold h-auto p-1 mt-1"
                    />
                  ) : (
                    <>
                      <p className="text-xl font-bold">{metrics.internalResistance.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">mΩ</p>
                    </>
                  )}
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Peak Power</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={metrics.peakPower}
                      onChange={(e) => updateMetrics('peakPower', parseFloat(e.target.value))}
                      className="text-xl font-bold h-auto p-1 mt-1"
                    />
                  ) : (
                    <>
                      <p className="text-xl font-bold">{metrics.peakPower.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">W</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Efficiency Metrics */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Efficiency Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-3 rounded">
                      <Label className="text-xs text-muted-foreground">Charging Efficiency</Label>
                      <p className="text-lg font-semibold">{metrics.chargingEfficiency.toFixed(1)}%</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded">
                      <Label className="text-xs text-muted-foreground">Discharging Efficiency</Label>
                      <p className="text-lg font-semibold">{metrics.dischargingEfficiency.toFixed(1)}%</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded">
                      <Label className="text-xs text-muted-foreground">Energy Density</Label>
                      <p className="text-lg font-semibold">{metrics.energyDensity.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Wh/kg</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded">
                      <Label className="text-xs text-muted-foreground">Self-Discharge Rate</Label>
                      <p className="text-lg font-semibold">{metrics.selfDischargeRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                  </div>
                </div>

                {/* Environmental Metrics */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Environmental & Life Metrics
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-muted/30 p-3 rounded">
                      <Label className="text-xs text-muted-foreground">Temperature Range</Label>
                      <p className="text-sm font-semibold">
                        {metrics.temperatureRange.min.toFixed(1)}°C - {metrics.temperatureRange.max.toFixed(1)}°C
                      </p>
                      <p className="text-xs text-muted-foreground">Avg: {metrics.temperatureRange.avg.toFixed(1)}°C</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded">
                      <Label className="text-xs text-muted-foreground">Voltage Range</Label>
                      <p className="text-sm font-semibold">
                        {metrics.voltageRange.min.toFixed(2)}V - {metrics.voltageRange.max.toFixed(2)}V
                      </p>
                      <p className="text-xs text-muted-foreground">Avg: {metrics.voltageRange.avg.toFixed(2)}V</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 p-3 rounded">
                        <Label className="text-xs text-muted-foreground">Cycle Life</Label>
                        <p className="text-lg font-semibold">{metrics.cycleLife}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded">
                        <Label className="text-xs text-muted-foreground">Calendar Life</Label>
                        <p className="text-lg font-semibold">{metrics.calendarLife}</p>
                        <p className="text-xs text-muted-foreground">days</p>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded">
                      <Label className="text-xs text-muted-foreground">Thermal Stability</Label>
                      <p className="text-lg font-semibold">{metrics.thermalStability}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            ) : (
              <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
                {battery.notes || "No notes available. Click Edit to add observations."}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
