"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2,
  Upload, Trash2, Loader2, Music, X,
  ChevronDown, ChevronUp, Pencil, Check,
  Image as ImageIcon, Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "rng@thejourneymencollective.com";

// Cosmic orb gradient — matches the "Vision for the Future" reference image
const COSMIC_BG = [
  "radial-gradient(ellipse 42% 40% at 50% 47%, rgba(0,230,245,0.6) 0%, rgba(0,185,215,0.35) 38%, transparent 70%)",
  "radial-gradient(ellipse 68% 65% at 50% 47%, rgba(0,155,185,0.24) 0%, rgba(0,95,145,0.15) 54%, transparent 82%)",
  "radial-gradient(ellipse 96% 92% at 50% 47%, rgba(0,72,125,0.13) 0%, transparent 72%)",
  "linear-gradient(180deg, #010A1E 0%, #010F28 45%, #010A1A 100%)",
].join(", ");

const CARD_SHADOW = [
  "inset 0 3px 0 rgba(255,255,255,0.22)", "inset 0 1px 0 rgba(255,255,255,0.38)",
  "inset 2px 0 0 rgba(255,255,255,0.06)", "inset 0 -3px 8px rgba(0,0,0,0.55)",
  "inset -2px 0 5px rgba(0,0,0,0.25)",
  "0 2px 0 rgba(0,0,0,0.90)", "0 4px 0 rgba(0,0,0,0.75)", "0 6px 0 rgba(0,0,0,0.58)",
  "0 8px 0 rgba(0,0,0,0.42)", "0 10px 0 rgba(0,0,0,0.28)", "0 12px 0 rgba(0,0,0,0.16)",
  "0 14px 0 rgba(0,0,0,0.08)", "0 16px 0 rgba(0,0,0,0.04)",
  "0 20px 28px rgba(0,0,0,0.75)", "0 38px 65px rgba(0,0,0,0.58)",
  "5px 0 16px rgba(0,0,0,0.45)", "0 0 0 1px rgba(0,0,0,0.6)",
].join(", ");

const GOLD_BTN_SHADOW = [
  "inset 0 1px 0 rgba(240,220,170,0.4)", "inset 0 -2px 4px rgba(0,0,0,0.25)",
  "0 2px 0 rgba(20,12,0,0.85)", "0 4px 0 rgba(20,12,0,0.65)",
  "0 6px 0 rgba(20,12,0,0.40)", "0 8px 0 rgba(20,12,0,0.20)",
  "0 10px 20px rgba(0,0,0,0.60)", "0 4px 30px rgba(194,159,96,0.25)",
].join(", ");

const pillBase = {
  fontFamily: "Syne, system-ui, sans-serif",
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  padding: "8px 18px",
  borderRadius: 24,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  transition: "transform 0.15s",
} as React.CSSProperties;

const pillInactive = {
  ...pillBase,
  background: "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(8,20,52,0.55) 60%, rgba(2,8,28,0.72) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderBottom: "1px solid rgba(0,0,0,0.45)",
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.07)",
    "inset 0 -1px 0 rgba(0,0,0,0.2)",
    "0 2px 4px rgba(0,0,0,0.45)",
    "0 4px 10px rgba(0,0,0,0.25)",
    "0 0 0 1px rgba(0,0,0,0.3)",
  ].join(", "),
  color: "rgba(222,211,200,0.72)",
} as React.CSSProperties;

const pillActive = {
  ...pillBase,
  fontWeight: 700,
  background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
  boxShadow: GOLD_BTN_SHADOW,
  color: "#08203A",
} as React.CSSProperties;

interface Meditation {
  id: string;
  title: string;
  description: string;
  category: string;
  audioUrl: string;
  imageUrl?: string;
  createdAt: string;
}

interface QueueItem {
  qid: string;
  file: File;
  title: string;
  category: string;
  imageFile: File | null;
  imagePreview: string | null;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
  progress?: number;
  bytesLoaded?: number;
  bytesTotal?: number;
  startedAt?: number;
}

const CATEGORIES = ["Journey", "Cleanse", "Healing", "Community", "Morning", "Evening", "Breathwork", "Visualization", "Sleep", "Grounding", "General"];

const CATEGORY_ICONS: Record<string, string> = {
  Journey: "🚀",
  Cleanse: "✨",
  Healing: "💫",
  Community: "🤝",
  Morning: "🌅",
  Evening: "🌙",
  Breathwork: "🌬️",
  Visualization: "🔮",
  Sleep: "😴",
  Grounding: "🌿",
  General: "🧘",
};

function titleFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim();
}

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatBytes(b: number): string {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Sticky Bottom Player ──────────────────────────────────────────────────────
function StickyPlayer({ meditation, onPrev, onNext, hasPrev, hasNext, onClose }: {
  meditation: Meditation;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(true);
  const scrubRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoading(true);
    setShouldAutoPlay(true);
    a.load();
  }, [meditation.id]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => {}); setPlaying(true); }
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
    <div className="left-0 md:left-[var(--sidebar-w)]" style={{
      position: "fixed",
      bottom: 0, right: 0,
      zIndex: 200,
      background: "linear-gradient(180deg, rgba(1,10,26,0.97) 0%, rgba(1,12,30,1) 100%)",
      borderTop: "1px solid rgba(194,159,96,0.22)",
      boxShadow: "0 -8px 40px rgba(0,0,0,0.75), 0 -2px 0 rgba(194,159,96,0.08)",
      backdropFilter: "blur(24px)",
      padding: "12px 28px 14px",
      display: "flex",
      alignItems: "center",
      gap: 20,
    }}>
      <audio
        ref={audioRef}
        src={meditation.audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onCanPlay={() => {
          setLoading(false);
          if (shouldAutoPlay) {
            audioRef.current?.play().catch(() => {});
            setPlaying(true);
            setShouldAutoPlay(false);
          }
        }}
        onEnded={() => { setPlaying(false); setCurrentTime(0); if (hasNext) onNext(); }}
        onVolumeChange={() => setVolume(audioRef.current?.volume ?? 1)}
        preload="metadata"
      />

      {/* Thumbnail */}
      <div style={{
        width: 46, height: 46, borderRadius: 8, flexShrink: 0, overflow: "hidden",
        background: COSMIC_BG,
        border: "1px solid rgba(194,159,96,0.12)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
      }}>
        {meditation.imageUrl && (
          <img src={meditation.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>

      {/* Track info */}
      <div style={{ flexShrink: 0, width: 172 }}>
        <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(194,159,96,0.6)", marginBottom: 2 }}>
          {meditation.category}
        </div>
        <div style={{ fontFamily: "Lora, Georgia, serif", fontSize: 13, fontWeight: 600, color: "#DED3C8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {meditation.title}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button onClick={onPrev} disabled={!hasPrev} style={{ background: "none", border: "none", cursor: hasPrev ? "pointer" : "not-allowed", padding: 6, opacity: hasPrev ? 1 : 0.25 }}>
          <SkipBack size={16} color="rgba(222,211,200,0.65)" />
        </button>
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            cursor: loading ? "default" : "pointer",
            background: loading ? "rgba(194,159,96,0.15)" : "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)",
            boxShadow: loading ? "none" : "0 2px 0 rgba(20,12,0,0.85), 0 4px 14px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {loading
            ? <Loader2 size={16} color="rgba(194,159,96,0.6)" style={{ animation: "spin 1s linear infinite" }} />
            : playing
              ? <Pause size={16} color="#08203A" fill="#08203A" />
              : <Play size={16} color="#08203A" fill="#08203A" style={{ marginLeft: 2 }} />
          }
        </button>
        <button onClick={onNext} disabled={!hasNext} style={{ background: "none", border: "none", cursor: hasNext ? "pointer" : "not-allowed", padding: 6, opacity: hasNext ? 1 : 0.25 }}>
          <SkipForward size={16} color="rgba(222,211,200,0.65)" />
        </button>
      </div>

      {/* Scrubber + time */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, color: "rgba(222,211,200,0.4)", flexShrink: 0, letterSpacing: "0.04em" }}>
          {formatTime(currentTime)}
        </span>
        <div
          ref={scrubRef}
          onClick={seek}
          style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", cursor: "pointer", position: "relative", overflow: "hidden" }}
        >
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #C29F60, #E0C878)",
            borderRadius: 4, transition: "width 0.1s linear",
          }} />
        </div>
        <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, color: "rgba(222,211,200,0.4)", flexShrink: 0, letterSpacing: "0.04em" }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Volume2 size={12} color="rgba(222,211,200,0.35)" />
        <input
          type="range" min={0} max={1} step={0.01} value={volume}
          onChange={e => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
          style={{ width: 72, accentColor: "#C29F60", cursor: "pointer" }}
        />
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 6, opacity: 0.4, flexShrink: 0, transition: "opacity 0.15s" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.8"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.4"}
      >
        <X size={16} color="rgba(222,211,200,0.8)" />
      </button>
    </div>
  );
}

