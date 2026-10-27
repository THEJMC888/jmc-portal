"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AttunementCard } from "@/types";

const CARDS_KEY  = "jmc_attunement_cards";
const ACTIVE_KEY = "jmc_attunement_active_id";

const shimmerStyle = `
  @keyframes att-shimmer {
    0%   { transform: translateX(-100%); }
    60%  { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }
`;

export default function AttunementDashboardCard() {
  const [card, setCard] = useState<AttunementCard | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const activeId = localStorage.getItem(ACTIVE_KEY);
      if (!activeId) return;
      const cards: AttunementCard[] = JSON.parse(localStorage.getItem(CARDS_KEY) ?? "[]");
      const active = cards.find(c => c.id === activeId);
      setCard(active ?? null);
    } catch { /* ignore */ }
  }, []);

  if (!mounted) return null;

  return (
    <Link href="/vision/attunement" style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <style>{shimmerStyle}</style>
      <div
        className="card-luxury"
        style={{
          position: "relative",
          padding: "16px 14px 16px 20px",
          cursor: "pointer",
          height: "100%",
          boxSizing: "border-box" as const,
          /* Login-card-grade treatment: stronger gradient, border & relief */
          background: "linear-gradient(175deg, rgba(45,108,195,0.52) 0%, rgba(28,72,148,0.58) 15%, rgba(10,26,78,0.68) 45%, rgba(3,9,28,0.80) 100%)",
          borderTop: "2px solid rgba(255,255,255,0.48)",
          borderLeft: "1px solid rgba(255,255,255,0.22)",
          borderRight: "1.5px solid rgba(194,159,96,0.22)",
          borderBottom: "1.5px solid rgba(160,165,175,0.65)",
          boxShadow: [
            "inset 0 4px 0 rgba(255,255,255,0.28)",
            "inset 0 2px 0 rgba(255,255,255,0.42)",
            "inset 0 1px 0 rgba(255,255,255,0.50)",
            "inset 2px 0 0 rgba(255,255,255,0.08)",
            "inset 0 -4px 10px rgba(0,0,0,0.7)",
            "inset -2px 0 6px rgba(0,0,0,0.3)",
            "6px 0 18px rgba(0,0,0,0.55)",
            "0 2px 0 rgba(0,0,0,0.95)",
            "0 4px 0 rgba(0,0,0,0.88)",
            "0 6px 0 rgba(0,0,0,0.80)",
            "0 8px 0 rgba(0,0,0,0.72)",
            "0 10px 0 rgba(0,0,0,0.62)",
            "0 12px 0 rgba(0,0,0,0.52)",
            "0 14px 0 rgba(0,0,0,0.42)",
            "0 16px 0 rgba(0,0,0,0.32)",
            "0 18px 0 rgba(0,0,0,0.22)",
            "0 20px 0 rgba(0,0,0,0.14)",
            "0 22px 0 rgba(0,0,0,0.08)",
            "0 26px 40px rgba(0,0,0,0.80)",
            "0 50px 80px rgba(0,0,0,0.60)",
            "0 80px 120px rgba(0,0,0,0.40)",
          ].join(", "),
        }}
      >
        {/* Subtle vision image hint — behind glass, not on top of it */}
        {card?.backgroundImageDataUrl && (
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${card.backgroundImageDataUrl})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.12,
            borderRadius: 16,
          }} />
        )}

        {/* Gold accent top line */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%", height: 2,
          background: "linear-gradient(90deg, transparent, rgba(194,159,96,0.7), transparent)",
          borderRadius: "0 0 4px 4px",
        }} />

        {/* Gold left accent bar */}
        <div style={{
          position: "absolute", top: "15%", bottom: "15%", left: 0, width: 3,
          background: "linear-gradient(180deg, transparent, rgba(194,159,96,0.85) 30%, rgba(194,159,96,0.95) 50%, rgba(194,159,96,0.85) 70%, transparent)",
          borderRadius: "16px 0 0 16px",
        }} />

        {/* Shimmer sweep — empty state only */}
        {!card && (
          <div style={{
            position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16, pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute", top: 0, bottom: 0, width: "55%",
              background: "linear-gradient(105deg, transparent 20%, rgba(194,159,96,0.07) 50%, transparent 80%)",
              animation: "att-shimmer 3.2s ease-in-out infinite",
            }} />
          </div>
        )}

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(194,159,96,0.12)",
              border: "1px solid rgba(194,159,96,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, flexShrink: 0,
            }}>
              ✦
            </div>
            <span style={{
              fontFamily: "Syne, system-ui, sans-serif",
              fontWeight: 700, textTransform: "uppercase" as const,
              letterSpacing: "0.12em", fontSize: "0.55rem",
              color: "#C29F60",
            }}>
              Primary Attunement
            </span>
          </div>

          {card ? (
            <>
              <p style={{
                fontFamily: '"Lora", Georgia, serif',
                fontWeight: 700, fontSize: "0.78rem",
                color: "#DED3C8", lineHeight: 1.35,
                margin: 0, marginBottom: 4,
              }}>
                {card.line1}
              </p>
              <p style={{
                fontFamily: '"Lora", Georgia, serif',
                fontWeight: 400, fontSize: "0.7rem",
                fontStyle: "italic",
                color: "rgba(222,211,200,0.6)", lineHeight: 1.35,
                margin: 0,
              }}>
                {card.line2}
              </p>
            </>
          ) : (
            <p style={{
              fontFamily: '"Lora", Georgia, serif',
              fontSize: "0.75rem", color: "rgba(222,211,200,0.4)",
              fontStyle: "italic", margin: 0,
            }}>
              Tap to create your attunement →
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
