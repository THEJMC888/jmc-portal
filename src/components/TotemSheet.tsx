"use client";

import { useEffect, Fragment } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import TotemGlyph from "./TotemGlyph";
import { useMobile } from "@/hooks/useMobile";
import { findTotemMatches, TOTEMS_BY_SLUG, ELEMENT_LABELS, DIRECTION_LABELS, KIND_LABELS, type Totem } from "@/lib/totems";

const GOLD = "#C29F60";

/** Journal text with every animal name rendered as a subtle gold link. Matching runs on device. */
export function TotemLinkedText({ text, onOpen }: { text: string; onOpen: (t: Totem) => void }) {
  const matches = findTotemMatches(text);
  if (!matches.length) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.start > pos) parts.push(<Fragment key={`t${i}`}>{text.slice(pos, m.start)}</Fragment>);
    const totem = TOTEMS_BY_SLUG[m.slug];
    // An inline span (buttons are inline-block and would stretch the line height)
    parts.push(
      <span
        key={`m${i}`}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onOpen(totem); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onOpen(totem); } }}
        title={`${totem.name} medicine`}
        style={{
          color: GOLD, cursor: "pointer",
          textDecoration: "underline dotted rgba(194,159,96,0.6)",
          textUnderlineOffset: 4,
        }}
      >
        {text.slice(m.start, m.end)}
      </span>
    );
    pos = m.end;
  });
  if (pos < text.length) parts.push(<Fragment key="tail">{text.slice(pos)}</Fragment>);
  return <>{parts}</>;
}

/** A small sheet with one animal's meaning: bottom sheet on phones, centered card on larger screens. */
export default function TotemSheet({ totem, onClose }: { totem: Totem | null; onClose: () => void }) {
  const isMobile = useMobile();
  useEffect(() => {
    if (!totem) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totem, onClose]);

  if (!totem) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-6"
      style={{ background: "rgba(2,4,12,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${totem.name} medicine`}
    >
      <div
        className="card-luxury w-full md:max-w-md"
        onClick={(e) => e.stopPropagation()}
        style={{
          ...(isMobile ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}),
          maxHeight: "82vh", overflowY: "auto",
          padding: "22px 20px calc(22px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <TotemGlyph totem={totem} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, opacity: 0.85, marginBottom: 4 }}>
              {ELEMENT_LABELS[totem.element]} · {DIRECTION_LABELS[totem.direction]} · {KIND_LABELS[totem.kind]}
            </p>
            <h2 style={{ fontFamily: '"Lora", Georgia, serif', fontWeight: 600, fontSize: 22, color: "#DED3C8", lineHeight: 1.15 }}>
              {totem.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.6)", padding: 6, alignSelf: "flex-start" }}
          >
            <X size={18} />
          </button>
        </div>
        <p style={{ fontFamily: '"Lora", Georgia, serif', fontStyle: "italic", fontSize: 15, color: GOLD, marginBottom: 12 }}>
          {totem.essence}
        </p>
        <p style={{ fontFamily: '"Lora", Georgia, serif', fontSize: 15, lineHeight: 1.75, color: "rgba(222,211,200,0.85)", marginBottom: 18 }}>
          {totem.medicine}
        </p>
        <Link
          href={`/totems/${totem.slug}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 11,
            letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD,
            padding: "10px 16px", borderRadius: 8,
            border: "1px solid rgba(194,159,96,0.4)", background: "rgba(194,159,96,0.08)",
          }}
        >
          Open {totem.name} <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
