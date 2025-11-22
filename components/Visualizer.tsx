import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isListening: boolean;
  analyserNode: AnalyserNode | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ isListening, analyserNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current || !isListening) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#f3f4f6'; // Tailwind gray-100 (bg)
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1e3a8a'; // Brand blue
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isListening, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full h-16 rounded-md bg-gray-100"
    />
  );
};

export default Visualizer;