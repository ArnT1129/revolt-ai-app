
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface AppSettings {
  // Analysis Settings
  defaultChemistry: string;
  voltageThreshold: number;
  capacityThreshold: number;
  temperatureUnit: string;
  
  // Data Processing
  autoDetectFormat: boolean;
  smoothingEnabled: boolean;
  outlierRemoval: boolean;
  interpolationMethod: string;
  
  // Display Settings
  darkMode: boolean;
  animationsEnabled: boolean;
  compactView: boolean;
  defaultView: string;
  
  // Export Settings
  exportFormat: string;
  includeMetadata: boolean;
  decimalPlaces: number;
  
  // Notifications
  analysisComplete: boolean;
  errorAlerts: boolean;
  emailNotifications: boolean;
  
  // Performance
  maxFileSize: number;
  parallelProcessing: boolean;
  cacheResults: boolean;
}

const defaultSettings: AppSettings = {
  defaultChemistry: "auto",
  voltageThreshold: 2.5,
  capacityThreshold: 80,
  temperatureUnit: "celsius",
  autoDetectFormat: true,
  smoothingEnabled: true,
  outlierRemoval: true,
  interpolationMethod: "linear",
  darkMode: false,
  animationsEnabled: true,
  compactView: false,
  defaultView: "table",
  exportFormat: "csv",
  includeMetadata: true,
  decimalPlaces: 3,
  analysisComplete: true,
  errorAlerts: true,
  emailNotifications: false,
  maxFileSize: 100,
  parallelProcessing: true,
  cacheResults: true,
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('batteryAnalysisSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Settings Load Error",
          description: "Failed to load saved settings. Using defaults.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Apply settings globally
  useEffect(() => {
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply animations
    if (!settings.animationsEnabled) {
      document.documentElement.classList.add('no-animations');
    } else {
      document.documentElement.classList.remove('no-animations');
    }

    // Store settings in global state for other components to access
    window.batteryAnalysisSettings = settings;
  }, [settings]);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('batteryAnalysisSettings', JSON.stringify(settings));
      
      // Apply settings immediately
      window.batteryAnalysisSettings = settings;
      
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

  const resetSettings = () => {
    try {
      localStorage.removeItem('batteryAnalysisSettings');
      setSettings(defaultSettings);
      
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

  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'battery-analysis-settings.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Settings Exported",
        description: "Settings have been exported to a JSON file.",
      });
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast({
        title: "Export Error",
        description: "Failed to export settings.",
        variant: "destructive"
      });
    }
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...importedSettings });
        
        toast({
          title: "Settings Imported",
          description: "Settings have been imported successfully.",
        });
      } catch (error) {
        console.error('Error importing settings:', error);
        toast({
          title: "Import Error",
          description: "Failed to import settings. Invalid file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-4 md:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading settings...</div>
        </div>
      </main>
    );
  }

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
                <p className="text-sm text-muted-foreground">Use dark theme</p>
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
                  <SelectItem value="table">Table View</SelectItem>
                  <SelectItem value="cards">Card View</SelectItem>
                  <SelectItem value="charts">Chart View</SelectItem>
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
                    <SelectItem value="pdf">PDF Report</SelectItem>
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

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Optimize system performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Maximum File Size (MB)</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={settings.maxFileSize}
                onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value) || 100)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Parallel Processing</Label>
                <p className="text-sm text-muted-foreground">Use multiple CPU cores for analysis</p>
              </div>
              <Switch
                checked={settings.parallelProcessing}
                onCheckedChange={(checked) => updateSetting('parallelProcessing', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cache Results</Label>
                <p className="text-sm text-muted-foreground">Store analysis results for faster access</p>
              </div>
              <Switch
                checked={settings.cacheResults}
                onCheckedChange={(checked) => updateSetting('cacheResults', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-4">
          <input
            type="file"
            accept=".json"
            onChange={importSettings}
            style={{ display: 'none' }}
            id="import-settings"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-settings')?.click()}>
            Import Settings
          </Button>
          <Button variant="outline" onClick={exportSettings}>
            Export Settings
          </Button>
          <Button variant="outline" onClick={resetSettings}>
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings}>
            Save Settings
          </Button>
        </div>
      </div>
    </main>
  );
}
