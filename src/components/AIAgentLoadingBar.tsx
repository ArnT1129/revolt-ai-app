import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Activity, Brain, Cpu, Database, Zap, Sparkles } from 'lucide-react';

interface AIAgentLoadingBarProps {
  isActive: boolean;
  progress: number;
  analysisType: string;
}

export default function AIAgentLoadingBar({ isActive, progress, analysisType }: AIAgentLoadingBarProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const loadingWords = [
    { word: "Initializing", icon: Activity, color: "text-blue-400" },
    { word: "Loading Models", icon: Brain, color: "text-purple-400" },
    { word: "Training Neural Networks", icon: Cpu, color: "text-green-400" },
    { word: "Processing Data", icon: Database, color: "text-cyan-400" },
    { word: "Analyzing Patterns", icon: Zap, color: "text-yellow-400" },
    { word: "Generating Insights", icon: Sparkles, color: "text-pink-400" },
    { word: "Optimizing Results", icon: Brain, color: "text-indigo-400" },
    { word: "Finalizing Report", icon: Activity, color: "text-blue-400" }
  ];

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % loadingWords.length);
    }, 2000); // Change word every 2 seconds

    return () => clearInterval(interval);
  }, [isActive, loadingWords.length]);

  if (!isActive) return null;

  const currentWord = loadingWords[currentWordIndex];

  return (
    <div className="space-y-4 p-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-lg border border-slate-600/50 shadow-lg">
      {/* Rotating Words */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <currentWord.icon className={`h-6 w-6 ${currentWord.color} animate-pulse`} />
          <span className="text-white font-semibold text-xl">{currentWord.word}</span>
        </div>
        <div className="flex gap-1">
          {loadingWords.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentWordIndex 
                  ? 'bg-blue-400 scale-125' 
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300 font-medium">Progress</span>
          <span className="text-white font-bold text-lg">{progress}%</span>
        </div>
        <div className="relative">
          <Progress 
            value={progress} 
            className="h-4 bg-slate-700"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #10b981)',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 2s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-cyan-400/20 rounded-full animate-pulse"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      {/* Analysis Type Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <span className="text-slate-300">Analysis Type:</span>
          <span className="text-white font-medium capitalize">
            {analysisType.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-400 animate-pulse" />
          <span className="text-slate-300">Active</span>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="text-center">
        <div className="text-sm text-slate-400">
          Estimated completion: {Math.max(0, Math.ceil((100 - progress) / 10))} seconds remaining
        </div>
      </div>
    </div>
  );
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
document.head.appendChild(style); 