// ─── Meditation Grid Card ──────────────────────────────────────────────────────
function MeditationGridCard({ meditation, isActive, onClick, onDelete, onUpdate, isAdmin, session }: {
  meditation: Meditation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onUpdate: (updated: Meditation) => void;
  isAdmin: boolean;
  session: { access_token: string } | null;
}) {
  const [hovering, setHovering] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(meditation.title);
  const [editDesc, setEditDesc] = useState(meditation.description);
  const [editCat, setEditCat] = useState(meditation.category);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(meditation.imageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!editImageFile) setEditImagePreview(meditation.imageUrl ?? null);
  }, [meditation.imageUrl, editImageFile]);

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(meditation.title);
    setEditDesc(meditation.description);
    setEditCat(meditation.category);
    setEditImageFile(null);
    setEditImagePreview(meditation.imageUrl ?? null);
    setSaveError("");
    setEditing(true);
  };

  const handleImageChange = (file: File) => {
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const saveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    setSaveError("");
    try {
      const fd = new FormData();
      fd.append("id", meditation.id);
      fd.append("title", editTitle.trim() || meditation.title);
      fd.append("description", editDesc.trim());
      fd.append("category", editCat);
      if (editImageFile) fd.append("image", editImageFile);
      const res = await fetch("/api/meditations", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      const updated: Meditation = await res.json();
      onUpdate({ ...updated, audioUrl: meditation.audioUrl });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    boxSizing: "border-box",
    padding: "7px 10px", borderRadius: 6,
    background: "rgba(2,12,30,0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#DED3C8", fontFamily: "Lora, Georgia, serif", fontSize: 12.5,
    outline: "none", width: "100%",
  };

  return (
    <>
      {/* Card — same structure as VideoCard */}
      <div
        onClick={onClick}
        onMouseEnter={(e) => {
          setHovering(true);
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = [
            "inset 0 3px 0 rgba(255,255,255,0.28)",
            "inset 0 1px 0 rgba(255,255,255,0.45)",
            "inset 2px 0 0 rgba(255,255,255,0.08)",
            "inset 0 -3px 8px rgba(0,0,0,0.55)",
            "inset -2px 0 5px rgba(0,0,0,0.25)",
            "0 2px 0 rgba(0,0,0,0.90)", "0 4px 0 rgba(0,0,0,0.75)", "0 6px 0 rgba(0,0,0,0.58)",
            "0 8px 0 rgba(0,0,0,0.42)", "0 10px 0 rgba(0,0,0,0.28)", "0 12px 0 rgba(0,0,0,0.16)",
            "0 14px 0 rgba(0,0,0,0.08)", "0 16px 0 rgba(0,0,0,0.04)",
            "0 26px 35px rgba(0,0,0,0.82)", "0 46px 78px rgba(0,0,0,0.65)",
            "5px 0 16px rgba(0,0,0,0.45)", "0 0 0 1px rgba(0,0,0,0.6)",
            ...(isActive ? ["0 0 0 2px rgba(194,159,96,0.45)"] : []),
          ].join(", ");
        }}
        onMouseLeave={(e) => {
          setHovering(false);
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(0)";
          el.style.boxShadow = isActive ? CARD_SHADOW + ", 0 0 0 2px rgba(194,159,96,0.45)" : CARD_SHADOW;
        }}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          background: "linear-gradient(175deg, rgba(255,255,255,0.09) 0%, rgba(20,55,130,0.28) 20%, rgba(6,18,55,0.48) 50%, rgba(3,8,26,0.68) 100%)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          borderTop: "2px solid rgba(255,255,255,0.35)",
          borderLeft: "1px solid rgba(255,255,255,0.18)",
          borderRight: "1.5px solid rgba(194,159,96,0.15)",
          borderBottom: "1.5px solid rgba(140,145,155,0.5)",
          boxShadow: isActive ? CARD_SHADOW + ", 0 0 0 2px rgba(194,159,96,0.45)" : CARD_SHADOW,
          transition: "transform 0.28s cubic-bezier(0.23,1,0.32,1), box-shadow 0.28s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {/* Thumbnail — fixed height 200px, matches VideoCard */}
        <div style={{ position: "relative", height: 200, flexShrink: 0, background: COSMIC_BG }}>
          {meditation.imageUrl && (
            <img src={meditation.imageUrl} alt={meditation.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}

          {/* Play button — centered, always visible */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "transform 0.2s",
                background: isActive
                  ? "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)"
                  : "rgba(194,159,96,0.15)",
                border: isActive ? "none" : "1px solid rgba(194,159,96,0.3)",
                boxShadow: isActive ? "0 2px 0 rgba(20,12,0,0.85), 0 4px 20px rgba(194,159,96,0.45)" : "none",
              }}
            >
              <Play size={20} color={isActive ? "#08203A" : "#C29F60"} fill={isActive ? "#08203A" : "#C29F60"} style={{ marginLeft: 2 }} />
            </div>
          </div>

          {/* Category badge — bottom right, matching VideoCard's duration badge position */}
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            display: "flex", alignItems: "center", gap: 4,
            borderRadius: 4, padding: "2px 8px",
            background: "rgba(4,13,28,0.8)",
          }}>
            <span style={{ fontSize: "0.68rem", color: "rgba(222,211,200,0.5)", fontFamily: "Avenir, Nunito, system-ui, sans-serif" }}>
              {CATEGORY_ICONS[meditation.category] ?? "🧘"} {meditation.category}
            </span>
          </div>

          {/* Admin controls — visible on hover */}
          {isAdmin && hovering && (
            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
              <button
                onClick={openEdit}
                style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(1,6,18,0.78)", border: "1px solid rgba(194,159,96,0.22)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}
                title="Edit"
              >
                <Pencil size={11} color="rgba(194,159,96,0.9)" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(1,6,18,0.78)", border: "1px solid rgba(255,80,80,0.22)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}
                title="Delete"
              >
                <Trash2 size={11} color="rgba(255,80,80,0.8)" />
              </button>
            </div>
          )}
        </div>

        {/* Info section — fixed height 170px, matches VideoCard */}
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", height: 170, flexShrink: 0 }}>
          <p style={{
            fontFamily: "Syne, system-ui, sans-serif",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.12em",
            fontSize: "0.6rem",
            color: "#C29F60",
            margin: "0 0 4px",
          }}>
            {meditation.category}
          </p>

          <h3 style={{
            fontFamily: '"Lora", Georgia, serif',
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "#DED3C8",
            lineHeight: 1.35,
            margin: "0 0 4px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
            {meditation.title}
          </h3>

          <p style={{
            fontFamily: "Avenir, Nunito, system-ui, sans-serif",
            fontSize: "0.78rem",
            color: "rgba(222,211,200,0.5)",
            lineHeight: 1.5,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
            {meditation.description}
          </p>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,4,14,0.85)", backdropFilter: "blur(6px)" }}
          onClick={() => setEditing(false)}
        >
          <div
            style={{
              width: 460,
              borderRadius: 16,
              padding: "24px 24px 20px",
              background: "linear-gradient(160deg, rgba(3,18,46,0.99) 0%, rgba(1,10,28,1) 100%)",
              border: "1px solid rgba(194,159,96,0.22)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.5)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(194,159,96,0.65)", marginBottom: 16 }}>
              Edit Meditation
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              {/* Cover picker */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 82, height: 82, borderRadius: 10, overflow: "hidden",
                  background: editImagePreview ? "none" : COSMIC_BG,
                  border: "1px dashed rgba(194,159,96,0.28)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {editImagePreview
                    ? <img src={editImagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <ImageIcon size={20} color="rgba(194,159,96,0.45)" />
                  }
                </div>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageChange(f); }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                <div style={{ fontFamily: "Syne", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(194,159,96,0.4)", textAlign: "center", marginTop: 5 }}>Cover</div>
              </div>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 9 }}>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" style={inputStyle} />
                  <select value={editCat} onChange={e => setEditCat(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description (optional)" style={inputStyle} />
              </div>
            </div>

            {saveError && <p style={{ fontFamily: "Lora", fontStyle: "italic", fontSize: 11, color: "rgba(255,100,100,0.8)", margin: "0 0 10px" }}>{saveError}</p>}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditing(false)}
                style={{ padding: "8px 14px", borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(222,211,200,0.5)", fontFamily: "Syne", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 7, cursor: saving ? "default" : "pointer", fontFamily: "Syne", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: saving ? "rgba(194,159,96,0.2)" : "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)", color: saving ? "rgba(222,211,200,0.4)" : "#08203A", border: "1.5px solid rgba(240,220,170,0.4)", boxShadow: saving ? "none" : "0 2px 0 rgba(20,12,0,0.85)" }}
              >
                {saving ? <><Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Check size={10} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Upload Panel ──────────────────────────────────────────────────────────────
function UploadPanel({ session, onUploaded }: {
  session: { access_token: string } | null;
  onUploaded: (m: Meditation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!uploading) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [uploading]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const items: QueueItem[] = Array.from(files).map(f => ({
      qid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f, title: titleFromFilename(f.name), category: "General",
      imageFile: null, imagePreview: null, status: "pending",
    }));
    setQueue(q => [...q, ...items]);
  };

  const setItemImage = (qid: string, file: File) => {
    setQueue(q => q.map(i => i.qid === qid ? { ...i, imageFile: file, imagePreview: URL.createObjectURL(file) } : i));
  };

  const removeItem = (qid: string) => setQueue(q => q.filter(i => i.qid !== qid));
  const clearDone = () => setQueue(q => q.filter(i => i.status !== "done"));
  const pendingCount = queue.filter(i => i.status === "pending").length;

  const uploadAll = async () => {
    if (!pendingCount || uploading) return;
    setUploading(true);
    for (const item of queue.filter(i => i.status === "pending")) {
      const { qid } = item;
      setQueue(q => q.map(i => i.qid === qid ? { ...i, status: "uploading", startedAt: Date.now() } : i));
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("title", item.title.trim() || titleFromFilename(item.file.name));
        fd.append("category", item.category);
        if (item.imageFile) fd.append("image", item.imageFile);

        const responseText = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/meditations/upload");
          xhr.setRequestHeader("x-supabase-token", session?.access_token ?? "");
          xhr.upload.addEventListener("progress", (e) => {
            if (!e.lengthComputable) return;
            // Cap at 99% — server-side Bunny.net transfer is the final 1%
            const pct = Math.min(99, Math.round((e.loaded / e.total) * 99));
            setQueue(q => q.map(i => i.qid === qid
              ? { ...i, progress: pct, bytesLoaded: e.loaded, bytesTotal: e.total }
              : i));
          });
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.responseText);
            } else {
              let msg = `HTTP ${xhr.status}`;
              try { msg = JSON.parse(xhr.responseText).error ?? msg; } catch { /* no-op */ }
              reject(new Error(msg));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(fd);
        });

        const m: Meditation = JSON.parse(responseText);
        onUploaded(m);
        setQueue(q => q.map(i => i.qid === qid ? { ...i, status: "done", progress: 100 } : i));
      } catch (err) {
        setQueue(q => q.map(i => i.qid === item.qid ? { ...i, status: "error", errorMsg: err instanceof Error ? err.message : "Failed" } : i));
      }
    }
    setUploading(false);
  };

  const inputStyle: React.CSSProperties = {
    boxSizing: "border-box", padding: "6px 10px", borderRadius: 6,
    background: "rgba(2,12,30,0.6)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#DED3C8", fontFamily: "Lora, Georgia, serif", fontSize: 12.5, outline: "none", width: "100%",
  };

  const statusColor = { pending: "rgba(222,211,200,0.3)", uploading: "#C29F60", done: "rgba(80,200,120,0.8)", error: "rgba(255,80,80,0.7)" };

  return (
    <div style={{
      borderRadius: 10, overflow: "hidden",
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
            Upload Meditations
          </span>
        </div>
        {open ? <ChevronUp size={13} color="rgba(194,159,96,0.5)" /> : <ChevronDown size={13} color="rgba(194,159,96,0.5)" />}
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px" }}>
          <div style={{
            padding: "18px 20px", borderRadius: 8, textAlign: "center",
            background: "rgba(2,12,30,0.4)", border: "1px dashed rgba(255,255,255,0.12)",
            cursor: "pointer", position: "relative", marginBottom: queue.length ? 14 : 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <input type="file" accept="audio/*" multiple onChange={e => addFiles(e.target.files)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            <Upload size={14} color="rgba(194,159,96,0.4)" />
            <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(222,211,200,0.35)" }}>
              {queue.length ? "Add more audio files" : "Select audio files (MP3, M4A, WAV) — pick multiple at once"}
            </span>
          </div>

          {queue.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {queue.map(item => (
                <div key={item.qid} style={{
                  borderRadius: 8, padding: "10px 12px",
                  background: item.status === "done" ? "rgba(80,200,120,0.04)" : item.status === "error" ? "rgba(255,80,80,0.04)" : item.status === "uploading" ? "rgba(194,159,96,0.06)" : "rgba(2,12,30,0.5)",
                  border: `1px solid ${item.status === "done" ? "rgba(80,200,120,0.2)" : item.status === "error" ? "rgba(255,80,80,0.2)" : item.status === "uploading" ? "rgba(194,159,96,0.25)" : "rgba(255,255,255,0.07)"}`,
                  display: "flex", flexDirection: "column", gap: 10,
                  opacity: item.status === "done" ? 0.7 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 6, overflow: "hidden",
                        background: item.imagePreview ? "none" : COSMIC_BG,
                        border: "1px dashed rgba(194,159,96,0.25)",
                        cursor: item.status === "pending" ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {item.imagePreview
                          ? <img src={item.imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <Music size={13} color="rgba(194,159,96,0.3)" />
                        }
                      </div>
                      {item.status === "pending" && (
                        <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setItemImage(item.qid, f); }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 8 }}>
                      <input value={item.title} onChange={e => setQueue(q => q.map(i => i.qid === item.qid ? { ...i, title: e.target.value } : i))} disabled={item.status !== "pending"} style={{ ...inputStyle, flex: "2 1 0" }} placeholder="Title" />
                      <select value={item.category} onChange={e => setQueue(q => q.map(i => i.qid === item.qid ? { ...i, category: e.target.value } : i))} disabled={item.status !== "pending"} style={{ ...inputStyle, flex: "1 1 0", cursor: "pointer" }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
                      {item.status === "uploading" && <Loader2 size={10} color="#C29F60" style={{ animation: "spin 1s linear infinite" }} />}
                      <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: statusColor[item.status] }}>
                        {item.status === "uploading" ? "Uploading" : item.status === "done" ? "Done" : item.status === "error" ? (item.errorMsg ?? "Error") : "Ready"}
                      </span>
                    </div>

                    {item.status === "pending" && (
                      <button onClick={() => removeItem(item.qid)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.4, flexShrink: 0 }}>
                        <X size={12} color="rgba(222,211,200,0.6)" />
                      </button>
                    )}
                  </div>

                  {item.status === "uploading" && (() => {
                    const pct = item.progress ?? 0;
                    const isSending = pct >= 99;
                    const elapsedSec = item.startedAt ? (Date.now() - item.startedAt) / 1000 : 0;
                    const mm = Math.floor(elapsedSec / 60);
                    const ss = Math.floor(elapsedSec % 60);
                    const mbps = (!isSending && item.bytesLoaded && elapsedSec > 0.5)
                      ? (item.bytesLoaded / (1024 * 1024)) / elapsedSec
                      : null;
                    return (
                      <div>
                        {/* Track */}
                        <div style={{
                          height: 22, borderRadius: 11,
                          background: "rgba(2,12,30,0.8)",
                          border: `1px solid ${isSending ? "rgba(194,159,96,0.45)" : "rgba(194,159,96,0.22)"}`,
                          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.55)",
                          position: "relative", overflow: "hidden",
                        }}>
                          {/* Fill */}
                          <div style={{
                            position: "absolute", inset: "0 auto 0 0",
                            width: isSending ? "100%" : `${pct}%`,
                            background: "linear-gradient(90deg, #7A5010 0%, #C29F60 28%, #F0E098 50%, #C8A04C 72%, #8B6020 100%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer-gold 1.8s linear infinite",
                            borderRadius: 11,
                            transition: isSending ? "none" : "width 0.35s ease",
                            boxShadow: "0 0 14px rgba(194,159,96,0.55), 0 0 28px rgba(194,159,96,0.28)",
                          }} />
                          {/* Percentage overlay */}
                          {!isSending && pct > 0 && (
                            <span style={{
                              position: "absolute", inset: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontFamily: "Syne, system-ui, sans-serif", fontSize: 9,
                              fontWeight: 800, letterSpacing: "0.08em",
                              color: pct > 50 ? "rgba(8,32,58,0.9)" : "rgba(240,220,170,0.85)",
                              mixBlendMode: pct > 50 ? "multiply" : "normal",
                              pointerEvents: "none",
                            }}>
                              {pct}%
                            </span>
                          )}
                          {isSending && (
                            <span style={{
                              position: "absolute", inset: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontFamily: "Syne, system-ui, sans-serif", fontSize: 8,
                              fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                              color: "rgba(8,32,58,0.85)", pointerEvents: "none",
                            }}>
                              Enhancing audio…
                            </span>
                          )}
                        </div>
                        {/* Metadata row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
                          <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(194,159,96,0.55)" }}>
                            {isSending
                              ? `Enhancing — ${mm}:${ss.toString().padStart(2, "0")} elapsed`
                              : item.bytesTotal
                                ? `${formatBytes(item.bytesLoaded ?? 0)} of ${formatBytes(item.bytesTotal)}`
                                : "Uploading…"}
                          </span>
                          {mbps !== null && (
                            <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(194,159,96,0.45)" }}>
                              {mbps >= 1 ? `${mbps.toFixed(1)} MB/s` : `${(mbps * 1024).toFixed(0)} KB/s`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}

          {queue.length > 0 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
              {queue.some(i => i.status === "done") && (
                <button onClick={clearDone} style={{ padding: "7px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(222,211,200,0.4)", fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
                  Clear Done
                </button>
              )}
              <button onClick={() => { setQueue([]); setOpen(false); }} style={{ padding: "7px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(222,211,200,0.5)", fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}>
                Cancel
              </button>
              {pendingCount > 0 && (
                <button onClick={uploadAll} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 7, cursor: uploading ? "default" : "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: uploading ? "rgba(194,159,96,0.2)" : "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)", color: uploading ? "rgba(222,211,200,0.4)" : "#08203A", border: "1.5px solid rgba(240,220,170,0.4)", boxShadow: uploading ? "none" : "0 2px 0 rgba(20,12,0,0.85), 0 4px 12px rgba(0,0,0,0.5)" }}>
                  {uploading ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</> : <><Upload size={12} /> Upload {pendingCount} File{pendingCount !== 1 ? "s" : ""}</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MeditationsPage() {
  const { user, session } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/meditations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then((data: Meditation[]) => { setMeditations(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session?.access_token]);

  const filteredMeditations = meditations.filter(m => {
    const matchesSearch = !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const active = activeIdx !== null ? meditations[activeIdx] : null;
  const availableCategories = CATEGORIES.filter(c => meditations.some(m => m.category === c));

  const onDelete = async (id: string) => {
    if (!confirm("Remove this meditation?")) return;
    await fetch("/api/meditations", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}`, "Content-Type": "application/json" },
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

  const onUpdate = (updated: Meditation) => {
    setMeditations(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const clearLibrary = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    setClearing(true);
    try {
      await fetch("/api/meditations/clear", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      setMeditations([]);
      setActiveIdx(null);
    } finally {
      setClearing(false);
      setClearConfirm(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer-gold {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      <div className="space-y-8" style={{ paddingBottom: active ? 96 : 0, transition: "padding-bottom 0.3s ease" }}>

        {/* Header */}
        <div>
          <p className="brand-subtitle text-gold text-xs mb-2 tracking-[0.25em]">
            Guided Practice
          </p>
          <h1 className="brand-title text-3xl text-white mb-1">
            Meditations
          </h1>
          <p className="text-muted text-sm">
            {meditations.length} guided {meditations.length === 1 ? "practice" : "practices"}
            {availableCategories.length > 0 && ` across ${availableCategories.length} ${availableCategories.length === 1 ? "category" : "categories"}`}
          </p>
        </div>

        {/* Admin upload */}
        {isAdmin && <UploadPanel session={session} onUploaded={onUploaded} />}

        {/* Admin: clear library */}
        {isAdmin && meditations.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { if (!clearing) clearLibrary(); }}
              onBlur={() => setClearConfirm(false)}
              disabled={clearing}
              style={{
                fontFamily: "Syne, system-ui, sans-serif",
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "6px 14px", borderRadius: 8, cursor: clearing ? "default" : "pointer",
                border: clearConfirm
                  ? "1.5px solid rgba(220,60,60,0.8)"
                  : "1.5px solid rgba(220,60,60,0.35)",
                background: clearConfirm
                  ? "rgba(220,60,60,0.18)"
                  : "rgba(220,60,60,0.07)",
                color: clearConfirm ? "rgba(255,120,120,0.95)" : "rgba(220,80,80,0.6)",
                transition: "all 0.2s ease",
                opacity: clearing ? 0.5 : 1,
              }}
            >
              {clearing ? "Clearing…" : clearConfirm ? `Confirm — clear all ${meditations.length} meditations?` : "Clear Library"}
            </button>
          </div>
        )}

        {/* Search */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(222,211,200,0.35)", pointerEvents: "none" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search meditations..."
              style={{
                width: "100%",
                background: "linear-gradient(180deg, rgba(1,8,22,0.88) 0%, rgba(4,15,38,0.72) 100%)",
                boxShadow: ["inset 0 3px 10px rgba(0,0,0,0.65)", "inset 0 1px 5px rgba(0,0,0,0.5)", "inset 0 6px 20px rgba(0,0,0,0.38)", "inset 0 0 0 1.5px rgba(0,0,0,0.45)", "inset 2px 0 8px rgba(0,0,0,0.22)", "0 1px 0 rgba(255,255,255,0.07)"].join(", "),
                border: "1.5px solid rgba(255,255,255,0.06)",
                borderTop: "1.5px solid rgba(0,0,0,0.55)",
                borderRadius: 10,
                padding: "14px 16px 14px 48px",
                color: "#DED3C8",
                fontFamily: "Syne, system-ui, sans-serif",
                fontSize: "0.85rem",
                outline: "none",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "rgba(194,159,96,0.25)";
                e.currentTarget.style.boxShadow = ["inset 0 3px 10px rgba(0,0,0,0.65)", "inset 0 1px 5px rgba(0,0,0,0.5)", "inset 0 6px 20px rgba(0,0,0,0.38)", "inset 0 0 0 1.5px rgba(0,0,0,0.45)", "0 0 0 2px rgba(194,159,96,0.12)", "0 1px 0 rgba(255,255,255,0.07)"].join(", ");
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderTopColor = "rgba(0,0,0,0.55)";
                e.currentTarget.style.boxShadow = ["inset 0 3px 10px rgba(0,0,0,0.65)", "inset 0 1px 5px rgba(0,0,0,0.5)", "inset 0 6px 20px rgba(0,0,0,0.38)", "inset 0 0 0 1.5px rgba(0,0,0,0.45)", "inset 2px 0 8px rgba(0,0,0,0.22)", "0 1px 0 rgba(255,255,255,0.07)"].join(", ");
              }}
            />
          </div>
        </div>

        {/* Category pills */}
        {availableCategories.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={!selectedCategory ? pillActive : pillInactive}
              onMouseEnter={e => { if (selectedCategory) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              All
            </button>
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                style={selectedCategory === cat ? pillActive : pillInactive}
                onMouseEnter={e => { if (selectedCategory !== cat) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                <span>{CATEGORY_ICONS[cat] ?? "🧘"}</span>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {(searchQuery || selectedCategory) && !loading && (
          <p className="text-sm text-muted">
            Showing {filteredMeditations.length} of {meditations.length} meditations
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "72px 0", color: "rgba(222,211,200,0.35)", fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 14 }}>
            Loading…
          </div>
        ) : filteredMeditations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg mb-2">
              {meditations.length === 0
                ? (isAdmin ? "Upload your first meditation above." : "No meditations available yet.")
                : "No meditations found"}
            </p>
            {(searchQuery || selectedCategory) && (
              <>
                <p className="text-muted/60 text-sm">Try a different search or category</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                  className="mt-4 text-sm text-gold hover:text-gold-light transition-colors"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {filteredMeditations.map(m => {
              const realIdx = meditations.findIndex(med => med.id === m.id);
              return (
                <MeditationGridCard
                  key={m.id}
                  meditation={m}
                  isActive={activeIdx === realIdx}
                  onClick={() => setActiveIdx(activeIdx === realIdx ? null : realIdx)}
                  onDelete={() => onDelete(m.id)}
                  onUpdate={onUpdate}
                  isAdmin={isAdmin}
                  session={session}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Player */}
      {active && (
        <StickyPlayer
          meditation={active}
          hasPrev={activeIdx! > 0}
          hasNext={activeIdx! < meditations.length - 1}
          onPrev={() => setActiveIdx(i => i !== null ? Math.max(0, i - 1) : null)}
          onNext={() => setActiveIdx(i => i !== null ? Math.min(meditations.length - 1, i + 1) : null)}
          onClose={() => setActiveIdx(null)}
        />
      )}
    </>
  );
}
