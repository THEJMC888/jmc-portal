"use client";
import { useEffect, useRef } from "react";

type Blob = {
  bx: number; by: number;
  dxAmp: number; dyAmp: number;
  dxPhase: number; dyPhase: number;
  dxSpeed: number; dySpeed: number;
  rx: number; ry: number;
  r: number; g: number; b: number;
  baseAlpha: number;
  alphaPhase: number;
  alphaSpeed: number;
};

const BLOBS: Blob[] = [
  // Deep navy — upper left, large anchor
  { bx: 0.10, by: 0.16, dxAmp: 0.07, dyAmp: 0.06, dxPhase: 0,   dyPhase: 1.2, dxSpeed: 0.28, dySpeed: 0.22,
    rx: 0.65, ry: 0.60, r: 6,  g: 28,  b: 95,  baseAlpha: 0.90, alphaPhase: 0,   alphaSpeed: 0.3 },
  // Forest green — lower right
  { bx: 0.88, by: 0.84, dxAmp: 0.06, dyAmp: 0.07, dxPhase: 2.0, dyPhase: 0.5, dxSpeed: 0.22, dySpeed: 0.25,
    rx: 0.58, ry: 0.56, r: 8,  g: 72,  b: 52,  baseAlpha: 0.82, alphaPhase: 2.1, alphaSpeed: 0.25 },
  // Ocean teal — upper right
  { bx: 0.76, by: 0.20, dxAmp: 0.06, dyAmp: 0.05, dxPhase: 1.1, dyPhase: 3.0, dxSpeed: 0.35, dySpeed: 0.30,
    rx: 0.50, ry: 0.46, r: 0,  g: 110, b: 168, baseAlpha: 0.68, alphaPhase: 1.2, alphaSpeed: 0.38 },
  // Deep indigo — lower left
  { bx: 0.20, by: 0.78, dxAmp: 0.05, dyAmp: 0.06, dxPhase: 3.4, dyPhase: 1.8, dxSpeed: 0.30, dySpeed: 0.28,
    rx: 0.46, ry: 0.44, r: 45, g: 4,   b: 110, baseAlpha: 0.62, alphaPhase: 3.5, alphaSpeed: 0.28 },
  // Bright teal center pulse
  { bx: 0.50, by: 0.50, dxAmp: 0.04, dyAmp: 0.04, dxPhase: 0.6, dyPhase: 2.4, dxSpeed: 0.45, dySpeed: 0.40,
    rx: 0.36, ry: 0.34, r: 0,  g: 165, b: 220, baseAlpha: 0.30, alphaPhase: 1.8, alphaSpeed: 0.50 },
  // Mid navy — left center
  { bx: 0.14, by: 0.52, dxAmp: 0.05, dyAmp: 0.06, dxPhase: 1.8, dyPhase: 0.2, dxSpeed: 0.32, dySpeed: 0.26,
    rx: 0.40, ry: 0.38, r: 4,  g: 44,  b: 130, baseAlpha: 0.55, alphaPhase: 0.8, alphaSpeed: 0.33 },
  // Emerald — right center
  { bx: 0.82, by: 0.46, dxAmp: 0.05, dyAmp: 0.05, dxPhase: 2.6, dyPhase: 1.4, dxSpeed: 0.26, dySpeed: 0.32,
    rx: 0.42, ry: 0.40, r: 10, g: 90,  b: 70,  baseAlpha: 0.55, alphaPhase: 2.6, alphaSpeed: 0.29 },
  // Sapphire — top center flowing
  { bx: 0.50, by: 0.12, dxAmp: 0.12, dyAmp: 0.04, dxPhase: 0.4, dyPhase: 1.6, dxSpeed: 0.20, dySpeed: 0.36,
    rx: 0.44, ry: 0.38, r: 20, g: 60,  b: 180, baseAlpha: 0.50, alphaPhase: 0.4, alphaSpeed: 0.35 },
  // Deep teal — bottom center
  { bx: 0.50, by: 0.90, dxAmp: 0.10, dyAmp: 0.04, dxPhase: 2.2, dyPhase: 0.8, dxSpeed: 0.18, dySpeed: 0.30,
    rx: 0.48, ry: 0.40, r: 5,  g: 85,  b: 90,  baseAlpha: 0.52, alphaPhase: 1.4, alphaSpeed: 0.27 },
];

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

    const TWO_PI = Math.PI * 2;

    const draw = () => {
      t += 0.011; // smooth, visible but not fast
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fluid blob layer
      for (const blob of BLOBS) {
        const cx = (blob.bx + Math.sin(t * blob.dxSpeed + blob.dxPhase) * blob.dxAmp) * canvas.width;
        const cy = (blob.by + Math.cos(t * blob.dySpeed + blob.dyPhase) * blob.dyAmp) * canvas.height;
        const alpha = blob.baseAlpha * (0.65 + 0.35 * Math.sin(t * blob.alphaSpeed + blob.alphaPhase));

        const rx = blob.rx * canvas.width;
        const ry = blob.ry * canvas.height;
        const maxR = Math.max(rx, ry);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        grad.addColorStop(0,    `rgba(${blob.r},${blob.g},${blob.b},${alpha})`);
        grad.addColorStop(0.30, `rgba(${blob.r},${blob.g},${blob.b},${alpha * 0.60})`);
        grad.addColorStop(0.65, `rgba(${blob.r},${blob.g},${blob.b},${alpha * 0.18})`);
        grad.addColorStop(1,    `rgba(${blob.r},${blob.g},${blob.b},0)`);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, ry / maxR);
        ctx.beginPath();
        ctx.arc(0, 0, maxR, 0, TWO_PI);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // Diagonal flowing light sweep — crosses the screen slowly on a diagonal
      const sweepX = (Math.sin(t * 0.09) + 1) * 0.5 * canvas.width;
      const sweepAlpha = 0.038 + 0.022 * Math.sin(t * 0.14);
      const sweep = ctx.createLinearGradient(
        sweepX - canvas.width * 0.3, 0,
        sweepX + canvas.width * 0.3, canvas.height
      );
      sweep.addColorStop(0,    "rgba(0,180,240,0)");
      sweep.addColorStop(0.45, `rgba(0,180,240,${sweepAlpha})`);
      sweep.addColorStop(0.55, `rgba(0,200,180,${sweepAlpha * 0.7})`);
      sweep.addColorStop(1,    "rgba(0,180,240,0)");
      ctx.fillStyle = sweep;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Slow horizontal aurora band
      const bandY = ((Math.sin(t * 0.10) + 1) * 0.5) * canvas.height;
      const band = ctx.createLinearGradient(0, bandY - 200, 0, bandY + 200);
      band.addColorStop(0,   "rgba(0,160,220,0)");
      band.addColorStop(0.5, "rgba(0,160,220,0.028)");
      band.addColorStop(1,   "rgba(0,160,220,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, bandY - 200, canvas.width, 400);

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
