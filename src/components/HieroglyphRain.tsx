"use client";
import { useEffect, useRef } from "react";

const GLYPHS = [
  "𓀀","𓀈","𓀘","𓀠","𓀨","𓀰","𓁐","𓁸",
  "𓂀","𓂈","𓂸","𓃠","𓃰","𓄈","𓄠","𓄨",
  "𓄰","𓄸","𓅀","𓅈","𓅐","𓅠","𓅨","𓅰",
  "𓅸","𓆀","𓆈","𓆐","𓆘","𓆨","𓆰","𓇀",
  "𓇈","𓇐","𓇘","𓇠","𓇰","𓈠","𓈨","𓈰",
  "𓈸","𓉀","𓉈","𓉰","𓊐","𓋀","𓋈","𓋐",
  "𓋘","𓋠","☥",
];

const COL_WIDTH  = 16;
const ROW_HEIGHT = 18;
const FONT_SIZE  = 12;
const TAIL_LEN   = 24;
const FRAME_MS   = 50;
const BG_ALPHA   = 0.045;

interface GlowSpot {
  col: number;
  row: number;
  life: number;
  maxLife: number;
}

export default function HieroglyphRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let cols: number;
    let visRows: number;
    let totalRows: number;
    let grid: string[][];
    let heads: number[];
    let speeds: number[];
    let glowSpots: GlowSpot[] = [];

    const rng = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    const init = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      cols      = Math.ceil(canvas.width  / COL_WIDTH)  + 1;
      visRows   = Math.ceil(canvas.height / ROW_HEIGHT) + 1;
      totalRows = visRows + TAIL_LEN + 4;

      grid   = Array.from({ length: cols }, () =>
        Array.from({ length: totalRows }, () => rng())
      );
      heads  = Array.from({ length: cols }, () => -(Math.random() * TAIL_LEN * 3));
      speeds = Array.from({ length: cols }, () => 0.15 + Math.random() * 0.25);
      glowSpots = [];
    };

    init();

    // Shimmer — mutate chars continuously for the "changing code" feel
    const shimmer = setInterval(() => {
      if (!grid) return;
      for (let i = 0; i < 4; i++) {
        const c = Math.floor(Math.random() * cols);
        const r = Math.floor(Math.random() * totalRows);
        grid[c][r] = rng();
      }
    }, 40);

    // Spawn random illuminated glow blobs — the bright oval streaks from the reference
    const glowSpawner = setInterval(() => {
      if (glowSpots.length < 10 && Math.random() < 0.7) {
        const life = 35 + Math.floor(Math.random() * 45);
        glowSpots.push({
          col: Math.floor(Math.random() * cols),
          row: Math.floor(Math.random() * visRows),
          life,
          maxLife: life,
        });
      }
    }, 250);

    let last = 0;
    const draw = (now: number) => {
      rafId = requestAnimationFrame(draw);
      if (now - last < FRAME_MS) return;
      last = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_SIZE}px "Noto Sans Egyptian Hieroglyphs", serif`;
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;

      // Layer 1: Ambient background — dim grid fills the entire screen
      ctx.fillStyle = `rgba(160, 130, 75, ${BG_ALPHA})`;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < visRows; r++) {
          ctx.fillText(grid[c][r], c * COL_WIDTH + COL_WIDTH / 2, r * ROW_HEIGHT);
        }
      }

      // Layer 2: Active falling streams with bright heads and fading tails
      for (let c = 0; c < cols; c++) {
        const headRow = Math.floor(heads[c]);

        for (let t = 0; t < TAIL_LEN; t++) {
          const r = headRow - t;
          const y = r * ROW_HEIGHT;
          if (y < -ROW_HEIGHT || y > canvas.height) continue;
          if (r < 0 || r >= totalRows) continue;

          const fade = Math.pow(1 - t / TAIL_LEN, 2.5);

          if (t === 0) {
            ctx.shadowColor = "rgba(220, 185, 120, 0.9)";
            ctx.shadowBlur = 20;
            ctx.fillStyle = `rgba(252, 232, 172, ${Math.min(fade * 1.1, 0.88)})`;
          } else if (t <= 3) {
            ctx.shadowColor = "rgba(210, 175, 110, 0.6)";
            ctx.shadowBlur = 12;
            ctx.fillStyle = `rgba(228, 198, 138, ${fade * 0.72})`;
          } else if (t <= 9) {
            ctx.shadowColor = "rgba(194, 159, 96, 0.3)";
            ctx.shadowBlur = 5;
            ctx.fillStyle = `rgba(205, 168, 102, ${fade * 0.52})`;
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(185, 148, 85, ${fade * 0.38})`;
          }

          ctx.fillText(grid[c][r % totalRows], c * COL_WIDTH + COL_WIDTH / 2, y);
        }

        heads[c] += speeds[c];
        if (heads[c] - TAIL_LEN > totalRows) {
          heads[c]  = -(Math.random() * TAIL_LEN * 2);
          speeds[c] = 0.15 + Math.random() * 0.25;
        }
      }

      // Layer 3: Glow blobs — the bright illuminated ovals from the reference image
      for (let i = glowSpots.length - 1; i >= 0; i--) {
        const spot = glowSpots[i];
        const lifeFrac = spot.life / spot.maxLife;
        const intensity = Math.sin(lifeFrac * Math.PI); // bell: 0 → peak → 0

        for (let dr = -4; dr <= 4; dr++) {
          const r = spot.row + dr;
          if (r < 0 || r >= totalRows) continue;
          const y = r * ROW_HEIGHT;
          if (y < 0 || y > canvas.height) continue;

          const distFade = 1 - Math.abs(dr) / 5;
          const alpha = intensity * distFade * 0.72;

          ctx.shadowColor = "rgba(225, 190, 125, 0.85)";
          ctx.shadowBlur = 22 * intensity * distFade;
          ctx.fillStyle = `rgba(248, 220, 158, ${alpha})`;
          ctx.fillText(grid[spot.col][r % totalRows], spot.col * COL_WIDTH + COL_WIDTH / 2, y);
        }

        spot.life--;
        if (spot.life <= 0) glowSpots.splice(i, 1);
      }

      ctx.shadowBlur = 0;
    };

    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", init);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(shimmer);
      clearInterval(glowSpawner);
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
