"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Play, Upload, Music, X, Download,
  Type, Image as ImageIcon, Bold, Italic, AlignLeft,
  AlignCenter, AlignRight, ChevronUp, ChevronDown,
  Layers, Sparkles, ImagePlus, FileInput, Send, CheckCircle,
} from "lucide-react";
import type { VisionVideo, VisionSlide, SlideElement, SlideBackground } from "@/types";
import { parsePptxFile } from "@/lib/parsePptx";
import MobileVisionEditor from "@/components/MobileVisionEditor";
import { PORTAL_PHOTO_BUCKETS, BUCKET_LABELS, type PortalPhotoBucket } from "@/lib/portalPhotos";
import { useAuth } from "@/lib/auth";

// ─── Virtual canvas ────────────────────────────────────────────────────────
const VW = 1600;
const VH = 900;
const MIN_SZ = 80;
const THUMB_SCALE = 0.0675; // 108px / 1600px

// ─── Multi-video storage ─────────────────────────────────────────────────────
const VISIONS_LIST_KEY = "jmc_visions_list";
const CURRENT_ID_KEY  = "jmc_current_vision_id";
const visionKey = (id: string) => `jmc_vision_${id}`;

interface VisionMeta { id: string; title: string; updatedAt: number; }

// ─── Fonts ─────────────────────────────────────────────────────────────────
interface FontDef { label: string; value: string; group?: string; }

const FONTS: FontDef[] = [
  // ── Elegant Serif ──────────────────────────────────────────────────────
  { group: "Elegant Serif",     label: "Noto Serif Display", value: '"Noto Serif Display", Georgia, serif' },
  {                              label: "Playfair Display",   value: '"Playfair Display", Georgia, serif' },
  {                              label: "Cormorant Garamond", value: '"Cormorant Garamond", Georgia, serif' },
  {                              label: "Cinzel",             value: '"Cinzel", Georgia, serif' },
  {                              label: "DM Serif Display",   value: '"DM Serif Display", Georgia, serif' },
  {                              label: "Lora",               value: '"Lora", Georgia, serif' },
  {                              label: "EB Garamond",        value: '"EB Garamond", Georgia, serif' },
  {                              label: "Spectral",           value: '"Spectral", Georgia, serif' },
  {                              label: "Libre Baskerville",  value: '"Libre Baskerville", Georgia, serif' },
  {                              label: "Merriweather",       value: '"Merriweather", Georgia, serif' },
  {                              label: "Yeseva One",         value: '"Yeseva One", Georgia, serif' },
  {                              label: "Italiana",           value: '"Italiana", Georgia, serif' },
  {                              label: "Georgia",            value: "Georgia, serif" },
  // ── Display & Impact ───────────────────────────────────────────────────
  { group: "Display & Impact",  label: "Bebas Neue",         value: '"Bebas Neue", sans-serif' },
  {                              label: "Abril Fatface",      value: '"Abril Fatface", serif' },
  {                              label: "Oswald",             value: '"Oswald", sans-serif' },
  {                              label: "Alfa Slab One",      value: '"Alfa Slab One", serif' },
  {                              label: "Impact",             value: '"Impact", "Arial Black", sans-serif' },
  // ── Modern Sans ────────────────────────────────────────────────────────
  { group: "Modern Sans",       label: "Syne",               value: '"Syne", system-ui, sans-serif' },
  {                              label: "Montserrat",         value: '"Montserrat", system-ui, sans-serif' },
  {                              label: "Poppins",            value: '"Poppins", system-ui, sans-serif' },
  {                              label: "Inter",              value: '"Inter", system-ui, sans-serif' },
  {                              label: "Raleway",            value: '"Raleway", system-ui, sans-serif' },
  {                              label: "Josefin Sans",       value: '"Josefin Sans", system-ui, sans-serif' },
  {                              label: "Tenor Sans",         value: '"Tenor Sans", system-ui, sans-serif' },
  {                              label: "Arial",              value: '"Arial", sans-serif' },
  // ── Script & Calligraphy ───────────────────────────────────────────────
  { group: "Script",            label: "Dancing Script",     value: '"Dancing Script", cursive' },
  {                              label: "Great Vibes",        value: '"Great Vibes", cursive' },
  {                              label: "Sacramento",         value: '"Sacramento", cursive' },
  {                              label: "Satisfy",            value: '"Satisfy", cursive' },
  {                              label: "Pacifico",           value: '"Pacifico", cursive' },
];
const FONT_SIZES = [18, 24, 32, 42, 56, 72, 96, 120, 148];

// ─── Photo library ──────────────────────────────────────────────────────────
const PHOTO_LIB_KEY = "jmc_photo_library";

interface LibPhoto { id: string; dataUrl: string; name: string; addedAt: number; }

// Build typed photo objects from the shared portal photo library
const JMC_PHOTOS = (Object.keys(PORTAL_PHOTO_BUCKETS) as PortalPhotoBucket[]).flatMap((bucket) =>
  PORTAL_PHOTO_BUCKETS[bucket].map((url, i) => ({
    id: `${bucket}_${i}`,
    url,
    label: `${BUCKET_LABELS[bucket]} ${i + 1}`,
    bucket,
  }))
);

// ─── Color presets ─────────────────────────────────────────────────────────
const EL_COLORS = [
  "#ffffff", "#DED3C8", "#C29F60", "#1D7458",
  "#08254D", "#040d1c", "#000000", "#ff6b6b",
  "#4ecdc4", "#a8edea", "#f7d794", "#fed9b7",
];
const BG_COLORS = [
  "#040d1c", "#08254D", "#0B4B32", "#1D7458",
  "#000000", "#1a1a2e", "#2d2d2d", "#533483",
  "#ffffff", "#DED3C8", "#C29F60", "#d4a853",
];
const BG_GRADIENTS = [
  { from: "#08254D", to: "#040d1c", angle: 160, label: "Navy Deep" },
  { from: "#0B4B32", to: "#040d1c", angle: 160, label: "Forest" },
  { from: "#08254D", to: "#0B4B32", angle: 160, label: "Brand" },
  { from: "#1a1a2e", to: "#0f3460", angle: 135, label: "Midnight" },
  { from: "#000000", to: "#1a1a2e", angle: 160, label: "Void" },
  { from: "#533483", to: "#08254D", angle: 135, label: "Cosmos" },
];

// ─── Slide templates ──────────────────────────────────────────────────────
type SlideTemplateDef = { name: string; desc: string; icon: string; build: () => VisionSlide };

function el(overrides: Partial<SlideElement>): SlideElement {
  return {
    id: uid(), type: "text",
    x: 200, y: 350, width: 1200, height: 200, zIndex: 1,
    text: "Text", fontFamily: FONTS[0].value, fontSize: 72,
    fontWeight: "700", fontStyle: "normal", color: "#ffffff",
    textAlign: "center", textShadow: true,
    ...overrides,
  };
}

const SLIDE_TEMPLATES: SlideTemplateDef[] = [
  {
    name: "Blank", desc: "Empty canvas", icon: "□",
    build: () => ({ id: uid(), background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } }, elements: [], kenBurnsVariant: 0 }),
  },
  {
    name: "Title", desc: "Big title + subtitle", icon: "T",
    build: () => ({
      id: uid(), kenBurnsVariant: 0,
      background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
      elements: [
        el({ x: 100, y: 220, width: 1400, height: 240, fontSize: 108, text: "YOUR VISION" }),
        el({ id: uid(), x: 200, y: 510, width: 1200, height: 120, fontSize: 40, fontWeight: "400", fontStyle: "italic", color: "rgba(194,159,96,0.9)", text: "A vision for your best life", zIndex: 2 }),
      ],
    }),
  },
  {
    name: "I AM", desc: "Being State affirmation", icon: "I",
    build: () => ({
      id: uid(), kenBurnsVariant: 1,
      background: { type: "gradient", gradient: { from: "#040d1c", to: "#08254D", angle: 200 } },
      elements: [
        el({ x: 100, y: 100, width: 1400, height: 120, fontSize: 48, fontWeight: "700", color: "rgba(194,159,96,0.75)", text: "I AM", textShadow: false, zIndex: 1 }),
        el({ id: uid(), x: 100, y: 260, width: 1400, height: 380, fontSize: 84, text: "Powerful, Aligned,\nand Fully Expressed", zIndex: 2 }),
      ],
    }),
  },
  {
    name: "Vision", desc: "Vision statement quote", icon: "V",
    build: () => ({
      id: uid(), kenBurnsVariant: 2,
      background: { type: "gradient", gradient: { from: "#0B4B32", to: "#040d1c", angle: 160 } },
      elements: [
        el({ x: 200, y: 270, width: 1200, height: 360, fontSize: 54, fontWeight: "400", fontStyle: "italic", text: "I am living in my dream life,\nsurrounded by beauty and abundance.", zIndex: 1 }),
      ],
    }),
  },
  {
    name: "Photo", desc: "Full image + caption", icon: "▣",
    build: () => ({
      id: uid(), kenBurnsVariant: 0,
      background: { type: "image", overlayOpacity: 0.45 },
      elements: [
        el({ x: 200, y: 680, width: 1200, height: 120, fontSize: 42, fontWeight: "400", fontStyle: "italic", text: "Your caption here", zIndex: 1 }),
      ],
    }),
  },
  {
    name: "Text + Img", desc: "Image element with text", icon: "⊞",
    build: () => ({
      id: uid(), kenBurnsVariant: 0,
      background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
      elements: [
        { id: uid(), type: "image", x: 50, y: 100, width: 680, height: 700, zIndex: 1, objectFit: "contain" },
        el({ id: uid(), x: 800, y: 200, width: 750, height: 500, fontSize: 52, text: "Your vision\nstatement here", textAlign: "left", zIndex: 2 }),
      ],
    }),
  },
];

// ─── Vision (whole presentation) templates ────────────────────────────────
type VisionTemplateDef = { name: string; desc: string; icon: string; build: () => VisionSlide[] };

const VISION_TEMPLATES: VisionTemplateDef[] = [
  {
    name: "Being State Journey",
    desc: "6-slide TJC methodology: alternating I AM + Vision",
    icon: "✦",
    build: () => [
      // Slide 1: Title
      {
        id: uid(), kenBurnsVariant: 0,
        background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
        elements: [
          el({ x: 100, y: 200, width: 1400, height: 260, fontSize: 108, text: "MY VISION" }),
          el({ id: uid(), x: 200, y: 520, width: 1200, height: 120, fontSize: 36, fontWeight: "400", fontStyle: "italic", color: "rgba(194,159,96,0.85)", text: "The Journeymen Collective", zIndex: 2 }),
        ],
      },
      // Slide 2: I AM
      {
        id: uid(), kenBurnsVariant: 1,
        background: { type: "gradient", gradient: { from: "#040d1c", to: "#08254D", angle: 200 } },
        elements: [
          el({ x: 100, y: 100, width: 1400, height: 120, fontSize: 48, color: "rgba(194,159,96,0.75)", text: "I AM", textShadow: false }),
          el({ id: uid(), x: 100, y: 260, width: 1400, height: 380, fontSize: 84, text: "Powerful, Aligned,\nand Fully Expressed", zIndex: 2 }),
        ],
      },
      // Slide 3: Vision
      {
        id: uid(), kenBurnsVariant: 2,
        background: { type: "gradient", gradient: { from: "#0B4B32", to: "#040d1c", angle: 160 } },
        elements: [
          el({ x: 200, y: 270, width: 1200, height: 360, fontSize: 54, fontWeight: "400", fontStyle: "italic", text: "I am living in abundance,\ndoing work that lights me up." }),
        ],
      },
      // Slide 4: I AM
      {
        id: uid(), kenBurnsVariant: 3,
        background: { type: "gradient", gradient: { from: "#040d1c", to: "#0B4B32", angle: 160 } },
        elements: [
          el({ x: 100, y: 100, width: 1400, height: 120, fontSize: 48, color: "rgba(194,159,96,0.75)", text: "I AM", textShadow: false }),
          el({ id: uid(), x: 100, y: 260, width: 1400, height: 380, fontSize: 84, text: "Healthy, Vibrant,\nand Thriving", zIndex: 2 }),
        ],
      },
      // Slide 5: Vision
      {
        id: uid(), kenBurnsVariant: 0,
        background: { type: "gradient", gradient: { from: "#08254D", to: "#1a1a2e", angle: 160 } },
        elements: [
          el({ x: 200, y: 270, width: 1200, height: 360, fontSize: 54, fontWeight: "400", fontStyle: "italic", text: "My relationships are deep,\njoyful, and full of love." }),
        ],
      },
      // Slide 6: Closing
      {
        id: uid(), kenBurnsVariant: 1,
        background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
        elements: [
          el({ x: 100, y: 280, width: 1400, height: 240, fontSize: 86, text: "I Am Living\nMy Vision" }),
          el({ id: uid(), x: 300, y: 580, width: 1000, height: 100, fontSize: 32, fontWeight: "400", fontStyle: "italic", color: "rgba(194,159,96,0.8)", text: "— The Journeymen Collective", zIndex: 2 }),
        ],
      },
    ],
  },
  {
    name: "Dream Board",
    desc: "Image-heavy slides for your dream life",
    icon: "◈",
    build: () => [
      {
        id: uid(), kenBurnsVariant: 0,
        background: { type: "image", overlayOpacity: 0.4 },
        elements: [el({ x: 100, y: 680, width: 1400, height: 120, fontSize: 48, text: "My Dream Life" })],
      },
      {
        id: uid(), kenBurnsVariant: 1,
        background: { type: "image", overlayOpacity: 0.5 },
        elements: [el({ x: 100, y: 680, width: 1400, height: 120, fontSize: 42, fontStyle: "italic", text: "My Dream Home" })],
      },
      {
        id: uid(), kenBurnsVariant: 2,
        background: { type: "image", overlayOpacity: 0.5 },
        elements: [el({ x: 100, y: 680, width: 1400, height: 120, fontSize: 42, fontStyle: "italic", text: "My Dream Career" })],
      },
      {
        id: uid(), kenBurnsVariant: 3,
        background: { type: "image", overlayOpacity: 0.5 },
        elements: [el({ x: 100, y: 680, width: 1400, height: 120, fontSize: 42, fontStyle: "italic", text: "My Dream Relationships" })],
      },
      {
        id: uid(), kenBurnsVariant: 0,
        background: { type: "image", overlayOpacity: 0.5 },
        elements: [el({ x: 100, y: 680, width: 1400, height: 120, fontSize: 42, fontStyle: "italic", text: "My Dream Body & Health" })],
      },
      {
        id: uid(), kenBurnsVariant: 1,
        background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
        elements: [el({ x: 100, y: 300, width: 1400, height: 300, fontSize: 72, text: "I Am Living\nAll of This" })],
      },
    ],
  },
];

