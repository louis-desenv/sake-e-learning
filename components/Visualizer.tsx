import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  color?: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, color = '#3b82f6' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let bars: number[] = Array(20).fill(10);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gap = 4;
      const barWidth = (canvas.width - (bars.length - 1) * gap) / bars.length;
      const centerY = canvas.height / 2;

      bars = bars.map((height) => {
        if (!isActive) return Math.max(height * 0.9, 4); // Decay to baseline
        // Random fluctuation for demo "liveness" if active, normally this binds to analyzer node
        const target = Math.random() * 40 + 10; 
        return height + (target - height) * 0.2;
      });

      bars.forEach((height, i) => {
        const x = i * (barWidth + gap);
        
        ctx.fillStyle = color;
        // Rounded bars
        ctx.beginPath();
        // Use rect if roundRect is not available in target env types, but standard modern browsers support it.
        if (ctx.roundRect) {
            ctx.roundRect(x, centerY - height / 2, barWidth, height, 4);
        } else {
            ctx.rect(x, centerY - height / 2, barWidth, height);
        }
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={80} 
      className="w-full max-w-[300px] h-[80px]"
    />
  );
};

export default Visualizer;
