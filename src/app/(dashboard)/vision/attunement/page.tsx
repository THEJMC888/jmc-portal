"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, ChevronLeft, Download, Sparkles, Hand, Wand2,
  Trash2, Star, Check, RefreshCw, Pencil, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useVaultRefresh } from "@/lib/accountKeyContext";
import type { AttunementCard, VisionVideo } from "@/types";

// ─── Storage ─────────────────────────────────────────────────────────────────
const CARDS_KEY   = "jmc_attunement_cards";
const ACTIVE_KEY  = "jmc_attunement_active_id";
const STMT_KEY    = "jmc_statements_v1";
const VISIONS_LIST_KEY = "jmc_visions_list";
const visionKey = (id: string) => `jmc_vision_${id}`;

function loadCards(): AttunementCard[] {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) ?? "[]"); } catch { return []; }
}
function saveCards(cards: AttunementCard[]) {
  try { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); } catch {}
}
function loadActive(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}
function saveActive(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
}

// ─── Gradients ────────────────────────────────────────────────────────────────
const GRADIENTS = [
  { from: "#08254D", to: "#040d1c", angle: 160, label: "Navy Deep" },
  { from: "#0B4B32", to: "#040d1c", angle: 160, label: "Forest" },
  { from: "#08254D", to: "#0B4B32", angle: 160, label: "Brand" },
  { from: "#1a1a2e", to: "#0f3460", angle: 135, label: "Midnight" },
  { from: "#533483", to: "#08254D", angle: 135, label: "Cosmos" },
  { from: "#000000", to: "#1a1a2e", angle: 160, label: "Void" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function extractVisionTexts(visions: VisionVideo[]): string[] {
  const texts: string[] = [];
  for (const v of visions.slice(0, 3)) {
    if (v.title) texts.push(v.title);
    for (const slide of v.slides.slice(0, 6)) {
      for (const el of slide.elements) {
        if (el.type === "text" && el.text?.trim()) texts.push(el.text.trim());
      }
    }
  }
  return [...new Set(texts)].slice(0, 20);
}

function extractStatements() {
  try {
    const raw = localStorage.getItem(STMT_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Record<string, { being?: string; doing?: string; skipped?: boolean }>;
    return Object.entries(data)
      .filter(([, v]) => v.being?.trim() || v.doing?.trim())
      .map(([category, v]) => ({ category, being: v.being ?? "", doing: v.doing ?? "" }));
  } catch { return []; }
}

function extractVisionImages(visions: VisionVideo[]): string[] {
  const imgs: string[] = [];
  for (const v of visions) {
    for (const slide of v.slides) {
      if (slide.background.imageDataUrl) imgs.push(slide.background.imageDataUrl);
      for (const el of slide.elements) {
        if (el.type === "image" && el.imageDataUrl) imgs.push(el.imageDataUrl);
      }
    }
  }
  return [...new Set(imgs)].slice(0, 20);
}

function loadVisions(): VisionVideo[] {
  try {
    const list: Array<{ id: string }> = JSON.parse(localStorage.getItem(VISIONS_LIST_KEY) ?? "[]");
    return list
      .map(m => { try { return JSON.parse(localStorage.getItem(visionKey(m.id)) ?? "null"); } catch { return null; } })
      .filter(Boolean) as VisionVideo[];
  } catch { return []; }
}

// ─── Card preview (portrait 9×16) ────────────────────────────────────────────
function CardPreview({ card, scale = 1 }: { card: Partial<AttunementCard>; scale?: number }) {
  const W = 270 * scale, H = 480 * scale;
  const hasBg = !!card.backgroundImageDataUrl;
  const grad = card.backgroundGradient ?? GRADIENTS[0];
  const overlay = card.overlayOpacity ?? 0.45;

  return (
    <div style={{
      width: W, height: H, borderRadius: 12 * scale,
      position: "relative", overflow: "hidden",
      boxShadow: `0 ${8 * scale}px ${32 * scale}px rgba(0,0,0,0.6), 0 0 0 ${1 * scale}px rgba(194,159,96,0.15)`,
      flexShrink: 0,
    }}>
      {/* Background */}
      {hasBg ? (
        <>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${card.backgroundImageDataUrl})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }} />
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlay})` }} />
        </>
      ) : (
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(${grad.angle}deg, ${grad.from}, ${grad.to})`,
        }} />
      )}

      {/* Gold accent line */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 40 * scale, height: 2 * scale,
        background: "linear-gradient(90deg, transparent, #C29F60, transparent)",
      }} />

      {/* Content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: `0 ${20 * scale}px`,
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: '"Lora", Georgia, serif',
          fontSize: 16 * scale, fontWeight: 700,
          color: "#ffffff", lineHeight: 1.3,
          textShadow: `0 ${2 * scale}px ${8 * scale}px rgba(0,0,0,0.6)`,
          marginBottom: 12 * scale,
          letterSpacing: "0.01em",
        }}>
          {card.line1 || "I AM…"}
        </p>
        <div style={{
          width: 40 * scale, height: 1 * scale,
          background: "rgba(194,159,96,0.6)", marginBottom: 12 * scale,
        }} />
        <p style={{
          fontFamily: '"Lora", Georgia, serif',
          fontSize: 13 * scale, fontWeight: 400,
          color: "rgba(255,255,255,0.85)", lineHeight: 1.45,
          fontStyle: "italic",
          textShadow: `0 ${1 * scale}px ${4 * scale}px rgba(0,0,0,0.5)`,
        }}>
          {card.line2 || "I walk in alignment…"}
        </p>
      </div>

      {/* Bottom label */}
      <div style={{
        position: "absolute", bottom: 14 * scale, left: 0, right: 0,
        textAlign: "center",
      }}>
        <span style={{
          fontFamily: "Syne, system-ui, sans-serif",
          fontSize: 7 * scale, fontWeight: 700,
          color: "rgba(194,159,96,0.5)", letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}>
          PRIMARY ATTUNEMENT
        </span>
      </div>
    </div>
  );
}

