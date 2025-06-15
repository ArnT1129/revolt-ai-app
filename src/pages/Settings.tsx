
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
  defaultView: "fleet",
  exportFormat: "csv",
  includeMetadata: true,
  decimalPlaces: 3,
  analysisComplete: true,
  errorAlerts: true,
  emailNotifications: false,
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
    const htmlElement = document.documentElement;
    if (settings.darkMode) {
      htmlElement.classList.add('dark');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.colorScheme = 'light';
    }

    // Apply animations setting
    if (!settings.animationsEnabled) {
      htmlElement.style.setProperty('--transition-duration', '0s');
      htmlElement.classList.add('no-animations');
    } else {
      htmlElement.style.removeProperty('--transition-duration');
      htmlElement.classList.remove('no-animations');
    }

    // Apply compact view
    if (settings.compactView) {
      htmlElement.style.setProperty('--spacing-unit', '0.5rem');
      htmlElement.style.setProperty('--card-padding', '0.75rem');
      htmlElement.classList.add('compact-view');
    } else {
      htmlElement.style.setProperty('--spacing-unit', '1rem');
      htmlElement.style.setProperty('--card-padding', '1.5rem');
      htmlElement.classList.remove('compact-view');
    }

    // Store settings globally
    (window as any).batteryAnalysisSettings = settings;
    
    // Dispatch settings change event
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
  }, [settings]);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('batteryAnalysisSettings', JSON.stringify(settings));
      (window as any).batteryAnalysisSettings = settings;
      
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
