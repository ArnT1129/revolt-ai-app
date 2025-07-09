
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  completed: boolean;
}

interface OnboardingContextType {
  steps: OnboardingStep[];
  currentStep: number;
  isOnboardingComplete: boolean;
  showOnboarding: boolean;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (stepId: string) => void;
  skipOnboarding: () => void;
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ReVolt',
    description: 'Your comprehensive battery intelligence platform for monitoring, analyzing, and optimizing battery performance.',
    completed: false,
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'View your battery fleet statistics, health metrics, and critical alerts at a glance.',
    completed: false,
  },
  {
    id: 'create-passport',
    title: 'Create Battery Passport',
    description: 'Upload battery data or create manual entries to start monitoring your battery fleet.',
    action: 'Go to Upload page',
    completed: false,
  },
  {
    id: 'search',
    title: 'Search & Analytics',
    description: 'Use our advanced search and filtering tools to find specific batteries and analyze performance trends.',
    action: 'Visit Search page',
    completed: false,
  },
  {
    id: 'companies',
    title: 'Company Management',
    description: 'Create or join companies to collaborate with your team on battery management.',
    completed: false,
  },
  {
    id: 'settings',
    title: 'Customize Settings',
    description: 'Personalize your experience with theme preferences, notifications, and default views.',
    action: 'Visit Settings',
    completed: false,
  },
];

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', error);
        return;
      }

      if (!data) {
        // Create onboarding record for new user
        await supabase
          .from('user_onboarding')
          .insert({
            user_id: user.id,
            completed_steps: [],
            is_completed: false,
          });
        
        setShowOnboarding(true);
      } else {
        const completedStepIds = data.completed_steps as string[] || [];
        const updatedSteps = steps.map(step => ({
          ...step,
          completed: completedStepIds.includes(step.id)
        }));
        
        setSteps(updatedSteps);
        setIsOnboardingComplete(data.is_completed || false);
        
        if (!data.is_completed && completedStepIds.length < steps.length) {
          setShowOnboarding(true);
          setCurrentStep(completedStepIds.length);
        }
      }
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeStep = async (stepId: string) => {
    if (!user) return;

    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );
    setSteps(updatedSteps);

    const completedSteps = updatedSteps.filter(step => step.completed).map(step => step.id);
    const allCompleted = completedSteps.length === steps.length;

    try {
      await supabase
        .from('user_onboarding')
        .update({
          completed_steps: completedSteps,
          is_completed: allCompleted,
        })
        .eq('user_id', user.id);

      if (allCompleted) {
        setIsOnboardingComplete(true);
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;

    try {
      const allStepIds = steps.map(step => step.id);
      await supabase
        .from('user_onboarding')
        .update({
          completed_steps: allStepIds,
          is_completed: true,
        })
        .eq('user_id', user.id);

      setIsOnboardingComplete(true);
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const startOnboarding = () => {
    setShowOnboarding(true);
    setCurrentStep(0);
  };

  const value = {
    steps,
    currentStep,
    isOnboardingComplete,
    showOnboarding,
    nextStep,
    prevStep,
    completeStep,
    skipOnboarding,
    startOnboarding,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};
