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

      // Five incommensurate waves — never feels repetitive
      const w1 = (Math.sin(t * 0.41)       + 1) * 0.5;
      const w2 = (Math.sin(t * 0.29 + 1.1) + 1) * 0.5;
      const w3 = (Math.sin(t * 0.53 + 2.3) + 1) * 0.5;
      const w4 = (Math.cos(t * 0.37 + 0.7) + 1) * 0.5;
      const w5 = (Math.sin(t * 0.19 + 3.1) + 1) * 0.5;

      // Gentle tilt — stays near-vertical so navy stays top, green stays bottom
      const tilt = Math.sin(t * 0.18) * 0.15 + Math.sin(t * 0.27) * 0.06;
      const cx = W / 2, cy = H / 2;
      // 75% of diagonal guarantees all four corners are covered at any tilt
      const len = Math.sqrt(W * W + H * H) * 0.75;
      const a = Math.PI * 0.5 + tilt;

      // ONE gradient, ONE fillRect — no alpha, no edges, no blobs possible
      const grad = ctx.createLinearGradient(
        cx - Math.cos(a) * len, cy - Math.sin(a) * len,
        cx + Math.cos(a) * len, cy + Math.sin(a) * len
      );

      // All stops use rgb() — fully opaque, zero chance of a visible boundary
      grad.addColorStop(0.00, `rgb(1,5,12)`);
      grad.addColorStop(0.12, `rgb(${2 + Math.round(w5 * 3)},${8  + Math.round(w5 * 10)},${22 + Math.round(w5 * 14)})`);
      grad.addColorStop(0.28, `rgb(${4 + Math.round(w2 * 6)},${28 + Math.round(w1 * 32)},${85 + Math.round(w1 * 48)})`);

      // Mid — most visible variance, swings between teal, blue-green, deep navy
      grad.addColorStop(0.50, `rgb(
        ${3  + Math.round(w3 * 7)},
        ${35 + Math.round(w2 * 55 + w4 * 20)},
        ${58 + Math.round(w1 * 32 - w3 * 22)}
      )`.replace(/\s+/g, ""));

      grad.addColorStop(0.72, `rgb(${5 + Math.round(w3 * 7)},${65 + Math.round(w4 * 35)},${40 + Math.round(w5 * 18)})`);
      grad.addColorStop(0.88, `rgb(${3 + Math.round(w1 * 4)},${40 + Math.round(w2 * 16)},${25 + Math.round(w2 * 10)})`);
      grad.addColorStop(1.00, `rgb(1,7,11)`);

      ctx.fillStyle = grad;
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
