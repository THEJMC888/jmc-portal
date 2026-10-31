"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import TotemGlyph from "@/components/TotemGlyph";
import {
  TOTEMS, KIND_LABELS, ELEMENT_LABELS, DIRECTION_LABELS, searchTotems,
  type TotemKind, type TotemElement,
} from "@/lib/totems";

const syne = { fontFamily: "Syne, system-ui, sans-serif" };
const lora = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

const GOLD = "#C29F60";

const ELEMENTS = Object.keys(ELEMENT_LABELS) as TotemElement[];
const KINDS = Object.keys(KIND_LABELS) as TotemKind[];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        ...syne, fontWeight: 700, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
        padding: "8px 13px", borderRadius: 999, cursor: "pointer",
        color: active ? "#0a0f1e" : "rgba(222,211,200,0.75)",
        background: active ? GOLD : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? GOLD : "rgba(194,159,96,0.28)"}`,
        transition: "all 0.18s",
      }}
    >
      {children}
    </button>
  );
}

export default function TotemsPage() {
  const [query, setQuery] = useState("");
  const [element, setElement] = useState<TotemElement | null>(null);
  const [kind, setKind] = useState<TotemKind | null>(null);

  const results = useMemo(() => {
    const filtered = TOTEMS.filter((t) => (!element || t.element === element) && (!kind || t.kind === kind));
    const searched = searchTotems(filtered, query);
    // Alphabetical when browsing; best match first while searching
    return query.trim() ? searched : [...searched].sort((a, b) => a.name.localeCompare(b.name));
  }, [query, element, kind]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p style={{ ...syne, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", fontSize: "0.62rem", color: GOLD, marginBottom: "0.5rem", opacity: 0.85 }}>
          Totem dictionary
        </p>
        <h1 style={{ ...lora, fontWeight: 600, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#DED3C8", lineHeight: 1.1, marginBottom: "0.9rem" }}>
          Medicine animals
        </h1>
        <p style={{ ...lora, fontSize: 15, lineHeight: 1.8, color: "rgba(222,211,200,0.72)", maxWidth: 680 }}>
          When an animal keeps finding us, in a dream, on the trail, or in the words we write at night, we can receive it as a mirror held up to our own becoming. These reflections are symbolic and original to the Collective, gathered from the long human conversation with animals across many cultures and from our own contemplative practice. We honor the ceremonial teachings of each Indigenous nation as belonging to their keepers, and we offer these pages as an invitation to listen for what each creature awakens in you.
        </p>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div style={{ position: "relative", maxWidth: 520 }}>
          <Search size={15} color="rgba(194,159,96,0.7)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search owl, courage, transformation…"
            aria-label="Search medicine animals"
            style={{
              ...avenir, width: "100%", fontSize: 16, color: "#DED3C8",
              padding: "12px 40px 12px 40px", borderRadius: 12, outline: "none",
              background: "rgba(6,18,55,0.55)", border: "1px solid rgba(194,159,96,0.3)",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.55)", padding: 6 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full sm:w-16" style={{ ...syne, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(222,211,200,0.45)" }}>Element</span>
          <Chip active={!element} onClick={() => setElement(null)}>All</Chip>
          {ELEMENTS.map((e) => (
            <Chip key={e} active={element === e} onClick={() => setElement(element === e ? null : e)}>{ELEMENT_LABELS[e]}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full sm:w-16" style={{ ...syne, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(222,211,200,0.45)" }}>Kind</span>
          <Chip active={!kind} onClick={() => setKind(null)}>All</Chip>
          {KINDS.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(kind === k ? null : k)}>{KIND_LABELS[k]}</Chip>
          ))}
        </div>

        <p style={{ ...avenir, fontSize: 13, color: "rgba(222,211,200,0.5)" }}>
          {results.length} {results.length === 1 ? "animal" : "animals"}
        </p>
      </div>

      {/* Grid */}
      {results.length === 0 ? (
        <div className="card-luxury" style={{ padding: "48px 24px", textAlign: "center" }}>
          <p style={{ ...lora, fontStyle: "italic", fontSize: 15, color: "rgba(222,211,200,0.6)" }}>
            Nothing here matches that search yet. Try another word, or clear the filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((t) => (
            <Link
              key={t.slug}
              href={`/totems/${t.slug}`}
              className="card-luxury block"
              // backdrop blur on sixty tiles is heavy for phones; the gradient alone reads the same here
              style={{ padding: "18px 18px 20px", backdropFilter: "none", WebkitBackdropFilter: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <TotemGlyph totem={t} size={54} />
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ ...lora, fontWeight: 600, fontSize: 19, color: "#DED3C8", lineHeight: 1.2 }}>{t.name}</h2>
                  <p style={{ ...syne, fontWeight: 700, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, opacity: 0.85, marginTop: 4 }}>
                    {ELEMENT_LABELS[t.element]} · {DIRECTION_LABELS[t.direction]}
                  </p>
                </div>
              </div>
              <p style={{ ...lora, fontStyle: "italic", fontSize: 14, lineHeight: 1.6, color: "rgba(222,211,200,0.72)", marginTop: 12 }}>
                {t.essence}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
