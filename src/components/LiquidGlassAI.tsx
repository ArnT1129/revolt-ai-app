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

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
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
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 4 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Move particles
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Mouse interaction
        if (isActive) {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / 100;
            particle.vx += dx * force * 0.001;
            particle.vy += dy * force * 0.001;
          }
        }

        // Boundary bounce
        if (particle.x < 0 || particle.x > canvas.offsetWidth) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.offsetHeight) particle.vy *= -1;

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.offsetWidth, particle.x));
        particle.y = Math.max(0, Math.min(canvas.offsetHeight, particle.y));

        // Damping
        particle.vx *= 0.999;
        particle.vy *= 0.999;

        // Draw particle with glow effect
        ctx.save();
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 4
        );
        gradient.addColorStop(0, `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${particle.color}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = `${particle.color}${Math.floor((particle.opacity + 0.3) * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw connections
        particles.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.save();
            const alpha = (120 - distance) / 120 * 0.1;
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      // Add flowing liquid effect
      const time_s = time * 0.001;
      ctx.save();
      
      // Create flowing gradients
      const flowGradient = ctx.createLinearGradient(
        0, 0, canvas.offsetWidth, canvas.offsetHeight
      );
      
      const wave1 = Math.sin(time_s * 0.5) * 0.3 + 0.3;
      const wave2 = Math.sin(time_s * 0.7 + Math.PI) * 0.3 + 0.3;
      
      flowGradient.addColorStop(0, `rgba(59, 130, 246, ${wave1 * 0.05})`);
      flowGradient.addColorStop(0.5, `rgba(6, 182, 212, ${wave2 * 0.08})`);
      flowGradient.addColorStop(1, `rgba(79, 70, 229, ${wave1 * 0.05})`);
      
      ctx.fillStyle = flowGradient;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
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
        mixBlendMode: 'screen'
      }}
      onMouseMove={handleMouseMove}
    />
  );
}
