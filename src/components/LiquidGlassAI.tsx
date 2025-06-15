import React, { useRef, useEffect, useState } from 'react';

interface LiquidGlassAIProps {
  isActive?: boolean;
  className?: string;
}

export default function LiquidGlassAI({ isActive = false, className = "" }: LiquidGlassAIProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isDestroyed = false;

    const resizeCanvas = () => {
      if (isDestroyed) return;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Liquid glass particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];

    const colors = ['#3b82f6', '#06b6d4', '#4f46e5', '#8b5cf6'];
    
    // Initialize particles
    const initParticles = () => {
      if (isDestroyed) return;
      
      const rect = canvas.getBoundingClientRect();
      particles.length = 0; // Clear existing particles
      
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.3 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    initParticles();

    const animate = () => {
      if (isDestroyed) return;
      
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Update and draw particles
      particles.forEach((particle, index) => {
        if (isDestroyed) return;
        
        // Move particles
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Mouse interaction
        if (isActive && mousePos.x !== 0 && mousePos.y !== 0) {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 80) {
            const force = (80 - distance) / 80;
            particle.vx += dx * force * 0.0005;
            particle.vy += dy * force * 0.0005;
          }
        }

        // Boundary bounce
        if (particle.x < 0 || particle.x > rect.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > rect.height) particle.vy *= -0.8;

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(rect.width, particle.x));
        particle.y = Math.max(0, Math.min(rect.height, particle.y));

        // Damping
        particle.vx *= 0.998;
        particle.vy *= 0.998;

        // Draw particle with glow effect
        try {
          ctx.save();
          
          // Outer glow
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 3
          );
          
          const alphaHex = Math.floor(particle.opacity * 80).toString(16).padStart(2, '0');
          gradient.addColorStop(0, `${particle.color}${alphaHex}`);
          gradient.addColorStop(1, `${particle.color}00`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
          ctx.fill();

          // Inner core
          const coreAlphaHex = Math.floor((particle.opacity + 0.2) * 150).toString(16).padStart(2, '0');
          ctx.fillStyle = `${particle.color}${coreAlphaHex}`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } catch (error) {
          // Silently handle any rendering errors
        }

        // Draw connections
        if (!isDestroyed) {
          particles.slice(index + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              try {
                ctx.save();
                const alpha = (100 - distance) / 100 * 0.05;
                ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.stroke();
                ctx.restore();
              } catch (error) {
                // Silently handle any rendering errors
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
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ 
        background: 'transparent',
        mixBlendMode: 'screen',
        width: '100%',
        height: '100%'
      }}
      onMouseMove={handleMouseMove}
    />
  );
}
