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
      t += 0.007;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const diag = Math.sqrt(W * W + H * H) / 2;

      // Layer 0: dark base fill
      ctx.fillStyle = "#010810";
      ctx.fillRect(0, 0, W, H);

      // Layer 1: primary blue — slow clockwise rotation
      const a1 = t * 0.22;
      const g1 = ctx.createLinearGradient(
        cx + Math.cos(a1) * diag, cy + Math.sin(a1) * diag,
        cx - Math.cos(a1) * diag, cy - Math.sin(a1) * diag
      );
      g1.addColorStop(0,    "rgba(2,8,22,1)");
      g1.addColorStop(0.28, "rgba(8,45,98,0.92)");
      g1.addColorStop(0.55, "rgba(4,18,50,0.80)");
      g1.addColorStop(0.78, "rgba(2,8,22,0.70)");
      g1.addColorStop(1,    "rgba(2,8,22,1)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      // Layer 2: deep forest green — counter-clockwise, slower
      const a2 = -t * 0.15 + 1.3;
      const greenIntensity = 0.55 + 0.30 * Math.sin(t * 0.55);
      const g2 = ctx.createLinearGradient(
        cx + Math.cos(a2) * diag, cy + Math.sin(a2) * diag,
        cx - Math.cos(a2) * diag, cy - Math.sin(a2) * diag
      );
      g2.addColorStop(0,    "rgba(2,14,10,0)");
      g2.addColorStop(0.35, `rgba(10,78,52,${greenIntensity})`);
      g2.addColorStop(0.60, `rgba(6,44,30,${greenIntensity * 0.55})`);
      g2.addColorStop(1,    "rgba(2,14,10,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // Layer 3: teal wash — diagonal, different phase
      const a3 = t * 0.13 + 0.9;
      const tealIntensity = 0.22 + 0.18 * Math.sin(t * 0.42 + 1.5);
      const g3 = ctx.createLinearGradient(
        cx + Math.cos(a3) * diag, cy + Math.sin(a3) * diag,
        cx - Math.cos(a3) * diag, cy - Math.sin(a3) * diag
      );
      g3.addColorStop(0,    "rgba(0,80,120,0)");
      g3.addColorStop(0.45, `rgba(0,110,150,${tealIntensity})`);
      g3.addColorStop(0.65, `rgba(0,90,100,${tealIntensity * 0.5})`);
      g3.addColorStop(1,    "rgba(0,80,120,0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, W, H);

      // Layer 4: slow navy pulse — nearly static, breathing
      const a4 = t * 0.08 + 2.2;
      const navyPulse = 0.40 + 0.22 * Math.sin(t * 0.30 + 0.7);
      const g4 = ctx.createLinearGradient(
        cx + Math.cos(a4) * diag, cy + Math.sin(a4) * diag,
        cx - Math.cos(a4) * diag, cy - Math.sin(a4) * diag
      );
      g4.addColorStop(0,    "rgba(5,30,90,0)");
      g4.addColorStop(0.50, `rgba(5,30,90,${navyPulse})`);
      g4.addColorStop(1,    "rgba(5,30,90,0)");
      ctx.fillStyle = g4;
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
