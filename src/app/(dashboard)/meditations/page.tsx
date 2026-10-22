"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2,
  Upload, Trash2, Loader2, Music, X,
  ChevronDown, ChevronUp, Pencil, Check,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

// Direct XHR upload to Vercel Blob — no library callbacks, no completion handshake.
// 1. POST to our server to get a signed clientToken for the pathname.
// 2. PUT the file straight to blob.vercel-storage.com with the token as a Bearer header.
// 3. Resolve with the blob URL from the JSON response.
async function uploadBlob(
  pathname: string,
  file: File,
  accessToken: string,
  onProgress?: (pct: number, loaded: number, total: number) => void
): Promise<string> {
  const tokenRes = await fetch("/api/meditations/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pathname, clientPayload: accessToken }),
  });
  if (!tokenRes.ok) throw new Error(`Token error ${tokenRes.status}`);
  const { clientToken, storeId } = await tokenRes.json() as { clientToken: string; storeId: string };

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `https://blob.vercel-storage.com/?pathname=${encodeURIComponent(pathname)}`);
    xhr.setRequestHeader("authorization", `Bearer ${clientToken}`);
    xhr.setRequestHeader("x-api-version", "13");
    xhr.setRequestHeader("x-content-length", String(file.size));
    xhr.setRequestHeader("x-vercel-blob-store-id", storeId);
    xhr.setRequestHeader("x-access", "public");
    if (file.type) xhr.setRequestHeader("content-type", file.type);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)), e.loaded, e.total);
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { url: string };
          onProgress?.(100, file.size, file.size);
          resolve(data.url);
        } catch {
          reject(new Error("Invalid response from blob storage"));
        }
      } else {
        reject(new Error(`Blob upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.send(file);
  });
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "rng@thejourneymencollective.com";

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
}

const CATEGORIES = ["Morning", "Evening", "Breathwork", "Visualization", "Sleep", "Grounding", "General"];

function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
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

      {/* Album art + metadata */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 10, flexShrink: 0, overflow: "hidden",
          background: "rgba(194,159,96,0.08)",
          border: "1px solid rgba(194,159,96,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: meditation.imageUrl ? "0 6px 20px rgba(0,0,0,0.5)" : "none",
        }}>
          {meditation.imageUrl
            ? <img src={meditation.imageUrl} alt={meditation.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Music size={28} color="rgba(194,159,96,0.3)" />
          }
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(194,159,96,0.6)", marginBottom: 4 }}>
            {meditation.category}
          </div>
          <h2 style={{ fontFamily: "Lora, Georgia, serif", fontSize: 22, fontWeight: 600, color: "#DED3C8", margin: "0 0 6px", lineHeight: 1.2 }}>
            {meditation.title}
          </h2>
          {meditation.description && (
            <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.5)", margin: 0, lineHeight: 1.65 }}>
              {meditation.description}
            </p>
          )}
        </div>
      </div>

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
function MeditationCard({ meditation, isActive, onClick, onDelete, onUpdate, isAdmin, session }: {
  meditation: Meditation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onUpdate: (updated: Meditation) => void;
  isAdmin: boolean;
  session: { access_token: string } | null;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(meditation.title);
  const [editDesc, setEditDesc] = useState(meditation.description);
  const [editCat, setEditCat] = useState(meditation.category);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(meditation.imageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Keep preview in sync if meditation.imageUrl changes externally
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

  if (editing) {
    return (
      <div
        onClick={e => e.stopPropagation()}
        style={{
          borderRadius: 10,
          padding: "16px 18px",
          background: "linear-gradient(160deg, rgba(194,159,96,0.1) 0%, rgba(2,12,30,0.6) 100%)",
          borderTop: "1px solid rgba(194,159,96,0.3)",
          borderLeft: "2px solid rgba(194,159,96,0.4)",
          borderRight: "1px solid rgba(0,0,0,0.15)",
          borderBottom: "1px solid rgba(0,0,0,0.2)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          {/* Cover image picker */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 8, overflow: "hidden",
              background: "rgba(255,255,255,0.04)",
              border: "1px dashed rgba(194,159,96,0.3)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {editImagePreview
                ? <img src={editImagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <ImageIcon size={18} color="rgba(194,159,96,0.4)" />
              }
            </div>
            <input
              type="file" accept="image/*"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageChange(f); }}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(194,159,96,0.4)", textAlign: "center", marginTop: 4 }}>
              Cover
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Title"
                style={inputStyle}
                onClick={e => e.stopPropagation()}
              />
              <select
                value={editCat}
                onChange={e => setEditCat(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onClick={e => e.stopPropagation()}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              style={inputStyle}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>

        {saveError && (
          <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 11, color: "rgba(255,100,100,0.8)", margin: "0 0 8px" }}>{saveError}</p>
        )}

        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button
            onClick={e => { e.stopPropagation(); setEditing(false); }}
            style={{ padding: "7px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(222,211,200,0.5)", fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={saveEdit}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 6, cursor: saving ? "default" : "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: saving ? "rgba(194,159,96,0.2)" : "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)", color: saving ? "rgba(222,211,200,0.4)" : "#08203A", border: "1.5px solid rgba(240,220,170,0.4)", boxShadow: saving ? "none" : "0 2px 0 rgba(20,12,0,0.85)" }}
          >
            {saving
              ? <><Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
              : <><Check size={10} /> Save</>
            }
          </button>
        </div>
      </div>
    );
  }

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
        {/* Thumbnail */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0, overflow: "hidden",
          background: isActive ? "rgba(194,159,96,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isActive ? "rgba(194,159,96,0.3)" : "rgba(255,255,255,0.06)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {meditation.imageUrl ? (
            <img src={meditation.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : isActive ? (
            <Play size={14} color="#C29F60" fill="#C29F60" style={{ marginLeft: 2 }} />
          ) : (
            <Music size={14} color="rgba(222,211,200,0.3)" />
          )}
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
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button
              onClick={openEdit}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 5, opacity: 0.45 }}
              title="Edit"
            >
              <Pencil size={12} color="rgba(194,159,96,0.9)" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 5, opacity: 0.4 }}
              title="Delete"
            >
              <Trash2 size={12} color="rgba(255,80,80,0.8)" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload Panel ─────────────────────────────────────────────────────────────
function UploadPanel({ session, onUploaded }: {
  session: { access_token: string } | null;
  onUploaded: (m: Meditation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const items: QueueItem[] = Array.from(files).map(f => ({
      qid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      title: titleFromFilename(f.name),
      category: "General",
      imageFile: null,
      imagePreview: null,
      status: "pending",
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
      setQueue(q => q.map(i => i.qid === item.qid ? { ...i, status: "uploading" } : i));
      try {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const ext = item.file.name.split(".").pop()?.toLowerCase() ?? "mp3";

        // Upload audio directly to Vercel Blob via our own XHR (no library callbacks)
        const audioUrl = await uploadBlob(
          `jmc-meditations/audio/${id}.${ext}`,
          item.file,
          session?.access_token ?? "",
          (pct, loaded, total) => {
            setQueue(q => q.map(i => i.qid === item.qid ? { ...i, progress: pct, bytesLoaded: loaded, bytesTotal: total } : i));
          }
        );

        // Upload cover image if provided
        let imageBlobUrl: string | undefined;
        if (item.imageFile) {
          const imgExt = item.imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
          imageBlobUrl = await uploadBlob(
            `jmc-meditations/images/${id}.${imgExt}`,
            item.imageFile,
            session?.access_token ?? ""
          );
        }

        // Save metadata to index
        const res = await fetch("/api/meditations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            audioUrl,
            imageUrl: imageBlobUrl,
            title: item.title.trim() || titleFromFilename(item.file.name),
            description: "",
            category: item.category,
          }),
        });

        if (!res.ok) {
          const errMsg = await res.json()
            .then((d: { error?: string }) => d.error)
            .catch(() => `HTTP ${res.status}`);
          throw new Error(errMsg ?? "Failed to save");
        }
        const m: Meditation = await res.json();
        onUploaded(m);
        setQueue(q => q.map(i => i.qid === item.qid ? { ...i, status: "done" } : i));
      } catch (err) {
        setQueue(q => q.map(i => i.qid === item.qid ? { ...i, status: "error", errorMsg: err instanceof Error ? err.message : "Failed" } : i));
      }
    }
    setUploading(false);
  };

  const inputStyle: React.CSSProperties = {
    boxSizing: "border-box",
    padding: "6px 10px", borderRadius: 6,
    background: "rgba(2,12,30,0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#DED3C8", fontFamily: "Lora, Georgia, serif", fontSize: 12.5,
    outline: "none", width: "100%",
  };

  const statusColor = { pending: "rgba(222,211,200,0.3)", uploading: "#C29F60", done: "rgba(80,200,120,0.8)", error: "rgba(255,80,80,0.7)" };

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
            Upload Meditations
          </span>
        </div>
        {open ? <ChevronUp size={13} color="rgba(194,159,96,0.5)" /> : <ChevronDown size={13} color="rgba(194,159,96,0.5)" />}
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px" }}>
          {/* Drop zone */}
          <div style={{
            padding: "18px 20px", borderRadius: 8, textAlign: "center",
            background: "rgba(2,12,30,0.4)",
            border: "1px dashed rgba(255,255,255,0.12)",
            cursor: "pointer", position: "relative",
            marginBottom: queue.length ? 14 : 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <input
              type="file" accept="audio/*" multiple
              onChange={e => addFiles(e.target.files)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
            <Upload size={14} color="rgba(194,159,96,0.4)" />
            <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(222,211,200,0.35)" }}>
              {queue.length ? "Add more audio files" : "Select audio files (MP3, M4A, WAV) — pick multiple at once"}
            </span>
          </div>

          {/* Queue rows */}
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
                  {/* Image thumbnail / picker */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 6, overflow: "hidden",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px dashed rgba(194,159,96,0.25)",
                      cursor: item.status === "pending" ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {item.imagePreview
                        ? <img src={item.imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <ImageIcon size={13} color="rgba(194,159,96,0.3)" />
                      }
                    </div>
                    {item.status === "pending" && (
                      <input
                        type="file" accept="image/*"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setItemImage(item.qid, f); }}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      />
                    )}
                  </div>

                  {/* Title + category */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 8 }}>
                    <input
                      value={item.title}
                      onChange={e => setQueue(q => q.map(i => i.qid === item.qid ? { ...i, title: e.target.value } : i))}
                      disabled={item.status !== "pending"}
                      style={{ ...inputStyle, flex: "2 1 0" }}
                      placeholder="Title"
                    />
                    <select
                      value={item.category}
                      onChange={e => setQueue(q => q.map(i => i.qid === item.qid ? { ...i, category: e.target.value } : i))}
                      disabled={item.status !== "pending"}
                      style={{ ...inputStyle, flex: "1 1 0", cursor: "pointer" }}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Status */}
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
                    {item.status === "uploading" && <Loader2 size={10} color="#C29F60" style={{ animation: "spin 1s linear infinite" }} />}
                    <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: statusColor[item.status] }}>
                      {item.status === "uploading" ? "Uploading" : item.status === "done" ? "Done" : item.status === "error" ? (item.errorMsg ?? "Error") : "Ready"}
                    </span>
                  </div>

                  {/* Remove */}
                  {item.status === "pending" && (
                    <button
                      onClick={() => removeItem(item.qid)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.4, flexShrink: 0 }}
                    >
                      <X size={12} color="rgba(222,211,200,0.6)" />
                    </button>
                  )}
                  </div>

                  {item.status === "uploading" && (
                    <div>
                      <div style={{ height: 14, borderRadius: 7, background: "rgba(2,12,30,0.7)", overflow: "hidden", border: "1px solid rgba(194,159,96,0.2)", position: "relative" }}>
                        <div style={{
                          position: "absolute", inset: "0 auto 0 0",
                          width: `${item.progress ?? 0}%`,
                          background: "linear-gradient(90deg, #7A5010 0%, #C29F60 30%, #F0E098 50%, #C8A04C 70%, #8B6020 100%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer-gold 1.8s linear infinite",
                          borderRadius: 7,
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                        <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(194,159,96,0.6)" }}>
                          {item.bytesLoaded && item.bytesTotal
                            ? `${formatBytes(item.bytesLoaded)} / ${formatBytes(item.bytesTotal)}`
                            : "Uploading…"}
                        </span>
                        <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#DEC272" }}>
                          {item.progress ?? 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action row */}
          {queue.length > 0 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
              {queue.some(i => i.status === "done") && (
                <button
                  onClick={clearDone}
                  style={{ padding: "7px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(222,211,200,0.4)", fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Clear Done
                </button>
              )}
              <button
                onClick={() => { setQueue([]); setOpen(false); }}
                style={{ padding: "7px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(222,211,200,0.5)", fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}
              >
                Cancel
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={uploadAll}
                  disabled={uploading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 7, cursor: uploading ? "default" : "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: uploading ? "rgba(194,159,96,0.2)" : "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)", color: uploading ? "rgba(222,211,200,0.4)" : "#08203A", border: "1.5px solid rgba(240,220,170,0.4)", boxShadow: uploading ? "none" : "0 2px 0 rgba(20,12,0,0.85), 0 4px 12px rgba(0,0,0,0.5)" }}
                >
                  {uploading
                    ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</>
                    : <><Upload size={12} /> Upload {pendingCount} File{pendingCount !== 1 ? "s" : ""}</>
                  }
                </button>
              )}
            </div>
          )}
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
    const withStream = { ...m, audioUrl: `/api/meditations/${m.id}/stream` };
    setMeditations(prev => {
      const next = [...prev, withStream];
      setActiveIdx(next.length - 1);
      return next;
    });
  };

  const onUpdate = (updated: Meditation) => {
    setMeditations(prev => prev.map(m => m.id === updated.id ? updated : m));
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

        {/* Player */}
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

        {/* List */}
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
                onUpdate={onUpdate}
                isAdmin={isAdmin}
                session={session}
              />
            ))}
          </div>
        )}

        {/* Admin upload */}
        {isAdmin && (
          <UploadPanel session={session} onUploaded={onUploaded} />
        )}
      </div>
    </>
  );
}
