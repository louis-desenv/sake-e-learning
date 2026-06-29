import React, { useEffect, useRef } from 'react';

/**
 * SimpleWaveVisualizer - Static Circular Particles
 * Solid dots in circle, color-coded by state, minimal movement
 */

interface SimpleWaveVisualizerProps {
  isInCall?: boolean;
  isListening?: boolean;
  isAgentSpeaking?: boolean;
  audioLevel?: number;
  theme?: 'cyan' | 'purple';
  className?: string;
}

export const SimpleWaveVisualizer: React.FC<SimpleWaveVisualizerProps> = ({
  isInCall = false,
  isListening = false,
  isAgentSpeaking = false,
  audioLevel = 0,
  theme = 'cyan',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Determine current state for colors
  const getState = () => {
    if (isAgentSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  // Colors for each state
  const stateColors = {
    idle: {
      primary: theme === 'cyan' ? { h: 185, s: 70, l: 65 } : { h: 270, s: 70, l: 65 },
      secondary: theme === 'cyan' ? { h: 195, s: 60, l: 75 } : { h: 280, s: 60, l: 75 },
    },
    listening: {
      primary: theme === 'cyan' ? { h: 175, s: 85, l: 50 } : { h: 260, s: 85, l: 50 },
      secondary: theme === 'cyan' ? { h: 190, s: 75, l: 60 } : { h: 275, s: 75, l: 60 },
    },
    speaking: {
      primary: { h: 215, s: 90, l: 55 }, // Blue quando IA fala
      secondary: { h: 200, s: 80, l: 65 },
    },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      return { width: rect.width, height: rect.height };
    };

    let { width, height } = resize();

    // 3D Sphere Particles
    const particleCount = 600;
    const particles: {
      x: number;
      y: number;
      z: number;
      baseSize: number;
    }[] = [];

    // Dynamic values that need recalculation on resize
    let baseRadius = Math.min(width, height) * 0.18;
    let centerX = width / 2;
    // Position: Stick to higher position (0.3) for consistency and better visibility
    let centerY = height * 0.3;

    // Initialize particles on a sphere (Fibonacci Sphere algorithm for even distribution)
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y); // radius at y

      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      particles.push({
        x: x * baseRadius,
        y: y * baseRadius,
        z: z * baseRadius,
        baseSize: 0.8 + Math.random() * 1.2, // Tiny dots: 0.8px - 2.0px
      });
    }

    // Animation constants
    let rotationX = 0;
    let rotationY = 0;
    let time = 0;
    let smoothLevel = 0;

    // Color transition state
    let currentH = 0;
    let currentS = 0;
    let currentL = 0;
    let initialized = false;

    // Helper for smooth interpolation
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const state = getState();
      const targetColors = stateColors[state].primary; // Just use primary for simplicity in 3D

      // Initialize colors on first run
      if (!initialized) {
        currentH = targetColors.h;
        currentS = targetColors.s;
        currentL = targetColors.l;
        initialized = true;
      }

      // Smoothly transition colors (very slow, organic)
      currentH = lerp(currentH, targetColors.h, 0.05);
      currentS = lerp(currentS, targetColors.s, 0.05);
      currentL = lerp(currentL, targetColors.l, 0.05);

      // Smooth audio level (Ultra-slow smooth)
      const targetLevel = Math.min(audioLevel / 255, 1);
      smoothLevel = lerp(smoothLevel, targetLevel, 0.015);

      // Time progression (Slower breathing)
      time += 0.008;

      // Rotate sphere - Speed up slightly when speaking
      const rotationSpeed = 0.002 + (smoothLevel * 0.004);
      rotationY += rotationSpeed;
      rotationX += rotationSpeed * 0.3;

      // ORGANIC BREATHING MATH
      // Base breath: Slow sine wave (-1 to 1)
      const breathCycle = Math.sin(time);

      // Amplitude: How "deep" the breath is. 
      // Idle: Shallow breath (0.02)
      // Speaking: Deeper breath (up to 0.10)
      const breathAmplitude = 0.02 + (smoothLevel * 0.08);

      // Final scale factor
      const breathingScale = 1 + (breathCycle * breathAmplitude);

      // Draw particles
      particles.forEach((p) => {
        // 1. Rotate Y
        let x = p.x * Math.cos(rotationY) - p.z * Math.sin(rotationY);
        let z = p.z * Math.cos(rotationY) + p.x * Math.sin(rotationY);

        // 2. Rotate X (subtle tilt)
        let y = p.y * Math.cos(rotationX) - z * Math.sin(rotationX);
        z = z * Math.cos(rotationX) + p.y * Math.sin(rotationX);

        // Apply organic breathing
        x *= breathingScale;
        y *= breathingScale;
        z *= breathingScale;

        // 3. Project to 2D (Perspective)
        const perspective = baseRadius * 2.5; // Distance from camera
        const scale = perspective / (perspective + z);

        const screenX = centerX + x * scale;
        const screenY = centerY + y * scale;

        // Visual properties
        const size = p.baseSize * scale;

        // Alpha based on depth
        const alphaDepth = (scale - 0.5) * 1.5;
        let finalAlpha = Math.max(0.1, Math.min(1, alphaDepth));

        // Slight shimmer based on audio
        if (state === 'speaking') {
          finalAlpha *= 0.8 + (Math.random() * 0.2 * smoothLevel);
        }

        // Depth coloring setup
        const depthFactor = (z / baseRadius + 1) / 2;
        const lightness = currentL + (1 - depthFactor) * 15; // Back is lighter/darker

        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${currentH}, ${currentS}%, ${lightness}%, ${finalAlpha})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      const size = resize();
      width = size.width;
      height = size.height;
      // Recalculate center positions on resize
      baseRadius = Math.min(width, height) * 0.18;
      centerX = width / 2;
      centerY = height * 0.3;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

  }, [audioLevel, isListening, isAgentSpeaking, isInCall, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block touch-none ${className}`}
    />
  );
};

export default SimpleWaveVisualizer;
