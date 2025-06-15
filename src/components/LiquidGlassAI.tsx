
import React, { useRef, useEffect, useState } from 'react';

interface LiquidGlassAIProps {
  isActive?: boolean;
  className?: string;
}

export default function LiquidGlassAI({ isActive = false, className = "" }: LiquidGlassAIProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Listen for dropdown state changes to pause particles
    const handleDropdownOpen = () => setIsDropdownOpen(true);
    const handleDropdownClose = () => setIsDropdownOpen(false);
    
    // Monitor for dropdown elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element && 
              (node.hasAttribute('data-radix-select-content') || 
               node.hasAttribute('data-radix-dropdown-menu-content') ||
               node.classList.contains('dropdown') ||
               node.querySelector('[role="listbox"]'))) {
            setIsDropdownOpen(true);
          }
        });
        
        mutation.removedNodes.forEach((node) => {
          if (node instanceof Element && 
              (node.hasAttribute('data-radix-select-content') || 
               node.hasAttribute('data-radix-dropdown-menu-content') ||
               node.classList.contains('dropdown') ||
               node.querySelector('[role="listbox"]'))) {
            setIsDropdownOpen(false);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Listen for ESC key to close dropdowns
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

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

    // Optimized particle system
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

    const colors = ['#3b82f6', '#06b6d4', '#4f46e5', '#8b5cf6'];
    const maxParticles = 20; // Reduced for better performance
    
    const initParticles = () => {
      if (isDestroyed) return;
      
      const rect = canvas.getBoundingClientRect();
      particles.length = 0;
      
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.2 + 0.05,
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

      // Skip animation if dropdown is open or not active
      if (isDropdownOpen || !isActive) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Update and draw particles with throttling
      particles.forEach((particle, index) => {
        if (isDestroyed) return;
        
        // Throttle particle updates for performance
        if (currentTime - particle.lastUpdate < 16) return; // ~60fps
        particle.lastUpdate = currentTime;
        
        // Move particles
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Gentle mouse interaction only when not over UI elements
        if (isActive && mousePos.x !== 0 && mousePos.y !== 0 && !isDropdownOpen) {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 60) {
            const force = (60 - distance) / 60;
            particle.vx += dx * force * 0.0002;
            particle.vy += dy * force * 0.0002;
          }
        }

        // Boundary bounce with damping
        if (particle.x < 0 || particle.x > rect.width) {
          particle.vx *= -0.7;
          particle.x = Math.max(0, Math.min(rect.width, particle.x));
        }
        if (particle.y < 0 || particle.y > rect.height) {
          particle.vy *= -0.7;
          particle.y = Math.max(0, Math.min(rect.height, particle.y));
        }

        // Enhanced damping
        particle.vx *= 0.995;
        particle.vy *= 0.995;

        // Draw particle with improved performance
        try {
          ctx.save();
          
          // Use simpler gradient for better performance
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          
          const alphaHex = Math.floor(particle.opacity * 60).toString(16).padStart(2, '0');
          gradient.addColorStop(0, `${particle.color}${alphaHex}`);
          gradient.addColorStop(1, `${particle.color}00`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();

          // Core particle
          const coreAlphaHex = Math.floor((particle.opacity + 0.1) * 120).toString(16).padStart(2, '0');
          ctx.fillStyle = `${particle.color}${coreAlphaHex}`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } catch (error) {
          // Silently handle rendering errors
        }

        // Draw connections (reduced for performance)
        if (!isDestroyed && index % 2 === 0) { // Only every other particle
          particles.slice(index + 1, index + 3).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 80) {
              try {
                ctx.save();
                const alpha = (80 - distance) / 80 * 0.03;
                ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
                ctx.lineWidth = 0.3;
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
      window.removeEventListener('resize', resizeHandler);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, mousePos, isDropdownOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDropdownOpen) return; // Don't track mouse when dropdown is open
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${isDropdownOpen ? 'pointer-events-none' : 'pointer-events-auto'} ${className}`}
      style={{ 
        background: 'transparent',
        mixBlendMode: 'screen',
        width: '100%',
        height: '100%',
        zIndex: isDropdownOpen ? -1 : 1 // Move behind when dropdown is open
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}
