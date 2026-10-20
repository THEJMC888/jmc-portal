"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Upload, Trash2, Loader2, Music, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ADMIN_EMAIL = "rng@thejourneymencollective.com";

interface Meditation {
  id: string;
  title: string;
  description: string;
  category: string;
  audioUrl: string;
  createdAt: string;
}

const CATEGORIES = ["Morning", "Evening", "Breathwork", "Visualization", "Sleep", "Grounding", "General"];

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Audio Player ─────────────────────────────────────────────────────────────
function AudioPlayer({ meditation, onPrev, onNext, hasPrev, hasNext }: {
  meditation: Meditation;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const scrubRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoading(true);
    a.load();
  }, [meditation.id]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    const el = scrubRef.current;
    if (!a || !el || !duration) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * duration;
  }, [duration]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      background: "linear-gradient(160deg, rgba(2,12,30,0.9) 0%, rgba(13,31,60,0.95) 100%)",
      borderRadius: 14,
      padding: "24px 28px",
      marginBottom: 28,
      borderTop: "1px solid rgba(194,159,96,0.3)",
      borderLeft: "2px solid rgba(194,159,96,0.4)",
      borderRight: "1px solid rgba(0,0,0,0.2)",
      borderBottom: "1px solid rgba(0,0,0,0.3)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 2px 8px rgba(0,0,0,0.3)",
    }}>
      <audio
        ref={audioRef}
        src={meditation.audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onCanPlay={() => setLoading(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); if (hasNext) onNext(); }}
        onVolumeChange={() => setVolume(audioRef.current?.volume ?? 1)}
        preload="metadata"
      />

      {/* Category tag + title */}
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(194,159,96,0.6)" }}>
          {meditation.category}
        </span>
      </div>
      <h2 style={{ fontFamily: "Lora, Georgia, serif", fontSize: 22, fontWeight: 600, color: "#DED3C8", margin: "0 0 6px", lineHeight: 1.2 }}>
        {meditation.title}
      </h2>
      {meditation.description && (
        <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.5)", margin: "0 0 20px", lineHeight: 1.65 }}>
          {meditation.description}
        </p>
      )}

      {/* Scrubber */}
      <div
        ref={scrubRef}
        onClick={seek}
        style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", cursor: "pointer", marginBottom: 8, position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #C29F60, #E0C878)", borderRadius: 4, transition: "width 0.1s linear" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, color: "rgba(222,211,200,0.4)", letterSpacing: "0.05em" }}>{formatTime(currentTime)}</span>
        <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, color: "rgba(222,211,200,0.4)", letterSpacing: "0.05em" }}>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          style={{ background: "none", border: "none", cursor: hasPrev ? "pointer" : "not-allowed", padding: 8, opacity: hasPrev ? 1 : 0.25 }}
        >
          <SkipBack size={18} color="rgba(222,211,200,0.65)" />
        </button>

        <button
          onClick={toggle}
          disabled={loading}
          style={{
            width: 52, height: 52, borderRadius: "50%", border: "none", cursor: loading ? "default" : "pointer",
            background: loading ? "rgba(194,159,96,0.15)" : "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)",
            boxShadow: loading ? "none" : "0 2px 0 rgba(20,12,0,0.85), 0 4px 14px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {loading
            ? <Loader2 size={20} color="rgba(194,159,96,0.6)" style={{ animation: "spin 1s linear infinite" }} />
            : playing
              ? <Pause size={20} color="#08203A" fill="#08203A" />
              : <Play size={20} color="#08203A" fill="#08203A" style={{ marginLeft: 2 }} />
          }
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          style={{ background: "none", border: "none", cursor: hasNext ? "pointer" : "not-allowed", padding: 8, opacity: hasNext ? 1 : 0.25 }}
        >
          <SkipForward size={18} color="rgba(222,211,200,0.65)" />
        </button>
      </div>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, justifyContent: "center" }}>
        <Volume2 size={12} color="rgba(222,211,200,0.35)" />
        <input
          type="range" min={0} max={1} step={0.01} value={volume}
          onChange={e => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
          style={{ width: 80, accentColor: "#C29F60", cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

// ─── Meditation Card ──────────────────────────────────────────────────────────
function MeditationCard({ meditation, isActive, onClick, onDelete, isAdmin }: {
  meditation: Meditation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 10,
        padding: "16px 18px",
        cursor: "pointer",
        position: "relative",
        background: isActive
          ? "linear-gradient(160deg, rgba(194,159,96,0.14) 0%, rgba(2,12,30,0.6) 100%)"
          : "rgba(2,12,30,0.4)",
        borderTop: `1px solid ${isActive ? "rgba(194,159,96,0.35)" : "rgba(255,255,255,0.06)"}`,
        borderLeft: `2px solid ${isActive ? "rgba(194,159,96,0.5)" : "rgba(255,255,255,0.04)"}`,
        borderRight: "1px solid rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(0,0,0,0.2)",
        boxShadow: isActive ? "0 4px 20px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.25)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isActive ? "rgba(194,159,96,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isActive ? "rgba(194,159,96,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}>
          {isActive
            ? <Play size={14} color="#C29F60" fill="#C29F60" style={{ marginLeft: 2 }} />
            : <Music size={14} color="rgba(222,211,200,0.3)" />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: isActive ? "rgba(194,159,96,0.7)" : "rgba(222,211,200,0.35)", marginBottom: 3 }}>
            {meditation.category}
          </div>
          <div style={{ fontFamily: "Lora, Georgia, serif", fontSize: 14, fontWeight: 600, color: isActive ? "#DED3C8" : "rgba(222,211,200,0.75)", lineHeight: 1.3, marginBottom: meditation.description ? 4 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {meditation.title}
          </div>
          {meditation.description && (
            <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 11.5, color: "rgba(222,211,200,0.4)", margin: 0, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {meditation.description}
            </p>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, opacity: 0.4, flexShrink: 0 }}
            title="Delete"
          >
            <Trash2 size={13} color="rgba(255,80,80,0.8)" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Upload Panel ─────────────────────────────────────────────────────────────
function UploadPanel({ session, onUploaded }: { session: { access_token: string } | null; onUploaded: (m: Meditation) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setTitle(""); setDescription(""); setCategory("General"); setFile(null); setError(""); };

  const submit = async () => {
    if (!file || !title.trim()) { setError("Title and audio file are required."); return; }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("audio", file);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("category", category);
      const res = await fetch("/api/meditations", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: fd,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Upload failed"); }
      const meditation: Meditation = await res.json();
      onUploaded(meditation);
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px", borderRadius: 7,
    background: "rgba(2,12,30,0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#DED3C8", fontFamily: "Lora, Georgia, serif", fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{
      borderRadius: 10,
      overflow: "hidden",
      background: "rgba(194,159,96,0.04)",
      borderTop: "1px solid rgba(194,159,96,0.2)",
      borderLeft: "2px solid rgba(194,159,96,0.3)",
      borderRight: "1px solid rgba(0,0,0,0.1)",
      borderBottom: "1px solid rgba(0,0,0,0.2)",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "none", border: "none", cursor: "pointer", gap: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Upload size={12} color="rgba(194,159,96,0.8)" />
          <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,159,96,0.8)" }}>
            Upload New Meditation
          </span>
        </div>
        {open ? <ChevronUp size={13} color="rgba(194,159,96,0.5)" /> : <ChevronDown size={13} color="rgba(194,159,96,0.5)" />}
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(222,211,200,0.45)", display: "block", marginBottom: 5 }}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning Centering" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(222,211,200,0.45)", display: "block", marginBottom: 5 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(222,211,200,0.45)", display: "block", marginBottom: 5 }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this meditation…" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div>
            <label style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(222,211,200,0.45)", display: "block", marginBottom: 5 }}>Audio File * (MP3, M4A, WAV)</label>
            <div style={{
              padding: "16px", borderRadius: 7, textAlign: "center",
              background: file ? "rgba(194,159,96,0.06)" : "rgba(2,12,30,0.4)",
              border: `1px dashed ${file ? "rgba(194,159,96,0.4)" : "rgba(255,255,255,0.1)"}`,
              cursor: "pointer", position: "relative",
            }}>
              <input
                type="file"
                accept="audio/*"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              />
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Music size={13} color="rgba(194,159,96,0.8)" />
                  <span style={{ fontFamily: "Lora, Georgia, serif", fontSize: 12.5, color: "rgba(222,211,200,0.75)" }}>{file.name}</span>
                  <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, color: "rgba(222,211,200,0.4)" }}>({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ) : (
                <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(222,211,200,0.35)" }}>Click to choose a file</span>
              )}
            </div>
          </div>

          {error && (
            <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(255,100,100,0.8)", margin: 0 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { reset(); setOpen(false); }} style={{ padding: "9px 16px", borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(222,211,200,0.5)", fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={uploading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 7, cursor: uploading ? "default" : "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: uploading ? "rgba(194,159,96,0.2)" : "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)", color: uploading ? "rgba(222,211,200,0.4)" : "#08203A", border: "1.5px solid rgba(240,220,170,0.4)", boxShadow: uploading ? "none" : "0 2px 0 rgba(20,12,0,0.85), 0 4px 12px rgba(0,0,0,0.5)" }}
            >
              {uploading ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</> : <><Upload size={12} /> Upload</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MeditationsPage() {
  const { user, session } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/meditations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then((data: Meditation[]) => { setMeditations(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session?.access_token]);

  const active = activeIdx !== null ? meditations[activeIdx] : null;

  const onDelete = async (id: string) => {
    if (!confirm("Remove this meditation?")) return;
    await fetch("/api/meditations", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session?.access_token ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    setMeditations(prev => {
      const next = prev.filter(m => m.id !== id);
      setActiveIdx(ai => ai !== null && ai >= next.length ? (next.length > 0 ? next.length - 1 : null) : ai);
      return next;
    });
  };

  const onUploaded = (m: Meditation) => {
    setMeditations(prev => {
      const next = [...prev, m];
      setActiveIdx(next.length - 1);
      return next;
    });
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(194,159,96,0.65)", marginBottom: 6 }}>
            Guided Practice
          </div>
          <h1 style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 600, fontSize: 32, color: "#DED3C8", margin: "0 0 8px", lineHeight: 1.1 }}>
            Meditations
          </h1>
          <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.45)", margin: 0 }}>
            Curated practices to anchor, expand, and align.
          </p>
        </div>

        {/* Player — shown when a meditation is selected */}
        {active && (
          <AudioPlayer
            key={active.id}
            meditation={active}
            hasPrev={activeIdx! > 0}
            hasNext={activeIdx! < meditations.length - 1}
            onPrev={() => setActiveIdx(i => i !== null ? Math.max(0, i - 1) : null)}
            onNext={() => setActiveIdx(i => i !== null ? Math.min(meditations.length - 1, i + 1) : null)}
          />
        )}

        {/* Meditation list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(222,211,200,0.35)", fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13 }}>
            Loading…
          </div>
        ) : meditations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(222,211,200,0.3)", fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13 }}>
            {isAdmin ? "Upload your first meditation below." : "No meditations available yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {meditations.map((m, i) => (
              <MeditationCard
                key={m.id}
                meditation={m}
                isActive={activeIdx === i}
                onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                onDelete={() => onDelete(m.id)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        {/* Admin upload panel */}
        {isAdmin && (
          <UploadPanel session={session} onUploaded={onUploaded} />
        )}
      </div>
    </>
  );
}
