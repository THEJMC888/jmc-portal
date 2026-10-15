"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Plus, Trash2, ChevronLeft, ChevronRight,
  AlignLeft, AlignCenter, AlignRight,
  X, Check, Image as ImageIcon, Pipette,
  Type, Layers, Music, BookOpen, FolderOpen, LayoutTemplate, Copy,
} from "lucide-react";
import type { VisionVideo, VisionSlide, SlideElement, SlideBackground } from "@/types";

// ── Storage keys (match desktop editor) ──────────────────────────────────────
const VISIONS_LIST_KEY  = "jmc_visions_list";
const CURRENT_ID_KEY    = "jmc_current_vision_id";
const STATEMENTS_KEY    = "jmc_statements_v1";
const visionKey = (id: string) => `jmc_vision_${id}`;
const uid = () => Math.random().toString(36).slice(2, 9);

// ── Virtual canvas dims ───────────────────────────────────────────────────────
const VW = 1600;
const VH = 900;

// ── JMC Photo Library (matches desktop) ─────────────────────────────────────
const JMC_PHOTOS = [
  { id: "jmc1",  url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", label: "Summit" },
  { id: "jmc2",  url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80", label: "Valley" },
  { id: "jmc3",  url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80", label: "Starfield" },
  { id: "jmc4",  url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", label: "City" },
  { id: "jmc5",  url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80", label: "Ocean" },
  { id: "jmc6",  url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80", label: "Forest" },
  { id: "jmc7",  url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80", label: "Peaks" },
  { id: "jmc8",  url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80", label: "Towers" },
  { id: "jmc9",  url: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800&q=80", label: "Alpine" },
  { id: "jmc10", url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80", label: "Tropical" },
  { id: "jmc11", url: "https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=800&q=80", label: "Dusk" },
  { id: "jmc12", url: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&q=80", label: "Journey" },
];

// ── Statement categories ──────────────────────────────────────────────────────
const STATEMENT_CATS = [
  { id: "self",          label: "Self" },
  { id: "relationships", label: "Relationships" },
  { id: "family",        label: "Family" },
  { id: "finances",      label: "Finances" },
  { id: "health",        label: "Health" },
  { id: "purpose",       label: "Purpose" },
  { id: "mindset",       label: "Mindset" },
];

// ── Slide templates ───────────────────────────────────────────────────────────
function makeTemplateElements(templateId: string): SlideElement[] {
  if (templateId === "single") {
    return [{
      id: uid(), type: "text",
      x: 80, y: 330, width: 1440, height: 240, zIndex: 1,
      text: "I AM...", fontFamily: '"Lora", Georgia, serif',
      fontSize: 96, fontWeight: "700", fontStyle: "normal",
      color: "#ffffff", textAlign: "center", textShadow: true,
    }];
  }
  if (templateId === "title-sub") {
    return [
      {
        id: uid(), type: "text",
        x: 80, y: 160, width: 1440, height: 140, zIndex: 1,
        text: "MY VISION", fontFamily: "Syne, system-ui, sans-serif",
        fontSize: 56, fontWeight: "700", fontStyle: "normal",
        color: "#C29F60", textAlign: "center", textShadow: true,
      },
      {
        id: uid(), type: "text",
        x: 100, y: 360, width: 1400, height: 300, zIndex: 2,
        text: "I AM creating the life I deserve.", fontFamily: '"Lora", Georgia, serif',
        fontSize: 72, fontWeight: "400", fontStyle: "italic",
        color: "#ffffff", textAlign: "center", textShadow: true,
      },
    ];
  }
  if (templateId === "three-lines") {
    return [
      {
        id: uid(), type: "text",
        x: 80, y: 180, width: 1440, height: 150, zIndex: 1,
        text: "I AM strong", fontFamily: '"Lora", Georgia, serif',
        fontSize: 72, fontWeight: "700", color: "#ffffff", textAlign: "center", textShadow: true,
      },
      {
        id: uid(), type: "text",
        x: 80, y: 380, width: 1440, height: 150, zIndex: 2,
        text: "I AM focused", fontFamily: '"Lora", Georgia, serif',
        fontSize: 72, fontWeight: "700", color: "#C29F60", textAlign: "center", textShadow: true,
      },
      {
        id: uid(), type: "text",
        x: 80, y: 580, width: 1440, height: 150, zIndex: 3,
        text: "I AM unstoppable", fontFamily: '"Lora", Georgia, serif',
        fontSize: 72, fontWeight: "700", color: "#ffffff", textAlign: "center", textShadow: true,
      },
    ];
  }
  if (templateId === "branded") {
    return [
      {
        id: uid(), type: "text",
        x: 80, y: 80, width: 1440, height: 80, zIndex: 1,
        text: "THE JOURNEYMEN COLLECTIVE™", fontFamily: "Syne, system-ui, sans-serif",
        fontSize: 32, fontWeight: "700", color: "rgba(194,159,96,0.75)", textAlign: "center", textShadow: true,
      },
      {
        id: uid(), type: "text",
        x: 80, y: 300, width: 1440, height: 300, zIndex: 2,
        text: "I AM worthy of the life I envision.", fontFamily: '"Lora", Georgia, serif',
        fontSize: 80, fontWeight: "700", fontStyle: "italic",
        color: "#ffffff", textAlign: "center", textShadow: true,
      },
    ];
  }
  return [];
}

// ── Color palettes ────────────────────────────────────────────────────────────
const BG_COLORS = [
  "#000000", "#040d1c", "#08254D", "#0B4B32",
  "#1a1a2e", "#2d2d2d", "#533483", "#ffffff",
  "#cc0000", "#dd6600", "#ccbb00", "#229933",
  "#1155cc", "#5511aa", "#9900cc", "#DED3C8",
];

const BG_GRADIENTS = [
  { from: "#08254D", to: "#040d1c", angle: 160, label: "Navy Deep" },
  { from: "#0B4B32", to: "#040d1c", angle: 160, label: "Forest" },
  { from: "#08254D", to: "#0B4B32", angle: 160, label: "Brand" },
  { from: "#1a1a2e", to: "#0f3460", angle: 135, label: "Midnight" },
  { from: "#000000", to: "#1a1a2e", angle: 160, label: "Void" },
  { from: "#533483", to: "#08254D", angle: 135, label: "Cosmos" },
  { from: "#cc0000", to: "#660000", angle: 160, label: "Red" },
  { from: "#cc7700", to: "#441100", angle: 160, label: "Amber" },
  { from: "#005500", to: "#001100", angle: 160, label: "Green" },
  { from: "#220055", to: "#000011", angle: 160, label: "Violet" },
];

const TEXT_COLORS = [
  "#ffffff", "#000000",
  "#ff2020", "#ff7700", "#ffee00",
  "#22cc44", "#2277ff", "#5500cc", "#cc00ff",
  "#C29F60", "#DED3C8", "#888888",
];

function makeBlankVision(): VisionVideo {
  const id = uid();
  return {
    id, title: "My Vision",
    slideDuration: 6000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slides: [{
      id: uid(), kenBurnsVariant: 0,
      background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
      elements: [],
    }],
  };
}

function loadVision(): { id: string; vision: VisionVideo } {
  try {
    const curId = localStorage.getItem(CURRENT_ID_KEY) ?? "";
    if (curId) {
      const s = localStorage.getItem(visionKey(curId));
      if (s) { const v = JSON.parse(s) as VisionVideo; if (v.slides?.[0]?.background) return { id: curId, vision: v }; }
    }
    const listS = localStorage.getItem(VISIONS_LIST_KEY);
    if (listS) {
      const list = JSON.parse(listS) as { id: string }[];
      for (const m of list) {
        const s = localStorage.getItem(visionKey(m.id));
        if (s) { const v = JSON.parse(s) as VisionVideo; if (v.slides?.[0]?.background) { localStorage.setItem(CURRENT_ID_KEY, m.id); return { id: m.id, vision: v }; } }
      }
    }
  } catch {}
  const v = makeBlankVision();
  localStorage.setItem(visionKey(v.id), JSON.stringify(v));
  localStorage.setItem(CURRENT_ID_KEY, v.id);
  return { id: v.id, vision: v };
}

function bgStyle(bg: SlideBackground): React.CSSProperties {
  if (bg.type === "color") return { background: bg.color ?? "#040d1c" };
  if (bg.type === "gradient" && bg.gradient) {
    const { from, to, angle } = bg.gradient;
    return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
  }
  if (bg.type === "image" && bg.imageDataUrl) {
    return { backgroundImage: `url(${bg.imageDataUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  return { background: "#040d1c" };
}

type SheetMode = null | "bg" | "elements" | "text-edit" | "templates" | "statements" | "visions" | "music" | "photos";

function ColorRow({
  current,
  onChange,
  size = 24,
}: { current?: string; onChange: (c: string) => void; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
      {TEXT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: size, height: size, borderRadius: 5, flexShrink: 0,
            background: c, cursor: "pointer",
            border: current === c
              ? "2px solid #C29F60"
              : c === "#ffffff" ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(194,159,96,0.2)",
            boxShadow: current === c ? "0 0 0 1px rgba(194,159,96,0.45)" : undefined,
          }}
        />
      ))}
      <div style={{
        width: size, height: size, borderRadius: 5, flexShrink: 0,
        background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
        border: "1px solid rgba(194,159,96,0.2)",
        position: "relative", overflow: "hidden", cursor: "pointer",
      }}>
        <input
          type="color"
          defaultValue={current ?? "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

export default function MobileVisionEditor() {
  const router = useRouter();
  const [vision, setVision] = useState<VisionVideo | null>(null);
  const [visionId, setVisionId] = useState("");
  const [slideIdx, setSlideIdx] = useState(0);
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [bgTab, setBgTab] = useState<"color" | "gradient" | "image">("gradient");
  const [editingEl, setEditingEl] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [allVisions, setAllVisions] = useState<{ id: string; title: string }[]>([]);
  const [statements, setStatements] = useState<Record<string, { being: string; doing: string }>>({});
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [photoLibTab, setPhotoLibTab] = useState<"jmc" | "personal">("jmc");

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const bgImgRef = useRef<HTMLInputElement>(null);
  const bgColorPickerRef = useRef<HTMLInputElement>(null);
  const musicRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { id, vision: v } = loadVision();
    setVision(v);
    setVisionId(id);
    setMounted(true);

    try {
      const listS = localStorage.getItem(VISIONS_LIST_KEY);
      if (listS) setAllVisions(JSON.parse(listS));
    } catch {}

    try {
      const stmS = localStorage.getItem(STATEMENTS_KEY);
      if (stmS) setStatements(JSON.parse(stmS));
    } catch {}
  }, []);

  const save = useCallback((updater: (v: VisionVideo) => VisionVideo) => {
    setVision((prev) => {
      if (!prev) return prev;
      const next = { ...updater(prev), updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem(visionKey(visionId), JSON.stringify(next));
        const listS = localStorage.getItem(VISIONS_LIST_KEY);
        const list: { id: string; title: string; updatedAt: number }[] = listS ? JSON.parse(listS) : [];
        const idx = list.findIndex((m) => m.id === visionId);
        const meta = { id: visionId, title: next.title, updatedAt: Date.now() };
        if (idx >= 0) list[idx] = meta; else list.unshift(meta);
        localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(list));
        setAllVisions(list);
      } catch {}
      return next;
    });
  }, [visionId]);

  if (!mounted || !vision) {
    return (
      <div style={{ minHeight: "100vh", background: "#040d1c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Syne, sans-serif", color: "rgba(194,159,96,0.8)", fontSize: 12, letterSpacing: "0.2em" }}>LOADING...</div>
      </div>
    );
  }

  const slides = vision.slides;
  const slide = slides[slideIdx] ?? slides[0];
  const clampIdx = (i: number) => Math.max(0, Math.min(i, slides.length - 1));
  const textElements = slide.elements.filter((e) => e.type === "text");
  const imageElements = slide.elements.filter((e) => e.type === "image");

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) setSlideIdx((i) => clampIdx(i + 1));
      else setSlideIdx((i) => clampIdx(i - 1));
    }
  };

  const addSlide = () => {
    const newSlide: VisionSlide = {
      id: uid(), kenBurnsVariant: Math.floor(Math.random() * 4),
      background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
      elements: [],
    };
    save((v) => ({ ...v, slides: [...v.slides, newSlide] }));
    setSlideIdx(slides.length);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    save((v) => ({ ...v, slides: v.slides.filter((_, i) => i !== slideIdx) }));
    setSlideIdx((i) => Math.max(0, i - 1));
  };

  const dupSlide = () => {
    const copy = { ...slide, id: uid() };
    save((v) => {
      const next = [...v.slides];
      next.splice(slideIdx + 1, 0, copy);
      return { ...v, slides: next };
    });
    setSlideIdx(slideIdx + 1);
  };

  const updateBg = (patch: Partial<SlideBackground>) => {
    save((v) => ({
      ...v,
      slides: v.slides.map((s, i) =>
        i !== slideIdx ? s : { ...s, background: { ...s.background, ...patch } }
      ),
    }));
  };

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > 1920) { h = Math.round(h * 1920 / w); w = 1920; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        updateBg({ type: "image", imageDataUrl: c.toDataURL("image/jpeg", 0.82) });
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert("Audio file too large (max 20 MB)."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      save((v) => ({ ...v, musicDataUrl: ev.target!.result as string, musicName: file.name }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Apply a JMC photo as background via URL → fetch → canvas → dataUrl
  const applyJmcPhoto = async (photoUrl: string) => {
    try {
      const resp = await fetch(photoUrl);
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > 1920) { h = Math.round(h * 1920 / w); w = 1920; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        updateBg({ type: "image", imageDataUrl: canvas.toDataURL("image/jpeg", 0.82) });
        setSheet("bg");
      };
      img.src = dataUrl;
    } catch {
      updateBg({ type: "image", imageDataUrl: photoUrl });
      setSheet("bg");
    }
  };

  const addTextEl = () => {
    const newEl: SlideElement = {
      id: uid(), type: "text",
      x: 100, y: 300, width: 1400, height: 200, zIndex: slide.elements.length + 1,
      text: "I AM...", fontFamily: '"Lora", Georgia, serif',
      fontSize: 72, fontWeight: "700", fontStyle: "normal",
      color: "#ffffff", textAlign: "center", textShadow: true,
    };
    save((v) => ({
      ...v,
      slides: v.slides.map((s, i) =>
        i !== slideIdx ? s : { ...s, elements: [...s.elements, newEl] }
      ),
    }));
    setSheet("elements");
  };

  const updateEl = (elId: string, patch: Partial<SlideElement>) => {
    save((v) => ({
      ...v,
      slides: v.slides.map((s, i) =>
        i !== slideIdx ? s : { ...s, elements: s.elements.map((e) => e.id === elId ? { ...e, ...patch } : e) }
      ),
    }));
  };

  const deleteEl = (elId: string) => {
    save((v) => ({
      ...v,
      slides: v.slides.map((s, i) =>
        i !== slideIdx ? s : { ...s, elements: s.elements.filter((e) => e.id !== elId) }
      ),
    }));
  };

  const startEditText = (el: SlideElement) => {
    setEditingEl(el.id);
    setEditText(el.text ?? "");
    setSheet("text-edit");
  };

  const commitTextEdit = () => {
    if (editingEl) updateEl(editingEl, { text: editText });
    setEditingEl(null);
    setSheet("elements");
  };

  const applyTemplate = (templateId: string) => {
    const elements = makeTemplateElements(templateId);
    save((v) => ({
      ...v,
      slides: v.slides.map((s, i) =>
        i !== slideIdx ? s : { ...s, elements }
      ),
    }));
    setSheet(null);
  };

  const addStatementAsText = (text: string) => {
    if (!text.trim()) return;
    const newEl: SlideElement = {
      id: uid(), type: "text",
      x: 80, y: 300, width: 1440, height: 300, zIndex: slide.elements.length + 1,
      text: text.trim(), fontFamily: '"Lora", Georgia, serif',
      fontSize: 64, fontWeight: "700", fontStyle: "italic",
      color: "#ffffff", textAlign: "center", textShadow: true,
    };
    save((v) => ({
      ...v,
      slides: v.slides.map((s, i) =>
        i !== slideIdx ? s : { ...s, elements: [...s.elements, newEl] }
      ),
    }));
    setSheet("elements");
  };

  const switchVision = (id: string) => {
    try {
      const s = localStorage.getItem(visionKey(id));
      if (!s) return;
      const v = JSON.parse(s) as VisionVideo;
      localStorage.setItem(CURRENT_ID_KEY, id);
      setVision(v);
      setVisionId(id);
      setSlideIdx(0);
      setSheet(null);
    } catch {}
  };

  const createNewVision = () => {
    const v = makeBlankVision();
    localStorage.setItem(visionKey(v.id), JSON.stringify(v));
    localStorage.setItem(CURRENT_ID_KEY, v.id);
    const listS = localStorage.getItem(VISIONS_LIST_KEY);
    const list: { id: string; title: string; updatedAt: number }[] = listS ? JSON.parse(listS) : [];
    list.unshift({ id: v.id, title: v.title, updatedAt: Date.now() });
    localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(list));
    setAllVisions(list);
    setVision(v);
    setVisionId(v.id);
    setSlideIdx(0);
    setSheet(null);
  };

  const PREVIEW_W = typeof window !== "undefined" ? Math.min(window.innerWidth - 28, 480) : 347;
  const PREVIEW_H = Math.round(PREVIEW_W * (VH / VW));
  const SCALE = PREVIEW_W / VW;

  // ── Shared button style helpers ─────────────────────────────────────────────
  const actionTabStyle = (active: boolean): React.CSSProperties => ({
    flex: "0 0 auto", padding: "9px 14px",
    background: "none", border: "none", cursor: "pointer",
    borderBottom: active ? "2px solid #C29F60" : "2px solid transparent",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    color: active ? "#C29F60" : "rgba(194,159,96,0.6)",
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", overflow: "hidden",
      background: "#02070f",
      position: "fixed", inset: 0, zIndex: 60,
    }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        background: "rgba(4,13,28,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(194,159,96,0.2)",
        flexShrink: 0, zIndex: 20,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                if (titleDraft.trim()) save((v) => ({ ...v, title: titleDraft.trim() }));
                setEditingTitle(false);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              style={{
                background: "none", border: "none", outline: "none",
                fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: "#DED3C8",
                width: "100%",
              }}
            />
          ) : (
            <div
              onClick={() => { setTitleDraft(vision.title); setEditingTitle(true); }}
              style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: "#DED3C8", cursor: "text" }}
            >
              {vision.title}
            </div>
          )}
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.85)", letterSpacing: "0.12em" }}>
            {slides.length} SLIDE{slides.length !== 1 ? "S" : ""}
            {vision.musicName && <span style={{ marginLeft: 8 }}>♪ {vision.musicName}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => router.push("/vision/play")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 20,
              background: "linear-gradient(135deg, #C29F60, #D4B47A)",
              border: "none", cursor: "pointer",
              fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12,
              color: "#08254D", letterSpacing: "0.08em",
            }}
          >
            <Play size={12} fill="#08254D" />
            PLAY
          </button>
        </div>
      </div>

      {/* ── Slide nav counter ───────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        padding: "7px 0 3px", flexShrink: 0,
        background: "rgba(2,7,15,0.6)",
      }}>
        <button
          onClick={() => setSlideIdx((i) => clampIdx(i - 1))}
          disabled={slideIdx === 0}
          style={{ background: "none", border: "none", cursor: slideIdx === 0 ? "default" : "pointer", opacity: slideIdx === 0 ? 0.25 : 1 }}
        >
          <ChevronLeft size={18} color="#C29F60" />
        </button>
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "rgba(222,211,200,0.9)", letterSpacing: "0.12em", fontWeight: 600 }}>
          {slideIdx + 1} / {slides.length}
        </span>
        <button
          onClick={() => setSlideIdx((i) => clampIdx(i + 1))}
          disabled={slideIdx === slides.length - 1}
          style={{ background: "none", border: "none", cursor: slideIdx === slides.length - 1 ? "default" : "pointer", opacity: slideIdx === slides.length - 1 ? 0.25 : 1 }}
        >
          <ChevronRight size={18} color="#C29F60" />
        </button>
      </div>

      {/* ── Slide preview ───────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: "6px 14px 8px",
        background: "rgba(2,7,15,0.6)",
      }}>
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            width: PREVIEW_W,
            height: PREVIEW_H,
            position: "relative",
            overflow: "hidden",
            borderRadius: 6,
            border: "1.5px solid rgba(194,159,96,0.6)",
            boxShadow: "0 0 0 1px rgba(194,159,96,0.12), 0 6px 32px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(194,159,96,0.06)",
          }}
        >
          <div style={{ position: "absolute", inset: 0, ...bgStyle(slide.background) }} />
          {slide.background.type === "image" && (
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${slide.background.overlayOpacity ?? 0.35})` }} />
          )}

          {slide.elements.map((el) => (
            <div
              key={el.id}
              onClick={() => el.type === "text" ? startEditText(el) : undefined}
              style={{
                position: "absolute",
                left: el.x * SCALE, top: el.y * SCALE,
                width: el.width * SCALE, height: el.height * SCALE,
                zIndex: el.zIndex,
                display: "flex", alignItems: "center",
                justifyContent: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
                cursor: el.type === "text" ? "pointer" : "default",
                opacity: el.opacity ?? 1,
                overflow: "hidden",
                borderRadius: el.clipShape === "circle" ? "50%" : el.clipShape === "square" ? "4px" : undefined,
              }}
            >
              {el.type === "text" && (
                <span style={{
                  fontFamily: el.fontFamily ?? "sans-serif",
                  fontSize: (el.fontSize ?? 48) * SCALE,
                  fontWeight: el.fontWeight ?? "700",
                  fontStyle: el.fontStyle ?? "normal",
                  color: el.color ?? "#fff",
                  textAlign: el.textAlign ?? "center",
                  textShadow: el.textShadow ? `0 2px ${8 * SCALE}px rgba(0,0,0,0.8)` : undefined,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  lineHeight: 1.2, width: "100%",
                  padding: `0 ${4 * SCALE}px`,
                }}>
                  {el.text || ""}
                </span>
              )}
              {el.type === "image" && el.imageDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={el.imageDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: el.objectFit ?? "cover" }} />
              )}
            </div>
          ))}

          {slide.elements.length === 0 && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              pointerEvents: "none",
            }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.7)", letterSpacing: "0.22em" }}>
                BLANK SLIDE
              </div>
              <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 11, color: "rgba(222,211,200,0.6)", textAlign: "center", padding: "0 20px" }}>
                Tap a button below to get started
              </div>
            </div>
          )}

          {slides.length > 1 && (
            <div style={{ position: "absolute", bottom: 7, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => setSlideIdx(i)} style={{
                  width: i === slideIdx ? 16 : 5, height: 5, borderRadius: 3,
                  background: i === slideIdx ? "#C29F60" : "rgba(222,211,200,0.4)",
                  transition: "all 0.2s", cursor: "pointer",
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Slide thumbnail strip ───────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 8, padding: "8px 14px",
        overflowX: "auto", flexShrink: 0,
        background: "rgba(4,13,28,0.85)",
        borderBottom: "1px solid rgba(194,159,96,0.18)",
      }}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            onClick={() => setSlideIdx(i)}
            style={{
              position: "relative", flexShrink: 0,
              width: 72, height: 41, borderRadius: 5,
              border: `2px solid ${i === slideIdx ? "#C29F60" : "rgba(194,159,96,0.25)"}`,
              boxShadow: i === slideIdx ? "0 0 8px rgba(194,159,96,0.3)" : undefined,
              overflow: "hidden", cursor: "pointer",
              ...bgStyle(s.background),
            }}
          >
            {s.statementSource && (
              <div style={{
                position: "absolute", top: 2, right: 2,
                width: 5, height: 5, borderRadius: "50%",
                background: s.statementOverridden ? "#f59e0b" : "#4ade80",
              }} />
            )}
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Syne, sans-serif", fontSize: 9, color: "rgba(255,255,255,0.85)", fontWeight: 700,
            }}>
              {i + 1}
            </div>
          </div>
        ))}
        <button
          onClick={addSlide}
          style={{
            flexShrink: 0, width: 72, height: 41, borderRadius: 5,
            border: "2px dashed rgba(194,159,96,0.4)", background: "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Plus size={16} color="rgba(194,159,96,0.75)" />
        </button>
      </div>

      {/* ── Primary action bar ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "stretch",
        background: "rgba(4,13,28,0.92)",
        borderBottom: "1px solid rgba(194,159,96,0.15)",
        flexShrink: 0,
      }}>
        {([
          { icon: <Layers size={17} />, label: "Background", action: () => setSheet(sheet === "bg" ? null : "bg") },
          { icon: <Type size={17} />, label: "Add Text", action: addTextEl },
          { icon: <ImageIcon size={17} />, label: "Elements", action: () => setSheet(sheet === "elements" ? null : "elements") },
          { icon: <Copy size={17} />, label: "Duplicate", action: dupSlide },
          { icon: <Trash2 size={17} />, label: "Delete", action: deleteSlide, danger: true },
        ] as { icon: React.ReactNode; label: string; action: () => void; danger?: boolean }[]).map(({ icon, label, action, danger }) => (
          <button
            key={label}
            onClick={action}
            style={{
              flex: 1, padding: "9px 2px", background: "none",
              border: "none", cursor: "pointer",
              borderRight: "1px solid rgba(194,159,96,0.1)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: danger ? "rgba(239,68,68,0.85)" : "rgba(194,159,96,0.92)",
            }}
          >
            {icon}
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Secondary action bar (power features) ──────────────────────────── */}
      <div style={{
        display: "flex", overflowX: "auto", flexShrink: 0,
        background: "rgba(2,5,18,0.9)",
        borderBottom: "1px solid rgba(194,159,96,0.1)",
      }}>
        {/* Hidden file inputs */}
        <input ref={musicRef} type="file" accept="audio/*" onChange={handleMusicUpload} style={{ display: "none" }} />

        {([
          { icon: <LayoutTemplate size={15} />, label: "Templates", key: "templates" as SheetMode },
          { icon: <BookOpen size={15} />, label: "Statements", key: "statements" as SheetMode },
          { icon: <FolderOpen size={15} />, label: "My Visions", key: "visions" as SheetMode },
          { icon: <Music size={15} />, label: "Music", key: "music" as SheetMode },
          { icon: <ImageIcon size={15} />, label: "Photo Lib", key: "photos" as SheetMode },
        ] as { icon: React.ReactNode; label: string; key: SheetMode }[]).map(({ icon, label, key }) => (
          <button
            key={label}
            onClick={() => setSheet(sheet === key ? null : key)}
            style={actionTabStyle(sheet === key)}
          >
            {icon}
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Panels ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", background: "rgba(4,13,28,0.7)" }}>

        {/* ── Background panel ─────────────────────────────────────────────── */}
        {sheet === "bg" && (
          <div style={{ padding: "14px 14px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {(["color", "gradient", "image"] as const).map((t) => (
                <button key={t} onClick={() => setBgTab(t)} style={{
                  padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontFamily: "Syne, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  background: bgTab === t ? "#C29F60" : "rgba(194,159,96,0.12)",
                  color: bgTab === t ? "#08254D" : "rgba(222,211,200,0.9)",
                }}>
                  {t}
                </button>
              ))}
            </div>

            {bgTab === "color" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 10 }}>
                  {BG_COLORS.map((c) => (
                    <button key={c} onClick={() => updateBg({ type: "color", color: c })} style={{
                      width: "100%", aspectRatio: "1", borderRadius: 8,
                      background: c, border: "none", cursor: "pointer",
                      boxShadow: slide.background.type === "color" && slide.background.color === c
                        ? "0 0 0 2px #C29F60, 0 0 0 4px rgba(194,159,96,0.3)"
                        : c === "#ffffff" ? "0 0 0 1px rgba(255,255,255,0.3)" : "0 0 0 1px rgba(255,255,255,0.08)",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(194,159,96,0.15)" }}>
                  <Pipette size={14} color="rgba(194,159,96,0.85)" />
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(222,211,200,0.9)", flex: 1 }}>Custom color</span>
                  <input
                    type="color"
                    defaultValue={slide.background.type === "color" ? (slide.background.color ?? "#040d1c") : "#040d1c"}
                    onChange={(e) => updateBg({ type: "color", color: e.target.value })}
                    style={{ width: 36, height: 28, borderRadius: 6, border: "none", cursor: "pointer", padding: 0, background: "none" }}
                  />
                </div>
              </div>
            )}

            {bgTab === "gradient" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {BG_GRADIENTS.map((g) => {
                  const isActive = slide.background.type === "gradient" && slide.background.gradient?.from === g.from && slide.background.gradient?.to === g.to;
                  return (
                    <button key={g.label} onClick={() => updateBg({ type: "gradient", gradient: { from: g.from, to: g.to, angle: g.angle } })} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: isActive ? "rgba(194,159,96,0.12)" : "rgba(255,255,255,0.03)",
                      borderLeft: isActive ? "3px solid #C29F60" : "3px solid transparent",
                    }}>
                      <div style={{ width: 40, height: 24, borderRadius: 6, flexShrink: 0, background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})` }} />
                      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#DED3C8", fontWeight: isActive ? 600 : 400 }}>{g.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {bgTab === "image" && (
              <div>
                <input ref={bgImgRef} type="file" accept="image/*" onChange={handleBgImage} style={{ display: "none" }} />
                <button onClick={() => bgImgRef.current?.click()} style={{
                  width: "100%", padding: "16px", borderRadius: 10,
                  border: "2px dashed rgba(194,159,96,0.45)", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  fontFamily: "Syne, sans-serif", fontSize: 12, color: "rgba(222,211,200,0.9)", letterSpacing: "0.1em",
                  fontWeight: 600, marginBottom: 12,
                }}>
                  <ImageIcon size={16} color="#C29F60" />
                  UPLOAD PHOTO
                </button>
                {slide.background.type === "image" && slide.background.imageDataUrl && (
                  <div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(222,211,200,0.85)", marginBottom: 8, letterSpacing: "0.1em", fontWeight: 600 }}>OVERLAY DARKNESS</div>
                    <input
                      type="range" min={0} max={0.9} step={0.05}
                      value={slide.background.overlayOpacity ?? 0.35}
                      onChange={(e) => updateBg({ overlayOpacity: parseFloat(e.target.value) })}
                      style={{ width: "100%", accentColor: "#C29F60" }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Elements panel ───────────────────────────────────────────────── */}
        {sheet === "elements" && (
          <div style={{ padding: "14px 14px" }}>
            {textElements.length === 0 && imageElements.length === 0 && (
              <div style={{ textAlign: "center", padding: 24, fontFamily: "Lora, serif", fontStyle: "italic", color: "rgba(222,211,200,0.65)", fontSize: 14 }}>
                No elements on this slide yet.
                <br /><span style={{ color: "rgba(194,159,96,0.85)", fontStyle: "normal", fontFamily: "Syne, sans-serif", fontSize: 11 }}>Tap Add Text above to create one.</span>
              </div>
            )}
            {textElements.map((el) => (
              <div key={el.id} style={{
                marginBottom: 10, padding: "12px 14px", borderRadius: 10,
                background: "rgba(8,37,77,0.25)", border: "1px solid rgba(194,159,96,0.2)",
              }}>
                <div style={{
                  fontFamily: el.fontFamily ?? "sans-serif",
                  fontSize: 15, color: el.color ?? "#fff",
                  fontWeight: el.fontWeight as React.CSSProperties["fontWeight"] ?? "700",
                  fontStyle: (el.fontStyle as React.CSSProperties["fontStyle"]) ?? "normal",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  marginBottom: 10,
                }}>
                  {el.text || <span style={{ opacity: 0.4 }}>Empty text</span>}
                </div>

                <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                  <button onClick={() => updateEl(el.id, { fontSize: Math.max(12, (el.fontSize ?? 48) - 8) })}
                    style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid rgba(194,159,96,0.3)", background: "none", color: "#DED3C8", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(222,211,200,0.9)", lineHeight: "28px", minWidth: 36, textAlign: "center" }}>{el.fontSize}px</span>
                  <button onClick={() => updateEl(el.id, { fontSize: Math.min(200, (el.fontSize ?? 48) + 8) })}
                    style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid rgba(194,159,96,0.3)", background: "none", color: "#DED3C8", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                  <button onClick={() => updateEl(el.id, { fontWeight: el.fontWeight === "700" ? "400" : "700" })}
                    style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid rgba(194,159,96,0.3)", background: el.fontWeight === "700" ? "rgba(194,159,96,0.2)" : "none", color: "#DED3C8", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>B</button>
                  <button onClick={() => updateEl(el.id, { fontStyle: el.fontStyle === "italic" ? "normal" : "italic" })}
                    style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid rgba(194,159,96,0.3)", background: el.fontStyle === "italic" ? "rgba(194,159,96,0.2)" : "none", color: "#DED3C8", cursor: "pointer", fontSize: 13, fontStyle: "italic" }}>I</button>
                  <button onClick={() => updateEl(el.id, { textAlign: "left" })}
                    style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(194,159,96,0.3)", background: el.textAlign === "left" ? "rgba(194,159,96,0.2)" : "none", color: "#DED3C8", cursor: "pointer" }}><AlignLeft size={13} /></button>
                  <button onClick={() => updateEl(el.id, { textAlign: "center" })}
                    style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(194,159,96,0.3)", background: (el.textAlign !== "left" && el.textAlign !== "right") ? "rgba(194,159,96,0.2)" : "none", color: "#DED3C8", cursor: "pointer" }}><AlignCenter size={13} /></button>
                  <button onClick={() => updateEl(el.id, { textAlign: "right" })}
                    style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(194,159,96,0.3)", background: el.textAlign === "right" ? "rgba(194,159,96,0.2)" : "none", color: "#DED3C8", cursor: "pointer" }}><AlignRight size={13} /></button>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(222,211,200,0.75)", marginBottom: 6, letterSpacing: "0.1em" }}>TEXT COLOR</div>
                  <ColorRow current={el.color} onChange={(c) => updateEl(el.id, { color: c })} size={22} />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEditText(el)} style={{
                    flex: 1, padding: "8px 10px", borderRadius: 7,
                    border: "1px solid rgba(194,159,96,0.4)", background: "rgba(194,159,96,0.1)",
                    cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 11, color: "#C29F60",
                    letterSpacing: "0.08em", fontWeight: 700,
                  }}>
                    EDIT TEXT
                  </button>
                  <button onClick={() => deleteEl(el.id)} style={{
                    padding: "8px 14px", borderRadius: 7,
                    border: "1px solid rgba(239,68,68,0.3)", background: "transparent",
                    cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 11,
                    color: "rgba(239,68,68,0.8)", letterSpacing: "0.08em", fontWeight: 700,
                  }}>
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Templates panel ──────────────────────────────────────────────── */}
        {sheet === "templates" && (
          <div style={{ padding: "14px" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.75)", letterSpacing: "0.18em", marginBottom: 14, textTransform: "uppercase", fontWeight: 700 }}>
              Slide Templates
            </div>
            <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 12, color: "rgba(222,211,200,0.6)", marginBottom: 16, lineHeight: 1.6 }}>
              Applying a template replaces elements on the current slide.
            </div>
            {([
              { id: "single", name: "Single Affirmation", desc: "One large centered I AM statement", preview: "I AM..." },
              { id: "title-sub", name: "Title + Affirmation", desc: "Gold title with large statement below", preview: "MY VISION / I AM..." },
              { id: "three-lines", name: "Three Lines", desc: "Three stacked affirmations", preview: "I AM strong / I AM focused / I AM..." },
              { id: "branded", name: "Branded", desc: "JMC header with centered statement", preview: "THE JMC™ / I AM worthy..." },
            ] as { id: string; name: string; desc: string; preview: string }[]).map((t) => (
              <button key={t.id} onClick={() => applyTemplate(t.id)} style={{
                width: "100%", marginBottom: 10,
                padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(194,159,96,0.2)", cursor: "pointer",
                background: "rgba(8,37,77,0.3)",
                display: "flex", alignItems: "center", gap: 14, textAlign: "left",
              } as React.CSSProperties}>
                <div style={{
                  width: 60, height: 34, borderRadius: 5, flexShrink: 0,
                  background: "linear-gradient(160deg, #08254D, #040d1c)",
                  border: "1px solid rgba(194,159,96,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 7, color: "rgba(255,255,255,0.8)",
                  textAlign: "center", padding: "0 4px",
                }}>
                  {t.preview}
                </div>
                <div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: "#DED3C8", marginBottom: 3 }}>{t.name}</div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(222,211,200,0.55)" }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Statements panel ─────────────────────────────────────────────── */}
        {sheet === "statements" && (
          <div style={{ padding: "14px" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.75)", letterSpacing: "0.18em", marginBottom: 6, textTransform: "uppercase", fontWeight: 700 }}>
              My I AM Statements
            </div>
            <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 12, color: "rgba(222,211,200,0.6)", marginBottom: 16, lineHeight: 1.6 }}>
              Tap a statement to add it as a text element on the current slide.
            </div>
            {STATEMENT_CATS.map((cat) => {
              const data = statements[cat.id];
              const hasBeing = data?.being?.trim();
              const hasDoing = data?.doing?.trim();
              if (!hasBeing && !hasDoing) return (
                <div key={cat.id} style={{
                  marginBottom: 10, padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(194,159,96,0.1)",
                  opacity: 0.5,
                }}>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "rgba(222,211,200,0.5)", fontWeight: 600 }}>{cat.label}</div>
                  <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 11, color: "rgba(222,211,200,0.35)", marginTop: 4 }}>Not written yet — go to My Statements to add.</div>
                </div>
              );
              return (
                <div key={cat.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "#C29F60", letterSpacing: "0.14em", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{cat.label}</div>
                  {hasBeing && (
                    <button onClick={() => addStatementAsText(data.being)} style={{
                      width: "100%", marginBottom: 6, padding: "10px 12px", borderRadius: 8,
                      background: "rgba(8,37,77,0.25)", border: "1px solid rgba(194,159,96,0.18)",
                      cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 9, color: "rgba(194,159,96,0.7)", letterSpacing: "0.1em", marginBottom: 4 }}>I AM (BEING)</div>
                      <div style={{ fontFamily: "Lora, serif", fontSize: 12, color: "#DED3C8", lineHeight: 1.5, fontStyle: "italic" }}>{data.being.slice(0, 120)}{data.being.length > 120 ? "…" : ""}</div>
                    </button>
                  )}
                  {hasDoing && (
                    <button onClick={() => addStatementAsText(data.doing)} style={{
                      width: "100%", padding: "10px 12px", borderRadius: 8,
                      background: "rgba(8,37,77,0.25)", border: "1px solid rgba(194,159,96,0.18)",
                      cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 9, color: "rgba(194,159,96,0.7)", letterSpacing: "0.1em", marginBottom: 4 }}>I AM (DOING)</div>
                      <div style={{ fontFamily: "Lora, serif", fontSize: 12, color: "#DED3C8", lineHeight: 1.5, fontStyle: "italic" }}>{data.doing.slice(0, 120)}{data.doing.length > 120 ? "…" : ""}</div>
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => router.push("/statements")}
              style={{
                width: "100%", padding: "13px", borderRadius: 10, marginTop: 8,
                border: "1px solid rgba(194,159,96,0.3)", background: "rgba(194,159,96,0.07)",
                cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 11,
                color: "rgba(194,159,96,0.9)", letterSpacing: "0.12em", fontWeight: 700,
              }}
            >
              WRITE / EDIT STATEMENTS →
            </button>
          </div>
        )}

        {/* ── Visions panel ────────────────────────────────────────────────── */}
        {sheet === "visions" && (
          <div style={{ padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.75)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
                My Visions
              </div>
              <button onClick={createNewVision} style={{
                padding: "6px 14px", borderRadius: 20,
                border: "1px solid rgba(194,159,96,0.4)", background: "rgba(194,159,96,0.1)",
                cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 10,
                color: "#C29F60", letterSpacing: "0.1em", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Plus size={11} /> NEW VISION
              </button>
            </div>
            {allVisions.length === 0 && (
              <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.5)", textAlign: "center", padding: "20px 0" }}>
                Only one vision so far. Create more to switch between them.
              </div>
            )}
            {allVisions.map((v) => (
              <button
                key={v.id}
                onClick={() => switchVision(v.id)}
                style={{
                  width: "100%", marginBottom: 8,
                  padding: "12px 16px", borderRadius: 10,
                  background: v.id === visionId ? "rgba(194,159,96,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${v.id === visionId ? "rgba(194,159,96,0.4)" : "rgba(194,159,96,0.12)"}`,
                  cursor: v.id === visionId ? "default" : "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: v.id === visionId ? "#C29F60" : "rgba(194,159,96,0.3)",
                }} />
                <span style={{
                  fontFamily: "Syne, sans-serif", fontSize: 13,
                  color: v.id === visionId ? "#C29F60" : "#DED3C8",
                  fontWeight: v.id === visionId ? 700 : 400, flex: 1,
                }}>
                  {v.title}
                </span>
                {v.id === visionId && (
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 9, color: "rgba(194,159,96,0.7)", letterSpacing: "0.12em" }}>ACTIVE</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Music panel ──────────────────────────────────────────────────── */}
        {sheet === "music" && (
          <div style={{ padding: "14px" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.75)", letterSpacing: "0.18em", marginBottom: 14, textTransform: "uppercase", fontWeight: 700 }}>
              Background Music
            </div>
            {vision.musicDataUrl ? (
              <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(8,37,77,0.3)", border: "1px solid rgba(194,159,96,0.25)" }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.7)", letterSpacing: "0.12em", marginBottom: 6 }}>CURRENT TRACK</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#DED3C8", fontWeight: 600, marginBottom: 12 }}>♪ {vision.musicName ?? "Audio Track"}</div>
                <button
                  onClick={() => save((v) => { const n = { ...v }; delete (n as any).musicDataUrl; delete (n as any).musicName; return n; })}
                  style={{
                    padding: "7px 14px", borderRadius: 7,
                    border: "1px solid rgba(239,68,68,0.3)", background: "transparent",
                    cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 11,
                    color: "rgba(239,68,68,0.8)", letterSpacing: "0.08em", fontWeight: 700,
                  }}
                >
                  REMOVE TRACK
                </button>
              </div>
            ) : (
              <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.55)", marginBottom: 16, lineHeight: 1.6 }}>
                No music added yet. Upload an audio file to play during your Vision Video.
              </div>
            )}
            <button onClick={() => musicRef.current?.click()} style={{
              width: "100%", padding: "16px", borderRadius: 10,
              border: "2px dashed rgba(194,159,96,0.45)", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontFamily: "Syne, sans-serif", fontSize: 12, color: "rgba(222,211,200,0.9)", letterSpacing: "0.1em", fontWeight: 600,
            }}>
              <Music size={16} color="#C29F60" />
              {vision.musicDataUrl ? "REPLACE TRACK" : "UPLOAD AUDIO (MP3 / AAC / M4A)"}
            </button>
            <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 11, color: "rgba(222,211,200,0.45)", marginTop: 10, textAlign: "center" }}>
              Max 20 MB · music plays on loop during playback
            </div>
          </div>
        )}

        {/* ── Photo Library panel ──────────────────────────────────────────── */}
        {sheet === "photos" && (
          <div style={{ padding: "14px" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.75)", letterSpacing: "0.18em", marginBottom: 6, textTransform: "uppercase", fontWeight: 700 }}>
              Photo Library
            </div>
            <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 12, color: "rgba(222,211,200,0.6)", marginBottom: 14 }}>
              Tap a photo to use it as the background for the current slide.
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {(["jmc", "personal"] as const).map((t) => (
                <button key={t} onClick={() => setPhotoLibTab(t)} style={{
                  padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontFamily: "Syne, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  background: photoLibTab === t ? "#C29F60" : "rgba(194,159,96,0.12)",
                  color: photoLibTab === t ? "#08254D" : "rgba(222,211,200,0.9)",
                }}>
                  {t === "jmc" ? "JMC Library" : "Upload"}
                </button>
              ))}
            </div>

            {photoLibTab === "jmc" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {JMC_PHOTOS.map((p) => (
                  <button key={p.id} onClick={() => applyJmcPhoto(p.url)} style={{
                    padding: 0, border: "2px solid rgba(194,159,96,0.25)", borderRadius: 8,
                    overflow: "hidden", cursor: "pointer", background: "none", aspectRatio: "16/9",
                    position: "relative",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "rgba(0,0,0,0.55)", padding: "3px 5px",
                      fontFamily: "Syne, sans-serif", fontSize: 8, color: "rgba(222,211,200,0.9)",
                      fontWeight: 600, letterSpacing: "0.08em",
                    }}>
                      {p.label}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {photoLibTab === "personal" && (
              <div>
                <input ref={photoUploadRef} type="file" accept="image/*" onChange={handleBgImage} style={{ display: "none" }} />
                <button onClick={() => photoUploadRef.current?.click()} style={{
                  width: "100%", padding: "16px", borderRadius: 10,
                  border: "2px dashed rgba(194,159,96,0.45)", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  fontFamily: "Syne, sans-serif", fontSize: 12, color: "rgba(222,211,200,0.9)", letterSpacing: "0.1em", fontWeight: 600,
                }}>
                  <ImageIcon size={16} color="#C29F60" />
                  UPLOAD FROM DEVICE
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Text edit overlay ───────────────────────────────────────────── */}
        {sheet === "text-edit" && editingEl && (() => {
          const el = slide.elements.find((e) => e.id === editingEl);
          if (!el) return null;
          return (
            <div style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "#02070f",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid rgba(194,159,96,0.2)",
                background: "rgba(4,13,28,0.95)",
              }}>
                <button onClick={() => { setSheet("elements"); setEditingEl(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.8)", padding: 4 }}>
                  <X size={22} />
                </button>
                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: "#DED3C8", letterSpacing: "0.12em" }}>EDIT TEXT</span>
                <button onClick={commitTextEdit}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#C29F60", padding: 4 }}>
                  <Check size={24} />
                </button>
              </div>

              <div style={{
                display: "flex", gap: 6, padding: "10px 14px",
                borderBottom: "1px solid rgba(194,159,96,0.15)",
                overflowX: "auto", background: "rgba(4,13,28,0.8)",
              }}>
                <button onClick={() => updateEl(el.id, { fontWeight: el.fontWeight === "700" ? "400" : "700" })}
                  style={{ padding: "7px 13px", borderRadius: 6, border: "1px solid rgba(194,159,96,0.3)", background: el.fontWeight === "700" ? "rgba(194,159,96,0.18)" : "none", color: "#DED3C8", cursor: "pointer", fontWeight: "bold", flexShrink: 0 }}>B</button>
                <button onClick={() => updateEl(el.id, { fontStyle: el.fontStyle === "italic" ? "normal" : "italic" })}
                  style={{ padding: "7px 13px", borderRadius: 6, border: "1px solid rgba(194,159,96,0.3)", background: el.fontStyle === "italic" ? "rgba(194,159,96,0.18)" : "none", color: "#DED3C8", cursor: "pointer", fontStyle: "italic", flexShrink: 0 }}>I</button>
                <button onClick={() => updateEl(el.id, { fontSize: Math.max(12, (el.fontSize ?? 48) - 8) })}
                  style={{ padding: "7px 11px", borderRadius: 6, border: "1px solid rgba(194,159,96,0.3)", background: "none", color: "#DED3C8", cursor: "pointer", flexShrink: 0, fontWeight: 700 }}>A−</button>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "rgba(222,211,200,0.9)", lineHeight: "36px", flexShrink: 0, fontWeight: 600 }}>{el.fontSize}px</span>
                <button onClick={() => updateEl(el.id, { fontSize: Math.min(200, (el.fontSize ?? 48) + 8) })}
                  style={{ padding: "7px 11px", borderRadius: 6, border: "1px solid rgba(194,159,96,0.3)", background: "none", color: "#DED3C8", cursor: "pointer", flexShrink: 0, fontWeight: 700 }}>A+</button>
                <button onClick={() => updateEl(el.id, { textAlign: "left" })}
                  style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid rgba(194,159,96,0.3)", background: el.textAlign === "left" ? "rgba(194,159,96,0.18)" : "none", color: "#DED3C8", cursor: "pointer", flexShrink: 0 }}><AlignLeft size={14} /></button>
                <button onClick={() => updateEl(el.id, { textAlign: "center" })}
                  style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid rgba(194,159,96,0.3)", background: el.textAlign !== "left" && el.textAlign !== "right" ? "rgba(194,159,96,0.18)" : "none", color: "#DED3C8", cursor: "pointer", flexShrink: 0 }}><AlignCenter size={14} /></button>
                <button onClick={() => updateEl(el.id, { textAlign: "right" })}
                  style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid rgba(194,159,96,0.3)", background: el.textAlign === "right" ? "rgba(194,159,96,0.18)" : "none", color: "#DED3C8", cursor: "pointer", flexShrink: 0 }}><AlignRight size={14} /></button>
                {TEXT_COLORS.map((c) => (
                  <button key={c} onClick={() => updateEl(el.id, { color: c })}
                    style={{ width: 28, height: 28, borderRadius: 5, background: c, flexShrink: 0, border: el.color === c ? "2px solid #C29F60" : c === "#ffffff" ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(194,159,96,0.2)", cursor: "pointer", boxShadow: el.color === c ? "0 0 0 1px rgba(194,159,96,0.45)" : undefined }} />
                ))}
                <div style={{ width: 28, height: 28, borderRadius: 5, flexShrink: 0, position: "relative", overflow: "hidden", background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)", border: "1px solid rgba(194,159,96,0.2)", cursor: "pointer" }}>
                  <input type="color" defaultValue={el.color ?? "#ffffff"} onChange={(e) => updateEl(el.id, { color: e.target.value })} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                </div>
              </div>

              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{
                  flex: 1, padding: "20px 18px",
                  background: "transparent", border: "none", outline: "none", resize: "none",
                  fontFamily: el.fontFamily ?? "Lora, Georgia, serif",
                  fontSize: Math.min((el.fontSize ?? 48) * SCALE * 1.2, 34),
                  fontWeight: el.fontWeight as React.CSSProperties["fontWeight"] ?? "700",
                  fontStyle: (el.fontStyle as React.CSSProperties["fontStyle"]) ?? "normal",
                  color: el.color ?? "#fff",
                  textAlign: (el.textAlign as React.CSSProperties["textAlign"]) ?? "center",
                  lineHeight: 1.5,
                }}
                placeholder="Type your text..."
              />
            </div>
          );
        })()}

        {/* ── Empty / tip state ───────────────────────────────────────────── */}
        {sheet === null && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 14 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "rgba(194,159,96,0.75)", textTransform: "uppercase", fontWeight: 700 }}>
              Slide {slideIdx + 1} of {slides.length}
            </div>
            <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.7)", textAlign: "center", lineHeight: 1.7 }}>
              Swipe the slide to change pages.
              <br />Tap a text element on the slide to edit it.
              <br />Use the buttons above to edit or add content.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
