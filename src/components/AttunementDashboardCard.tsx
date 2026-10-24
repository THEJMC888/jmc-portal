"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AttunementCard } from "@/types";

const CARDS_KEY  = "jmc_attunement_cards";
const ACTIVE_KEY = "jmc_attunement_active_id";

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
      <div
        className="card-luxury"
        style={{
          position: "relative",
          padding: "16px 14px",
          cursor: "pointer",
          height: "100%",
          boxSizing: "border-box" as const,
          outline: "1.5px solid rgba(194,159,96,0.55)",
          outlineOffset: "-1px",
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
              letterSpacing: "0.1em", fontSize: "0.55rem",
              color: "rgba(222,211,200,0.55)",
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
