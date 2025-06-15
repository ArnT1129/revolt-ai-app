
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/Sidebar";
import LiquidGlassAI from "./components/LiquidGlassAI";
import LandingPageModal from "./components/LandingPageModal";

const queryClient = new QueryClient();

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLandingModal, setShowLandingModal] = useState(false);
  const [settings, setSettings] = useState({
    animations: true,
    compactView: false,
    theme: 'dark'
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('batteryAnalysisSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
    }

    // Listen for settings changes
    const handleSettingsChanged = (event: CustomEvent) => {
      setSettings(event.detail);
    };

    window.addEventListener('settingsChanged', handleSettingsChanged as EventListener);
    
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChanged as EventListener);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      setShowLandingModal(true);
      // Remove the demo parameter from URL
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('demo');
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  const getAppClasses = () => {
    let classes = "flex min-h-screen w-full bg-background relative";
    if (!settings.animations) classes += " no-animations";
    if (settings.compactView) classes += " compact-view";
    return classes;
  };

  return (
    <div className={getAppClasses()}>
      {/* Aurora Background */}
      <div className="aurora-background">
        <div className="aurora one"></div>
        <div className="aurora two"></div>
        <div className="aurora three"></div>
      </div>
      
      {/* Liquid Glass AI Background */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <LiquidGlassAI isActive={true} />
      </div>
      
      <div className="content-wrapper flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>

      <LandingPageModal 
        isOpen={showLandingModal} 
        onClose={() => setShowLandingModal(false)} 
      />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
