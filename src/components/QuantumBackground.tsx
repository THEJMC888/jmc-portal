"use client";
import { useEffect, useRef } from "react";

export default function QuantumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.006;
      const W = canvas.width;
      const H = canvas.height;

      // Four independent sine waves — incommensurate periods so it never feels repetitive
      const w1 = (Math.sin(t * 0.41)        + 1) * 0.5;
      const w2 = (Math.sin(t * 0.29 + 1.1)  + 1) * 0.5;
      const w3 = (Math.sin(t * 0.53 + 2.3)  + 1) * 0.5;
      const w4 = (Math.cos(t * 0.37 + 0.7)  + 1) * 0.5;
      const w5 = (Math.sin(t * 0.19 + 3.1)  + 1) * 0.5;

      // Gradient angle tilts gently — mostly vertical to keep navy-top / green-bottom
      const tilt = Math.sin(t * 0.18) * 0.18 + Math.sin(t * 0.27) * 0.08;
      const cx = W / 2, cy = H / 2;
      const len = Math.sqrt(W * W + H * H) * 0.55;
      const baseAngle = Math.PI * 0.5; // straight down
      const a = baseAngle + tilt;

      // Single full-canvas gradient — NO transparency at any stop
      const grad = ctx.createLinearGradient(
        cx - Math.cos(a) * len, cy - Math.sin(a) * len,  // "top"
        cx + Math.cos(a) * len, cy + Math.sin(a) * len   // "bottom"
      );

      // Top zone: very dark with hints of navy
      grad.addColorStop(0.00, `rgb(1,6,14)`);
      grad.addColorStop(0.10, `rgb(${2+Math.round(w5*4)},${10+Math.round(w5*14)},${28+Math.round(w5*18)})`);

      // Upper navy zone — richness pulses
      const navyG = Math.round(28 + w1 * 32);
      const navyB = Math.round(88 + w1 * 48);
      grad.addColorStop(0.28, `rgb(${4+Math.round(w2*6)},${navyG},${navyB})`);

      // Mid zone — this is where variance is most visible; swings between blue and teal
      const midR = Math.round(3 + w3 * 8);
      const midG = Math.round(35 + w2 * 55 + w4 * 20);
      const midB = Math.round(55 + w1 * 35 - w3 * 25);
      grad.addColorStop(0.50, `rgb(${midR},${midG},${midB})`);

      // Lower green zone — depth and richness vary
      const greenG = Math.round(65 + w4 * 35);
      const greenB = Math.round(42 + w5 * 20);
      grad.addColorStop(0.72, `rgb(${5+Math.round(w3*7)},${greenG},${greenB})`);

      // Bottom zone: deep forest, dark
      grad.addColorStop(0.88, `rgb(${3+Math.round(w1*5)},${42+Math.round(w2*18)},${28+Math.round(w2*12)})`);
      grad.addColorStop(1.00, `rgb(1,8,12)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Subtle diagonal shimmer — second pass, fully opaque mid-tones, very low contrast
      const shimAngle = t * 0.11 + Math.sin(t * 0.23) * 0.4;
      const shimLen = Math.max(W, H) * 0.9;
      const sx = cx + Math.cos(shimAngle) * shimLen;
      const sy = cy + Math.sin(shimAngle) * shimLen;
      const shimmer = ctx.createLinearGradient(sx, sy, cx * 2 - sx, cy * 2 - sy);
      const shimAlpha = 0.06 + 0.04 * Math.sin(t * 0.44);
      shimmer.addColorStop(0,    `rgba(5,45,110,0)`);
      shimmer.addColorStop(0.42, `rgba(5,45,110,${shimAlpha})`);
      shimmer.addColorStop(0.58, `rgba(8,80,60,${shimAlpha * 0.6})`);
      shimmer.addColorStop(1,    `rgba(8,80,60,0)`);
      ctx.fillStyle = shimmer;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
    />
  );
}
