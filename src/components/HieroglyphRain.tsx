"use client";

import { useEffect, useRef } from "react";

// Egyptian hieroglyphics — verified to render in Noto Sans Egyptian Hieroglyphs
const GLYPHS = [
  "𓀀","𓀈","𓀘","𓀠","𓀨","𓀰","𓁐","𓁸",
  "𓂀","𓂈","𓂸","𓃠","𓃰","𓄈","𓄠","𓄨",
  "𓄰","𓄸","𓅀","𓅈","𓅐","𓅠","𓅨","𓅰",
  "𓅸","𓆀","𓆈","𓆐","𓆘","𓆨","𓆰","𓇀",
  "𓇈","𓇐","𓇘","𓇠","𓇰","𓈠","𓈨","𓈰",
  "𓈸","𓉀","𓉈","𓉰","𓊐","𓋀","𓋈","𓋐",
  "𓋘","𓋠","☥",
];

const COL_WIDTH  = 24;
const ROW_HEIGHT = 24;
const TAIL_LEN   = 18;
const FRAME_MS   = 70;
const MAX_ALPHA  = 0.32; // visible gold against dark background

export default function HieroglyphRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let cols: number;
    let rows: number;
    let grid: string[][];
    let heads: number[];   // fractional row position of each column's head
    let speeds: number[];  // rows-per-frame, varies per column

    const init = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      cols  = Math.ceil(canvas.width  / COL_WIDTH)  + 1;
      rows  = Math.ceil(canvas.height / ROW_HEIGHT) + TAIL_LEN + 4;

      grid   = Array.from({ length: cols }, () =>
        Array.from({ length: rows }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
      );
      heads  = Array.from({ length: cols }, () => -Math.random() * TAIL_LEN * 2);
      speeds = Array.from({ length: cols }, () => 0.18 + Math.random() * 0.28);
    };

    init();

    // Shimmer — randomly mutate glyphs to simulate the Matrix "changing code" look
    const shimmer = setInterval(() => {
      if (!grid) return;
      const c = Math.floor(Math.random() * cols);
      const r = Math.floor(Math.random() * rows);
      grid[c][r] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }, 60);

    let last = 0;
    const draw = (now: number) => {
      rafId = requestAnimationFrame(draw);
      if (now - last < FRAME_MS) return;
      last = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `15px "Noto Sans Egyptian Hieroglyphs", serif`;
      ctx.textAlign = "center";

      for (let c = 0; c < cols; c++) {
        const head = heads[c];
        const headRow = Math.floor(head);

        for (let t = 0; t < TAIL_LEN; t++) {
          const r = headRow - t;
          if (r < 0) continue;
          const y = r * ROW_HEIGHT;
          if (y > canvas.height) continue;

          // Quadratic fade so the tail drops off quickly
          const fade  = Math.pow(1 - t / TAIL_LEN, 2);
          const alpha = fade * MAX_ALPHA;

          const glyph = grid[c][r % rows] ?? "𓂀";

          if (t === 0) {
            // Head — warmest and brightest
            ctx.fillStyle = `rgba(235, 205, 145, ${Math.min(alpha * 4, 0.45)})`;
          } else if (t <= 2) {
            ctx.fillStyle = `rgba(215, 180, 115, ${alpha * 2})`;
          } else {
            ctx.fillStyle = `rgba(194, 159, 96, ${alpha})`;
          }

          ctx.fillText(glyph, c * COL_WIDTH + COL_WIDTH / 2, y);
        }

        // Advance head
        heads[c] += speeds[c];

        // Reset off-screen column with a random delay above the top
        if (heads[c] - TAIL_LEN > rows) {
          heads[c]  = -Math.floor(Math.random() * TAIL_LEN * 3);
          speeds[c] = 0.18 + Math.random() * 0.28;
        }
      }
    };

    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", init);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(shimmer);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
