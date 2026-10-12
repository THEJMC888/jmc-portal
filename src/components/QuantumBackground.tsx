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

// These blobs ARE the background color — html is near-black so motion is visible
const BLOBS: Blob[] = [
  // Rich navy — upper left, large
  { bx: 0.10, by: 0.15, dxAmp: 0.08, dyAmp: 0.07, dxPhase: 0,   dyPhase: 1.2, dxSpeed: 0.28, dySpeed: 0.22,
    rx: 0.70, ry: 0.65, r: 8,  g: 40,  b: 120, baseAlpha: 0.95, alphaPhase: 0,   alphaSpeed: 0.30 },
  // Deep forest green — lower right
  { bx: 0.90, by: 0.86, dxAmp: 0.07, dyAmp: 0.08, dxPhase: 2.0, dyPhase: 0.5, dxSpeed: 0.22, dySpeed: 0.25,
    rx: 0.65, ry: 0.60, r: 10, g: 90,  b: 65,  baseAlpha: 0.90, alphaPhase: 2.1, alphaSpeed: 0.25 },
  // Cobalt — upper right
  { bx: 0.80, by: 0.18, dxAmp: 0.07, dyAmp: 0.06, dxPhase: 1.1, dyPhase: 3.0, dxSpeed: 0.35, dySpeed: 0.30,
    rx: 0.55, ry: 0.50, r: 15, g: 90,  b: 200, baseAlpha: 0.75, alphaPhase: 1.2, alphaSpeed: 0.38 },
  // Indigo — lower left
  { bx: 0.18, by: 0.82, dxAmp: 0.06, dyAmp: 0.07, dxPhase: 3.4, dyPhase: 1.8, dxSpeed: 0.30, dySpeed: 0.28,
    rx: 0.52, ry: 0.48, r: 50, g: 10,  b: 140, baseAlpha: 0.72, alphaPhase: 3.5, alphaSpeed: 0.28 },
  // Teal — center, slow drift
  { bx: 0.50, by: 0.50, dxAmp: 0.05, dyAmp: 0.05, dxPhase: 0.6, dyPhase: 2.4, dxSpeed: 0.45, dySpeed: 0.40,
    rx: 0.42, ry: 0.38, r: 0,  g: 155, b: 200, baseAlpha: 0.45, alphaPhase: 1.8, alphaSpeed: 0.50 },
  // Blue-green — left center
  { bx: 0.12, by: 0.52, dxAmp: 0.06, dyAmp: 0.07, dxPhase: 1.8, dyPhase: 0.2, dxSpeed: 0.32, dySpeed: 0.26,
    rx: 0.46, ry: 0.44, r: 5,  g: 60,  b: 150, baseAlpha: 0.70, alphaPhase: 0.8, alphaSpeed: 0.33 },
  // Emerald — right center
  { bx: 0.84, by: 0.44, dxAmp: 0.06, dyAmp: 0.06, dxPhase: 2.6, dyPhase: 1.4, dxSpeed: 0.26, dySpeed: 0.32,
    rx: 0.48, ry: 0.44, r: 12, g: 110, b: 80,  baseAlpha: 0.70, alphaPhase: 2.6, alphaSpeed: 0.29 },
  // Sapphire — top, wide lateral drift
  { bx: 0.50, by: 0.10, dxAmp: 0.14, dyAmp: 0.05, dxPhase: 0.4, dyPhase: 1.6, dxSpeed: 0.20, dySpeed: 0.36,
    rx: 0.50, ry: 0.42, r: 25, g: 65,  b: 195, baseAlpha: 0.65, alphaPhase: 0.4, alphaSpeed: 0.35 },
  // Teal-green — bottom, wide
  { bx: 0.50, by: 0.92, dxAmp: 0.12, dyAmp: 0.04, dxPhase: 2.2, dyPhase: 0.8, dxSpeed: 0.18, dySpeed: 0.30,
    rx: 0.55, ry: 0.46, r: 8,  g: 105, b: 100, baseAlpha: 0.68, alphaPhase: 1.4, alphaSpeed: 0.27 },
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
      t += 0.011;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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

      // Slow diagonal light sweep
      const sweepX = (Math.sin(t * 0.09) + 1) * 0.5 * canvas.width;
      const sweepAlpha = 0.055 + 0.025 * Math.sin(t * 0.14);
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
