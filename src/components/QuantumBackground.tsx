"use client";
import { useEffect, useRef } from "react";

// Slowly breathing aurora blob
type Blob = {
  // base position as fraction of canvas
  bx: number; by: number;
  // drift amplitude and phase offsets
  dxAmp: number; dyAmp: number;
  dxPhase: number; dyPhase: number;
  dxSpeed: number; dySpeed: number;
  // size as fraction of canvas width
  rx: number; ry: number;
  // color
  r: number; g: number; b: number;
  // opacity
  baseAlpha: number;
  alphaPhase: number;
  alphaSpeed: number;
};

const BLOBS: Blob[] = [
  // Deep navy — upper left anchor
  { bx: 0.12, by: 0.18, dxAmp: 0.06, dyAmp: 0.05, dxPhase: 0, dyPhase: 1.2, dxSpeed: 0.28, dySpeed: 0.22,
    rx: 0.58, ry: 0.52, r: 6, g: 28, b: 95, baseAlpha: 0.78, alphaPhase: 0, alphaSpeed: 0.3 },
  // Forest teal — lower right
  { bx: 0.88, by: 0.82, dxAmp: 0.05, dyAmp: 0.06, dxPhase: 2.0, dyPhase: 0.5, dxSpeed: 0.22, dySpeed: 0.25,
    rx: 0.52, ry: 0.5, r: 8, g: 72, b: 52, baseAlpha: 0.68, alphaPhase: 2.1, alphaSpeed: 0.25 },
  // Teal — upper right
  { bx: 0.74, by: 0.22, dxAmp: 0.055, dyAmp: 0.04, dxPhase: 1.1, dyPhase: 3.0, dxSpeed: 0.35, dySpeed: 0.3,
    rx: 0.42, ry: 0.4, r: 0, g: 110, b: 168, baseAlpha: 0.52, alphaPhase: 1.2, alphaSpeed: 0.38 },
  // Deep indigo / purple — lower left
  { bx: 0.22, by: 0.76, dxAmp: 0.045, dyAmp: 0.055, dxPhase: 3.4, dyPhase: 1.8, dxSpeed: 0.3, dySpeed: 0.28,
    rx: 0.4, ry: 0.38, r: 62, g: 4, b: 118, baseAlpha: 0.48, alphaPhase: 3.5, alphaSpeed: 0.28 },
  // Soft teal center pulse
  { bx: 0.5, by: 0.5, dxAmp: 0.03, dyAmp: 0.03, dxPhase: 0.6, dyPhase: 2.4, dxSpeed: 0.45, dySpeed: 0.4,
    rx: 0.3, ry: 0.28, r: 0, g: 165, b: 220, baseAlpha: 0.2, alphaPhase: 1.8, alphaSpeed: 0.5 },
  // Navy blue — left middle
  { bx: 0.16, by: 0.52, dxAmp: 0.04, dyAmp: 0.05, dxPhase: 1.8, dyPhase: 0.2, dxSpeed: 0.32, dySpeed: 0.26,
    rx: 0.34, ry: 0.32, r: 4, g: 44, b: 130, baseAlpha: 0.42, alphaPhase: 0.8, alphaSpeed: 0.33 },
  // Purple — right mid
  { bx: 0.84, by: 0.4, dxAmp: 0.04, dyAmp: 0.04, dxPhase: 2.6, dyPhase: 1.4, dxSpeed: 0.26, dySpeed: 0.32,
    rx: 0.36, ry: 0.34, r: 44, g: 0, b: 90, baseAlpha: 0.38, alphaPhase: 2.6, alphaSpeed: 0.29 },
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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const TWO_PI = Math.PI * 2;

    const draw = () => {
      t += 0.008; // ~0.5 real seconds per unit at 60fps
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const blob of BLOBS) {
        // Drifting center position
        const cx = (blob.bx + Math.sin(t * blob.dxSpeed + blob.dxPhase) * blob.dxAmp) * canvas.width;
        const cy = (blob.by + Math.cos(t * blob.dySpeed + blob.dyPhase) * blob.dyAmp) * canvas.height;

        // Breathing opacity
        const alpha = blob.baseAlpha * (0.68 + 0.32 * Math.sin(t * blob.alphaSpeed + blob.alphaPhase));

        const rx = blob.rx * canvas.width;
        const ry = blob.ry * canvas.height;
        const maxR = Math.max(rx, ry);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        grad.addColorStop(0,    `rgba(${blob.r},${blob.g},${blob.b},${alpha})`);
        grad.addColorStop(0.28, `rgba(${blob.r},${blob.g},${blob.b},${alpha * 0.65})`);
        grad.addColorStop(0.6,  `rgba(${blob.r},${blob.g},${blob.b},${alpha * 0.22})`);
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

      // Slow horizontal aurora band — sweeps top to bottom over ~28 seconds
      const bandY = ((Math.sin(t * 0.12) + 1) * 0.5) * canvas.height;
      const band = ctx.createLinearGradient(0, bandY - 160, 0, bandY + 160);
      band.addColorStop(0,   "rgba(0,180,240,0)");
      band.addColorStop(0.5, "rgba(0,180,240,0.018)");
      band.addColorStop(1,   "rgba(0,180,240,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, bandY - 160, canvas.width, 320);

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
