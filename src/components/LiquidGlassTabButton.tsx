import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LiquidGlassTabButtonProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export default function LiquidGlassTabButton({ 
  children, 
  isActive = false, 
  onClick, 
  className = "",
  icon 
}: LiquidGlassTabButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isDestroyed = false;

    const resizeCanvas = () => {
      if (isDestroyed) return;
      
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    
    const resizeHandler = () => {
      requestAnimationFrame(resizeCanvas);
    };
    
    window.addEventListener('resize', resizeHandler);

    // Optimized particle system for tab buttons
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
      lastUpdate: number;
    }> = [];

    const colors = isActive 
      ? ['#8b5cf6', '#a855f7', '#c084fc', '#e879f9'] // Purple for active
      : ['#3b82f6', '#06b6d4', '#4f46e5', '#6366f1']; // Blue for inactive
    
    const maxParticles = isActive ? 15 : 8; // More particles for active state
    
    const initParticles = () => {
      if (isDestroyed) return;
      
      const rect = canvas.getBoundingClientRect();
      particles.length = 0;
      
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.3 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
          lastUpdate: 0
        });
      }
    };

    initParticles();

    const animate = (currentTime: number) => {
      if (isDestroyed) return;
      
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Only animate when hovered or active
      if (!isHovered && !isActive) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Update and draw particles
      particles.forEach((particle, index) => {
        if (isDestroyed) return;
        
        // Throttle particle updates
        if (currentTime - particle.lastUpdate < 20) return; // ~50fps for better performance
        particle.lastUpdate = currentTime;
        
        // Move particles
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Mouse interaction
        if (isHovered && mousePos.x !== 0 && mousePos.y !== 0) {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 40) {
            const force = (40 - distance) / 40;
            particle.vx += dx * force * 0.0003;
            particle.vy += dy * force * 0.0003;
          }
        }

        // Boundary bounce with damping
        if (particle.x < 0 || particle.x > rect.width) {
          particle.vx *= -0.8;
          particle.x = Math.max(0, Math.min(rect.width, particle.x));
        }
        if (particle.y < 0 || particle.y > rect.height) {
          particle.vy *= -0.8;
          particle.y = Math.max(0, Math.min(rect.height, particle.y));
        }

        // Enhanced damping
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Draw particle
        try {
          ctx.save();
          
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          
          const alphaHex = Math.floor(particle.opacity * 80).toString(16).padStart(2, '0');
          gradient.addColorStop(0, `${particle.color}${alphaHex}`);
          gradient.addColorStop(1, `${particle.color}00`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();

          // Core particle
          const coreAlphaHex = Math.floor((particle.opacity + 0.2) * 150).toString(16).padStart(2, '0');
          ctx.fillStyle = `${particle.color}${coreAlphaHex}`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } catch (error) {
          // Silently handle rendering errors
        }

        // Draw connections (only for active state or hovered)
        if ((isActive || isHovered) && index % 2 === 0) {
          particles.slice(index + 1, index + 2).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 60) {
              try {
                ctx.save();
                const alpha = (60 - distance) / 60 * 0.05;
                ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.stroke();
                ctx.restore();
              } catch (error) {
                // Silently handle rendering errors
              }
            }
          });
        }
      });

      if (!isDestroyed) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isDestroyed = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeHandler);
    };
  }, [isActive, isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg transition-all duration-300",
        isActive 
          ? "bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30" 
          : "bg-gradient-to-r from-slate-700/50 to-slate-600/50 border border-slate-600/30 hover:border-slate-500/50",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div className="relative z-10 flex items-center gap-2 px-4 py-3 text-sm font-medium">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className={cn(
          isActive ? "text-purple-100" : "text-slate-300 hover:text-white"
        )}>
          {children}
        </span>
      </div>
    </div>
  );
} 