// ─── Export canvas ────────────────────────────────────────────────────────────
async function exportCard(card: AttunementCard): Promise<void> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  if (card.backgroundImageDataUrl) {
    await new Promise<void>((res) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(W / img.width, H / img.height);
        const sw = img.width * scale, sh = img.height * scale;
        ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
        res();
      };
      img.onerror = () => res();
      img.src = card.backgroundImageDataUrl!;
    });
    const ov = card.overlayOpacity ?? 0.45;
    ctx.fillStyle = `rgba(0,0,0,${ov})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = card.backgroundGradient ?? GRADIENTS[0];
    const grd = ctx.createLinearGradient(0, 0, W * Math.cos((grad.angle * Math.PI) / 180), H * Math.sin((grad.angle * Math.PI) / 180));
    grd.addColorStop(0, grad.from);
    grd.addColorStop(1, grad.to);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  // Gold top accent
  const goldGrd = ctx.createLinearGradient(W * 0.35, 0, W * 0.65, 0);
  goldGrd.addColorStop(0, "transparent");
  goldGrd.addColorStop(0.5, "#C29F60");
  goldGrd.addColorStop(1, "transparent");
  ctx.fillStyle = goldGrd;
  ctx.fillRect(W * 0.35, 0, W * 0.3, 4);

  // Line 1
  ctx.font = `bold 72px "Georgia", serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 20;
  wrapText(ctx, card.line1, W / 2, H / 2 - 60, W - 160, 88);

  // Divider
  ctx.shadowBlur = 0;
  const divGrd = ctx.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
  divGrd.addColorStop(0, "transparent");
  divGrd.addColorStop(0.5, "rgba(194,159,96,0.7)");
  divGrd.addColorStop(1, "transparent");
  ctx.fillStyle = divGrd;
  ctx.fillRect(W / 2 - 80, H / 2 + 40, 160, 2);

  // Line 2
  ctx.font = `italic 56px "Georgia", serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 12;
  wrapText(ctx, card.line2, W / 2, H / 2 + 110, W - 200, 70);

  // Bottom label
  ctx.shadowBlur = 0;
  ctx.font = `700 28px "Arial", sans-serif`;
  ctx.fillStyle = "rgba(194,159,96,0.5)";
  ctx.letterSpacing = "8px";
  ctx.fillText("PRIMARY ATTUNEMENT", W / 2, H - 80);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.title.replace(/[^a-z0-9]/gi, "_")}_attunement.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

// ─── Creator Modal ────────────────────────────────────────────────────────────
type CreatorMode = "manual" | "auto" | "ai";

interface CreatorProps {
  onSave: (card: AttunementCard) => void;
  onClose: () => void;
  editCard?: AttunementCard;
}

function Creator({ onSave, onClose, editCard }: CreatorProps) {
  const { session } = useAuth();
  const [mode, setMode] = useState<CreatorMode>(editCard?.generationMode ?? "ai");
  const [line1, setLine1] = useState(editCard?.line1 ?? "");
  const [line2, setLine2] = useState(editCard?.line2 ?? "");
  const [title, setTitle] = useState(editCard?.title ?? "Primary Attunement");
  const [bgImage, setBgImage] = useState<string | undefined>(editCard?.backgroundImageDataUrl);
  const [bgGradient, setBgGradient] = useState(editCard?.backgroundGradient ?? GRADIENTS[2]);
  const [overlay, setOverlay] = useState(editCard?.overlayOpacity ?? 0.45);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [visions, setVisions] = useState<VisionVideo[]>([]);
  const [visionImages, setVisionImages] = useState<string[]>([]);
  const [bgTab, setBgTab] = useState<"gradient" | "image">(editCard?.backgroundImageDataUrl ? "image" : "gradient");
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const v = loadVisions();
    setVisions(v);
    setVisionImages(extractVisionImages(v));
    // Auto-mode: pre-fill from best sources
    if (mode === "auto" && !line1) {
      const stmts = extractStatements();
      const topStmt = stmts[0];
      if (topStmt?.being) {
        const words = topStmt.being.split(/[,.!?]/)[0].trim();
        setLine1(words.startsWith("I AM") ? words : `I AM ${words}`);
      }
      if (topStmt?.doing) {
        const words = topStmt.doing.split(/[,.!?]/)[0].trim();
        setLine2(words.startsWith("I ") ? words : `I ${words}`);
      }
      // Auto-pick first vision image
      const imgs = extractVisionImages(v);
      if (imgs[0]) { setBgImage(imgs[0]); setBgTab("image"); }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    if (!session?.access_token) return;
    setGenerating(true);
    setGenError("");
    try {
      const stmts = extractStatements();
      const texts = extractVisionTexts(visions);
      const res = await fetch("/api/attunement", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statements: stmts, visionTexts: texts }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data: { line1: string; line2: string } = await res.json();
      setLine1(data.line1);
      setLine2(data.line2);
    } catch {
      setGenError("Generation failed — check your API key or try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!line1.trim() || !line2.trim()) return;
    const card: AttunementCard = {
      id: editCard?.id ?? uid(),
      title: title.trim() || "Primary Attunement",
      line1: line1.trim(),
      line2: line2.trim(),
      backgroundImageDataUrl: bgTab === "image" ? bgImage : undefined,
      backgroundGradient: bgTab === "gradient" ? bgGradient : undefined,
      overlayOpacity: bgTab === "image" ? overlay : undefined,
      generationMode: mode,
      visionId: visions[0]?.id,
      createdAt: editCard?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(card);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBgImage(ev.target?.result as string);
      setBgTab("image");
    };
    reader.readAsDataURL(file);
  };

  const previewCard: Partial<AttunementCard> = {
    line1, line2,
    backgroundImageDataUrl: bgTab === "image" ? bgImage : undefined,
    backgroundGradient: bgTab === "gradient" ? bgGradient : undefined,
    overlayOpacity: overlay,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(4,13,28,0.9)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, overflowY: "auto",
    }}>
      <div style={{
        background: "#0a1628", border: "1px solid rgba(194,159,96,0.2)",
        borderRadius: 16, width: "100%", maxWidth: 880,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        display: "flex", flexDirection: "column", gap: 0,
        maxHeight: "95vh", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid rgba(194,159,96,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, color: "#DED3C8", fontFamily: '"Lora",Georgia,serif', fontSize: 17, fontWeight: 700 }}>
            {editCard ? "Edit Attunement" : "Create Primary Attunement"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.4)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden", flexWrap: "wrap" }}>
          {/* Left: controls */}
          <div style={{
            flex: 1, minWidth: 300, padding: "20px 24px",
            overflowY: "auto", display: "flex", flexDirection: "column", gap: 18,
          }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Card Name</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={inputStyle}
                placeholder="Primary Attunement"
              />
            </div>

            {/* Mode tabs */}
            <div>
              <label style={labelStyle}>Generation Mode</label>
              <div style={{ display: "flex", gap: 6 }}>
                {([
                  { key: "ai" as const,     icon: Sparkles, label: "AI Generate" },
                  { key: "auto" as const,   icon: Wand2,    label: "Auto Select" },
                  { key: "manual" as const, icon: Hand,     label: "Manual" },
                ]).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    style={{
                      flex: 1, padding: "7px 6px", borderRadius: 8,
                      border: mode === key ? "1.5px solid rgba(194,159,96,0.45)" : "1px solid rgba(255,255,255,0.08)",
                      background: mode === key ? "rgba(194,159,96,0.1)" : "rgba(255,255,255,0.03)",
                      color: mode === key ? "#C29F60" : "rgba(222,211,200,0.4)",
                      fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                      letterSpacing: "0.04em", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI generate button */}
            {mode === "ai" && (
              <div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{
                    width: "100%", padding: "10px 0",
                    borderRadius: 8, border: "1px solid rgba(194,159,96,0.35)",
                    background: "rgba(194,159,96,0.1)", color: "#C29F60",
                    fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                    letterSpacing: "0.08em", cursor: generating ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    opacity: generating ? 0.7 : 1,
                  }}
                >
                  {generating
                    ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
                    : <><Sparkles size={13} /> Generate with AI</>
                  }
                </button>
                {genError && <p style={{ color: "#ff6b6b", fontSize: 11, marginTop: 6, fontFamily: "Syne,system-ui,sans-serif" }}>{genError}</p>}
                <p style={{ color: "rgba(222,211,200,0.4)", fontSize: 11, marginTop: 6, fontFamily: "Syne,system-ui,sans-serif", lineHeight: 1.4 }}>
                  Uses your Being/Doing Statements and Vision Video content.
                </p>
                <p style={{ color: "rgba(222,211,200,0.4)", fontSize: 11, marginTop: 4, fontFamily: "Syne,system-ui,sans-serif", lineHeight: 1.4 }}>
                  To write your card, these words are sent unencrypted to our AI provider for this one request. They are never logged or stored.
                </p>
              </div>
            )}

            {/* Text lines */}
            <div>
              <label style={labelStyle}>Line 1 <span style={{ opacity: 0.5 }}>— starts with I AM</span></label>
              <textarea
                value={line1}
                onChange={e => setLine1(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
                placeholder="I AM grounded, powerful, and fully expressed…"
              />
            </div>
            <div>
              <label style={labelStyle}>Line 2 <span style={{ opacity: 0.5 }}>— present-tense action</span></label>
              <textarea
                value={line2}
                onChange={e => setLine2(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
                placeholder="I move through the world with clarity and intention…"
              />
            </div>

            {/* Background */}
            <div>
              <label style={labelStyle}>Background</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {(["gradient", "image"] as const).map((t) => (
                  <button key={t} onClick={() => setBgTab(t)} style={{
                    flex: 1, padding: "6px 0", borderRadius: 7,
                    border: bgTab === t ? "1.5px solid rgba(194,159,96,0.4)" : "1px solid rgba(255,255,255,0.07)",
                    background: bgTab === t ? "rgba(194,159,96,0.08)" : "transparent",
                    color: bgTab === t ? "#C29F60" : "rgba(222,211,200,0.4)",
                    fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                    letterSpacing: "0.06em", cursor: "pointer", textTransform: "capitalize",
                  }}>
                    {t}
                  </button>
                ))}
              </div>

              {bgTab === "gradient" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.label}
                      onClick={() => setBgGradient({ from: g.from, to: g.to, angle: g.angle })}
                      style={{
                        height: 40, borderRadius: 8, cursor: "pointer",
                        background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`,
                        border: bgGradient.from === g.from && bgGradient.to === g.to
                          ? "2px solid #C29F60"
                          : "1px solid rgba(255,255,255,0.1)",
                        position: "relative",
                      }}
                    >
                      {bgGradient.from === g.from && bgGradient.to === g.to && (
                        <Check size={10} style={{ position: "absolute", bottom: 3, right: 3, color: "#C29F60" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {bgTab === "image" && (
                <div>
                  {/* Vision images */}
                  {visionImages.length > 0 && (
                    <div>
                      <p style={{ ...labelStyle, marginBottom: 6 }}>From your Vision Videos</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        {visionImages.slice(0, 8).map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setBgImage(img)}
                            style={{
                              width: 56, height: 40, borderRadius: 6, cursor: "pointer",
                              backgroundImage: `url(${img})`,
                              backgroundSize: "cover", backgroundPosition: "center",
                              border: bgImage === img ? "2px solid #C29F60" : "1px solid rgba(255,255,255,0.1)",
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => imgInputRef.current?.click()}
                    style={{
                      width: "100%", padding: "8px 0", borderRadius: 7,
                      border: "1px dashed rgba(194,159,96,0.3)",
                      background: "transparent", color: "rgba(194,159,96,0.6)",
                      fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                      letterSpacing: "0.06em", cursor: "pointer",
                    }}
                  >
                    + Upload Image
                  </button>
                  <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

                  {bgImage && bgTab === "image" && (
                    <div style={{ marginTop: 10 }}>
                      <label style={labelStyle}>Overlay Opacity</label>
                      <input
                        type="range" min={0} max={0.85} step={0.05} value={overlay}
                        onChange={e => setOverlay(parseFloat(e.target.value))}
                        style={{ width: "100%", accentColor: "#C29F60" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: preview */}
          <div style={{
            width: 310, flexShrink: 0, padding: "20px 20px",
            borderLeft: "1px solid rgba(194,159,96,0.08)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            overflowY: "auto",
          }}>
            <p style={{ ...labelStyle, alignSelf: "flex-start" }}>Preview</p>
            <CardPreview card={previewCard} scale={0.98} />
            <p style={{ color: "rgba(222,211,200,0.3)", fontSize: 10, fontFamily: "Syne,system-ui,sans-serif", textAlign: "center" }}>
              Exports as 1080×1920 PNG
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid rgba(194,159,96,0.1)",
          display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "rgba(222,211,200,0.5)",
            fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
            letterSpacing: "0.06em", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!line1.trim() || !line2.trim()}
            style={{
              padding: "9px 24px", borderRadius: 8,
              border: "1px solid rgba(194,159,96,0.4)",
              background: "rgba(194,159,96,0.15)", color: "#C29F60",
              fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: !line1.trim() || !line2.trim() ? "not-allowed" : "pointer",
              opacity: !line1.trim() || !line2.trim() ? 0.5 : 1,
            }}
          >
            Save Attunement
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", color: "rgba(222,211,200,0.55)",
  fontSize: 11, fontFamily: "Syne,system-ui,sans-serif",
  fontWeight: 700, letterSpacing: "0.08em",
  textTransform: "uppercase", marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(194,159,96,0.2)",
  borderRadius: 8, padding: "9px 13px",
  color: "#DED3C8", fontSize: 13,
  fontFamily: '"Lora",Georgia,serif',
  outline: "none",
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AttunementPage() {
  const router = useRouter();
  const [cards, setCards] = useState<AttunementCard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [editCard, setEditCard] = useState<AttunementCard | undefined>();

  const reloadFromStorage = useCallback(() => {
    setCards(loadCards());
    setActiveId(loadActive());
  }, []);
  useEffect(reloadFromStorage, [reloadFromStorage]);
  // Cards made or changed on another device
  useVaultRefresh(["attunement"], reloadFromStorage);

  const handleSave = useCallback((card: AttunementCard) => {
    setCards(prev => {
      const idx = prev.findIndex(c => c.id === card.id);
      const next = idx >= 0 ? prev.map(c => c.id === card.id ? card : c) : [...prev, card];
      saveCards(next);
      return next;
    });
    // Auto-pin first card
    if (cards.length === 0) {
      setActiveId(card.id);
      saveActive(card.id);
    }
    setShowCreator(false);
    setEditCard(undefined);
  }, [cards.length]);

  const handlePin = (id: string) => {
    setActiveId(id);
    saveActive(id);
  };

  const handleDelete = (id: string) => {
    setCards(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCards(next);
      return next;
    });
    if (activeId === id) {
      const remaining = cards.filter(c => c.id !== id);
      const newActive = remaining[0]?.id ?? null;
      setActiveId(newActive);
      if (newActive) saveActive(newActive);
      else try { localStorage.removeItem(ACTIVE_KEY); } catch {}
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#040d1c", padding: "0 0 60px" }}>
      {showCreator && (
        <Creator
          onSave={handleSave}
          onClose={() => { setShowCreator(false); setEditCard(undefined); }}
          editCard={editCard}
        />
      )}

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(194,159,96,0.1)",
        background: "rgba(4,13,28,0.95)",
        padding: "16px 24px",
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, rowGap: 10,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.push("/vision")}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "rgba(222,211,200,0.45)", display: "flex", alignItems: "center", gap: 5,
            padding: 0, fontSize: 12, fontFamily: "Syne,system-ui,sans-serif",
          }}
        >
          <ChevronLeft size={14} /> Vision
        </button>
        <div style={{ width: 1, height: 16, background: "rgba(194,159,96,0.2)" }} />
        <h1 style={{
          margin: 0, flex: 1, color: "#DED3C8",
          fontFamily: '"Lora",Georgia,serif', fontSize: 18, fontWeight: 700,
        }}>
          Primary Attunements
        </h1>
        <button
          onClick={() => { setEditCard(undefined); setShowCreator(true); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            border: "1px solid rgba(194,159,96,0.35)",
            background: "rgba(194,159,96,0.1)", color: "#C29F60",
            fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
            letterSpacing: "0.08em", cursor: "pointer",
          }}
        >
          <Plus size={13} /> New Attunement
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 0" }}>
        {cards.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "64px 24px",
            color: "rgba(222,211,200,0.4)",
            fontFamily: "Syne,system-ui,sans-serif", fontSize: 14,
          }}>
            <Sparkles size={32} style={{ color: "rgba(194,159,96,0.3)", margin: "0 auto 16px", display: "block" }} />
            <p style={{ marginBottom: 8 }}>No attunements yet.</p>
            <p style={{ fontSize: 12, opacity: 0.6 }}>
              Create your first Primary Attunement — it will appear on your dashboard and can be exported as a phone wallpaper.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: 24,
          }}>
            {cards.map(card => (
              <div key={card.id} style={{ position: "relative" }}>
                {/* Active badge */}
                {activeId === card.id && (
                  <div style={{
                    position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(194,159,96,0.15)", border: "1px solid rgba(194,159,96,0.4)",
                    borderRadius: 20, padding: "2px 10px", zIndex: 2,
                    fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                    color: "#C29F60", letterSpacing: "0.12em", textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>
                    ★ Active
                  </div>
                )}

                <CardPreview card={card} />

                {/* Title */}
                <p style={{
                  marginTop: 10, textAlign: "center",
                  color: "rgba(222,211,200,0.7)",
                  fontFamily: '"Lora",Georgia,serif', fontSize: 13, fontWeight: 600,
                }}>
                  {card.title}
                </p>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center" }}>
                  {activeId !== card.id && (
                    <button
                      onClick={() => handlePin(card.id)}
                      title="Set as active"
                      style={actionBtn("#C29F60")}
                    >
                      <Star size={12} /> Set Active
                    </button>
                  )}
                  <button
                    onClick={() => exportCard(card)}
                    title="Download wallpaper"
                    style={actionBtn("#1D7458")}
                  >
                    <Download size={12} /> Wallpaper
                  </button>
                  <button
                    onClick={() => { setEditCard(card); setShowCreator(true); }}
                    title="Edit"
                    style={actionBtn("rgba(222,211,200,0.5)")}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    title="Delete"
                    style={actionBtn("rgba(255,107,107,0.6)")}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function actionBtn(color: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 4,
    padding: "5px 10px", borderRadius: 6,
    border: `1px solid ${color}40`,
    background: `${color}12`, color,
    fontSize: 10, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
    letterSpacing: "0.04em", cursor: "pointer",
  };
}
