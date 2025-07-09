
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, X, Lightbulb } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';

export default function OnboardingModal() {
  const {
    steps,
    currentStep,
    showOnboarding,
    nextStep,
    prevStep,
    completeStep,
    skipOnboarding,
  } = useOnboarding();

  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (!showOnboarding || !steps.length) return null;

  const current = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    setIsTransitioning(true);
    await completeStep(current.id);
    
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        nextStep();
      }
      setIsTransitioning(false);
    }, 300);
  };

  const handleAction = () => {
    if (current.action) {
      if (current.id === 'create-passport') {
        navigate('/upload');
      } else if (current.id === 'search') {
        navigate('/search');
      } else if (current.id === 'settings') {
        navigate('/settings');
      }
      completeStep(current.id);
    }
  };

  return (
    <Dialog open={showOnboarding} onOpenChange={() => {}}>
      <DialogContent className="enhanced-card max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-400" />
              Getting Started with ReVolt
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Step {currentStep + 1} of {steps.length}</span>
              <Badge variant="secondary">{Math.round(progress)}% Complete</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className={`space-y-4 transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {current.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-blue-400 flex items-center justify-center">
                    <span className="text-xs text-blue-400">{currentStep + 1}</span>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-white">{current.title}</h3>
            </div>

            <p className="text-slate-300 leading-relaxed ml-9">
              {current.description}
            </p>

            {current.action && (
              <div className="ml-9">
                <Button
                  onClick={handleAction}
                  variant="outline"
                  className="glass-button border-blue-500/40 hover:border-blue-400"
                >
                  {current.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="glass-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={skipOnboarding}
                className="glass-button"
              >
                Skip Tour
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isTransitioning}
                  className="glass-button bg-blue-500/20 border-blue-400/50 hover:bg-blue-500/30"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={skipOnboarding}
                  className="glass-button bg-green-500/20 border-green-400/50 hover:bg-green-500/30"
                >
                  Complete Tour
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
