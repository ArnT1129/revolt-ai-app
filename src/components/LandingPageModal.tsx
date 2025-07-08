
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Battery, Zap, Shield, BarChart3, Globe, Cpu } from "lucide-react";
import { Link } from "react-router-dom";

interface LandingPageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LandingPageModal({ isOpen, onClose }: LandingPageModalProps) {
  const features = [
    {
      icon: Battery,
      title: "Battery Passport Generation",
      description: "Create standardized digital passports for any battery type with comprehensive lifecycle data."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into battery performance, degradation patterns, and predictive maintenance."
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Automated grading system with detailed health assessments and remaining useful life predictions."
    },
    {
      icon: Globe,
      title: "Universal Compatibility",
      description: "Works with any battery chemistry and form factor - from consumer electronics to industrial storage."
    },
    {
      icon: Cpu,
      title: "AI-Powered Insights",
      description: "Machine learning algorithms detect anomalies and optimize battery performance automatically."
    },
    {
      icon: Zap,
      title: "Real-time Monitoring",
      description: "Live tracking of key metrics with instant alerts for critical performance changes."
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 border border-blue-500/30 text-white">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/91171b44-dc50-495d-8eaa-2d7b71a48b70.png" 
              alt="ReVolt Logo" 
              className="h-16 w-auto"
            />
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Welcome to ReVolt
          </DialogTitle>
          <p className="text-lg text-slate-300 mt-2">
            The Universal Battery Intelligence Platform
          </p>
        </DialogHeader>

        <div className="space-y-8">
          <div className="text-center">
            <p className="text-slate-200 text-lg leading-relaxed">
              Transform raw battery test data into standardized, analyzable outputs and generate 
              verifiable <span className="text-blue-400 font-semibold">Digital Battery Passports</span> 
              with advanced AI-powered insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <feature.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-300">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Ready to Get Started?</h3>
            <p className="text-slate-300 mb-4">
              Upload your battery data or create manual passports to begin generating insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/upload">
                <Button 
                  className="glass-button border-blue-500/40 hover:border-blue-400 px-6"
                  onClick={onClose}
                >
                  Create Your First Passport
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="glass-button border-white/20 hover:border-white/40 px-6"
                onClick={onClose}
              >
                Explore Dashboard
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
