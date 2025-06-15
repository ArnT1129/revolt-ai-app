
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Upload, BarChart3, Zap } from 'lucide-react';

interface LandingPageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LandingPageModal({ isOpen, onClose }: LandingPageModalProps) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    onClose();
    navigate('/upload');
  };

  const handleViewDashboard = () => {
    onClose();
    navigate('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="enhanced-card max-w-2xl border-blue-500/40">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome to ReVolt AI Demo
          </DialogTitle>
          <DialogDescription className="text-lg text-slate-300 mt-4">
            Experience the power of the Universal Battery Intelligence Platform. 
            Upload your battery test data and watch our AI transform it into actionable insights.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Upload className="h-8 w-8 text-blue-400 mb-2" />
              <h4 className="font-semibold text-white">Upload Data</h4>
              <p className="text-sm text-slate-400">Any format, any cycler</p>
            </div>
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Zap className="h-8 w-8 text-cyan-400 mb-2" />
              <h4 className="font-semibold text-white">AI Analysis</h4>
              <p className="text-sm text-slate-400">Instant insights & grading</p>
            </div>
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <BarChart3 className="h-8 w-8 text-indigo-400 mb-2" />
              <h4 className="font-semibold text-white">Digital Passport</h4>
              <p className="text-sm text-slate-400">Verifiable certificates</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button 
              onClick={handleGetStarted}
              className="glass-button flex-1 py-6 text-lg font-semibold border-blue-500/40 hover:border-blue-400"
            >
              Start AI Analysis →
            </Button>
            <Button 
              onClick={handleViewDashboard}
              variant="outline"
              className="glass-button flex-1 py-6 text-lg border-cyan-500/40 hover:border-cyan-400"
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
