
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import SearchPage from "./pages/SearchPage";
import Settings from "./pages/Settings";
import CompanyManagement from "./pages/CompanyManagement";
import Review from "./pages/Review";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Comparison from "./pages/Comparison";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/Sidebar";
import LiquidGlassAI from "./components/LiquidGlassAI";
import LandingPageModal from "./components/LandingPageModal";
import OnboardingModal from "./components/OnboardingModal";
import ProtectedRoute from "./components/ProtectedRoute";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";

const queryClient = new QueryClient();

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLandingModal, setShowLandingModal] = useState(false);
  const { settings } = useSettings();

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
    if (!settings.animationsEnabled) classes += " no-animations";
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
      
      {/* Liquid Glass AI Background - improved z-index management */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <LiquidGlassAI isActive={settings.animationsEnabled} />
      </div>
      
      {/* Main content with higher z-index */}
      <div className="content-wrapper flex min-h-screen w-full relative z-[2]">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <CompanyProvider>
                <OnboardingProvider>
                  <Sidebar />
                  <div className="flex-1 flex flex-col">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/upload" element={<Upload />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/comparison" element={<Comparison />} />
                      <Route path="/review" element={<Review />} />
                      <Route path="/company" element={<CompanyManagement />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <OnboardingModal />
                </OnboardingProvider>
              </CompanyProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </div>

      {/* Modal with highest z-index */}
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
      <AuthProvider>
        <SettingsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
