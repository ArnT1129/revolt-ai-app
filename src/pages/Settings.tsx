
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";

export default function Settings() {
  const { settings, updateSetting, resetSettings, saveSettings } = useSettings();

  const handleSaveSettings = async () => {
    try {
      saveSettings();
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
    }
  };

  const handleResetSettings = () => {
    try {
      resetSettings();
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

  return (
    <main className="flex-1 p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your battery analysis preferences and system settings.
          </p>
        </div>

        {/* Analysis Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Settings</CardTitle>
            <CardDescription>Configure default parameters for battery analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultChemistry">Default Battery Chemistry</Label>
                <Select value={settings.defaultChemistry} onValueChange={(value) => updateSetting('defaultChemistry', value)}>
                  <SelectTrigger>
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
                <Label htmlFor="voltageThreshold">Voltage Threshold (V)</Label>
                <Input
                  id="voltageThreshold"
                  type="number"
                  step="0.1"
                  value={settings.voltageThreshold}
                  onChange={(e) => updateSetting('voltageThreshold', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacityThreshold">SoH Threshold (%)</Label>
                <Input
                  id="capacityThreshold"
                  type="number"
                  value={settings.capacityThreshold}
                  onChange={(e) => updateSetting('capacityThreshold', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperatureUnit">Temperature Unit</Label>
                <Select value={settings.temperatureUnit} onValueChange={(value) => updateSetting('temperatureUnit', value)}>
                  <SelectTrigger>
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
        <Card>
          <CardHeader>
            <CardTitle>Data Processing</CardTitle>
            <CardDescription>Configure how uploaded data is processed and cleaned</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-detect File Format</Label>
                <p className="text-sm text-muted-foreground">Automatically detect Maccor, Arbin, Neware formats</p>
              </div>
              <Switch
                checked={settings.autoDetectFormat}
                onCheckedChange={(checked) => updateSetting('autoDetectFormat', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Smoothing</Label>
                <p className="text-sm text-muted-foreground">Apply smoothing algorithms to reduce noise</p>
              </div>
              <Switch
                checked={settings.smoothingEnabled}
                onCheckedChange={(checked) => updateSetting('smoothingEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Outlier Removal</Label>
                <p className="text-sm text-muted-foreground">Automatically remove statistical outliers</p>
              </div>
              <Switch
                checked={settings.outlierRemoval}
                onCheckedChange={(checked) => updateSetting('outlierRemoval', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Interpolation Method</Label>
              <Select value={settings.interpolationMethod} onValueChange={(value) => updateSetting('interpolationMethod', value)}>
                <SelectTrigger className="w-full md:w-[200px]">
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
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Customize the user interface appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme (applies immediately)</p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => updateSetting('darkMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Animations</Label>
                <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
              </div>
              <Switch
                checked={settings.animationsEnabled}
                onCheckedChange={(checked) => updateSetting('animationsEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact View</Label>
                <p className="text-sm text-muted-foreground">Use condensed layout for more data</p>
              </div>
              <Switch
                checked={settings.compactView}
                onCheckedChange={(checked) => updateSetting('compactView', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Default Dashboard View</Label>
              <Select value={settings.defaultView} onValueChange={(value) => updateSetting('defaultView', value)}>
                <SelectTrigger className="w-full md:w-[200px]">
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
        <Card>
          <CardHeader>
            <CardTitle>Export Settings</CardTitle>
            <CardDescription>Configure default export options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Export Format</Label>
                <Select value={settings.exportFormat} onValueChange={(value) => updateSetting('exportFormat', value)}>
                  <SelectTrigger>
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
                <Label>Decimal Places</Label>
                <Input
                  type="number"
                  min="0"
                  max="6"
                  value={settings.decimalPlaces}
                  onChange={(e) => updateSetting('decimalPlaces', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Metadata</Label>
                <p className="text-sm text-muted-foreground">Include analysis metadata in exports</p>
              </div>
              <Switch
                checked={settings.includeMetadata}
                onCheckedChange={(checked) => updateSetting('includeMetadata', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-4">
          <Button variant="outline" onClick={handleResetSettings}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>
      </div>
    </main>
  );
}
