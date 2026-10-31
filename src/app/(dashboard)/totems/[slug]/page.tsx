"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, NotebookPen, Lock } from "lucide-react";
import TotemGlyph from "@/components/TotemGlyph";
import { TOTEMS, TOTEMS_BY_SLUG, ELEMENT_LABELS, DIRECTION_LABELS, KIND_LABELS, findTotems } from "@/lib/totems";

const syne = { fontFamily: "Syne, system-ui, sans-serif" };
const lora = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

const GOLD = "#C29F60";

const eyebrow: React.CSSProperties = {
  ...syne, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", fontSize: "0.62rem", color: GOLD, opacity: 0.85,
};
const body: React.CSSProperties = { ...lora, fontSize: 16, lineHeight: 1.85, color: "rgba(222,211,200,0.86)" };

// The journal page keeps a decrypted cache of entries on this device; read it
// here so the list of mentions is computed locally and nothing leaves the browser.
const LIST_KEY = "jmc_journal_list";
const entryKey = (id: string) => `jmc_journal_${id}`;

interface Mention { id: string; date: string; title: string }

function journalMentions(slug: string): Mention[] {
  try {
    const list = JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]") as { id: string; date: string; title: string }[];
    const out: Mention[] = [];
    for (const item of list) {
      const raw = localStorage.getItem(entryKey(item.id));
      if (!raw) continue;
      const e = JSON.parse(raw) as { title?: string; text?: string };
      if (findTotems(`${e.title ?? ""}\n${e.text ?? ""}`).some((t) => t.slug === slug)) {
        out.push({ id: item.id, date: item.date, title: e.title ?? item.title ?? "" });
      }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-luxury" style={{ padding: "22px 22px 24px" }}>
      <h2 style={{ ...eyebrow, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

export default function TotemPage() {
  const params = useParams<{ slug: string }>();
  const totem = TOTEMS_BY_SLUG[params.slug];
  const [mentions, setMentions] = useState<Mention[] | null>(null);

  useEffect(() => {
    if (totem) setMentions(journalMentions(totem.slug));
  }, [totem]);

  if (!totem) {
    return (
      <div className="space-y-6">
        <Link href="/totems" style={{ ...avenir, fontSize: 14, color: GOLD, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> All medicine animals
        </Link>
        <div className="card-luxury" style={{ padding: "40px 24px", textAlign: "center" }}>
          <p style={{ ...lora, fontStyle: "italic", fontSize: 15, color: "rgba(222,211,200,0.65)" }}>
            This animal has yet to be written into the library.
          </p>
        </div>
      </div>
    );
  }

  const sorted = [...TOTEMS].sort((a, b) => a.name.localeCompare(b.name));
  const i = sorted.findIndex((t) => t.slug === totem.slug);
  const prev = sorted[(i - 1 + sorted.length) % sorted.length];
  const next = sorted[(i + 1) % sorted.length];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/totems" style={{ ...avenir, fontSize: 14, color: GOLD, display: "inline-flex", alignItems: "center", gap: 6 }}>
        <ArrowLeft size={14} /> All medicine animals
      </Link>

      {/* Hero */}
      <div className="card-luxury animate-fade-in-up" style={{ padding: "26px 22px" }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <TotemGlyph totem={totem} size={104} />
          <div style={{ minWidth: 0 }}>
            <p style={{ ...eyebrow, marginBottom: 8 }}>
              {ELEMENT_LABELS[totem.element]} · {DIRECTION_LABELS[totem.direction]} · {KIND_LABELS[totem.kind]}
            </p>
            <h1 style={{ ...lora, fontWeight: 600, fontSize: "clamp(2rem, 6vw, 2.75rem)", color: "#DED3C8", lineHeight: 1.05, marginBottom: 8 }}>
              {totem.name}
            </h1>
            <p style={{ ...lora, fontStyle: "italic", fontSize: 17, color: GOLD, lineHeight: 1.45 }}>{totem.essence}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" style={{ marginTop: 18 }}>
          {totem.keywords.map((k) => (
            <span key={k} style={{ ...avenir, fontSize: 13, color: "rgba(222,211,200,0.8)", padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(194,159,96,0.3)", background: "rgba(194,159,96,0.06)" }}>
              {k}
            </span>
          ))}
        </div>
      </div>

      <Section title="Medicine"><p style={body}>{totem.medicine}</p></Section>
      <Section title="Shadow"><p style={body}>{totem.shadow}</p></Section>
      <Section title="When it appears"><p style={body}>{totem.appears}</p></Section>

      <Section title="Journal prompt">
        <p style={{ ...lora, fontStyle: "italic", fontSize: 18, lineHeight: 1.6, color: "#DED3C8", marginBottom: 18 }}>
          {totem.prompt}
        </p>
        <Link
          href={`/journal?totem=${totem.slug}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            ...syne, fontWeight: 700, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0a0f1e",
            padding: "11px 18px", borderRadius: 8, background: GOLD,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          <NotebookPen size={14} /> Write in my journal
        </Link>
      </Section>

      <Section title="In your journal">
        {mentions === null ? null : mentions.length === 0 ? (
          <p style={{ ...lora, fontStyle: "italic", fontSize: 15, lineHeight: 1.7, color: "rgba(222,211,200,0.6)" }}>
            When {totem.name} finds its way into your journal, the dates will gather here.
          </p>
        ) : (
          <ul className="space-y-1">
            {mentions.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/journal?entry=${m.id}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                  style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(194,159,96,0.14)" }}
                >
                  <span style={{ ...syne, fontWeight: 700, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD }}>
                    {formatDate(m.date)}
                  </span>
                  <span style={{ ...lora, fontSize: 15, color: "#DED3C8", minWidth: 0, overflowWrap: "anywhere" }}>
                    {m.title || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Untitled</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p style={{ ...avenir, fontSize: 12, lineHeight: 1.6, color: "rgba(222,211,200,0.45)", marginTop: 14, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <Lock size={12} style={{ marginTop: 3, flexShrink: 0 }} />
          Found on this device from your private entries, visible only to you.
        </p>
      </Section>

      {/* Prev / next */}
      <div className="flex justify-between gap-3" style={{ paddingTop: 4, paddingBottom: 16 }}>
        <Link href={`/totems/${prev.slug}`} style={{ ...avenir, fontSize: 14, color: GOLD, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> {prev.name}
        </Link>
        <Link href={`/totems/${next.slug}`} style={{ ...avenir, fontSize: 14, color: GOLD, display: "inline-flex", alignItems: "center", gap: 6 }}>
          {next.name} <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