// ─── Drag state type ────────────────────────────────────────────────────────
type Handle = "nw" | "ne" | "se" | "sw";
type DragState =
  | { kind: "move"; id: string; startEl: { x: number; y: number }; startM: { x: number; y: number } }
  | { kind: "resize"; id: string; handle: Handle; startEl: { x: number; y: number; w: number; h: number }; startM: { x: number; y: number } };

// ─── Helpers ───────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function makeTextEl(idx = 0): SlideElement {
  return {
    id: uid(), type: "text",
    x: 200, y: 280 + idx * 200, width: 1200, height: 180,
    zIndex: idx + 1,
    text: "Your text here",
    fontFamily: FONTS[0].value,
    fontSize: 72,
    fontWeight: "700",
    fontStyle: "normal",
    color: "#ffffff",
    textAlign: "center",
    textShadow: true,
  };
}

function makeSlide(): VisionSlide {
  return {
    id: uid(),
    background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
    elements: [],
    kenBurnsVariant: Math.floor(Math.random() * 4),
  };
}

function makeVision(): VisionVideo {
  return {
    id: uid(), title: "My Vision",
    slides: [makeSlide()],
    slideDuration: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

let _initCache: { id: string; vision: VisionVideo; list: VisionMeta[] } | null = null;

function initStorage(): { id: string; vision: VisionVideo; list: VisionMeta[] } {
  if (_initCache) return _initCache;
  if (typeof window === "undefined") {
    const v = makeVision();
    return { id: v.id, vision: v, list: [{ id: v.id, title: v.title, updatedAt: Date.now() }] };
  }
  let list: VisionMeta[] = [];
  try { const s = localStorage.getItem(VISIONS_LIST_KEY); if (s) list = JSON.parse(s); } catch {}

  if (list.length === 0) {
    // Migrate legacy jmc_vision_v2
    try {
      const legacy = localStorage.getItem("jmc_vision_v2");
      if (legacy) {
        const v = JSON.parse(legacy) as VisionVideo;
        if (v.slides?.[0]?.background) {
          list = [{ id: v.id, title: v.title, updatedAt: Date.now() }];
          localStorage.setItem(visionKey(v.id), legacy);
          localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(list));
          localStorage.setItem(CURRENT_ID_KEY, v.id);
          _initCache = { id: v.id, vision: v, list };
          return _initCache;
        }
      }
    } catch {}
    // Fresh start
    const v = makeVision();
    list = [{ id: v.id, title: v.title, updatedAt: Date.now() }];
    localStorage.setItem(visionKey(v.id), JSON.stringify(v));
    localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(list));
    localStorage.setItem(CURRENT_ID_KEY, v.id);
    _initCache = { id: v.id, vision: v, list };
    return _initCache;
  }

  let curId = "";
  try { curId = localStorage.getItem(CURRENT_ID_KEY) ?? ""; } catch {}
  if (!list.find((m) => m.id === curId)) curId = list[0].id;

  let vision: VisionVideo | null = null;
  try {
    const s = localStorage.getItem(visionKey(curId));
    if (s) { const v = JSON.parse(s) as VisionVideo; if (v.slides?.[0]?.background) vision = v; }
  } catch {}
  if (!vision) { vision = makeVision(); vision.id = curId; localStorage.setItem(visionKey(curId), JSON.stringify(vision)); }

  localStorage.setItem(CURRENT_ID_KEY, curId);
  _initCache = { id: curId, vision, list };
  return _initCache;
}

