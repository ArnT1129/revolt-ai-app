
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AppSettings {
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

export const defaultSettings: AppSettings = {
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

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  saveSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('batteryAnalysisSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Apply settings to document when they change
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    // Apply dark mode
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

    // Store settings globally for backward compatibility
    (window as any).batteryAnalysisSettings = settings;
    
    // Dispatch settings change event
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
  }, [settings]);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('batteryAnalysisSettings');
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('batteryAnalysisSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
