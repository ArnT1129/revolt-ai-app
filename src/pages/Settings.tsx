
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useEffect, useState } from "react";
import { Save, RotateCcw, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { settings, updateSetting, resetSettings, saveSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save settings when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasUnsavedChanges) {
        try {
          saveSettings();
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [settings, saveSettings, hasUnsavedChanges]);

  const handleSettingChange = (key: string, value: any) => {
    updateSetting(key as any, value);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await saveSettings();
      setHasUnsavedChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    try {
      resetSettings();
      setHasUnsavedChanges(false);
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to defaults.",
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Reset Error",
        description: "Failed to reset settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVoltageThresholdChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
      handleSettingChange('voltageThreshold', numValue);
    }
  };

  const handleCapacityThresholdChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      handleSettingChange('capacityThreshold', numValue);
    }
  };

  const handleDecimalPlacesChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 6) {
      handleSettingChange('decimalPlaces', numValue);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SettingsIcon className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-slate-400">
            Configure your battery analysis preferences and system settings.
          </p>
          {hasUnsavedChanges && (
            <div className="mt-2 text-amber-400 text-sm">
              You have unsaved changes
            </div>
          )}
        </div>

        {/* Analysis Settings */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Analysis Settings</CardTitle>
            <CardDescription className="text-slate-400">
              Configure default parameters for battery analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultChemistry" className="text-white">Default Battery Chemistry</Label>
                <Select 
                  value={settings.defaultChemistry} 
                  onValueChange={(value) => handleSettingChange('defaultChemistry', value)}
                >
                  <SelectTrigger className="glass-button">
                    <SelectValue placeholder="Select chemistry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="NMC">NMC</SelectItem>
                    <SelectItem value="LFP">LFP</SelectItem>
                    <SelectItem value="LCO">LCO</SelectItem>
                    <SelectItem value="NCA">NCA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voltageThreshold" className="text-white">Voltage Threshold (V)</Label>
                <Input
                  id="voltageThreshold"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={settings.voltageThreshold}
                  onChange={(e) => handleVoltageThresholdChange(e.target.value)}
                  className="glass-button"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacityThreshold" className="text-white">SoH Threshold (%)</Label>
                <Input
                  id="capacityThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.capacityThreshold}
                  onChange={(e) => handleCapacityThresholdChange(e.target.value)}
                  className="glass-button"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperatureUnit" className="text-white">Temperature Unit</Label>
                <Select 
                  value={settings.temperatureUnit} 
                  onValueChange={(value) => handleSettingChange('temperatureUnit', value)}
                >
                  <SelectTrigger className="glass-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">Celsius (°C)</SelectItem>
                    <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                    <SelectItem value="kelvin">Kelvin (K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Processing */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Data Processing</CardTitle>
            <CardDescription className="text-slate-400">
              Configure how uploaded data is processed and cleaned
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Auto-detect File Format</Label>
                <p className="text-sm text-slate-400">Automatically detect Maccor, Arbin, Neware formats</p>
              </div>
              <Switch
                checked={settings.autoDetectFormat}
                onCheckedChange={(checked) => handleSettingChange('autoDetectFormat', checked)}
              />
            </div>
            
            <Separator className="bg-slate-600" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Data Smoothing</Label>
                <p className="text-sm text-slate-400">Apply smoothing algorithms to reduce noise</p>
              </div>
              <Switch
                checked={settings.smoothingEnabled}
                onCheckedChange={(checked) => handleSettingChange('smoothingEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Outlier Removal</Label>
                <p className="text-sm text-slate-400">Automatically remove statistical outliers</p>
              </div>
              <Switch
                checked={settings.outlierRemoval}
                onCheckedChange={(checked) => handleSettingChange('outlierRemoval', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Interpolation Method</Label>
              <Select 
                value={settings.interpolationMethod} 
                onValueChange={(value) => handleSettingChange('interpolationMethod', value)}
              >
                <SelectTrigger className="w-full md:w-[200px] glass-button">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="cubic">Cubic Spline</SelectItem>
                  <SelectItem value="polynomial">Polynomial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Display Settings</CardTitle>
            <CardDescription className="text-slate-400">
              Customize the user interface appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Dark Mode</Label>
                <p className="text-sm text-slate-400">Use dark theme (applies immediately)</p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Animations</Label>
                <p className="text-sm text-slate-400">Enable smooth transitions and animations</p>
              </div>
              <Switch
                checked={settings.animationsEnabled}
                onCheckedChange={(checked) => handleSettingChange('animationsEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Compact View</Label>
                <p className="text-sm text-slate-400">Use condensed layout for more data</p>
              </div>
              <Switch
                checked={settings.compactView}
                onCheckedChange={(checked) => handleSettingChange('compactView', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Default Dashboard View</Label>
              <Select 
                value={settings.defaultView} 
                onValueChange={(value) => handleSettingChange('defaultView', value)}
              >
                <SelectTrigger className="w-full md:w-[200px] glass-button">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fleet">Fleet View</SelectItem>
                  <SelectItem value="analytics">Analytics View</SelectItem>
                  <SelectItem value="comparison">Comparison View</SelectItem>
                  <SelectItem value="export">Export View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Export Settings */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Export Settings</CardTitle>
            <CardDescription className="text-slate-400">
              Configure default export options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Default Export Format</Label>
                <Select 
                  value={settings.exportFormat} 
                  onValueChange={(value) => handleSettingChange('exportFormat', value)}
                >
                  <SelectTrigger className="glass-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Decimal Places</Label>
                <Input
                  type="number"
                  min="0"
                  max="6"
                  value={settings.decimalPlaces}
                  onChange={(e) => handleDecimalPlacesChange(e.target.value)}
                  className="glass-button"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Include Metadata</Label>
                <p className="text-sm text-slate-400">Include analysis metadata in exports</p>
              </div>
              <Switch
                checked={settings.includeMetadata}
                onCheckedChange={(checked) => handleSettingChange('includeMetadata', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white">Notifications</CardTitle>
            <CardDescription className="text-slate-400">
              Configure alert and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Analysis Complete Notifications</Label>
                <p className="text-sm text-slate-400">Get notified when analysis is complete</p>
              </div>
              <Switch
                checked={settings.analysisComplete}
                onCheckedChange={(checked) => handleSettingChange('analysisComplete', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Error Alerts</Label>
                <p className="text-sm text-slate-400">Show alerts for errors and issues</p>
              </div>
              <Switch
                checked={settings.errorAlerts}
                onCheckedChange={(checked) => handleSettingChange('errorAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Email Notifications</Label>
                <p className="text-sm text-slate-400">Receive notifications via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
            className="glass-button"
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSaveSettings}
            className="glass-button"
            disabled={isLoading || !hasUnsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </main>
  );
}
