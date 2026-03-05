import React, { useEffect, useRef, useMemo } from 'react';

/**
 * AudioVisualizer - Animated audio waves
 *
 * Inspired by Spotify/iOS music visualizers:
 * - Smooth, flowing wave motion
 * - Always animated (idle breathing effect)
 * - Reacts to audio when speaking
 * - Natural gradient colors
 */

interface AudioVisualizerProps {
  isListening?: boolean;
  isAgentSpeaking?: boolean;
  audioLevel?: number;
  theme?: 'purple' | 'blue' | 'mixed';
  bars?: number;
  speed?: number;
  className?: string;
  isConnected?: boolean; // Se true, ondas estáticas
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening = false,
  isAgentSpeaking = false,
  audioLevel = 0,
  theme = 'mixed',
  bars = 40,
  speed = 1,
  className = '',
  isConnected = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Smooth audio level with decay
  const currentLevelRef = useRef(0);
  const targetLevelRef = useRef(0);

  // Colors
  const colors = useMemo(() => {
    if (theme === 'purple') {
      return { primary: '#a855f7', secondary: '#c084fc', glow: 'rgba(192, 132, 252, 0.5)' };
    }
    if (theme === 'blue') {
      return { primary: '#3b82f6', secondary: '#60a5fa', glow: 'rgba(96, 165, 250, 0.5)' };
    }
    return {
      primary: isAgentSpeaking ? '#3b82f6' : '#a855f7',
      secondary: isAgentSpeaking ? '#60a5fa' : '#c084fc',
      glow: isAgentSpeaking ? 'rgba(96, 165, 250, 0.5)' : 'rgba(192, 132, 252, 0.5)'
    };
  }, [theme, isAgentSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      return { width: rect.width, height: rect.height };
    };

    let { width, height } = updateSize();

    const handleResize = () => {
      const size = updateSize();
      width = size.width;
      height = size.height;
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      timeRef.current += 0.016 * speed;

      // Se conectado, força zero imediatamente (sem reação à voz)
      if (isConnected) {
        currentLevelRef.current = 0;
      } else {
        // Smooth level transitions with faster attack, slower decay
        const attackSpeed = 0.4;
        const decaySpeed = 0.1;

        if (audioLevel > currentLevelRef.current) {
          currentLevelRef.current += (audioLevel - currentLevelRef.current) * attackSpeed;
        } else {
          currentLevelRef.current += (audioLevel - currentLevelRef.current) * decaySpeed;
        }
      }

      ctx.clearRect(0, 0, width, height);

      const barWidth = width / bars;
      const maxBarHeight = height * 0.5;
      const gap = 2;

      const normalizedLevel = Math.min(currentLevelRef.current / 100, 1);

      for (let i = 0; i < bars; i++) {
        const position = (i / bars) * 2 - 1;

        const time = timeRef.current;

        // Ondas sempre animando
        const baseWave =
          Math.sin(time * 2 + position * 3) * 0.3 +
          Math.sin(time * 1.3 + position * 5) * 0.2 +
          Math.cos(time * 0.7 + position * 2) * 0.15;

        let intensity = Math.abs(baseWave);

        // Audio boost SÓ quando não está conectado
        if (!isConnected) {
          intensity += normalizedLevel * 0.6;
        }

        // Bell curve
        const bellCurve = Math.exp(-position * position * 2);
        intensity *= bellCurve;

        // Variação para ficar orgânico
        intensity += Math.sin(time * 1.5 + i * 0.3) * 0.1;

        // Clamp
        intensity = Math.max(0.08, Math.min(0.95, intensity));

        const barHeight = intensity * maxBarHeight;
        const x = i * barWidth + gap / 2;
        const actualBarWidth = barWidth - gap;
        const y = (height - barHeight) / 2;

        // Gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, colors.secondary);
        gradient.addColorStop(0.5, colors.primary);
        gradient.addColorStop(1, colors.secondary);

        // Glow when active
        if (normalizedLevel > 0.01) {
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = 8 + normalizedLevel * 12;
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw bar
        const radius = Math.min(actualBarWidth / 2, 4);

        ctx.beginPath();
        ctx.roundRect(x, y, actualBarWidth, barHeight, radius);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bars, colors, isListening, isAgentSpeaking, audioLevel, speed, isConnected]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
};

export const AudioPulse: React.FC<{
  isPulsing?: boolean;
  color?: string;
  size?: number;
  className?: string;
}> = ({
  isPulsing = true,
  color = '#a855f7',
  size = 120,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {isPulsing && (
        <>
          <div
            className="absolute inset-0 rounded-full opacity-30 animate-ping"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute inset-2 rounded-full animate-pulse"
            style={{ backgroundColor: color, opacity: 0.4 }}
          />
        </>
      )}
      <div
        className="relative rounded-full shadow-xl"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          background: `radial-gradient(circle at 30% 30%, ${color}dd, ${color})`,
        }}
      />
    </div>
  );
};

export default AudioVisualizer;
