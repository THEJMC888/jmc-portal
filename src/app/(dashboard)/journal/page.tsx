"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  NotebookPen, Plus, Mic, MicOff, Video, VideoOff,
  Upload, Play, Pause, Trash2, Check, X, ChevronLeft,
  FileText, Loader,
} from "lucide-react";
import { useMobile } from "@/hooks/useMobile";
import { supabase } from "@/lib/supabase";

// ─── OpenAI API key (stored locally) ─────────────────────────────────────────
const OPENAI_KEY = "jmc_openai_key";
function getOpenAIKey(): string { try { return localStorage.getItem(OPENAI_KEY) ?? ""; } catch { return ""; } }
function setOpenAIKey(k: string) { try { localStorage.setItem(OPENAI_KEY, k); } catch {} }

async function whisperTranscribe(dataUrl: string, apiKey: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("file", new File([blob], `audio.${ext}`, { type: blob.type || "audio/webm" }));
  form.append("model", "whisper-1");
  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.text ?? "";
}

// ─── Live dictation hook (Web Speech API) ────────────────────────────────────
function useDictation(onWord: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (!supported) { alert("Live dictation requires Chrome or Edge."); return; }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join(" ");
      onWord(transcript + " ");
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => { setListening(false); };
    rec.start();
    recRef.current = rec;
    setListening(true);
  }, [listening, onWord, supported]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  return { listening, toggle, stop, supported };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface JournalMedia {
  id: string;
  type: "audio" | "video";
  name: string;
  dataUrl: string;
  duration: number; // seconds
  size: number;     // bytes
  createdAt: string;
}