async function resizeImg(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > 1920) { h = Math.round(h * 1920 / w); w = 1920; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = rej;
      img.src = e.target!.result as string;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function escH(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Render background (shared between canvas preview and export) ───────────
function bgStyle(bg: SlideBackground): React.CSSProperties {
  if (bg.type === "color") return { background: bg.color ?? "#040d1c" };
  if (bg.type === "gradient" && bg.gradient) {
    const { from, to, angle } = bg.gradient;
    return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
  }
  return { background: "#040d1c" };
}

// ─── Export HTML ───────────────────────────────────────────────────────────
function generateExportHTML(v: VisionVideo): string {
  const slides = v.slides;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escH(v.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Display:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;-webkit-font-smoothing:antialiased}
#wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000}
#stage{position:relative;width:1600px;height:900px;overflow:hidden;transform-origin:center center;flex-shrink:0}
.slide{position:absolute;inset:0;pointer-events:none}
.bg{position:absolute;inset:0}
.bg-img{position:absolute;inset:-12%;background-size:cover;background-position:center}
.ov{position:absolute;inset:0}
.el{position:absolute;display:flex;align-items:center}
.el-text{width:100%;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;overflow:hidden}
@keyframes kb0{from{transform:scale(1) translate(0,0)}to{transform:scale(1.16) translate(-2.5%,-1.5%)}}
@keyframes kb1{from{transform:scale(1) translate(0,0)}to{transform:scale(1.16) translate(2.5%,-1.5%)}}
@keyframes kb2{from{transform:scale(1) translate(0,0)}to{transform:scale(1.12) translate(-1.5%,2%)}}
@keyframes kb3{from{transform:scale(1) translate(0,0)}to{transform:scale(1.12) translate(1.5%,1.5%)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
#sc{transition:opacity .55s ease}
#dots{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:8px;align-items:center;z-index:100;opacity:0;transition:opacity .4s}
.dot{height:6px;border-radius:3px;background:rgba(255,255,255,.28);cursor:pointer;transition:all .3s}
.dot.on{background:#C29F60}
#ss{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(4,13,28,.92);z-index:200;cursor:pointer;gap:20px}
#ss-t{font-size:52px;font-weight:700;color:rgba(222,211,200,.92);text-align:center;padding:0 80px;font-family:Georgia,serif;max-width:1400px}
#ss-sub{font-size:16px;color:rgba(29,116,88,.85);letter-spacing:.12em;font-family:system-ui;font-style:italic}
#pb{width:80px;height:80px;border-radius:50%;background:rgba(194,159,96,.14);border:2px solid rgba(194,159,96,.45);display:flex;align-items:center;justify-content:center;transition:transform .2s}
#pb:hover{transform:scale(1.1)}
#pb svg{fill:#C29F60}
#ttl{position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:15px;color:rgba(255,255,255,.6);letter-spacing:.06em;font-family:Georgia,serif;font-weight:600;opacity:0;transition:opacity .4s;white-space:nowrap;z-index:100}
#es{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(4,13,28,.9);z-index:200;gap:24px}
#em{font-size:44px;font-weight:700;color:rgba(222,211,200,.9);font-family:Georgia,serif}
#rb{padding:12px 36px;border-radius:8px;background:rgba(194,159,96,.12);border:1px solid rgba(194,159,96,.35);color:#C29F60;font-size:13px;letter-spacing:.12em;cursor:pointer;font-family:system-ui;text-transform:uppercase}
#rb:hover{background:rgba(194,159,96,.22)}
#badge{position:fixed;bottom:10px;right:14px;font-size:9px;letter-spacing:.16em;color:rgba(194,159,96,.2);text-transform:uppercase;font-family:system-ui;z-index:50}
</style>
</head>
<body>
<div id="wrap">
  <div id="stage">
    <div id="sc"></div>
    <div id="dots"></div>
    <div id="ttl">${escH(v.title)}</div>
    <div id="ss">
      <div id="ss-t">${escH(v.title)}</div>
      <div id="ss-sub">The Journeymen Collective</div>
      <div id="pb"><svg width="28" height="28" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      <div style="font-size:10px;color:rgba(255,255,255,.28);letter-spacing:.14em;font-family:system-ui">TAP TO BEGIN YOUR VISION</div>
    </div>
    <div id="es">
      <div id="em">Your Vision Awaits</div>
      <button id="rb">WATCH AGAIN</button>
    </div>
  </div>
</div>
<div id="badge">The Journeymen Collective</div>
<script>
const SLIDES=${JSON.stringify(slides)};
const MUSIC=${v.musicDataUrl ? JSON.stringify(v.musicDataUrl) : "null"};
const DUR=${v.slideDuration};
let cur=0,busy=false,aud=null,htimer=null,timer=null;
const sc=document.getElementById('sc'),dots=document.getElementById('dots'),
      ttl=document.getElementById('ttl'),ss=document.getElementById('ss'),es=document.getElementById('es');

function resize(){
  const s=Math.min(window.innerWidth/1600,window.innerHeight/900);
  document.getElementById('stage').style.transform='scale('+s+')';
}
window.addEventListener('resize',resize);resize();

SLIDES.forEach((_,i)=>{
  const d=document.createElement('div');d.className='dot'+(i===0?' on':'');
  d.style.width=i===0?'24px':'6px';d.onclick=()=>!busy&&go(i);dots.appendChild(d);
});

function updDots(i){
  dots.querySelectorAll('.dot').forEach((d,j)=>{
    d.classList.toggle('on',j===i);d.style.width=j===i?'24px':'6px';
  });
}

function renderBg(slide,container){
  const bg=slide.background||{type:'color',color:'#040d1c'};
  if(bg.type==='image'&&bg.imageDataUrl){
    const d=document.createElement('div');d.className='bg-img';
    d.style.backgroundImage='url('+bg.imageDataUrl+')';
    const kbv=(slide.kenBurnsVariant||0)%4;
    d.style.animation='kb'+kbv+' '+(DUR+2)+'s ease-out forwards';
    container.appendChild(d);
    const ov=(bg.overlayOpacity??0.4);
    if(ov>0){const o=document.createElement('div');o.className='ov';o.style.background='rgba(0,0,0,'+ov+')';container.appendChild(o);}
  } else {
    const d=document.createElement('div');d.className='bg';
    if(bg.type==='color')d.style.background=bg.color||'#040d1c';
    else if(bg.type==='gradient'&&bg.gradient){const g=bg.gradient;d.style.background='linear-gradient('+g.angle+'deg,'+g.from+','+g.to+')';}
    else d.style.background='#040d1c';
    container.appendChild(d);
  }
}

function renderEls(slide,container){
  const els=[...(slide.elements||[])].sort((a,b)=>a.zIndex-b.zIndex);
  els.forEach(el=>{
    const d=document.createElement('div');d.className='el';
    d.style.left=el.x+'px';d.style.top=el.y+'px';
    d.style.width=el.width+'px';d.style.height=el.height+'px';
    d.style.zIndex=el.zIndex;
    d.style.justifyContent=el.textAlign==='left'?'flex-start':el.textAlign==='right'?'flex-end':'center';
    if(el.type==='text'&&el.text){
      const p=document.createElement('p');p.className='el-text';
      p.textContent=el.text;
      p.style.fontFamily=el.fontFamily||'Georgia,serif';
      p.style.fontSize=(el.fontSize||64)+'px';
      p.style.fontWeight=el.fontWeight||'700';
      p.style.fontStyle=el.fontStyle||'normal';
      p.style.color=el.color||'#fff';
      p.style.textAlign=el.textAlign||'center';
      if(el.textShadow)p.style.textShadow='0 4px 24px rgba(0,0,0,.95),0 2px 8px rgba(0,0,0,.7)';
      p.style.animation='fadeUp .9s ease .3s both';
      d.appendChild(p);
    } else if(el.type==='image'&&el.imageDataUrl){
      const img=document.createElement('img');img.src=el.imageDataUrl;
      img.style.width='100%';img.style.height='100%';
      const safeObjectFit=['cover','contain','fill','none','scale-down'].includes(el.objectFit)?el.objectFit:'cover';
      img.style.objectFit=safeObjectFit;
      img.alt='';d.appendChild(img);
    }
    container.appendChild(d);
  });
}

function render(slide){
  sc.innerHTML='';renderBg(slide,sc);renderEls(slide,sc);
}

function go(i){
  if(i>=SLIDES.length){
    es.style.display='flex';dots.style.opacity='0';ttl.style.opacity='0';
    if(aud)aud.pause();clearTimeout(timer);return;
  }
  busy=true;clearTimeout(timer);sc.style.opacity='0';
  setTimeout(()=>{cur=i;render(SLIDES[i]);updDots(i);sc.style.opacity='1';busy=false;
    timer=setTimeout(()=>go(i+1),DUR*1000);},600);
}

function start(){
  ss.style.opacity='0';setTimeout(()=>ss.style.display='none',500);
  dots.style.opacity='1';ttl.style.opacity='1';
  if(MUSIC){aud=new Audio(MUSIC);aud.loop=true;aud.volume=0.7;aud.play().catch(()=>{});}
  render(SLIDES[0]);timer=setTimeout(()=>go(1),DUR*1000);
}
ss.onclick=start;
document.getElementById('rb').onclick=()=>{
  es.style.display='none';dots.style.opacity='1';ttl.style.opacity='1';
  if(aud){aud.currentTime=0;aud.play().catch(()=>{});}
  sc.style.opacity='1';render(SLIDES[0]);timer=setTimeout(()=>go(1),DUR*1000);
};
document.addEventListener('mousemove',()=>{
  if(ss.style.display!=='none'||es.style.display==='flex')return;
  dots.style.opacity='1';ttl.style.opacity='1';
  clearTimeout(htimer);htimer=setTimeout(()=>{dots.style.opacity='0';ttl.style.opacity='0';},3000);
});
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function VisionPage() {
  const router = useRouter();
  const { session } = useAuth();

  // ─── State ──────────────────────────────────────────────────────────────
  const [vision, setVision] = useState<VisionVideo>(() => initStorage().vision);
  const [currentId, setCurrentId] = useState<string>(() => initStorage().id);
  const [visionList, setVisionList] = useState<VisionMeta[]>(() => initStorage().list);
  const [selSlideId, setSelSlideId] = useState<string>(() => initStorage().vision.slides[0]?.id ?? "");
  const [selElId, setSelElId] = useState<string | null>(null);
  const [editingElId, setEditingElId] = useState<string | null>(null);
  const [canvasW, setCanvasW] = useState(800);
  const [bgTab, setBgTab] = useState<"color" | "gradient" | "image">("gradient");
  const [addingElImg, setAddingElImg] = useState(false);
  const [showSlideTemplates, setShowSlideTemplates] = useState(false);
  const [showVisionTemplates, setShowVisionTemplates] = useState(false);
  const [showVisionList, setShowVisionList] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileProps, setShowMobileProps] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isImportingPptx, setIsImportingPptx] = useState(false);
  const [pptxImportError, setPptxImportError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [draggingSlideId, setDraggingSlideId] = useState<string | null>(null);
  const [dragOverSlideId, setDragOverSlideId] = useState<string | null>(null);
  const [photoLibrary, setPhotoLibrary] = useState<LibPhoto[]>([]);
  const [photoLibTab, setPhotoLibTab] = useState<"jmc" | "personal">("jmc");
  const [jmcBucket, setJmcBucket] = useState<PortalPhotoBucket | "all">("all");
  const [jmcLoadingId, setJmcLoadingId] = useState<string | null>(null);
  const [controlTab, setControlTab] = useState<"bg" | "style" | "music" | "photos">("bg");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMsg, setSubmitMsg] = useState("");

  // ─── Refs ────────────────────────────────────────────────────────────────
  const outerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const bgImgRef = useRef<HTMLInputElement>(null);
  const elImgRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const historyRef = useRef<VisionVideo[]>([initStorage().vision]);
  const historyIdxRef = useRef<number>(0);
  const currentIdRef = useRef<string>(initStorage().id);
  const visionListRef = useRef<VisionMeta[]>(initStorage().list);
  const slideDragIdRef = useRef<string | null>(null);
  const photoMultiRef = useRef<HTMLInputElement>(null);
  const pptxImportRef = useRef<HTMLInputElement>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const selSlide = vision.slides.find((s) => s.id === selSlideId) ?? vision.slides[0];
  const selEl = selSlide?.elements.find((e) => e.id === selElId) ?? null;
  const scale = canvasW / VW;

  // ─── Sync undo/redo indicators and visionList after each vision change ──────
  useEffect(() => {
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    setVisionList([...visionListRef.current]);
  }, [vision]);

  // ─── Canvas width observer ─────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (outerRef.current) setCanvasW(outerRef.current.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, []);

  // ─── Sync bgTab with selected slide's background type ─────────────────────
  useEffect(() => {
    if (selSlide?.background?.type) setBgTab(selSlide.background.type);
  }, [selSlideId]); // eslint-disable-line

  // ─── Mobile breakpoint ─────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── Load photo library ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PHOTO_LIB_KEY);
      if (raw) setPhotoLibrary(JSON.parse(raw));
    } catch {}
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const save = (fn: (v: VisionVideo) => VisionVideo, toHistory = true) =>
    setVision((prev) => {
      const next = { ...fn(prev), updatedAt: new Date().toISOString() };
      const id = currentIdRef.current;
      if (id) {
        try { localStorage.setItem(visionKey(id), JSON.stringify(next)); } catch {}
        const newList = visionListRef.current.map((m) =>
          m.id === id ? { ...m, title: next.title, updatedAt: Date.now() } : m
        );
        visionListRef.current = newList;
        try { localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(newList)); } catch {}
      }
      if (toHistory) {
        const newH = historyRef.current.slice(0, historyIdxRef.current + 1);
        newH.push(next);
        if (newH.length > 60) newH.shift();
        historyRef.current = newH;
        historyIdxRef.current = newH.length - 1;
      }
      return next;
    });

  // ─── Undo / Redo ─────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    const state = historyRef.current[historyIdxRef.current];
    try { localStorage.setItem(visionKey(currentIdRef.current), JSON.stringify(state)); } catch {}
    setVision(state);
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    const state = historyRef.current[historyIdxRef.current];
    try { localStorage.setItem(visionKey(currentIdRef.current), JSON.stringify(state)); } catch {}
    setVision(state);
  }, []);

  // ─── Vision management ───────────────────────────────────────────────────────
  const openVision = useCallback((id: string) => {
    try {
      const s = localStorage.getItem(visionKey(id));
      if (!s) return;
      const v = JSON.parse(s) as VisionVideo;
      if (!v.slides?.[0]?.background) return;
      setVision(v);
      currentIdRef.current = id;
      setCurrentId(id);
      localStorage.setItem(CURRENT_ID_KEY, id);
      setSelSlideId(v.slides[0]?.id ?? "");
      setSelElId(null);
      historyRef.current = [v];
      historyIdxRef.current = 0;
      setShowVisionList(false);
    } catch {}
  }, []);

  const createNewVision = useCallback(() => {
    const v = makeVision();
    const meta: VisionMeta = { id: v.id, title: v.title, updatedAt: Date.now() };
    const newList = [...visionListRef.current, meta];
    visionListRef.current = newList;
    localStorage.setItem(visionKey(v.id), JSON.stringify(v));
    localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(newList));
    localStorage.setItem(CURRENT_ID_KEY, v.id);
    setVisionList(newList);
    setVision(v);
    currentIdRef.current = v.id;
    setCurrentId(v.id);
    setSelSlideId(v.slides[0]?.id ?? "");
    setSelElId(null);
    historyRef.current = [v];
    historyIdxRef.current = 0;
    setShowVisionList(false);
  }, []);

  const duplicateVision = useCallback((id: string) => {
    try {
      const s = localStorage.getItem(visionKey(id));
      if (!s) return;
      const src = JSON.parse(s) as VisionVideo;
      const newV: VisionVideo = { ...JSON.parse(JSON.stringify(src)), id: uid(), title: `${src.title} (copy)` };
      const meta: VisionMeta = { id: newV.id, title: newV.title, updatedAt: Date.now() };
      const newList = [...visionListRef.current, meta];
      visionListRef.current = newList;
      localStorage.setItem(visionKey(newV.id), JSON.stringify(newV));
      localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(newList));
      setVisionList([...newList]);
    } catch {}
  }, []);

  const deleteVision = useCallback((id: string) => {
    if (visionListRef.current.length <= 1) return;
    const newList = visionListRef.current.filter((m) => m.id !== id);
    visionListRef.current = newList;
    localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(newList));
    try { localStorage.removeItem(visionKey(id)); } catch {}
    setVisionList([...newList]);
    if (id === currentIdRef.current) openVision(newList[0].id);
  }, [openVision]);

  // Auto-switch to style tab when an element is selected
  useEffect(() => {
    if (selElId) setControlTab("style");
  }, [selElId]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const updateSlide = useCallback((id: string, updates: Partial<VisionSlide>) => {
    save((v) => ({
      ...v,
      slides: v.slides.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []); // eslint-disable-line

  const updateBg = useCallback((bgUpdates: Partial<SlideBackground>) => {
    save((v) => ({
      ...v,
      slides: v.slides.map((s) =>
        s.id === selSlideId ? { ...s, background: { ...s.background, ...bgUpdates } } : s
      ),
    }));
  }, [selSlideId]); // eslint-disable-line

  const updateEl = (id: string, updates: Partial<SlideElement>) => {
    save((v) => ({
      ...v,
      slides: v.slides.map((s) => {
        if (s.id !== selSlideId) return s;
        // If text is changing on a statement-linked slide, mark it overridden
        const markOverridden = "text" in updates && !!s.statementSource && !s.statementOverridden;
        return {
          ...s,
          ...(markOverridden ? { statementOverridden: true } : {}),
          elements: s.elements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        };
      }),
    }));
  };

  const getEl = (id: string) => selSlide?.elements.find((e) => e.id === id);

  // ─── Virtual coordinate helper ──────────────────────────────────────────
  const toVirtual = (e: React.MouseEvent): { x: number; y: number } => {
    if (!outerRef.current) return { x: 0, y: 0 };
    const rect = outerRef.current.getBoundingClientRect();
    const sc = rect.width / VW;
    return {
      x: (e.clientX - rect.left) / sc,
      y: (e.clientY - rect.top) / sc,
    };
  };

  // ─── Canvas mouse handlers ────────────────────────────────────────────────
  const onElMouseDown = (e: React.MouseEvent, id: string) => {
    if (editingElId === id) return;
    e.preventDefault();
    e.stopPropagation();
    setSelElId(id);
    setEditingElId(null);
    const m = toVirtual(e);
    const el = getEl(id);
    if (!el) return;
    dragRef.current = { kind: "move", id, startEl: { x: el.x, y: el.y }, startM: m };
  };

  const onResizeDown = (e: React.MouseEvent, id: string, handle: Handle) => {
    e.preventDefault();
    e.stopPropagation();
    const m = toVirtual(e);
    const el = getEl(id);
    if (!el) return;
    dragRef.current = {
      kind: "resize", id, handle,
      startEl: { x: el.x, y: el.y, w: el.width, h: el.height },
      startM: m,
    };
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const m = toVirtual(e);

    if (d.kind === "move") {
      updateEl(d.id, {
        x: Math.max(0, Math.min(VW - MIN_SZ, d.startEl.x + m.x - d.startM.x)),
        y: Math.max(0, Math.min(VH - MIN_SZ, d.startEl.y + m.y - d.startM.y)),
      });
    } else {
      const dx = m.x - d.startM.x;
      const dy = m.y - d.startM.y;
      let { x, y } = d.startEl;
      let w = d.startEl.w, h = d.startEl.h;

      if (d.handle === "se") {
        w = Math.max(MIN_SZ, d.startEl.w + dx);
        h = Math.max(MIN_SZ, d.startEl.h + dy);
      } else if (d.handle === "sw") {
        const nw = Math.max(MIN_SZ, d.startEl.w - dx);
        x = d.startEl.x + (d.startEl.w - nw);
        w = nw;
        h = Math.max(MIN_SZ, d.startEl.h + dy);
      } else if (d.handle === "ne") {
        w = Math.max(MIN_SZ, d.startEl.w + dx);
        const nh = Math.max(MIN_SZ, d.startEl.h - dy);
        y = d.startEl.y + (d.startEl.h - nh);
        h = nh;
      } else {
        const nw = Math.max(MIN_SZ, d.startEl.w - dx);
        const nh = Math.max(MIN_SZ, d.startEl.h - dy);
        x = d.startEl.x + (d.startEl.w - nw);
        y = d.startEl.y + (d.startEl.h - nh);
        w = nw; h = nh;
      }
      updateEl(d.id, { x, y, width: w, height: h });
    }
  };

  const onCanvasMouseUp = () => { dragRef.current = null; };

  // ─── Touch support ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toVirtualTouch = (touch: any): { x: number; y: number } => {
    if (!outerRef.current) return { x: 0, y: 0 };
    const rect = outerRef.current.getBoundingClientRect();
    const sc = rect.width / VW;
    return { x: (touch.clientX - rect.left) / sc, y: (touch.clientY - rect.top) / sc };
  };

  const onElTouchStart = (e: React.TouchEvent, id: string) => {
    if (editingElId === id) return;
    e.stopPropagation();
    setSelElId(id); setEditingElId(null);
    const m = toVirtualTouch(e.touches[0]);
    const el = getEl(id);
    if (!el) return;
    dragRef.current = { kind: "move", id, startEl: { x: el.x, y: el.y }, startM: m };
  };

  const onCanvasTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const d = dragRef.current;
    const m = toVirtualTouch(e.touches[0]);
    if (d.kind === "move") {
      updateEl(d.id, {
        x: Math.max(0, Math.min(VW - MIN_SZ, d.startEl.x + m.x - d.startM.x)),
        y: Math.max(0, Math.min(VH - MIN_SZ, d.startEl.y + m.y - d.startM.y)),
      });
    }
  };

  const onCanvasTouchEnd = () => { dragRef.current = null; };

  // ─── Photo library helpers ────────────────────────────────────────────────

  const applyPhotoBackground = (dataUrl: string) => {
    save((v) => ({
      ...v,
      slides: v.slides.map((s) =>
        s.id === selSlideId
          ? { ...s, background: { type: "image" as const, imageDataUrl: dataUrl, overlayOpacity: 0.35 } }
          : s
      ),
    }));
    setBgTab("image");
  };

  const applyJmcPhoto = async (id: string, url: string) => {
    setJmcLoadingId(id);
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext("2d")!.drawImage(img, 0, 0);
          applyPhotoBackground(c.toDataURL("image/jpeg", 0.88));
          resolve();
        };
        img.onerror = reject;
        img.src = `${url}?w=1920&q=85`;
      });
    } catch { /* CORS or network fail — silently skip */ }
    setJmcLoadingId(null);
  };

  const handleMultiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const photo: LibPhoto = { id: uid(), dataUrl, name: file.name, addedAt: Date.now() };
        setPhotoLibrary((prev) => {
          const next = [photo, ...prev];
          try { localStorage.setItem(PHOTO_LIB_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
    setPhotoLibTab("personal");
  };

  const removePhoto = (id: string) => {
    setPhotoLibrary((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try { localStorage.setItem(PHOTO_LIB_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const addPhotoElement = (dataUrl: string, shape: "circle" | "square" | "rectangle") => {
    const w = shape === "rectangle" ? 640 : 440;
    const h = shape === "rectangle" ? 360 : 440;
    const newEl: SlideElement = {
      id: uid(), type: "image",
      x: Math.round(VW / 2 - w / 2), y: Math.round(VH / 2 - h / 2),
      width: w, height: h,
      zIndex: (selSlide?.elements.length ?? 0) + 1,
      imageDataUrl: dataUrl, objectFit: "cover", clipShape: shape, opacity: 1,
    };
    save((v) => ({
      ...v,
      slides: v.slides.map((s) =>
        s.id === selSlideId ? { ...s, elements: [...s.elements, newEl] } : s
      ),
    }));
  };

  const addJmcPhotoElement = async (id: string, url: string, shape: "circle" | "square" | "rectangle") => {
    setJmcLoadingId(id);
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext("2d")!.drawImage(img, 0, 0);
          addPhotoElement(c.toDataURL("image/jpeg", 0.88), shape);
          resolve();
        };
        img.onerror = reject;
        img.src = `${url}?w=1920&q=85`;
      });
    } catch {}
    setJmcLoadingId(null);
  };

  // ─── Element CRUD ─────────────────────────────────────────────────────────
  const addTextEl = () => {
    const idx = selSlide?.elements.filter((e) => e.type === "text").length ?? 0;
    const el = makeTextEl(idx);
    save((v) => ({
      ...v,
      slides: v.slides.map((s) =>
        s.id === selSlideId ? { ...s, elements: [...s.elements, el] } : s
      ),
    }));
    setSelElId(el.id);
    setEditingElId(el.id);
  };

  const addImgEl = () => { setAddingElImg(true); elImgRef.current?.click(); };

  const deleteSelEl = () => {
    if (!selElId) return;
    save((v) => ({
      ...v,
      slides: v.slides.map((s) =>
        s.id === selSlideId
          ? { ...s, elements: s.elements.filter((e) => e.id !== selElId) }
          : s
      ),
    }));
    setSelElId(null);
    setEditingElId(null);
  };

  const bringForward = () => {
    if (!selElId || !selSlide) return;
    const el = getEl(selElId);
    if (!el) return;
    updateEl(selElId, { zIndex: el.zIndex + 1 });
  };

  const sendBack = () => {
    if (!selElId || !selSlide) return;
    const el = getEl(selElId);
    if (!el) return;
    updateEl(selElId, { zIndex: Math.max(1, el.zIndex - 1) });
  };

  const bringToFront = () => {
    if (!selElId || !selSlide) return;
    const maxZ = Math.max(...selSlide.elements.map((e) => e.zIndex), 0);
    updateEl(selElId, { zIndex: maxZ + 1 });
  };

  const sendToBack = () => {
    if (!selElId || !selSlide) return;
    updateEl(selElId, { zIndex: 1 });
  };

  const duplicateElement = () => {
    if (!selElId || !selSlide) return;
    const el = getEl(selElId);
    if (!el) return;
    const copy = { ...JSON.parse(JSON.stringify(el)), id: uid(), x: el.x + 20, y: el.y + 20 };
    save((v) => ({
      ...v,
      slides: v.slides.map((s) =>
        s.id === selSlide.id ? { ...s, elements: [...s.elements, copy] } : s
      ),
    }));
    setSelElId(copy.id);
  };

  // ─── Slide CRUD ───────────────────────────────────────────────────────────
  const addSlideFromTemplate = (tmpl: SlideTemplateDef) => {
    const s = tmpl.build();
    // Give all elements fresh IDs (template elements have predictable IDs)
    s.elements = s.elements.map((e) => ({ ...e, id: uid() }));
    save((v) => ({ ...v, slides: [...v.slides, s] }));
    setSelSlideId(s.id);
    setSelElId(null);
    setEditingElId(null);
    setShowSlideTemplates(false);
  };

  const addSlide = () => addSlideFromTemplate(SLIDE_TEMPLATES[0]); // fallback (blank)

  const handlePptxImport = async (file: File) => {
    setIsImportingPptx(true);
    setPptxImportError(null);
    try {
      const imported = await parsePptxFile(file);
      if (imported.length === 0) throw new Error("No slides found in this file.");
      save((v) => ({ ...v, slides: [...v.slides, ...imported] }));
      setSelSlideId(imported[0].id);
      setSelElId(null);
      setEditingElId(null);
    } catch (err) {
      setPptxImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImportingPptx(false);
      if (pptxImportRef.current) pptxImportRef.current.value = "";
    }
  };

  const loadVisionTemplate = (tmpl: VisionTemplateDef) => {
    const slides = tmpl.build().map((s) => ({
      ...s,
      id: uid(),
      elements: s.elements.map((e) => ({ ...e, id: uid() })),
    }));
    save((v) => ({ ...v, title: tmpl.name, slides }));
    setSelSlideId(slides[0]?.id ?? "");
    setSelElId(null);
    setEditingElId(null);
    setShowVisionTemplates(false);
  };

  const deleteSlide = (id: string) => {
    if (vision.slides.length <= 1) return;
    const idx = vision.slides.findIndex((s) => s.id === id);
    save((v) => ({ ...v, slides: v.slides.filter((s) => s.id !== id) }));
    const remaining = vision.slides.filter((s) => s.id !== id);
    setSelSlideId(remaining[Math.max(0, idx - 1)]?.id ?? remaining[0]?.id ?? "");
    setSelElId(null);
    setEditingElId(null);
  };

  const duplicateSlide = (id: string) => {
    const src = vision.slides.find((s) => s.id === id);
    if (!src) return;
    const copy: VisionSlide = { ...JSON.parse(JSON.stringify(src)), id: uid() };
    const idx = vision.slides.findIndex((s) => s.id === id);
    save((v) => {
      const slides = [...v.slides];
      slides.splice(idx + 1, 0, copy);
      return { ...v, slides };
    });
    setSelSlideId(copy.id);
    setSelElId(null);
  };

  const reorderSlides = (fromId: string, toId: string, insertAfter: boolean) => {
    if (fromId === toId) return;
    save((v) => {
      const slides = [...v.slides];
      const fromIdx = slides.findIndex((s) => s.id === fromId);
      if (fromIdx < 0) return v;
      const [moved] = slides.splice(fromIdx, 1);
      const toIdx = slides.findIndex((s) => s.id === toId);
      if (toIdx < 0) return v;
      slides.splice(insertAfter ? toIdx + 1 : toIdx, 0, moved);
      return { ...v, slides };
    });
  };

  // ─── Image upload handlers ─────────────────────────────────────────────────
  const handleBgImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImg(file);
    updateBg({ type: "image", imageDataUrl: dataUrl, overlayOpacity: 0.4 });
    setBgTab("image");
    e.target.value = "";
  };

  const handleElImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setAddingElImg(false); return; }
    const dataUrl = await resizeImg(file);
    const maxZ = Math.max(0, ...(selSlide?.elements.map((e) => e.zIndex) ?? [0]));
    if (addingElImg && !selElId) {
      const el: SlideElement = {
        id: uid(), type: "image",
        x: 400, y: 150, width: 800, height: 600,
        zIndex: maxZ + 1,
        imageDataUrl: dataUrl,
        objectFit: "contain",
      };
      save((v) => ({
        ...v,
        slides: v.slides.map((s) =>
          s.id === selSlideId ? { ...s, elements: [...s.elements, el] } : s
        ),
      }));
      setSelElId(el.id);
    } else if (selEl?.type === "image") {
      updateEl(selEl.id, { imageDataUrl: dataUrl });
    }
    setAddingElImg(false);
    e.target.value = "";
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      save((v) => ({ ...v, musicDataUrl: ev.target!.result as string, musicName: file.name }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const loadImg = (src: string): Promise<HTMLImageElement> => {
    if (imgCacheRef.current.has(src)) return Promise.resolve(imgCacheRef.current.get(src)!);
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => { imgCacheRef.current.set(src, img); res(img); };
      img.onerror = rej;
      img.src = src;
    });
  };

  const drawSlideFrame = async (
    ctx: CanvasRenderingContext2D, slide: VisionSlide,
    W: number, H: number, t: number
  ) => {
    const sx = W / VW, sy = H / VH;
    const bg = slide.background;
    ctx.clearRect(0, 0, W, H);

    if (bg.type === "gradient" && bg.gradient) {
      const angle = ((bg.gradient.angle ?? 135) * Math.PI) / 180;
      const grd = ctx.createLinearGradient(
        W / 2 - (Math.cos(angle) * W) / 2, H / 2 - (Math.sin(angle) * H) / 2,
        W / 2 + (Math.cos(angle) * W) / 2, H / 2 + (Math.sin(angle) * H) / 2
      );
      grd.addColorStop(0, bg.gradient.from);
      grd.addColorStop(1, bg.gradient.to);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    } else if (bg.type === "image" && bg.imageDataUrl) {
      try {
        const img = await loadImg(bg.imageDataUrl);
        const kbScale = 1 + 0.16 * t;
        const offsets = [[-0.025, -0.015], [0.025, -0.015], [-0.015, 0.02], [0.015, 0.015]] as const;
        const [ox, oy] = offsets[slide.kenBurnsVariant ?? 0];
        const iw = W * kbScale, ih = H * kbScale;
        const ix = (W - iw) / 2 + ox * W * t, iy = (H - ih) / 2 + oy * H * t;
        ctx.drawImage(img, ix, iy, iw, ih);
        ctx.fillStyle = `rgba(4,13,28,${bg.overlayOpacity ?? 0.4})`;
        ctx.fillRect(0, 0, W, H);
      } catch { ctx.fillStyle = "#040d1c"; ctx.fillRect(0, 0, W, H); }
    } else {
      ctx.fillStyle = bg.color ?? "#040d1c";
      ctx.fillRect(0, 0, W, H);
    }

    const fadeA = Math.min(1, t / 0.25);
    const fadeY = (1 - fadeA) * 18 * sy;

    for (const el of slide.elements) {
      if (el.type === "text") {
        const fs = (el.fontSize ?? 72) * sx;
        ctx.save();
        ctx.globalAlpha = fadeA;
        ctx.font = `${el.fontStyle === "italic" ? "italic " : ""}${el.fontWeight ?? "400"} ${fs}px ${el.fontFamily ?? "Georgia, serif"}`;
        ctx.fillStyle = el.color ?? "#ffffff";
        ctx.textAlign = (el.textAlign as CanvasTextAlign) ?? "center";
        ctx.textBaseline = "middle";
        if (el.textShadow) {
          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = 8 * sx;
          ctx.shadowOffsetX = 2 * sx;
          ctx.shadowOffsetY = 2 * sy;
        }
        const elX = el.x * sx, elY = el.y * sy + fadeY;
        const elW = el.width * sx, elH = el.height * sy;
        const rawText = el.textTransform === "uppercase" ? (el.text ?? "").toUpperCase()
          : el.textTransform === "lowercase" ? (el.text ?? "").toLowerCase()
          : (el.text ?? "");
        const words = rawText.split(/\s+/);
        const lh = fs * (el.lineHeight ?? 1.3);
        const lines: string[] = [];
        let cur = "";
        for (const w of words) {
          const test = cur ? cur + " " + w : w;
          if (ctx.measureText(test).width > elW && cur) { lines.push(cur); cur = w; }
          else cur = test;
        }
        if (cur) lines.push(cur);
        const totalH = lines.length * lh;
        const startY = elY + elH / 2 - totalH / 2 + lh / 2;
        const textX = el.textAlign === "left" ? elX : el.textAlign === "right" ? elX + elW : elX + elW / 2;
        lines.forEach((ln, i) => ctx.fillText(ln, textX, startY + i * lh));
        ctx.restore();
      } else if (el.type === "image" && el.imageDataUrl) {
        try {
          const img = await loadImg(el.imageDataUrl);
          ctx.save();
          ctx.globalAlpha = fadeA;
          ctx.drawImage(img, el.x * sx, el.y * sy + fadeY, el.width * sx, el.height * sy);
          ctx.restore();
        } catch { /* skip */ }
      }
    }
  };

  const handleSubmitForReview = async () => {
    if (isSubmitting || !session?.access_token) return;
    if (vision.slides.length === 0) {
      setSubmitStatus("error");
      setSubmitMsg("Add at least one slide before submitting.");
      setTimeout(() => setSubmitStatus("idle"), 4000);
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus("idle");
    try {
      const res = await fetch("/api/vision-submissions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visionId: currentId,
          visionTitle: vision.title || "Untitled Vision",
          visionData: vision,
          slideCount: vision.slides.length,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Submission failed");
      }
      setSubmitStatus("success");
      setSubmitMsg("Vision submitted for review!");
    } catch (e) {
      setSubmitStatus("error");
      setSubmitMsg(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }
  };

  const exportVision = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);

    const W = 1280, H = 720;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const stream = canvas.captureStream(30);

    // Add music track if present
    let audioEl: HTMLAudioElement | null = null;
    if (vision.musicDataUrl) {
      try {
        const audioCtx = new AudioContext();
        audioEl = new Audio(vision.musicDataUrl);
        audioEl.loop = false;
        const src = audioCtx.createMediaElementSource(audioEl);
        const dest = audioCtx.createMediaStreamDestination();
        src.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        audioEl.play().catch(() => {});
      } catch { /* audio optional */ }
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      audioEl?.pause();
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${vision.title.replace(/[^a-z0-9]/gi, "_")}_vision.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportProgress(0);
    };
    recorder.start(100);

    const totalSlides = vision.slides.length;
    const durMs = vision.slideDuration * 1000;

    for (let si = 0; si < totalSlides; si++) {
      const slide = vision.slides[si];
      const start = Date.now();
      await new Promise<void>((resolve) => {
        const tick = async () => {
          const elapsed = Date.now() - start;
          if (elapsed >= durMs) { resolve(); return; }
          const t = elapsed / durMs;
          await drawSlideFrame(ctx, slide, W, H, t);
          setExportProgress(Math.round(((si + t) / totalSlides) * 100));
          setTimeout(tick, 33);
        };
        tick();
      });
      // Draw final frame of this slide
      await drawSlideFrame(ctx, slide, W, H, 1);
    }

    recorder.stop();
  };

  // ─── Resize handle UI helper ───────────────────────────────────────────────
  const handlePos = (h: Handle): React.CSSProperties => {
    const sz = Math.round(14 / scale);
    const off = -Math.round(7 / scale);
    const base: React.CSSProperties = {
      position: "absolute", width: sz, height: sz,
      background: "white", border: "2px solid rgba(8,37,77,0.7)",
      borderRadius: 2, zIndex: 999,
    };
    if (h === "nw") return { ...base, top: off, left: off, cursor: "nwse-resize" };
    if (h === "ne") return { ...base, top: off, right: off, cursor: "nesw-resize" };
    if (h === "se") return { ...base, bottom: off, right: off, cursor: "nwse-resize" };
    return { ...base, bottom: off, left: off, cursor: "nesw-resize" };
  };

  // ─── Render background in canvas ──────────────────────────────────────────
  const renderCanvasBg = (bg: SlideBackground) => {
    if (bg.type === "image" && bg.imageDataUrl) {
      return (
        <>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${bg.imageDataUrl})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: `rgba(0,0,0,${bg.overlayOpacity ?? 0.4})`,
          }} />
        </>
      );
    }
    return <div style={{ position: "absolute", inset: 0, ...bgStyle(bg) }} />;
  };

  // ─── Properties panel ───────────────────────────────────────────────────
  const renderProps = () => {
    if (selEl) return renderElProps(selEl);
    return renderBgProps();
  };

  const renderElProps = (el: SlideElement) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Title */}
      <div style={{ fontSize: 10, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.14em", color: "#C29F60", textTransform: "uppercase" }}>
        {el.type === "text" ? "Text Element" : "Image Element"}
      </div>

      {el.type === "text" && (
        <>
          {/* Font family */}
          <div>
            <Label>Font</Label>
            <select
              value={el.fontFamily ?? FONTS[0].value}
              onChange={(e) => updateEl(el.id, { fontFamily: e.target.value })}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 6,
                border: "1px solid rgba(194,159,96,0.2)", background: "rgba(10,20,50,0.9)",
                color: "#DED3C8", fontSize: 13, fontFamily: el.fontFamily ?? FONTS[0].value,
                cursor: "pointer", appearance: "auto",
              }}
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <Label>Color</Label>
            <ColorSwatches colors={EL_COLORS} selected={el.color ?? "#ffffff"} onSelect={(c) => updateEl(el.id, { color: c })} />
            <label style={{ display: "block", marginTop: 6, cursor: "pointer", position: "relative" }}>
              <div style={{
                width: "100%", height: 36, borderRadius: 6, background: el.color ?? "#ffffff",
                border: "2px solid rgba(194,159,96,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(0,0,0,0.35)", textTransform: "uppercase" }}>
                  Custom Color
                </span>
              </div>
              <input type="color" value={el.color ?? "#ffffff"} onChange={(e) => updateEl(el.id, { color: e.target.value })}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
            </label>
          </div>

          {/* Letter Spacing + Line Height — one row */}
          <div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Label>Spacing: {(el.letterSpacing ?? 0).toFixed(2)}em</Label>
                <input type="range" min={-5} max={50} step={1}
                  value={Math.round((el.letterSpacing ?? 0) * 100)}
                  onChange={(e) => updateEl(el.id, { letterSpacing: Number(e.target.value) / 100 })}
                  style={{ width: "100%", accentColor: "#C29F60" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Label>Line H: {(el.lineHeight ?? 1.3).toFixed(1)}</Label>
                <input type="range" min={80} max={250} step={5}
                  value={Math.round((el.lineHeight ?? 1.3) * 100)}
                  onChange={(e) => updateEl(el.id, { lineHeight: Number(e.target.value) / 100 })}
                  style={{ width: "100%", accentColor: "#C29F60" }} />
              </div>
            </div>
          </div>
        </>
      )}

      {el.type === "image" && (
        <>
          <div>
            <Label>Shape</Label>
            <div style={{ display: "flex", gap: 4 }}>
              {([
                { shape: "rectangle" as const, label: "▭ Rect" },
                { shape: "square" as const, label: "■ Square" },
                { shape: "circle" as const, label: "○ Circle" },
              ]).map(({ shape, label }) => (
                <ToggleBtn
                  key={shape}
                  active={(el.clipShape ?? "rectangle") === shape}
                  onClick={() => updateEl(el.id, { clipShape: shape })}
                >
                  <span style={{ fontSize: 10 }}>{label}</span>
                </ToggleBtn>
              ))}
            </div>
          </div>
          <div>
            <Label>Opacity: {Math.round((el.opacity ?? 1) * 100)}%</Label>
            <input type="range" min={10} max={100} step={5}
              value={Math.round((el.opacity ?? 1) * 100)}
              onChange={(e) => updateEl(el.id, { opacity: Number(e.target.value) / 100 })}
              style={{ width: "100%", accentColor: "#C29F60" }} />
          </div>
          {el.imageDataUrl && (
            <>
              <div>
                <Label>Object Fit</Label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["cover", "contain"] as const).map((f) => (
                    <ToggleBtn key={f} active={(el.objectFit ?? "contain") === f} onClick={() => updateEl(el.id, { objectFit: f })}>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{f}</span>
                    </ToggleBtn>
                  ))}
                </div>
              </div>
              <button onClick={() => { setAddingElImg(false); elImgRef.current?.click(); }} style={secondaryBtnStyle}>
                Replace Image
              </button>
            </>
          )}
        </>
      )}

      {/* Hint for non-text / image elements on mobile */}
      {!selElId && (
        <div style={{ fontSize: 10, color: "rgba(222,211,200,0.3)", fontFamily: "Syne,system-ui,sans-serif", fontStyle: "italic" }}>
          Select an element to edit it.
        </div>
      )}
    </div>
  );

  const renderBgProps = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 10, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.14em", color: "#C29F60", textTransform: "uppercase" }}>
        Background
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 3 }}>
        {(["color", "gradient", "image"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setBgTab(t); if (t !== "image") updateBg({ type: t }); }}
            style={{
              flex: 1, padding: "4px 0", borderRadius: 4, cursor: "pointer",
              background: bgTab === t ? "rgba(194,159,96,0.13)" : "transparent",
              border: `1px solid ${bgTab === t ? "rgba(194,159,96,0.28)" : "rgba(194,159,96,0.1)"}`,
              color: bgTab === t ? "#C29F60" : "rgba(222,211,200,0.4)",
              fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {bgTab === "color" && (
        <>
          <ColorSwatches colors={BG_COLORS} selected={selSlide?.background.color ?? "#040d1c"} onSelect={(c) => updateBg({ type: "color", color: c })} />
          <label style={{ display: "block", cursor: "pointer", position: "relative" }}>
            <div style={{
              width: "100%", height: 44, borderRadius: 6,
              background: selSlide?.background.color ?? "#040d1c",
              border: "2px solid rgba(194,159,96,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                Custom Color
              </span>
            </div>
            <input type="color" value={selSlide?.background.color ?? "#040d1c"}
              onChange={(e) => updateBg({ type: "color", color: e.target.value })}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
          </label>
        </>
      )}

      {bgTab === "gradient" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {BG_GRADIENTS.map((g) => (
              <button
                key={g.label}
                title={g.label}
                onClick={() => updateBg({ type: "gradient", gradient: { from: g.from, to: g.to, angle: g.angle } })}
                style={{
                  height: 22, borderRadius: 5, cursor: "pointer",
                  background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`,
                  border: selSlide?.background.gradient?.from === g.from ? "2px solid #C29F60" : "2px solid transparent",
                  fontSize: 8, color: "rgba(255,255,255,0.7)", fontFamily: "Syne,system-ui,sans-serif",
                  fontWeight: 700, letterSpacing: "0.06em",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
          {selSlide?.background.gradient && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "Syne,system-ui,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(194,159,96,0.7)", flexShrink: 0 }}>From</span>
              <input type="color" value={selSlide.background.gradient.from}
                onChange={(e) => updateBg({ gradient: { ...selSlide!.background.gradient!, from: e.target.value } })}
                style={{ width: 32, height: 22, borderRadius: 4, border: "1px solid rgba(194,159,96,0.2)", cursor: "pointer", flexShrink: 0 }} />
              <span style={{ fontFamily: "Syne,system-ui,sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(194,159,96,0.7)", flexShrink: 0 }}>To</span>
              <input type="color" value={selSlide.background.gradient.to}
                onChange={(e) => updateBg({ gradient: { ...selSlide!.background.gradient!, to: e.target.value } })}
                style={{ width: 32, height: 22, borderRadius: 4, border: "1px solid rgba(194,159,96,0.2)", cursor: "pointer", flexShrink: 0 }} />
              <input type="range" min={0} max={360} value={selSlide.background.gradient.angle}
                onChange={(e) => updateBg({ gradient: { ...selSlide!.background.gradient!, angle: Number(e.target.value) } })}
                style={{ flex: 1, accentColor: "#C29F60" }} />
              <span style={{ fontFamily: "Syne,system-ui,sans-serif", fontSize: 9, color: "rgba(222,211,200,0.5)", flexShrink: 0, minWidth: 28, textAlign: "right" }}>{selSlide.background.gradient.angle}°</span>
            </div>
          )}
        </>
      )}

      {bgTab === "image" && (
        <>
          {selSlide?.background.imageDataUrl ? (
            <>
              <div style={{ borderRadius: 6, overflow: "hidden", aspectRatio: "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selSlide.background.imageDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <button onClick={() => bgImgRef.current?.click()} style={secondaryBtnStyle}>
                <Upload size={12} style={{ display: "inline", marginRight: 4 }} />
                Replace Image
              </button>
              <div>
                <Label>Overlay: {Math.round((selSlide.background.overlayOpacity ?? 0.4) * 100)}%</Label>
                <input type="range" min={0} max={90} step={5}
                  value={Math.round((selSlide.background.overlayOpacity ?? 0.4) * 100)}
                  onChange={(e) => updateBg({ overlayOpacity: Number(e.target.value) / 100 })}
                  style={{ width: "100%", accentColor: "#C29F60" }} />
              </div>
            </>
          ) : (
            <button onClick={() => bgImgRef.current?.click()} style={{ ...secondaryBtnStyle, padding: "20px 0", flexDirection: "column", gap: 8 }}>
              <Upload size={16} />
              <span style={{ fontSize: 11 }}>Upload Background Image</span>
            </button>
          )}
        </>
      )}

      {/* Ken Burns */}
      {selSlide?.background.type === "image" && (
        <div>
          <Label>Ken Burns Direction</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
            {[0, 1, 2, 3].map((v) => (
              <button
                key={v}
                onClick={() => updateSlide(selSlideId, { kenBurnsVariant: v })}
                style={{
                  padding: "5px 0", borderRadius: 4, border: selSlide.kenBurnsVariant === v ? "1px solid #C29F60" : "1px solid rgba(194,159,96,0.2)",
                  background: selSlide.kenBurnsVariant === v ? "rgba(194,159,96,0.12)" : "transparent",
                  color: selSlide.kenBurnsVariant === v ? "#C29F60" : "rgba(222,211,200,0.5)",
                  fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                  cursor: "pointer", letterSpacing: "0.04em",
                }}
              >
                {["↖", "↗", "↙", "↘"][v]}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );

  const renderMusicPanel = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Label>Slide Duration</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number" min={3} max={30} value={vision.slideDuration}
            onChange={(e) => save((v) => ({ ...v, slideDuration: Number(e.target.value) }))}
            style={{
              width: 52, padding: "5px 8px", borderRadius: 4,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(194,159,96,0.2)",
              color: "#DED3C8", fontSize: 13, textAlign: "center", outline: "none",
            }}
          />
          <span style={{ fontSize: 11, color: "rgba(222,211,200,0.5)", fontFamily: "Syne,system-ui,sans-serif" }}>seconds per slide</span>
        </div>
      </div>
      <div>
        <Label>Background Music</Label>
        {vision.musicDataUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
              borderRadius: 6, background: "rgba(194,159,96,0.08)", border: "1px solid rgba(194,159,96,0.22)",
            }}>
              <Music size={14} style={{ color: "#C29F60", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#C29F60", fontFamily: "Syne,system-ui,sans-serif", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {vision.musicName}
              </span>
            </div>
            <button onClick={() => save((v) => ({ ...v, musicDataUrl: undefined, musicName: undefined }))}
              style={{ padding: "10px", borderRadius: 6, border: "1px solid rgba(255,107,107,0.3)", background: "transparent", color: "rgba(255,107,107,0.7)", cursor: "pointer" }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => audioRef.current?.click()} style={{ ...secondaryBtnStyle, padding: "28px 0", flexDirection: "column", gap: 10 }}>
            <Music size={20} />
            <span style={{ fontSize: 12 }}>Add Background Music</span>
          </button>
        )}
      </div>
    </div>
  );

  // ─── UI sub-components (inline) ──────────────────────────────────────────
  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(194,159,96,0.6)", textTransform: "uppercase", marginBottom: 4 }}>
      {children}
    </div>
  );

  const ToggleBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} style={{
      flex: 1, padding: "6px 0", borderRadius: 4, border: active ? "1px solid rgba(194,159,96,0.45)" : "1px solid rgba(255,255,255,0.08)",
      background: active ? "rgba(194,159,96,0.14)" : "rgba(255,255,255,0.04)",
      color: active ? "#C29F60" : "rgba(222,211,200,0.5)", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </button>
  );

  const ColorSwatches = ({ colors, selected, onSelect }: { colors: string[]; selected: string; onSelect: (c: string) => void }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          title={c}
          style={{
            width: 18, height: 18, borderRadius: 3, background: c, cursor: "pointer",
            border: selected === c ? "2px solid #C29F60" : "1.5px solid rgba(255,255,255,0.12)",
            boxSizing: "border-box", flexShrink: 0,
          }}
        />
      ))}
    </div>
  );

  // ─── Style constants ──────────────────────────────────────────────────────
  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "6px 8px", borderRadius: 6,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(194,159,96,0.2)",
    color: "#DED3C8", fontSize: 12, fontFamily: "Syne,system-ui,sans-serif",
    cursor: "pointer", outline: "none",
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(194,159,96,0.15)",
    color: "#DED3C8", cursor: "pointer", fontSize: 16, fontWeight: 700,
  };

  const secondaryBtnStyle: React.CSSProperties = {
    width: "100%", padding: "7px 0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(194,159,96,0.15)",
    color: "rgba(222,211,200,0.7)", fontSize: 11, fontFamily: "Syne,system-ui,sans-serif",
    fontWeight: 600, cursor: "pointer", letterSpacing: "0.06em",
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isMobile) return <MobileVisionEditor />;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", margin: "-2rem -2rem -2rem",
      background: "#080f1e",
    }}>
      {/* ── Hidden inputs ── */}
      <input ref={bgImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBgImgUpload} />
      <input ref={elImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleElImgUpload} />
      <input ref={audioRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioUpload} />
      <input ref={pptxImportRef} type="file" accept=".pptx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePptxImport(f); }} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
        padding: isMobile ? "8px 12px" : "7px 14px",
        borderBottom: "1px solid rgba(194,159,96,0.12)",
        background: "linear-gradient(180deg, #09183d 0%, #080f1e 100%)",
        flexShrink: 0,
      }}>
        {!isMobile ? (
          <button
            onClick={() => setShowVisionList(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
              borderRadius: 6, border: "1px solid rgba(194,159,96,0.2)",
              background: "rgba(194,159,96,0.06)", color: "rgba(194,159,96,0.75)",
              fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
              letterSpacing: "0.08em", cursor: "pointer", flexShrink: 0,
              textTransform: "uppercase",
            }}
          >
            <Layers size={11} /> My Visions
          </button>
        ) : (
          <Sparkles size={16} color="#C29F60" style={{ flexShrink: 0 }} />
        )}
        <input
          value={vision.title}
          onChange={(e) => save((v) => ({ ...v, title: e.target.value }))}
          style={{
            background: "transparent", border: "none", outline: "none",
            color: "#DED3C8", fontSize: isMobile ? 13 : 14,
            fontFamily: '"Lora", Georgia, serif',
            fontWeight: 700, flex: 1, minWidth: 0,
          }}
        />
        {/* Undo / Redo */}
        {!isMobile && (
          <>
            <button onClick={undo} disabled={!canUndo} title="Undo (⌘Z)" style={{
              width: 30, height: 30, borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: canUndo ? "rgba(222,211,200,0.7)" : "rgba(222,211,200,0.2)",
              cursor: canUndo ? "pointer" : "default", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            }}>↩</button>
            <button onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)" style={{
              width: 30, height: 30, borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: canRedo ? "rgba(222,211,200,0.7)" : "rgba(222,211,200,0.2)",
              cursor: canRedo ? "pointer" : "default", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            }}>↪</button>
          </>
        )}
        {!isMobile && (
          <button
            onClick={() => setShowVisionTemplates(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)", color: "rgba(222,211,200,0.55)",
              fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
              letterSpacing: "0.08em", cursor: "pointer",
            }}
          >
            Templates
          </button>
        )}
        <button
          onClick={() => router.push("/vision/play")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: isMobile ? "8px 12px" : "6px 14px",
            borderRadius: 6, border: "1px solid rgba(194,159,96,0.3)",
            background: "rgba(194,159,96,0.1)", color: "#C29F60",
            fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
            letterSpacing: "0.08em", cursor: "pointer",
          }}
        >
          <Play size={12} fill="#C29F60" />
          {!isMobile && " Preview"}
        </button>
        {!isMobile && (
          <button
            onClick={exportVision}
            disabled={isExporting}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              borderRadius: 6, border: "1px solid rgba(29,116,88,0.35)",
              background: isExporting ? "rgba(29,116,88,0.2)" : "rgba(29,116,88,0.1)",
              color: "#1D7458",
              fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
              letterSpacing: "0.08em", cursor: isExporting ? "not-allowed" : "pointer",
              opacity: isExporting ? 0.8 : 1,
            }}
          >
            <Download size={12} />
            {isExporting ? `Exporting… ${exportProgress}%` : "Export MP4 Movie"}
          </button>
        )}
        <button
          onClick={handleSubmitForReview}
          disabled={isSubmitting}
          title="Submit this Vision for admin review"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: isMobile ? "8px 12px" : "6px 14px",
            borderRadius: 6,
            border: submitStatus === "success"
              ? "1px solid rgba(29,116,88,0.5)"
              : "1px solid rgba(194,159,96,0.35)",
            background: submitStatus === "success"
              ? "rgba(29,116,88,0.15)"
              : "rgba(194,159,96,0.08)",
            color: submitStatus === "success" ? "#1D7458" : "rgba(194,159,96,0.8)",
            fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
            letterSpacing: "0.08em",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
            transition: "all 0.3s",
          }}
        >
          {submitStatus === "success"
            ? <><CheckCircle size={12} />{!isMobile && " Submitted!"}</>
            : <><Send size={12} />{!isMobile && (isSubmitting ? " Submitting…" : " Submit for Review")}</>
          }
        </button>
        {submitStatus === "error" && (
          <span style={{
            fontSize: 11, color: "#ff6b6b",
            fontFamily: "Syne,system-ui,sans-serif",
            flexShrink: 0,
          }}>
            {submitMsg}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* ── Slide Strip ── */}
        <div style={{
          order: isMobile ? 3 : undefined,
          width: isMobile ? "100%" : 116,
          height: isMobile ? 82 : undefined,
          flexShrink: 0, display: "flex",
          flexDirection: isMobile ? "row" : "column",
          gap: isMobile ? 6 : 8,
          padding: isMobile ? "8px 8px" : "10px 8px",
          overflowY: isMobile ? "hidden" : "auto",
          overflowX: isMobile ? "auto" : "hidden",
          borderRight: isMobile ? "none" : "1px solid rgba(194,159,96,0.1)",
          borderTop: isMobile ? "1px solid rgba(194,159,96,0.1)" : "none",
          background: "rgba(4,13,28,0.6)",
        }}>
          {vision.slides.map((slide, idx) => (
            <div
              key={slide.id}
              draggable={!isMobile}
              onDragStart={(e) => {
                slideDragIdRef.current = slide.id;
                setDraggingSlideId(slide.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!slideDragIdRef.current || slideDragIdRef.current === slide.id) return;
                e.dataTransfer.dropEffect = "move";
                const rect = e.currentTarget.getBoundingClientRect();
                const mid = isMobile ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
                const after = isMobile ? e.clientX > mid : e.clientY > mid;
                setDragOverSlideId(after ? `after-${slide.id}` : `before-${slide.id}`);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSlideId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (slideDragIdRef.current) {
                  const after = dragOverSlideId?.startsWith("after-") ?? false;
                  reorderSlides(slideDragIdRef.current, slide.id, after);
                }
                slideDragIdRef.current = null;
                setDraggingSlideId(null);
                setDragOverSlideId(null);
              }}
              onDragEnd={() => {
                slideDragIdRef.current = null;
                setDraggingSlideId(null);
                setDragOverSlideId(null);
              }}
              style={{
                position: "relative", flexShrink: isMobile ? 0 : undefined,
                opacity: draggingSlideId === slide.id ? 0.3 : 1,
                transition: "opacity .15s",
                cursor: isMobile ? "default" : "grab",
                // Drop indicator lines
                borderTop: !isMobile && dragOverSlideId === `before-${slide.id}` ? "2px solid #C29F60" : "2px solid transparent",
                borderBottom: !isMobile && dragOverSlideId === `after-${slide.id}` ? "2px solid #C29F60" : "2px solid transparent",
                borderLeft: isMobile && dragOverSlideId === `before-${slide.id}` ? "2px solid #C29F60" : isMobile ? "2px solid transparent" : undefined,
                borderRight: isMobile && dragOverSlideId === `after-${slide.id}` ? "2px solid #C29F60" : isMobile ? "2px solid transparent" : undefined,
              }}
            >
              <div
                onClick={() => { setSelSlideId(slide.id); setSelElId(null); setEditingElId(null); setShowMobileProps(false); }}
                style={{
                  width: isMobile ? 100 : "100%", aspectRatio: "16/9", position: "relative",
                  borderRadius: 4, overflow: "hidden", cursor: "pointer",
                  border: slide.id === selSlideId ? "2px solid #C29F60" : "2px solid rgba(194,159,96,0.12)",
                }}
              >
                {/* Scaled thumbnail */}
                <div style={{ pointerEvents: "none" }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0,
                    width: VW, height: VH,
                    transformOrigin: "top left",
                    transform: `scale(${THUMB_SCALE})`,
                    overflow: "hidden",
                  }}>
                    {/* Bg */}
                    {slide.background.type === "image" && slide.background.imageDataUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${slide.background.imageDataUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${slide.background.overlayOpacity ?? 0.4})` }} />
                      </>
                    ) : (
                      <div style={{ position: "absolute", inset: 0, ...bgStyle(slide.background) }} />
                    )}
                    {/* Elements */}
                    {[...slide.elements].sort((a, b) => a.zIndex - b.zIndex).map((el) => (
                      <div key={el.id} style={{
                        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
                        zIndex: el.zIndex, opacity: el.opacity ?? 1,
                        borderRadius: el.clipShape === "circle" ? "50%" : 0,
                        overflow: el.clipShape ? "hidden" : undefined,
                        display: "flex", alignItems: "center",
                        justifyContent: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
                      }}>
                        {el.type === "text" && (
                          <span style={{
                            fontFamily: el.fontFamily, fontSize: el.fontSize,
                            fontWeight: el.fontWeight, fontStyle: el.fontStyle,
                            color: el.color, textAlign: el.textAlign,
                            textShadow: el.textShadow ? "0 2px 8px rgba(0,0,0,0.9)" : "none",
                            letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
                            lineHeight: el.lineHeight ?? 1.3,
                            textTransform: el.textTransform ?? "none",
                            whiteSpace: "pre-wrap", overflow: "hidden",
                            display: "block", width: "100%",
                          }}>{el.text}</span>
                        )}
                        {el.type === "image" && el.imageDataUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={el.imageDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: el.objectFit ?? "contain" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Slide number badge */}
                <span style={{
                  position: "absolute", bottom: 2, left: 3, fontSize: 7,
                  fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                  color: "rgba(255,255,255,0.45)", zIndex: 10, pointerEvents: "none",
                }}>{idx + 1}</span>
                {/* Statement source badge */}
                {slide.statementSource && (
                  <span title={slide.statementOverridden ? "Manually edited — out of sync" : "Synced from Statements"} style={{
                    position: "absolute", top: 2, right: 2, zIndex: 10, pointerEvents: "none",
                    width: 6, height: 6, borderRadius: "50%",
                    background: slide.statementOverridden ? "#f59e0b" : "#4ade80",
                    boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                  }} />
                )}
              </div>
              {/* Duplicate / delete row */}
              <div style={{ display: isMobile ? "none" : "flex", gap: 2, marginTop: 2 }}>
                <button onClick={() => duplicateSlide(slide.id)} title="Duplicate" style={{
                  flex: 1, padding: "2px 0", fontSize: 9, borderRadius: 3,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(222,211,200,0.45)", cursor: "pointer",
                }}>+copy</button>
                {vision.slides.length > 1 && (
                  <button onClick={() => deleteSlide(slide.id)} title="Delete" style={{
                    padding: "2px 4px", fontSize: 9, borderRadius: 3,
                    background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.12)",
                    color: "rgba(255,107,107,0.55)", cursor: "pointer",
                  }}><Trash2 size={8} /></button>
                )}
              </div>
            </div>
          ))}
          <div style={{ position: "relative", flexShrink: isMobile ? 0 : undefined }}>
            <button onClick={() => setShowSlideTemplates(!showSlideTemplates)} style={{
              width: isMobile ? 50 : "100%", aspectRatio: "16/9", borderRadius: 4,
              border: "1px dashed rgba(194,159,96,0.25)",
              background: "rgba(194,159,96,0.03)", color: "rgba(194,159,96,0.45)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 2,
            }}>
              <Plus size={12} />
              {!isMobile && <span style={{ fontSize: 7, fontFamily: "Syne,system-ui,sans-serif", letterSpacing: "0.08em" }}>ADD SLIDE</span>}
            </button>

            {/* Slide template picker */}
            {showSlideTemplates && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowSlideTemplates(false)} />
                <div style={{
                  position: "fixed",
                  bottom: isMobile ? 90 : 80,
                  left: isMobile ? "50%" : 120,
                  transform: isMobile ? "translateX(-50%)" : undefined,
                  width: 220, background: "linear-gradient(180deg, #0d2043, #08152e)",
                  border: "1px solid rgba(194,159,96,0.2)", borderRadius: 8,
                  padding: 8, zIndex: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}>
                  <div style={{ fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(194,159,96,0.6)", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
                    Choose a Slide Layout
                  </div>
                  {SLIDE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => addSlideFromTemplate(tmpl)}
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: 5,
                        background: "transparent",
                        border: "1px solid transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                        color: "#DED3C8", textAlign: "left", marginBottom: 2,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(194,159,96,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(194,159,96,0.15)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                    >
                      <span style={{ width: 28, height: 20, borderRadius: 3, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {tmpl.icon}
                      </span>
                      <div>
                        <div style={{ fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700 }}>{tmpl.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(222,211,200,0.45)", fontFamily: "Syne,system-ui,sans-serif" }}>{tmpl.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Canvas + stacked controls ── */}
        <div style={{
          order: isMobile ? 1 : undefined, flex: isMobile ? "none" : 1,
          display: "flex", flexDirection: "column", minWidth: 0,
          background: isMobile ? "transparent" : "rgba(0,0,0,0.3)",
        }}>
          {/* ── Upper section: toolbar + canvas ── */}
          <div style={{ flexShrink: 0, padding: isMobile ? "8px" : "10px 18px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={addTextEl} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
              borderRadius: 5, border: "1px solid rgba(194,159,96,0.2)",
              background: "rgba(194,159,96,0.07)", color: "#C29F60",
              fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
              letterSpacing: "0.08em", cursor: "pointer",
            }}>
              <Type size={12} /> {isMobile ? "Text" : "Add Text"}
            </button>
            <button onClick={addImgEl} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
              borderRadius: 5, border: "1px solid rgba(194,159,96,0.2)",
              background: "rgba(194,159,96,0.07)", color: "#C29F60",
              fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
              letterSpacing: "0.08em", cursor: "pointer",
            }}>
              <ImageIcon size={12} /> {isMobile ? "Image" : "Add Image"}
            </button>
            <button
              onClick={() => pptxImportRef.current?.click()}
              disabled={isImportingPptx}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                borderRadius: 5, border: "1px solid rgba(194,159,96,0.2)",
                background: "rgba(194,159,96,0.07)", color: isImportingPptx ? "rgba(194,159,96,0.4)" : "#C29F60",
                fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                letterSpacing: "0.08em", cursor: isImportingPptx ? "wait" : "pointer",
              }}
            >
              <FileInput size={12} /> {isMobile ? "PPTX" : isImportingPptx ? "Importing…" : "Import PPTX"}
            </button>
            {pptxImportError && (
              <span style={{ fontSize: 10, color: "rgba(255,107,107,0.8)", fontFamily: "Syne,system-ui,sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                <X size={10} onClick={() => setPptxImportError(null)} style={{ cursor: "pointer" }} />
                {pptxImportError}
              </span>
            )}
            {selElId && (
              <button onClick={() => { setSelElId(null); setEditingElId(null); }} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent", color: "rgba(222,211,200,0.4)",
                fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", cursor: "pointer",
              }}>
                <X size={11} /> {isMobile ? "" : "Deselect"}
              </button>
            )}
            {isMobile && (
              <>
                <button
                  onClick={() => setShowVisionTemplates(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                    borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: "rgba(222,211,200,0.55)",
                    fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <Sparkles size={12} /> Start
                </button>
                <button
                  onClick={() => setShowMobileProps(!showMobileProps)}
                  style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "5px 12px",
                    borderRadius: 5, border: `1px solid ${showMobileProps ? "rgba(194,159,96,0.4)" : "rgba(255,255,255,0.08)"}`,
                    background: showMobileProps ? "rgba(194,159,96,0.1)" : "transparent",
                    color: showMobileProps ? "#C29F60" : "rgba(222,211,200,0.55)",
                    fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <Layers size={12} /> Style
                </button>
              </>
            )}
            {!isMobile && selElId && (
              <div style={{ marginLeft: "auto" }} />
            )}
          </div>

          {/* Slide info bar */}
          {!isMobile && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 2px", flexShrink: 0,
            }}>
              <span style={{
                fontSize: 9, fontFamily: "Syne,system-ui,sans-serif",
                fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(194,159,96,0.5)",
              }}>
                Slide {vision.slides.findIndex((s) => s.id === selSlideId) + 1} of {vision.slides.length}
              </span>
              <span style={{
                fontSize: 9, fontFamily: "Syne,system-ui,sans-serif",
                color: "rgba(222,211,200,0.22)", letterSpacing: "0.06em",
              }}>
                {selElId ? "Element selected · double-click to edit" : "Double-click text · corner handles to resize"}
              </span>
            </div>
          )}

          {/* Contextual text toolbar — shown above canvas when a text element is selected */}
          {!isMobile && selElId && (() => {
            const tel = getEl(selElId);
            if (!tel || tel.type !== "text") return null;
            return (
              <div style={{
                display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                padding: "5px 8px", borderRadius: 6, flexShrink: 0,
                background: "rgba(4,13,28,0.7)",
                border: "1px solid rgba(194,159,96,0.18)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
              }}>
                {/* Font dropdown */}
                <select
                  value={tel.fontFamily ?? FONTS[0].value}
                  onChange={(e) => updateEl(tel.id, { fontFamily: e.target.value })}
                  style={{
                    height: 26, padding: "0 6px", borderRadius: 4,
                    border: "1px solid rgba(194,159,96,0.2)", background: "rgba(10,20,50,0.9)",
                    color: "#DED3C8", fontSize: 12, fontFamily: tel.fontFamily ?? FONTS[0].value,
                    cursor: "pointer", maxWidth: 140,
                  }}
                >
                  {FONTS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                {/* Font size */}
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <button onClick={() => { const i = FONT_SIZES.indexOf(tel.fontSize ?? 72); if (i > 0) updateEl(tel.id, { fontSize: FONT_SIZES[i-1] }); }}
                    style={{ width: 22, height: 26, borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#DED3C8", cursor: "pointer", fontSize: 14 }}>−</button>
                  <input type="number" value={tel.fontSize ?? 72} min={8} max={400}
                    onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 8 && v <= 400) updateEl(tel.id, { fontSize: v }); }}
                    style={{ width: 46, height: 26, textAlign: "center", fontSize: 12, color: "#DED3C8", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, MozAppearance: "textfield" } as React.CSSProperties} />
                  <button onClick={() => { const i = FONT_SIZES.indexOf(tel.fontSize ?? 72); if (i < FONT_SIZES.length-1) updateEl(tel.id, { fontSize: FONT_SIZES[i+1] }); }}
                    style={{ width: 22, height: 26, borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#DED3C8", cursor: "pointer", fontSize: 14 }}>+</button>
                </div>
                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                {/* Bold / Italic / Shadow */}
                {[
                  { title: "Bold", active: tel.fontWeight === "700", onClick: () => updateEl(tel.id, { fontWeight: tel.fontWeight === "700" ? "400" : "700" }), icon: <Bold size={12} /> },
                  { title: "Italic", active: tel.fontStyle === "italic", onClick: () => updateEl(tel.id, { fontStyle: tel.fontStyle === "italic" ? "normal" : "italic" }), icon: <Italic size={12} /> },
                  { title: "Shadow", active: !!tel.textShadow, onClick: () => updateEl(tel.id, { textShadow: !tel.textShadow }), icon: <span style={{ fontSize: 11, fontWeight: 700 }}>S</span> },
                ].map(({ title, active, onClick, icon }) => (
                  <button key={title} title={title} onClick={onClick} style={{
                    width: 26, height: 26, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    border: active ? "1px solid rgba(194,159,96,0.6)" : "1px solid rgba(255,255,255,0.1)",
                    background: active ? "rgba(194,159,96,0.15)" : "rgba(255,255,255,0.05)",
                    color: active ? "#C29F60" : "#DED3C8",
                  }}>{icon}</button>
                ))}
                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                {/* Alignment */}
                {(["left", "center", "right"] as const).map((a) => (
                  <button key={a} title={a} onClick={() => updateEl(tel.id, { textAlign: a })} style={{
                    width: 26, height: 26, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    border: (tel.textAlign ?? "center") === a ? "1px solid rgba(194,159,96,0.6)" : "1px solid rgba(255,255,255,0.1)",
                    background: (tel.textAlign ?? "center") === a ? "rgba(194,159,96,0.15)" : "rgba(255,255,255,0.05)",
                    color: (tel.textAlign ?? "center") === a ? "#C29F60" : "#DED3C8",
                  }}>
                    {a === "left" ? <AlignLeft size={12} /> : a === "center" ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                  </button>
                ))}
                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                {/* Transform */}
                {(["none", "uppercase", "lowercase"] as const).map((t) => (
                  <button key={t} title={t === "none" ? "Normal case" : t} onClick={() => updateEl(tel.id, { textTransform: t })} style={{
                    width: 26, height: 26, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    border: (tel.textTransform ?? "none") === t ? "1px solid rgba(194,159,96,0.6)" : "1px solid rgba(255,255,255,0.1)",
                    background: (tel.textTransform ?? "none") === t ? "rgba(194,159,96,0.15)" : "rgba(255,255,255,0.05)",
                    color: (tel.textTransform ?? "none") === t ? "#C29F60" : "#DED3C8",
                  }}><span style={{ fontSize: 9, fontWeight: 700 }}>{t === "none" ? "Aa" : t === "uppercase" ? "AA" : "aa"}</span></button>
                ))}
                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                {/* Color picker */}
                <label title="Color" style={{ cursor: "pointer", position: "relative", display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 4, background: tel.color ?? "#fff",
                    border: "2px solid rgba(194,159,96,0.35)",
                  }} />
                  <input type="color" value={tel.color ?? "#ffffff"} onChange={(e) => updateEl(tel.id, { color: e.target.value })}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                </label>
                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                {/* Layers */}
                {[
                  { title: "Bring Forward", onClick: bringForward, icon: <ChevronUp size={12} /> },
                  { title: "Send Back", onClick: sendBack, icon: <ChevronDown size={12} /> },
                  { title: "Bring to Front", onClick: bringToFront, icon: <span style={{ fontSize: 11 }}>↑↑</span> },
                  { title: "Send to Back", onClick: sendToBack, icon: <span style={{ fontSize: 11 }}>↓↓</span> },
                ].map(({ title, onClick, icon }) => (
                  <button key={title} title={title} onClick={onClick} style={{
                    width: 26, height: 26, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#DED3C8",
                  }}>{icon}</button>
                ))}
                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                {/* Duplicate + Delete */}
                <button title="Duplicate" onClick={duplicateElement} style={{ width: 26, height: 26, borderRadius: 4, border: "1px solid rgba(194,159,96,0.25)", background: "rgba(194,159,96,0.08)", color: "#C29F60", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⧉</button>
                <button title="Delete" onClick={deleteSelEl} style={{ width: 26, height: 26, borderRadius: 4, border: "1px solid rgba(255,107,107,0.25)", background: "rgba(255,107,107,0.07)", color: "#ff6b6b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
              </div>
            );
          })()}

          {/* Canvas — sized purely by aspect ratio, no flex growth */}
          <div
            ref={outerRef}
            style={{
              position: "relative",
              aspectRatio: "16/9",
              maxHeight: isMobile ? undefined : "calc(48vh)",
              alignSelf: "center",
              width: "100%",
              overflow: "hidden",
              borderRadius: isMobile ? 0 : 6,
              boxShadow: isMobile ? "none" : "0 0 0 1.5px rgba(194,159,96,0.28), 0 0 0 6px rgba(0,0,0,0.45), 0 24px 64px rgba(0,0,0,0.75)",
              userSelect: "none",
              cursor: "default",
            }}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onMouseLeave={onCanvasMouseUp}
            onTouchMove={onCanvasTouchMove}
            onTouchEnd={onCanvasTouchEnd}
          >
            {selSlide && (
              <div style={{
                position: "absolute", top: 0, left: 0,
                width: VW, height: VH,
                transformOrigin: "top left",
                transform: `scale(${scale})`,
                overflow: "hidden",
              }}>
                {/* Background */}
                {renderCanvasBg(selSlide.background)}

                {/* Click-catcher to deselect */}
                <div
                  style={{ position: "absolute", inset: 0, zIndex: 0 }}
                  onClick={() => { setSelElId(null); setEditingElId(null); }}
                />

                {/* Elements */}
                {[...selSlide.elements].sort((a, b) => a.zIndex - b.zIndex).map((el) => {
                  const isSelected = el.id === selElId;
                  const isEditing = el.id === editingElId;
                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => onElMouseDown(e, el.id)}
                      onTouchStart={(e) => onElTouchStart(e, el.id)}
                      onDoubleClick={() => el.type === "text" && setEditingElId(el.id)}
                      style={{
                        position: "absolute",
                        left: el.x, top: el.y, width: el.width, height: el.height,
                        zIndex: el.zIndex,
                        opacity: el.opacity ?? 1,
                        borderRadius: el.clipShape === "circle" ? "50%" : 0,
                        overflow: el.clipShape ? "hidden" : undefined,
                        cursor: isEditing ? "text" : "move",
                        outline: isSelected && el.clipShape !== "circle" ? `${Math.round(2 / scale)}px solid rgba(194,159,96,0.8)` : "none",
                        boxShadow: isSelected && el.clipShape === "circle" ? `0 0 0 ${Math.round(2 / scale)}px rgba(194,159,96,0.8)` : undefined,
                        outlineOffset: Math.round(1 / scale),
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Content */}
                      {el.type === "text" && (
                        isEditing ? (
                          <textarea
                            autoFocus
                            value={el.text ?? ""}
                            onChange={(e) => updateEl(el.id, { text: e.target.value })}
                            onBlur={() => setEditingElId(null)}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute", inset: 0, width: "100%", height: "100%",
                              background: "rgba(0,0,0,0.3)", border: "none", outline: "none",
                              resize: "none", padding: "8px",
                              fontFamily: el.fontFamily, fontSize: el.fontSize,
                              fontWeight: el.fontWeight, fontStyle: el.fontStyle,
                              color: el.color, textAlign: el.textAlign,
                              letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
                              lineHeight: el.lineHeight ?? 1.3,
                              textTransform: el.textTransform ?? "none",
                            }}
                          />
                        ) : (
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center",
                            justifyContent: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
                            pointerEvents: "none",
                          }}>
                            <span style={{
                              fontFamily: el.fontFamily, fontSize: el.fontSize,
                              fontWeight: el.fontWeight, fontStyle: el.fontStyle,
                              color: el.color ?? "#fff", textAlign: el.textAlign,
                              textShadow: el.textShadow ? "0 4px 24px rgba(0,0,0,0.95)" : "none",
                              letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
                              lineHeight: el.lineHeight ?? 1.3,
                              textTransform: el.textTransform ?? "none",
                              whiteSpace: "pre-wrap", wordBreak: "break-word",
                              overflow: "hidden", display: "block", width: "100%",
                            }}>{el.text}</span>
                          </div>
                        )
                      )}
                      {el.type === "image" && el.imageDataUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={el.imageDataUrl} alt="" style={{
                          width: "100%", height: "100%",
                          objectFit: el.objectFit ?? "contain",
                          pointerEvents: "none", display: "block",
                        }} />
                      )}

                      {/* Resize handles */}
                      {isSelected && !isEditing && (
                        <>
                          {(["nw", "ne", "se", "sw"] as Handle[]).map((h) => (
                            <div
                              key={h}
                              onMouseDown={(e) => onResizeDown(e, el.id, h)}
                              style={handlePos(h)}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          </div>{/* end upper section (toolbar + canvas) */}

          {/* ── Control tab bar (desktop only) ── */}
          {!isMobile && (
            <div style={{
              display: "flex", flexShrink: 0,
              borderTop: "1px solid rgba(194,159,96,0.1)",
              borderBottom: "1px solid rgba(0,0,0,0.35)",
              background: "rgba(4,13,28,0.55)",
              padding: "0 18px",
            }}>
              {([
                { id: "bg",     label: "Background" },
                { id: "style",  label: "Style" },
                { id: "music",  label: "Music" },
                { id: "photos", label: "Photos" },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setControlTab(id)}
                  style={{
                    padding: "9px 16px 8px",
                    background: "transparent", border: "none",
                    borderBottom: controlTab === id ? "2px solid rgba(194,159,96,0.65)" : "2px solid transparent",
                    cursor: "pointer",
                    fontFamily: "Syne,system-ui,sans-serif", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: controlTab === id ? "rgba(194,159,96,0.9)" : "rgba(222,211,200,0.3)",
                    transition: "color 0.15s, border-bottom-color 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Control panel content (desktop only) ── */}
          {!isMobile && (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px 18px" }}>
              {controlTab === "bg" && (
                <div style={{ maxWidth: 520 }}>
                  {renderBgProps()}
                </div>
              )}
              {controlTab === "style" && (
                selEl ? <div style={{ maxWidth: 520 }}>{renderElProps(selEl)}</div> : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(222,211,200,0.25)", fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", letterSpacing: "0.06em" }}>
                    Select an element on the canvas to edit its style
                  </div>
                )
              )}
              {controlTab === "music" && renderMusicPanel()}
              {controlTab === "photos" && (
                <div>

            {/* ── Photo Library ── */}
              {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 0 }}>
                    {(["jmc", "personal"] as const).map((tab) => (
                      <button key={tab} onClick={() => setPhotoLibTab(tab)} style={{
                        padding: "4px 14px 5px", background: "transparent", border: "none",
                        borderBottom: photoLibTab === tab ? "1px solid rgba(194,159,96,0.55)" : "1px solid transparent",
                        cursor: "pointer", fontFamily: "Syne,system-ui,sans-serif", fontSize: 9,
                        fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: photoLibTab === tab ? "rgba(194,159,96,0.9)" : "rgba(222,211,200,0.3)",
                        transition: "color 0.15s, border-bottom-color 0.15s",
                      }}>
                        {tab === "jmc" ? "Portal (300)" : "Personal"}
                      </button>
                    ))}
                  </div>
                  <label style={{ cursor: "pointer" }}>
                    <input ref={photoMultiRef} type="file" accept="image/*" multiple onChange={handleMultiPhotoUpload} style={{ display: "none" }} />
                    <button onClick={() => photoMultiRef.current?.click()} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 4, cursor: "pointer",
                      background: "rgba(194,159,96,0.08)", border: "1px solid rgba(194,159,96,0.2)",
                      color: "#C29F60", fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.08em",
                    }}>
                      <ImagePlus size={10} /> Upload
                    </button>
                  </label>
                </div>

                {/* Bucket sub-tabs (JMC only) */}
                {photoLibTab === "jmc" && (
                  <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                    {([
                      { id: "all" as const, label: "All", count: JMC_PHOTOS.length },
                      ...(Object.keys(PORTAL_PHOTO_BUCKETS) as PortalPhotoBucket[]).map((b) => ({
                        id: b as PortalPhotoBucket | "all",
                        label: BUCKET_LABELS[b],
                        count: PORTAL_PHOTO_BUCKETS[b].length,
                      })),
                    ]).map(({ id, label, count }) => (
                      <button key={id} onClick={() => setJmcBucket(id)} style={{
                        padding: "3px 12px 4px", borderRadius: 0, cursor: "pointer", fontSize: 8,
                        fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        background: "transparent", border: "none",
                        borderBottom: jmcBucket === id ? "1px solid rgba(194,159,96,0.55)" : "1px solid transparent",
                        color: jmcBucket === id ? "rgba(194,159,96,0.9)" : "rgba(222,211,200,0.28)",
                        transition: "color 0.15s, border-bottom-color 0.15s",
                      }}>
                        {label} ({count})
                      </button>
                    ))}
                  </div>
                )}

                {/* Personal empty state */}
                {photoLibTab === "personal" && photoLibrary.length === 0 && (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "rgba(222,211,200,0.28)", fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", lineHeight: 1.7 }}>
                    No personal photos yet.<br />Click Upload to add yours.
                  </div>
                )}

                {/* Photo grid — wider auto-fill columns now that we have full width */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                  {photoLibTab === "jmc"
                    ? (jmcBucket === "all" ? JMC_PHOTOS : JMC_PHOTOS.filter((p) => p.bucket === jmcBucket)).map((p) => (
                      <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 3, opacity: jmcLoadingId && jmcLoadingId !== p.id ? 0.45 : 1, transition: "opacity 0.2s" }}>
                        <button
                          onClick={() => applyJmcPhoto(p.id, p.url)}
                          title={`Set as background: ${p.label}`}
                          style={{
                            aspectRatio: "16/9", borderRadius: 5, overflow: "hidden",
                            border: "1px solid rgba(194,159,96,0.15)", cursor: jmcLoadingId === p.id ? "wait" : "pointer",
                            padding: 0, position: "relative", background: "#040d1c",
                            transition: "transform 0.15s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`${p.url}?w=200&q=60`} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", padding: "10px 5px 4px" }}>
                            <span style={{ fontSize: 7, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              {jmcLoadingId === p.id ? "Loading…" : p.label}
                            </span>
                          </div>
                        </button>
                        <div style={{ display: "flex", gap: 2 }}>
                          {(["circle", "square", "rectangle"] as const).map((shape) => (
                            <button key={shape} onClick={() => addJmcPhotoElement(p.id, p.url, shape)} title={`Add as ${shape}`} style={{
                              flex: 1, fontSize: 10, padding: "2px 0", borderRadius: 3,
                              background: "rgba(194,159,96,0.06)", border: "1px solid rgba(194,159,96,0.15)",
                              color: "rgba(194,159,96,0.65)", cursor: "pointer",
                            }}>
                              {shape === "circle" ? "○" : shape === "square" ? "■" : "▭"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                    : photoLibrary.map((p) => (
                      <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ position: "relative" }}>
                          <button onClick={() => applyPhotoBackground(p.dataUrl)} title={p.name} style={{
                            width: "100%", aspectRatio: "16/9", borderRadius: 5, overflow: "hidden",
                            border: "1px solid rgba(194,159,96,0.15)", cursor: "pointer", padding: 0,
                            transition: "transform 0.15s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.dataUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </button>
                          <button onClick={() => removePhoto(p.id)} title="Remove" style={{
                            position: "absolute", top: 3, right: 3, width: 16, height: 16,
                            borderRadius: "50%", background: "rgba(0,0,0,0.75)", border: "none",
                            cursor: "pointer", color: "rgba(255,255,255,0.7)",
                            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                          }}>
                            <X size={9} />
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 2 }}>
                          {(["circle", "square", "rectangle"] as const).map((shape) => (
                            <button key={shape} onClick={() => addPhotoElement(p.dataUrl, shape)} title={`Add as ${shape}`} style={{
                              flex: 1, fontSize: 10, padding: "2px 0", borderRadius: 3,
                              background: "rgba(194,159,96,0.06)", border: "1px solid rgba(194,159,96,0.15)",
                              color: "rgba(194,159,96,0.65)", cursor: "pointer",
                            }}>
                              {shape === "circle" ? "○" : shape === "square" ? "■" : "▭"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Properties Bottom Sheet ── */}
      {isMobile && showMobileProps && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 249, background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowMobileProps(false)}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 250,
            maxHeight: "60vh", overflowY: "auto",
            background: "linear-gradient(180deg, #0d2043 0%, #060e1e 100%)",
            borderTop: "1px solid rgba(194,159,96,0.2)",
            borderRadius: "16px 16px 0 0",
            padding: "12px 16px 24px",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          }}>
            {/* Drag handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(194,159,96,0.25)", margin: "0 auto 16px" }} />
            {renderProps()}
          </div>
        </>
      )}

      {/* ── Vision Templates Modal ── */}
      {showVisionTemplates && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 299 }}
            onClick={() => setShowVisionTemplates(false)}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(560px, 90vw)", maxHeight: "80vh",
            background: "linear-gradient(180deg, #0d2043, #06111f)",
            border: "1px solid rgba(194,159,96,0.22)",
            borderRadius: 12, padding: 24, zIndex: 300,
            overflowY: "auto",
            boxShadow: "0 20px 80px rgba(0,0,0,0.8)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontFamily: '"Lora", Georgia, serif', fontWeight: 700, color: "#DED3C8" }}>Vision Templates</div>
                <div style={{ fontSize: 11, color: "rgba(194,159,96,0.6)", fontFamily: "Syne,system-ui,sans-serif", marginTop: 2 }}>Start from a pre-built structure — then make it yours</div>
              </div>
              <button onClick={() => setShowVisionTemplates(false)} style={{ background: "none", border: "none", color: "rgba(222,211,200,0.4)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {VISION_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => loadVisionTemplate(tmpl)}
                  style={{
                    width: "100%", padding: "16px 20px", borderRadius: 8, textAlign: "left",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(194,159,96,0.12)",
                    cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(194,159,96,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(194,159,96,0.3)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(194,159,96,0.12)"; }}
                >
                  <span style={{ fontSize: 24, flexShrink: 0, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(194,159,96,0.08)", borderRadius: 8 }}>{tmpl.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontFamily: '"Lora", Georgia, serif', fontWeight: 700, color: "#DED3C8", marginBottom: 4 }}>{tmpl.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(222,211,200,0.5)", fontFamily: "Syne,system-ui,sans-serif" }}>{tmpl.desc}</div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => { loadVisionTemplate({ name: "My Vision", desc: "", icon: "", build: () => [makeSlide()] }); }}
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 8, textAlign: "left",
                  background: "transparent", border: "1px dashed rgba(255,255,255,0.1)",
                  cursor: "pointer", color: "rgba(222,211,200,0.45)",
                  fontFamily: "Syne,system-ui,sans-serif", fontSize: 12,
                }}
              >
                + Start completely blank
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── My Visions Modal ── */}
      {showVisionList && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(4,13,28,0.88)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            overflowY: "auto", padding: isMobile ? "20px 12px" : "60px 20px",
          }}
          onClick={() => setShowVisionList(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 700, borderRadius: 16,
              background: "linear-gradient(180deg, #0b1e45 0%, #040d1c 100%)",
              border: "1px solid rgba(194,159,96,0.15)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", padding: "18px 22px",
              borderBottom: "1px solid rgba(194,159,96,0.1)",
            }}>
              <Layers size={15} color="#C29F60" style={{ marginRight: 10, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 16, fontFamily: '"Lora", Georgia, serif', fontWeight: 700, color: "#DED3C8" }}>
                My Vision Videos
              </span>
              <button
                onClick={createNewVision}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  borderRadius: 8, border: "1px solid rgba(194,159,96,0.3)",
                  background: "rgba(194,159,96,0.1)", color: "#C29F60",
                  fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", marginRight: 12,
                }}
              >
                <Plus size={12} /> New Vision
              </button>
              <button onClick={() => setShowVisionList(false)} style={{ background: "none", border: "none", color: "rgba(222,211,200,0.4)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* Cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, padding: 18 }}>
              {[...visionList].sort((a, b) => b.updatedAt - a.updatedAt).map((meta) => {
                const isActive = meta.id === currentId;
                const previewBg = (() => {
                  try {
                    const s = localStorage.getItem(visionKey(meta.id));
                    if (s) {
                      const bg = (JSON.parse(s) as VisionVideo).slides[0]?.background;
                      if (bg?.type === "gradient" && bg.gradient)
                        return `linear-gradient(${bg.gradient.angle ?? 135}deg, ${bg.gradient.from}, ${bg.gradient.to})`;
                      if (bg?.type === "color") return bg.color ?? "#040d1c";
                      if (bg?.type === "image") return "linear-gradient(135deg, #1a3a6b, #040d1c)";
                    }
                  } catch {}
                  return "linear-gradient(135deg, #08254d, #040d1c)";
                })();
                const relTime = (() => {
                  const m = Math.floor((Date.now() - meta.updatedAt) / 60000);
                  if (m < 1) return "Just now";
                  if (m < 60) return `${m}m ago`;
                  const h = Math.floor(m / 60);
                  if (h < 24) return `${h}h ago`;
                  return `${Math.floor(h / 24)}d ago`;
                })();
                return (
                  <div
                    key={meta.id}
                    onClick={() => openVision(meta.id)}
                    style={{
                      borderRadius: 10, overflow: "hidden", cursor: "pointer",
                      border: isActive ? "2px solid #C29F60" : "2px solid rgba(255,255,255,0.06)",
                      transition: "border-color .2s",
                    }}
                  >
                    <div style={{ height: 90, background: previewBg, position: "relative" }}>
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 8, right: 8, padding: "3px 8px",
                          borderRadius: 4, background: "rgba(194,159,96,0.9)",
                          fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                          letterSpacing: "0.1em", color: "#040d1c", textTransform: "uppercase",
                        }}>Active</div>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)" }}>
                      <div style={{ fontSize: 13, fontFamily: '"Lora", Georgia, serif', fontWeight: 700, color: "#DED3C8", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {meta.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: "rgba(222,211,200,0.35)", fontFamily: "Syne,system-ui,sans-serif" }}>{relTime}</span>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); duplicateVision(meta.id); }}
                            title="Duplicate"
                            style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(222,211,200,0.45)", fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}
                          >Copy</button>
                          {visionList.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${meta.title}"?`)) deleteVision(meta.id); }}
                              title="Delete"
                              style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,107,107,0.2)", background: "transparent", color: "rgba(255,107,107,0.5)", fontSize: 9, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}
                            >Del</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
        padding: isMobile ? "6px 12px" : "8px 16px",
        borderTop: "1px solid rgba(194,159,96,0.1)",
        background: "rgba(4,13,28,0.6)", flexShrink: 0,
      }}>
        {vision.musicDataUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Music size={10} style={{ color: "#C29F60" }} />
            <span style={{ fontSize: 10, color: "#C29F60", fontFamily: "Syne,system-ui,sans-serif", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {vision.musicName}
            </span>
          </div>
        )}

        <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(29,116,88,0.5)", fontFamily: "Syne,system-ui,sans-serif" }}>
          {vision.slides.length} {isMobile ? "slides" : "slides · auto-saved"}
        </span>
      </div>
    </div>
  );
}