interface JournalEntry {
  id: string;
  date: string;   // YYYY-MM-DD
  title: string;
  text: string;
  media: JournalMedia[];
  createdAt: string;
  updatedAt: string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const LIST_KEY = "jmc_journal_list";
const entryKey = (id: string) => `jmc_journal_${id}`;
const uid = () => Math.random().toString(36).slice(2, 11);
const today = () => new Date().toISOString().slice(0, 10);

function loadList(): { id: string; date: string; title: string; updatedAt: string }[] {
  try { return JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]"); } catch { return []; }
}
function loadEntry(id: string): JournalEntry | null {
  try { const r = localStorage.getItem(entryKey(id)); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveEntry(entry: JournalEntry) {
  localStorage.setItem(entryKey(entry.id), JSON.stringify(entry));
  const list = loadList().filter((e) => e.id !== entry.id);
  list.unshift({ id: entry.id, date: entry.date, title: entry.title, updatedAt: entry.updatedAt });
  list.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}
function deleteEntry(id: string) {
  localStorage.removeItem(entryKey(id));
  localStorage.setItem(LIST_KEY, JSON.stringify(loadList().filter((e) => e.id !== id)));
}

// ─── Supabase sync helpers ────────────────────────────────────────────────────
async function syncToSupabase(entry: JournalEntry, userId: string) {
  await supabase.from("journal_entries").upsert({
    id: entry.id,
    date: entry.date,
    title: entry.title,
    text: entry.text,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    user_id: userId,
  });
}

async function deleteFromSupabase(id: string) {
  await supabase.from("journal_entries").delete().eq("id", id);
}

async function fetchFromSupabase(): Promise<JournalEntry[]> {
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .order("date", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    title: row.title,
    text: row.text,
    media: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function formatShortDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDur(s: number) {
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Shared depth styles ──────────────────────────────────────────────────────
const CARD_SHADOW = [
  "inset 0 3px 0 rgba(255,255,255,0.22)",
  "inset 0 1px 0 rgba(255,255,255,0.38)",
  "inset 2px 0 0 rgba(255,255,255,0.06)",
  "inset 0 -3px 8px rgba(0,0,0,0.55)",
  "inset -2px 0 5px rgba(0,0,0,0.25)",
  "0 2px 0 rgba(0,0,0,0.90)","0 4px 0 rgba(0,0,0,0.75)","0 6px 0 rgba(0,0,0,0.58)",
  "0 8px 0 rgba(0,0,0,0.42)","0 10px 0 rgba(0,0,0,0.28)","0 12px 0 rgba(0,0,0,0.16)",
  "0 14px 0 rgba(0,0,0,0.08)","0 16px 0 rgba(0,0,0,0.04)",
  "0 20px 28px rgba(0,0,0,0.75)","0 38px 65px rgba(0,0,0,0.58)",
  "5px 0 16px rgba(0,0,0,0.45)","0 0 0 1px rgba(0,0,0,0.6)",
].join(", ");

const glassCard: React.CSSProperties = {
  background: "linear-gradient(175deg, rgba(255,255,255,0.09) 0%, rgba(20,55,130,0.28) 20%, rgba(6,18,55,0.48) 50%, rgba(3,8,26,0.68) 100%)",
  backdropFilter: "blur(28px) saturate(200%)",
  WebkitBackdropFilter: "blur(28px) saturate(200%)",
  borderTop: "2px solid rgba(255,255,255,0.35)",
  borderLeft: "1px solid rgba(255,255,255,0.18)",
  borderRight: "1.5px solid rgba(194,159,96,0.15)",
  borderBottom: "1.5px solid rgba(140,145,155,0.5)",
  boxShadow: CARD_SHADOW,
};
const raisedBtn: React.CSSProperties = {
  background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
  border: "none",
  color: "#08203A",
  boxShadow: [
    "inset 0 1px 0 rgba(240,220,170,0.4)",
    "inset 0 -2px 4px rgba(0,0,0,0.25)",
    "0 2px 0 rgba(20,12,0,0.85)","0 4px 0 rgba(20,12,0,0.65)",
    "0 6px 0 rgba(20,12,0,0.40)","0 8px 0 rgba(20,12,0,0.20)",
    "0 10px 20px rgba(0,0,0,0.60)","0 4px 30px rgba(194,159,96,0.25)",
  ].join(", "),
  cursor: "pointer",
  transition: "transform 0.1s ease, box-shadow 0.1s ease",
};
const ghostBtn: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
  borderTop: "1.5px solid rgba(255,255,255,0.20)",
  borderLeft: "1px solid rgba(255,255,255,0.12)",
  borderRight: "1px solid rgba(0,0,0,0.18)",
  borderBottom: "1.5px solid rgba(100,105,115,0.45)",
  boxShadow: [
    "inset 0 2px 0 rgba(255,255,255,0.12)",
    "inset 0 -2px 6px rgba(0,0,0,0.35)",
    "0 2px 0 rgba(0,0,0,0.70)","0 4px 0 rgba(0,0,0,0.45)",
    "0 6px 0 rgba(0,0,0,0.22)","0 8px 12px rgba(0,0,0,0.50)",
  ].join(", "),
  cursor: "pointer",
  transition: "transform 0.1s ease, box-shadow 0.1s ease",
};

// ─── MediaRecorder hook ───────────────────────────────────────────────────────
function useRecorder(type: "audio" | "video") {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    try {
      const constraints = type === "audio" ? { audio: true } : { video: true, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const mimeType = type === "audio" ? "audio/webm" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      recorderRef.current = recorder;
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      console.error("Recorder error:", err);
      alert(`Could not access ${type === "audio" ? "microphone" : "camera"}. Please allow permission and try again.`);
    }
  }, [type]);

  const stop = useCallback((): Promise<{ dataUrl: string; duration: number; size: number; mimeType: string }> => {
    return new Promise((resolve) => {
      if (!recorderRef.current) return;
      if (timerRef.current) clearInterval(timerRef.current);
      const duration = elapsed;
      recorderRef.current.onstop = () => {
        const mimeType = type === "audio" ? "audio/webm" : "video/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = () => {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          setState("idle");
          resolve({ dataUrl: reader.result as string, duration, size: blob.size, mimeType });
        };
        reader.readAsDataURL(blob);
      };
      recorderRef.current.stop();
    });
  }, [elapsed, type]);

  const cancel = useCallback(() => {
    if (recorderRef.current) { recorderRef.current.stop(); }
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setState("idle");
    setElapsed(0);
  }, []);

  return { state, elapsed, start, stop, cancel };
}

// ─── Media player ─────────────────────────────────────────────────────────────
function MediaPlayer({ item, onDelete, onTranscribe }: { item: JournalMedia; onDelete: () => void; onTranscribe?: () => Promise<void> }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const ref = useRef<HTMLAudioElement & HTMLVideoElement>(null);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play(); setPlaying(true); }
  };

  const handleTranscribe = async () => {
    if (!onTranscribe) return;
    setTranscribing(true);
    try { await onTranscribe(); } finally { setTranscribing(false); }
  };

  return (
    <div style={{
      ...glassCard,
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(to right, transparent, rgba(194,159,96,0.3), transparent)" }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: item.type === "audio"
            ? "linear-gradient(135deg, rgba(0,200,240,0.18), rgba(0,100,180,0.1))"
            : "linear-gradient(135deg, rgba(194,159,96,0.18), rgba(140,100,40,0.08))",
          border: item.type === "audio" ? "1px solid rgba(0,200,240,0.25)" : "1px solid rgba(194,159,96,0.25)",
          boxShadow: item.type === "audio" ? "0 0 10px rgba(0,180,220,0.15)" : "0 0 10px rgba(194,159,96,0.1)",
        }}>
          {item.type === "audio"
            ? <Mic size={12} color="#00d8ff" />
            : <Video size={12} color="#C29F60" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, fontWeight: 600, color: "#DED3C8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.name}
          </div>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, color: "rgba(222,211,200,0.45)", letterSpacing: "0.05em" }}>
            {formatDur(item.duration)} · {formatBytes(item.size)}
          </div>
        </div>
        <button
          onClick={toggle}
          style={{
            ...ghostBtn,
            width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, flexShrink: 0,
          }}
        >
          {playing ? <Pause size={11} color="#DED3C8" /> : <Play size={11} color="#DED3C8" style={{ marginLeft: 1 }} />}
        </button>
        {item.type === "audio" && onTranscribe && (
          <button
            onClick={handleTranscribe}
            disabled={transcribing}
            title="Transcribe to text"
            style={{
              background: transcribing ? "rgba(0,200,240,0.08)" : "none",
              border: transcribing ? "1px solid rgba(0,200,240,0.2)" : "none",
              borderRadius: 5,
              cursor: transcribing ? "default" : "pointer",
              padding: "2px 6px",
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: 4,
              fontFamily: "Syne, system-ui, sans-serif", fontSize: 9,
              fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#00c8f0", opacity: transcribing ? 1 : 0.6,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { if (!transcribing) (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { if (!transcribing) (e.currentTarget as HTMLElement).style.opacity = "0.6"; }}
          >
            {transcribing
              ? <><Loader size={10} style={{ animation: "spin 1s linear infinite" }} /> AI…</>
              : <><FileText size={10} /> Text</>}
          </button>
        )}
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0, opacity: 0.45, transition: "opacity 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.45"; }}
        >
          <Trash2 size={12} color="#ff6b6b" />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: item.type === "audio" ? "#00c8f0" : "#C29F60", borderRadius: 1, transition: "width 0.1s linear" }} />
      </div>

      {/* Hidden media element */}
      {item.type === "audio" ? (
        <audio
          ref={ref as React.RefObject<HTMLAudioElement>}
          src={item.dataUrl}
          onTimeUpdate={() => {
            if (ref.current && ref.current.duration) setProgress(ref.current.currentTime / ref.current.duration);
          }}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          style={{ display: "none" }}
        />
      ) : (
        <video
          ref={ref as React.RefObject<HTMLVideoElement>}
          src={item.dataUrl}
          controls
          onTimeUpdate={() => {
            if (ref.current && ref.current.duration) setProgress(ref.current.currentTime / ref.current.duration);
          }}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          style={{ width: "100%", borderRadius: 6, marginTop: 4, maxHeight: 200, objectFit: "cover" }}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function JournalPage() {
  const isMobile = useMobile();
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState<{ id: string; date: string; title: string; updatedAt: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [saved, setSaved] = useState(false);
  const [showList, setShowList] = useState(true); // mobile toggle
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioRec = useRecorder("audio");
  const videoRec = useRecorder("video");
  const audioUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setList(loadList());
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userIdRef.current = user.id;
      fetchFromSupabase().then(async (remoteEntries) => {
        const remoteMap = new Map(remoteEntries.map((e) => [e.id, e]));
        // Pull remote → local (remote wins if newer)
        remoteEntries.forEach((remote) => {
          const local = loadEntry(remote.id);
          if (!local || remote.updatedAt > local.updatedAt) {
            saveEntry({ ...remote, media: local?.media ?? [] });
          }
        });
        // Push local → remote (entries not yet in Supabase)
        const localList = loadList();
        for (const item of localList) {
          if (!remoteMap.has(item.id)) {
            const entry = loadEntry(item.id);
            if (entry) await syncToSupabase(entry, user.id).catch(() => {});
          }
        }
        setList(loadList());
      }).catch(() => {});
    });
  }, []);

  const openEntry = useCallback((id: string) => {
    const e = loadEntry(id);
    if (e) { setActiveId(id); setEntry(e); if (isMobile) setShowList(false); }
  }, [isMobile]);

  const createEntry = useCallback(() => {
    const newEntry: JournalEntry = {
      id: uid(), date: today(), title: "", text: "", media: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    saveEntry(newEntry);
    setList(loadList());
    setActiveId(newEntry.id);
    setEntry(newEntry);
    if (isMobile) setShowList(false);
  }, [isMobile]);

  const persistEntry = useCallback((updated: JournalEntry) => {
    const e = { ...updated, updatedAt: new Date().toISOString() };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveEntry(e);
      setList(loadList());
      syncToSupabase(e, userIdRef.current ?? "").catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
    setEntry(e);
  }, []);

  // Append text to notes — defined after persistEntry
  const appendToNotes = useCallback((text: string) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, text: prev.text + text };
      persistEntry(updated);
      return updated;
    });
  }, [persistEntry]);

  const dictation = useDictation(appendToNotes);

  const handleTranscribeClip = useCallback(async (item: JournalMedia) => {
    let key = getOpenAIKey();
    if (!key) {
      key = (prompt("Enter your OpenAI API key to transcribe audio.\nIt will be saved locally and never leave your browser.") ?? "").trim();
      if (!key) return;
      setOpenAIKey(key);
    }
    try {
      const text = await whisperTranscribe(item.dataUrl, key);
      appendToNotes(`\n\n[Transcript — ${item.name}]\n${text}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Transcription failed: ${msg}`);
      if (msg.includes("401") || msg.toLowerCase().includes("invalid")) setOpenAIKey("");
    }
  }, [appendToNotes]);

  const updateField = (field: "title" | "text", value: string) => {
    if (!entry) return;
    persistEntry({ ...entry, [field]: value });
  };

  const addMedia = (item: JournalMedia) => {
    if (!entry) return;
    persistEntry({ ...entry, media: [...entry.media, item] });
  };

  const removeMedia = (mediaId: string) => {
    if (!entry) return;
    persistEntry({ ...entry, media: entry.media.filter((m) => m.id !== mediaId) });
  };

  const handleDeleteEntry = () => {
    if (!activeId || !confirm("Delete this journal entry?")) return;
    deleteEntry(activeId);
    deleteFromSupabase(activeId).catch(() => {});
    setList(loadList());
    setActiveId(null);
    setEntry(null);
    if (isMobile) setShowList(true);
  };

  // ── Audio recording ──
  const handleAudioRecord = async () => {
    if (audioRec.state === "idle") {
      await audioRec.start();
    } else {
      const result = await audioRec.stop();
      addMedia({
        id: uid(), type: "audio",
        name: `Audio ${new Date().toLocaleTimeString()}`,
        dataUrl: result.dataUrl, duration: result.duration,
        size: result.size, createdAt: new Date().toISOString(),
      });
    }
  };

  // ── Video recording ──
  const handleVideoRecord = async () => {
    if (videoRec.state === "idle") {
      await videoRec.start();
    } else {
      const result = await videoRec.stop();
      addMedia({
        id: uid(), type: "video",
        name: `Video ${new Date().toLocaleTimeString()}`,
        dataUrl: result.dataUrl, duration: result.duration,
        size: result.size, createdAt: new Date().toISOString(),
      });
    }
  };

  // ── File upload ──
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "audio" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert("File too large (max 50 MB). Try a shorter clip."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const media: JournalMedia = {
        id: uid(), type,
        name: file.name,
        dataUrl: reader.result as string,
        duration: 0, size: file.size,
        createdAt: new Date().toISOString(),
      };
      addMedia(media);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (!mounted) return null;

  const isRecordingAudio = audioRec.state === "recording";
  const isRecordingVideo = videoRec.state === "recording";

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px", flexShrink: 0, zIndex: 10, flexWrap: "wrap", rowGap: 8,
        position: "relative",
        background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(4,10,32,0.3) 100%)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(0,200,240,0.4), rgba(194,159,96,0.3), transparent)" }} />

        {isMobile && !showList && (
          <button onClick={() => setShowList(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.6)", padding: "2px 4px", display: "flex" }}>
            <ChevronLeft size={18} />
          </button>
        )}

        <NotebookPen size={16} color="#00c8f0" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: "#DED3C8", letterSpacing: "0.04em" }}>
            Journal
          </div>
          <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 10, color: "rgba(0,200,240,0.8)" }}>
            {list.length} {list.length === 1 ? "entry" : "entries"}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 600, color: "#4ade80", letterSpacing: "0.1em", padding: "4px 10px", borderRadius: 4, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <Check size={11} /> Saved
          </div>
        )}
        <button
          onClick={createEntry}
          style={{
            ...raisedBtn,
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 7,
            fontFamily: "Syne, system-ui, sans-serif",
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          <Plus size={13} /> New Entry
        </button>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" }}>

        {/* Entry list */}
        {(!isMobile || showList) && (
          <nav style={{
            width: isMobile ? "100%" : 240,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            overflowY: "auto",
            padding: "14px 10px",
            flexShrink: 0,
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(3,8,26,0.16) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, rgba(0,200,240,0.2), rgba(255,255,255,0.06), transparent)" }} />

            {list.length === 0 ? (
              <div style={{ padding: "32px 12px", textAlign: "center" }}>
                <NotebookPen size={28} color="rgba(0,200,240,0.2)" style={{ marginBottom: 12 }} />
                <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(222,211,200,0.35)", lineHeight: 1.6 }}>
                  Your journal is empty. Tap &ldquo;New Entry&rdquo; to begin.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {list.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => openEntry(item.id)}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "10px 12px", borderRadius: 8,
                        cursor: "pointer",
                        transition: "all 0.18s cubic-bezier(0.23,1,0.32,1)",
                        ...(isActive ? {
                          background: "linear-gradient(135deg, rgba(0,200,240,0.12), rgba(0,80,180,0.07))",
                          borderTop: "1px solid rgba(0,200,240,0.3)",
                          borderLeft: "1px solid rgba(0,200,240,0.15)",
                          borderRight: "1px solid rgba(0,0,0,0.15)",
                          borderBottom: "1px solid rgba(0,0,0,0.3)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3), 0 0 16px rgba(0,180,220,0.08)",
                          transform: "translateX(2px)",
                        } : {
                          background: "transparent",
                          border: "1px solid transparent",
                        }),
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "rgba(255,255,255,0.03)";
                          el.style.borderColor = "rgba(255,255,255,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "transparent";
                          el.style.borderColor = "transparent";
                        }
                      }}
                    >
                      <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isActive ? "#00d8ff" : "rgba(0,200,240,0.55)", marginBottom: 3 }}>
                        {formatShortDate(item.date)}
                      </div>
                      <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#DED3C8" : "rgba(222,211,200,0.75)", lineHeight: 1.3, marginBottom: 2 }}>
                        {item.title || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Untitled</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        )}

        {/* Editor */}
        {(!isMobile || !showList) && (
          <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "36px 44px", maxWidth: isMobile ? "100%" : 860 }}>

            {!entry ? (
              /* Empty state */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20 }}>
                <div style={{
                  ...glassCard,
                  borderRadius: 20,
                  padding: "48px 52px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  maxWidth: 400,
                }}>
                  <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(to right, transparent, rgba(0,200,240,0.4), transparent)" }} />
                  <NotebookPen size={36} color="rgba(0,200,240,0.35)" style={{ marginBottom: 20 }} />
                  <h2 style={{ fontFamily: "Lora, Georgia, serif", fontSize: 22, fontWeight: 600, color: "#DED3C8", marginBottom: 10, lineHeight: 1.2 }}>
                    Your Journal
                  </h2>
                  <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.65)", lineHeight: 1.7, marginBottom: 24 }}>
                    Capture your thoughts, record your voice, document your journey — text, audio, and video in one place.
                  </p>
                  <button
                    onClick={createEntry}
                    style={{
                      ...raisedBtn,
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "10px 24px", borderRadius: 8,
                      fontFamily: "Syne, system-ui, sans-serif",
                      fontSize: 12, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  >
                    <Plus size={14} /> Create First Entry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Entry header */}
                <div style={{
                  ...glassCard,
                  borderRadius: 14,
                  padding: "24px 28px",
                  marginBottom: 28,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(to right, transparent, rgba(0,200,240,0.4), transparent)" }} />
                  <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,240,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

                  {/* Date */}
                  <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00c8f0", marginBottom: 10 }}>
                    {formatDate(entry.date)}
                  </div>

                  {/* Title */}
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Entry title…"
                    style={{
                      width: "100%", display: "block",
                      background: "transparent", border: "none", outline: "none",
                      fontFamily: "Lora, Georgia, serif", fontWeight: 600,
                      fontSize: 26, color: "#DED3C8", lineHeight: 1.2,
                      marginBottom: 4,
                    }}
                  />
                  <div style={{ height: 1, background: "linear-gradient(to right, rgba(0,200,240,0.2), rgba(194,159,96,0.1), transparent)", marginTop: 6 }} />

                  {/* Delete */}
                  <button
                    onClick={handleDeleteEntry}
                    style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", opacity: 0.35, transition: "opacity 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.35"; }}
                  >
                    <Trash2 size={14} color="#ff6b6b" />
                  </button>
                </div>

                {/* ── Text body ── */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,200,240,0.6)" }}>
                      Notes
                    </div>
                    {/* Live dictation button */}
                    <button
                      onClick={dictation.toggle}
                      title={dictation.supported ? (dictation.listening ? "Stop dictating" : "Dictate into notes") : "Dictation requires Chrome or Edge"}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 5,
                        fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.18s",
                        ...(dictation.listening ? {
                          background: "rgba(255,60,60,0.12)",
                          borderTop: "1px solid rgba(255,80,80,0.4)",
                          borderLeft: "1px solid rgba(255,60,60,0.2)",
                          borderRight: "1px solid rgba(0,0,0,0.15)",
                          borderBottom: "1px solid rgba(0,0,0,0.3)",
                          boxShadow: "inset 0 1px 0 rgba(255,150,150,0.1), 0 0 12px rgba(255,60,60,0.15)",
                          color: "#ff6b6b",
                        } : {
                          background: "linear-gradient(180deg, rgba(0,200,240,0.12) 0%, rgba(0,100,180,0.06) 100%)",
                          borderTop: "1px solid rgba(0,200,240,0.3)",
                          borderLeft: "1px solid rgba(0,200,240,0.15)",
                          borderRight: "1px solid rgba(0,0,0,0.12)",
                          borderBottom: "1px solid rgba(0,0,0,0.28)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)",
                          color: "#00c8f0",
                          opacity: dictation.supported ? 1 : 0.4,
                        }),
                      }}
                    >
                      {dictation.listening ? (
                        <>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 6px rgba(255,60,60,0.7)", animation: "pulse 1s ease-in-out infinite", flexShrink: 0 }} />
                          Stop Dictating
                        </>
                      ) : (
                        <><Mic size={10} /> Dictate</>
                      )}
                    </button>
                    {dictation.listening && (
                      <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 10, color: "#ff8888" }}>
                        Listening…
                      </span>
                    )}
                  </div>
                  <textarea
                    value={entry.text}
                    onChange={(e) => updateField("text", e.target.value)}
                    placeholder="Write your thoughts…"
                    rows={8}
                    style={{
                      width: "100%", display: "block",
                      background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(20,48,120,0.18) 100%)",
                      backdropFilter: "blur(18px) saturate(180%)",
                      WebkitBackdropFilter: "blur(18px) saturate(180%)",
                      border: "1.5px solid rgba(0,200,240,0.2)",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.2)",
                      borderRadius: 10,
                      padding: "20px 22px",
                      color: "#EDE5DC",
                      fontFamily: "Lora, Georgia, serif", fontWeight: 500,
                      fontSize: 15, lineHeight: 1.85,
                      resize: "vertical", outline: "none",
                      minHeight: 200,
                      WebkitFontSmoothing: "antialiased",
                      transition: "border-color 0.22s, box-shadow 0.22s",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = "rgba(0,200,240,0.5)";
                      (e.target as HTMLTextAreaElement).style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.18), 0 0 0 3px rgba(0,200,240,0.1), 0 0 24px rgba(0,180,220,0.12)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = "rgba(0,200,240,0.2)";
                      (e.target as HTMLTextAreaElement).style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.2)";
                    }}
                  />
                </div>

                {/* ── Audio section ── */}
                <MediaSection title="Audio" icon={<Mic size={12} color="#00d8ff" />} accentColor="#00c8f0">
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    {/* Record button */}
                    <button
                      onClick={handleAudioRecord}
                      disabled={isRecordingVideo}
                      style={{
                        ...(isRecordingAudio ? {
                          background: "linear-gradient(180deg, rgba(255,80,80,0.22) 0%, rgba(200,30,30,0.12) 100%)",
                          borderTop: "1px solid rgba(255,100,100,0.5)",
                          borderLeft: "1px solid rgba(255,80,80,0.28)",
                          borderRight: "1px solid rgba(0,0,0,0.2)",
                          borderBottom: "1px solid rgba(0,0,0,0.4)",
                          boxShadow: "inset 0 1px 0 rgba(255,150,150,0.15), 0 0 16px rgba(255,60,60,0.2)",
                        } : ghostBtn),
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: isRecordingAudio ? "#ff6b6b" : "#00d8ff",
                        cursor: isRecordingVideo ? "not-allowed" : "pointer",
                        opacity: isRecordingVideo ? 0.4 : 1,
                      }}
                    >
                      {isRecordingAudio ? (
                        <><MicOff size={12} /> Stop · {formatDur(audioRec.elapsed)}</>
                      ) : (
                        <><Mic size={12} /> Record</>
                      )}
                    </button>

                    {/* Upload button */}
                    <button
                      onClick={() => audioUploadRef.current?.click()}
                      disabled={isRecordingAudio}
                      style={{
                        ...ghostBtn,
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "rgba(222,211,200,0.7)",
                        opacity: isRecordingAudio ? 0.4 : 1,
                        cursor: isRecordingAudio ? "not-allowed" : "pointer",
                      }}
                    >
                      <Upload size={12} /> Upload
                    </button>
                    <input ref={audioUploadRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => handleUpload(e, "audio")} />

                    {isRecordingAudio && (
                      <button
                        onClick={audioRec.cancel}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.45)", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "Syne, system-ui, sans-serif", padding: "7px 8px" }}
                      >
                        <X size={11} /> Cancel
                      </button>
                    )}
                  </div>

                  {/* Recording pulse */}
                  {isRecordingAudio && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(255,60,60,0.06)", border: "1px solid rgba(255,60,60,0.15)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 8px rgba(255,60,60,0.7)", animation: "pulse 1s ease-in-out infinite" }} />
                      <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, color: "#ff8888", letterSpacing: "0.1em" }}>RECORDING — {formatDur(audioRec.elapsed)}</span>
                    </div>
                  )}

                  {/* Audio clips */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {entry.media.filter((m) => m.type === "audio").map((item) => (
                      <MediaPlayer key={item.id} item={item} onDelete={() => removeMedia(item.id)} onTranscribe={() => handleTranscribeClip(item)} />
                    ))}
                  </div>
                </MediaSection>

                {/* ── Video section ── */}
                <MediaSection title="Video" icon={<Video size={12} color="#C29F60" />} accentColor="#C29F60">
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    {/* Record button */}
                    <button
                      onClick={handleVideoRecord}
                      disabled={isRecordingAudio}
                      style={{
                        ...(isRecordingVideo ? {
                          background: "linear-gradient(180deg, rgba(255,80,80,0.22) 0%, rgba(200,30,30,0.12) 100%)",
                          borderTop: "1px solid rgba(255,100,100,0.5)",
                          borderLeft: "1px solid rgba(255,80,80,0.28)",
                          borderRight: "1px solid rgba(0,0,0,0.2)",
                          borderBottom: "1px solid rgba(0,0,0,0.4)",
                          boxShadow: "inset 0 1px 0 rgba(255,150,150,0.15), 0 0 16px rgba(255,60,60,0.2)",
                        } : ghostBtn),
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: isRecordingVideo ? "#ff6b6b" : "#C29F60",
                        cursor: isRecordingAudio ? "not-allowed" : "pointer",
                        opacity: isRecordingAudio ? 0.4 : 1,
                      }}
                    >
                      {isRecordingVideo ? (
                        <><VideoOff size={12} /> Stop · {formatDur(videoRec.elapsed)}</>
                      ) : (
                        <><Video size={12} /> Record</>
                      )}
                    </button>

                    {/* Upload button */}
                    <button
                      onClick={() => videoUploadRef.current?.click()}
                      disabled={isRecordingVideo}
                      style={{
                        ...ghostBtn,
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "rgba(222,211,200,0.7)",
                        opacity: isRecordingVideo ? 0.4 : 1,
                        cursor: isRecordingVideo ? "not-allowed" : "pointer",
                      }}
                    >
                      <Upload size={12} /> Upload
                    </button>
                    <input ref={videoUploadRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleUpload(e, "video")} />

                    {isRecordingVideo && (
                      <button
                        onClick={videoRec.cancel}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.45)", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "Syne, system-ui, sans-serif", padding: "7px 8px" }}
                      >
                        <X size={11} /> Cancel
                      </button>
                    )}
                  </div>

                  {/* Recording pulse */}
                  {isRecordingVideo && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(255,60,60,0.06)", border: "1px solid rgba(255,60,60,0.15)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 8px rgba(255,60,60,0.7)" }} />
                      <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, color: "#ff8888", letterSpacing: "0.1em" }}>RECORDING — {formatDur(videoRec.elapsed)}</span>
                    </div>
                  )}

                  {/* Video clips */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {entry.media.filter((m) => m.type === "video").map((item) => (
                      <MediaPlayer key={item.id} item={item} onDelete={() => removeMedia(item.id)} />
                    ))}
                  </div>
                </MediaSection>
              </>
            )}
          </main>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        textarea::placeholder { color: rgba(222,211,200,0.3); font-style: italic; }
        input::placeholder { color: rgba(222,211,200,0.25); }
      `}</style>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function MediaSection({ title, icon, accentColor, children }: { title: string; icon: React.ReactNode; accentColor: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        paddingBottom: 10,
        borderBottom: `1px solid ${accentColor}22`,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `radial-gradient(circle, ${accentColor}22, transparent 70%)`,
          border: `1px solid ${accentColor}33`,
          boxShadow: `0 0 10px ${accentColor}18`,
        }}>
          {icon}
        </div>
        <span style={{
          fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: `${accentColor}`,
          opacity: 0.8,
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
