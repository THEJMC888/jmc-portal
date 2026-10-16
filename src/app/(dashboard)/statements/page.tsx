"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download, BookOpen, Check, Sparkles, RefreshCw, AlertTriangle, X, ChevronDown } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";

const STORAGE_KEY = "jmc_statements_v1";
const VISIONS_LIST_KEY = "jmc_visions_list";
const CURRENT_ID_KEY = "jmc_current_vision_id";
const visionKey = (id: string) => `jmc_vision_${id}`;
const uid = () => Math.random().toString(36).slice(2, 11);

interface CategoryStatement {
  being: string;
  doing: string;
  skipped?: boolean;
}

type StatementsData = Record<string, CategoryStatement>;
type SyncStatus = "synced" | "overridden" | "none";

const CATEGORIES = [
  {
    id: "self",
    label: "Self",
    subtitle: "Identity & Character",
    beingPrompt: "Who AM I at my core? What defines my character and values?",
    doingPrompt: "How do I show up in the world each day?",
    beingExample: "I AM grounded, purposeful, and deeply at peace with who I am. I move through the world with confidence, clarity, and unwavering integrity...",
    doingExample: "I invest in my growth daily through reflection, physical movement, and intentional learning. I protect my peace and choose my environment wisely...",
  },
  {
    id: "relationships",
    label: "Relationships",
    subtitle: "Connection & Love",
    beingPrompt: "Who AM I in my most important relationships?",
    doingPrompt: "How do I actively show up for the people I love?",
    beingExample: "I AM a loyal, present, and deeply caring partner and friend. I give generously of my time, attention, and heart...",
    doingExample: "I nurture my relationships through quality time, honest communication, and consistent acts of love and support...",
  },
  {
    id: "family",
    label: "Family",
    subtitle: "Legacy & Devotion",
    beingPrompt: "Who AM I as a family man? What do I stand for and model?",
    doingPrompt: "How do I invest in my family's wellbeing, security, and future?",
    beingExample: "I AM a devoted, protective, and present family man. My family is my foundation and my greatest pride...",
    doingExample: "I build lasting memories, provide unwavering strength and security, and show my family what a life fully lived looks like...",
  },
  {
    id: "finances",
    label: "Finances",
    subtitle: "Wealth & Stewardship",
    beingPrompt: "Who AM I as a steward of wealth? What is my money mindset?",
    doingPrompt: "How do I build, multiply, and protect my financial abundance?",
    beingExample: "I AM a wise and intentional steward of wealth. Money flows to me easily because I respect it, grow it, and use it with purpose...",
    doingExample: "I make intentional financial decisions, invest consistently, eliminate unnecessary expenses, and grow my net worth every month...",
  },
  {
    id: "financial-goals",
    label: "Financial Goals",
    subtitle: "Targets & Milestones",
    beingPrompt: "What specific financial future AM I committed to creating?",
    doingPrompt: "What concrete financial milestones am I actively achieving and by when?",
    beingExample: "I AM on a clear path to complete financial independence. Generational wealth is my birthright and my responsibility...",
    doingExample: "I am building $X in passive income by [year], eliminating all consumer debt by [date], and investing $X monthly toward my goals...",
  },
  {
    id: "career",
    label: "Career",
    subtitle: "Leadership & Excellence",
    beingPrompt: "Who AM I in my professional life? How do I lead and create?",
    doingPrompt: "How do I continuously grow and deliver extraordinary value in my work?",
    beingExample: "I AM a respected leader who brings vision, integrity, and relentless excellence to everything I touch. People trust and follow me...",
    doingExample: "I sharpen my skills relentlessly, build meaningful professional partnerships, and create exceptional results that speak for themselves...",
  },
  {
    id: "lifes-work",
    label: "Life's Work",
    subtitle: "Mission & Purpose",
    beingPrompt: "What is the deeper purpose I AM called to? What is my true mission?",
    doingPrompt: "How am I actively living out and building toward my life's highest calling?",
    beingExample: "I AM a man whose life's work transforms others and leaves behind a lasting, meaningful legacy. My purpose is bigger than me...",
    doingExample: "I build platforms, communities, and movements that serve my highest purpose. Every day I take one step closer to the mission I was born for...",
  },
  {
    id: "hobbies",
    label: "Hobbies & Passions",
    subtitle: "Joy & Fulfillment",
    beingPrompt: "Who AM I when I play, create, and explore what lights me up?",
    doingPrompt: "How do I actively protect and invest in what fills my soul?",
    beingExample: "I AM a man who deliberately makes time for joy, adventure, and the things that restore and inspire me. I play as hard as I work...",
    doingExample: "I regularly invest time in the hobbies and passions that energize me — [your passions]. These are not luxuries; they are essential...",
  },
  {
    id: "travel",
    label: "Travel & Adventure",
    subtitle: "Exploration & Experience",
    beingPrompt: "Who AM I as an explorer of the world, its people, and its places?",
    doingPrompt: "What adventures am I creating and what experiences am I collecting?",
    beingExample: "I AM a world traveler and seeker of extraordinary experiences. Every journey expands my mind, deepens my gratitude, and shapes who I become...",
    doingExample: "I visit [X] new countries per year, immerse myself in new cultures, and create unforgettable memories with the people I love...",
  },
  {
    id: "creation",
    label: "Things I'm Creating",
    subtitle: "Vision & Manifestation",
    beingPrompt: "What AM I bringing into existence? What am I here to manifest?",
    doingPrompt: "What am I actively building, creating, or launching right now?",
    beingExample: "I AM a creator who turns bold visions into tangible, meaningful reality. I build things that outlast me and impact others...",
    doingExample: "I am currently building [specific creation] and bringing [vision] to life. I take consistent creative action every single day...",
  },
  {
    id: "goals",
    label: "Goals",
    subtitle: "Commitment & Achievement",
    beingPrompt: "Who AM I as a man who sets and achieves his goals? What drives me?",
    doingPrompt: "What specific goals am I committed to achieving and by when?",
    beingExample: "I AM a man of clear intention and decisive action. I set bold goals, stay the course through obstacles, and celebrate every milestone...",
    doingExample: "I am committed to achieving [goal 1] by [date], [goal 2] by [date]. I take deliberate daily action and hold myself accountable...",
  },
];

// ─── Slide builder ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStatementSlide(cat: typeof CATEGORIES[0], being: string, doing: string): any {
  const beingElId = uid();
  const doingElId = uid();
  return {
    id: uid(),
    kenBurnsVariant: Math.floor(Math.random() * 4),
    statementSource: { categoryId: cat.id, beingElId, doingElId },
    statementOverridden: false,
    background: { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } },
    elements: [
      {
        id: uid(), type: "text",
        x: 100, y: 70, width: 1400, height: 90, zIndex: 1,
        text: `${cat.label.toUpperCase()}  ·  ${cat.subtitle.toUpperCase()}`,
        fontFamily: '"Syne", system-ui, sans-serif',
        fontSize: 26, fontWeight: "700",
        color: "rgba(194,159,96,0.7)", textAlign: "center", textShadow: false,
      },
      {
        id: beingElId, type: "text",
        x: 100, y: 210, width: 1400, height: 340, zIndex: 2,
        text: being || "I AM...",
        fontFamily: '"Lora", Georgia, serif',
        fontSize: 58, fontWeight: "600",
        color: "#ffffff", textAlign: "center", textShadow: true,
      },
      {
        id: doingElId, type: "text",
        x: 200, y: 610, width: 1200, height: 200, zIndex: 3,
        text: doing || "I am...",
        fontFamily: '"Lora", Georgia, serif',
        fontSize: 34, fontWeight: "400", fontStyle: "italic",
        color: "rgba(222,211,200,0.75)", textAlign: "center", textShadow: false,
      },
    ],
  };
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
function loadStatements(): StatementsData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persistStatements(data: StatementsData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readCurrentVision(): { id: string; vision: any } | null {
  try {
    const id = localStorage.getItem(CURRENT_ID_KEY);
    if (!id) return null;
    const raw = localStorage.getItem(visionKey(id));
    if (!raw) return null;
    return { id, vision: JSON.parse(raw) };
  } catch { return null; }
}

// ─── PDF builder ─────────────────────────────────────────────────────────────
function buildPrintHtml(statements: StatementsData): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const sectionsHtml = CATEGORIES.map((cat) => {
    const stmt = statements[cat.id] ?? { being: "", doing: "" };
    if (!stmt.being && !stmt.doing) return "";
    const escape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    return `
      <div class="cat-block">
        <div class="cat-head">
          <span class="cat-name">${cat.label}</span>
          <span class="cat-sub">${cat.subtitle}</span>
        </div>
        ${stmt.being ? `<div class="stmt-section"><div class="badge being-badge">Being</div><p class="stmt-text">${escape(stmt.being)}</p></div>` : ""}
        ${stmt.doing ? `<div class="stmt-section"><div class="badge doing-badge">Doing</div><p class="stmt-text">${escape(stmt.doing)}</p></div>` : ""}
      </div>`;
  }).join("");
  const hasContent = CATEGORIES.some((c) => statements[c.id]?.being || statements[c.id]?.doing);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>My I AM Statements — The Journeymen Collective™</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  @page{size:letter;margin:.65in .75in;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none!important;}.cat-block{page-break-inside:avoid;}}
  body{font-family:'Lora',Georgia,serif;background:#fff;color:#0d1f38;line-height:1.6;font-size:14px;}
  .cover{background:linear-gradient(145deg,#08254D 0%,#040d1c 100%);color:#fff;padding:52px 64px 44px;margin-bottom:44px;position:relative;}
  .cover::after{content:'';position:absolute;bottom:0;left:64px;right:64px;height:1.5px;background:linear-gradient(to right,#C29F60,rgba(194,159,96,.15),transparent);}
  .cover-eyebrow{font-family:'Syne',sans-serif;font-size:8.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#C29F60;margin-bottom:14px;}
  .cover-title{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;color:#fff;line-height:1.05;margin-bottom:6px;}
  .cover-tagline{font-family:'Lora',Georgia,serif;font-style:italic;font-size:14px;color:rgba(194,159,96,.75);margin-bottom:28px;}
  .cover-date{font-family:'Syne',sans-serif;font-size:9px;color:rgba(255,255,255,.3);letter-spacing:.12em;}
  .body{padding:0 64px;}
  .cat-block{margin-bottom:38px;padding-bottom:34px;border-bottom:1px solid rgba(13,31,56,.08);}
  .cat-block:last-child{border-bottom:none;}
  .cat-head{display:flex;align-items:baseline;gap:10px;margin-bottom:18px;padding-bottom:9px;border-bottom:1.5px solid #C29F60;}
  .cat-name{font-family:'Syne',sans-serif;font-size:13.5px;font-weight:700;color:#08254D;text-transform:uppercase;letter-spacing:.07em;}
  .cat-sub{font-family:'Syne',sans-serif;font-size:8px;font-weight:600;color:#C29F60;text-transform:uppercase;letter-spacing:.16em;}
  .stmt-section{margin-bottom:14px;}
  .stmt-section:last-child{margin-bottom:0;}
  .badge{display:inline-block;font-family:'Syne',sans-serif;font-size:7.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;padding:2px 8px;border-radius:3px;margin-bottom:7px;}
  .being-badge{background:rgba(194,159,96,.12);color:#7a5c25;}
  .doing-badge{background:rgba(8,37,77,.07);color:#08254D;}
  .stmt-text{font-family:'Lora',Georgia,serif;font-size:12.5px;line-height:1.8;color:#1a2e4a;padding-left:14px;border-left:2px solid rgba(194,159,96,.28);}
  .empty{text-align:center;padding:60px 0;font-family:'Syne',sans-serif;font-size:12px;color:rgba(8,37,77,.25);letter-spacing:.1em;}
  .footer{margin-top:44px;padding:20px 64px;border-top:1px solid rgba(8,37,77,.08);display:flex;justify-content:space-between;align-items:center;}
  .footer-brand{font-family:'Syne',sans-serif;font-size:7.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(8,37,77,.25);}
  .footer-date{font-family:'Syne',sans-serif;font-size:7.5px;color:rgba(8,37,77,.2);letter-spacing:.1em;}
  .print-btn-wrap{text-align:center;padding:32px 0 48px;}
  .print-btn{padding:13px 36px;background:#08254D;color:#C29F60;border:none;border-radius:6px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;}
</style></head><body>
<div class="cover">
  <div class="cover-eyebrow">The Journeymen Collective™</div>
  <div class="cover-title">My I AM Statements</div>
  <div class="cover-tagline">A Declaration of My Being &amp; Doing</div>
  <div class="cover-date">${today}</div>
</div>
<div class="body">${hasContent ? sectionsHtml : '<div class="empty">No statements written yet.</div>'}</div>
<div class="footer">
  <span class="footer-brand">The Journeymen Collective™ — My I AM Statements</span>
  <span class="footer-date">${today}</span>
</div>
<div class="no-print print-btn-wrap"><button class="print-btn" onclick="window.print()">Save as PDF / Print</button></div>
<script>setTimeout(()=>window.print(),1400);<\/script>
</body></html>`;
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

const BTN_SHADOW = [
  "inset 0 1px 0 rgba(240,220,170,0.4)",
  "inset 0 -2px 4px rgba(0,0,0,0.25)",
  "0 2px 0 rgba(20,12,0,0.85)","0 4px 0 rgba(20,12,0,0.65)",
  "0 6px 0 rgba(20,12,0,0.40)","0 8px 0 rgba(20,12,0,0.20)",
  "0 10px 20px rgba(0,0,0,0.60)","0 4px 30px rgba(194,159,96,0.25)",
].join(", ");

const glassPanel = {
  background: "linear-gradient(175deg, rgba(255,255,255,0.09) 0%, rgba(20,55,130,0.28) 20%, rgba(6,18,55,0.48) 50%, rgba(3,8,26,0.68) 100%)",
  backdropFilter: "blur(28px) saturate(200%)",
  WebkitBackdropFilter: "blur(28px) saturate(200%)",
  borderTop: "2px solid rgba(255,255,255,0.35)",
  borderLeft: "1px solid rgba(255,255,255,0.18)",
  borderRight: "1.5px solid rgba(194,159,96,0.15)",
  borderBottom: "1.5px solid rgba(140,145,155,0.5)",
  boxShadow: CARD_SHADOW,
} as React.CSSProperties;

const raisedGoldBtn = {
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
} as React.CSSProperties;

const raisedGoldBtnPrimary = {
  background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
  border: "none",
  color: "#08203A",
  boxShadow: BTN_SHADOW,
  cursor: "pointer",
  transition: "transform 0.1s ease, box-shadow 0.1s ease",
} as React.CSSProperties;

// ─── Component ────────────────────────────────────────────────────────────────
export default function StatementsPage() {
  const router = useRouter();
  const isMobile = useMobile();
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [statements, setStatements] = useState<StatementsData>({});
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [visionStatus, setVisionStatus] = useState<Record<string, SyncStatus>>({});
  const [currentVisionTitle, setCurrentVisionTitle] = useState<string | null>(null);
  const [updatedId, setUpdatedId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshVisionStatus = useCallback(() => {
    const result = readCurrentVision();
    if (!result) { setVisionStatus({}); setCurrentVisionTitle(null); return; }
    setCurrentVisionTitle(result.vision.title ?? "My Vision");
    const status: Record<string, SyncStatus> = {};
    CATEGORIES.forEach((cat) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slide = result.vision.slides?.find((s: any) => s.statementSource?.categoryId === cat.id);
      if (!slide) status[cat.id] = "none";
      else if (slide.statementOverridden) status[cat.id] = "overridden";
      else status[cat.id] = "synced";
    });
    setVisionStatus(status);
  }, []);

  useEffect(() => {
    setStatements(loadStatements());
    setMounted(true);
    refreshVisionStatus();
  }, [refreshVisionStatus]);

  const activeCategory = CATEGORIES.find((c) => c.id === activeId)!;
  const activeStatement: CategoryStatement = statements[activeId] ?? { being: "", doing: "" };

  const update = useCallback((field: "being" | "doing", value: string) => {
    setStatements((prev) => {
      const next = {
        ...prev,
        [activeId]: { ...(prev[activeId] ?? { being: "", doing: "" }), [field]: value, skipped: false },
      };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        persistStatements(next);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 400);
      return next;
    });
  }, [activeId]);

  const handleSkip = useCallback(() => {
    setStatements((prev) => {
      const next = { ...prev, [activeId]: { being: "", doing: "", skipped: true } };
      persistStatements(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      return next;
    });
  }, [activeId]);

  const handleUnskip = useCallback(() => {
    setStatements((prev) => {
      const next = { ...prev, [activeId]: { ...(prev[activeId] ?? { being: "", doing: "" }), skipped: false } };
      persistStatements(next);
      return next;
    });
  }, [activeId]);

  const submitToVision = (mode: "current" | "new") => {
    const completedCats = CATEGORIES.filter(
      (c) => statements[c.id]?.being || statements[c.id]?.doing
    );
    if (completedCats.length === 0) return;

    try {
      if (mode === "new") {
        const newId = uid();
        const newSlides = completedCats.map((cat) =>
          buildStatementSlide(cat, statements[cat.id]?.being ?? "", statements[cat.id]?.doing ?? "")
        );
        const newVision = {
          id: newId, title: "My Statements Vision",
          slides: newSlides, slideDuration: 7,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(visionKey(newId), JSON.stringify(newVision));
        const listRaw = localStorage.getItem(VISIONS_LIST_KEY);
        const list = listRaw ? JSON.parse(listRaw) : [];
        list.unshift({ id: newId, title: newVision.title, updatedAt: Date.now() });
        localStorage.setItem(VISIONS_LIST_KEY, JSON.stringify(list));
        localStorage.setItem(CURRENT_ID_KEY, newId);
      } else {
        const result = readCurrentVision();
        if (!result) { submitToVision("new"); return; }
        const vision = result.vision;
        const newSlides = completedCats.map((cat) =>
          buildStatementSlide(cat, statements[cat.id]?.being ?? "", statements[cat.id]?.doing ?? "")
        );
        const kept = (vision.slides ?? []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => !completedCats.some((c) => s.statementSource?.categoryId === c.id)
        );
        vision.slides = [...kept, ...newSlides];
        vision.updatedAt = new Date().toISOString();
        localStorage.setItem(visionKey(result.id), JSON.stringify(vision));
      }
    } catch (e) { console.error(e); }

    setShowVisionModal(false);
    refreshVisionStatus();
    router.push("/vision");
  };

  const updateCategorySlide = (categoryId: string) => {
    const result = readCurrentVision();
    if (!result) return;
    const vision = result.vision;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slideIdx = vision.slides?.findIndex((s: any) => s.statementSource?.categoryId === categoryId);
    if (slideIdx == null || slideIdx === -1) return;

    const slide = vision.slides[slideIdx];
    if (slide.statementOverridden) {
      const go = window.confirm("This slide was manually edited in the Vision Editor. Push your updated statement and reset it?");
      if (!go) return;
    }

    const stmt = statements[categoryId] ?? { being: "", doing: "" };
    const { beingElId, doingElId } = slide.statementSource;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slide.elements = slide.elements.map((e: any) => {
      if (e.id === beingElId) return { ...e, text: stmt.being || "I AM..." };
      if (e.id === doingElId) return { ...e, text: stmt.doing || "I am..." };
      return e;
    });
    slide.statementOverridden = false;
    vision.slides[slideIdx] = slide;
    vision.updatedAt = new Date().toISOString();
    localStorage.setItem(visionKey(result.id), JSON.stringify(vision));

    setUpdatedId(categoryId);
    setTimeout(() => setUpdatedId(null), 2500);
    refreshVisionStatus();
  };

  const exportPDF = () => {
    const win = window.open("", "_blank", "width=960,height=720");
    if (!win) { alert("Please allow pop-ups to export your PDF."); return; }
    win.document.write(buildPrintHtml(statements));
    win.document.close();
  };

  if (!mounted) return null;

  const filled = CATEGORIES.filter((c) => statements[c.id]?.being || statements[c.id]?.doing || statements[c.id]?.skipped).length;
  const anySlideExists = Object.values(visionStatus).some((s) => s !== "none");
  const activeStatus = visionStatus[activeId] ?? "none";

  return (
    <div style={{
      minHeight: "100vh",
      background: "transparent",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Vision modal ── */}
      {showVisionModal && (
        <>
          <div
            onClick={() => setShowVisionModal(false)}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            zIndex: 201, width: 400,
            ...glassPanel,
            borderRadius: 16,
            padding: "32px 30px 28px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 32px rgba(0,0,0,0.6), 0 32px 96px rgba(0,0,0,0.7), 0 0 80px rgba(0,100,200,0.08)",
          }}>
            {/* Inner top glow */}
            <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(to right, transparent, rgba(194,159,96,0.5), transparent)", borderRadius: "0 0 50% 50%" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={15} color="#C29F60" />
                <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: "#DED3C8" }}>
                  Add to Vision Video
                </span>
              </div>
              <button
                onClick={() => setShowVisionModal(false)}
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.1) 100%)",
                  borderTop: "1px solid rgba(255,255,255,0.15)",
                  borderLeft: "1px solid rgba(255,255,255,0.08)",
                  borderRight: "1px solid rgba(0,0,0,0.2)",
                  borderBottom: "1px solid rgba(0,0,0,0.3)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)",
                  borderRadius: 6, cursor: "pointer", color: "rgba(222,211,200,0.7)",
                  padding: "4px 6px", display: "flex", alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>
            <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(222,211,200,0.78)", marginBottom: 22, lineHeight: 1.6 }}>
              {filled} statement{filled !== 1 ? "s" : ""} ready — one slide per life area. Where should they go?
            </p>

            {currentVisionTitle && (
              <button
                onClick={() => submitToVision("current")}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "16px 18px", marginBottom: 10, borderRadius: 10,
                  background: "linear-gradient(180deg, rgba(194,159,96,0.16) 0%, rgba(194,159,96,0.06) 100%)",
                  borderTop: "1px solid rgba(194,159,96,0.4)",
                  borderLeft: "1px solid rgba(194,159,96,0.2)",
                  borderRight: "1px solid rgba(0,0,0,0.15)",
                  borderBottom: "1px solid rgba(0,0,0,0.35)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3), 0 6px 20px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                  transition: "transform 0.18s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 12, color: "#C29F60", marginBottom: 3 }}>
                  Add to current vision
                </div>
                <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 11, color: "rgba(222,211,200,0.78)" }}>
                  &ldquo;{currentVisionTitle}&rdquo; — existing statement slides will be replaced
                </div>
              </button>
            )}

            <button
              onClick={() => submitToVision("new")}
              style={{
                width: "100%", textAlign: "left",
                padding: "16px 18px", marginBottom: 22, borderRadius: 10,
                background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.14)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                borderRight: "1px solid rgba(0,0,0,0.12)",
                borderBottom: "1px solid rgba(0,0,0,0.32)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3)",
                cursor: "pointer",
                transition: "transform 0.18s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 12, color: "#DED3C8", marginBottom: 3 }}>
                Create new vision
              </div>
              <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 11, color: "rgba(222,211,200,0.72)" }}>
                &ldquo;My Statements Vision&rdquo; — a fresh video built from your statements
              </div>
            </button>

            <button
              onClick={() => setShowVisionModal(false)}
              style={{
                width: "100%", padding: "9px 0",
                background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.08) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                borderLeft: "1px solid rgba(255,255,255,0.05)",
                borderRight: "1px solid rgba(0,0,0,0.1)",
                borderBottom: "1px solid rgba(0,0,0,0.25)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                borderRadius: 8, cursor: "pointer",
                fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, color: "rgba(222,211,200,0.72)",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px",
        flexShrink: 0, zIndex: 10, flexWrap: "wrap", rowGap: 8,
        position: "relative",
        background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(4,10,32,0.3) 100%)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        borderTop: "none",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 24px rgba(0,0,0,0.4), 0 16px 48px rgba(0,0,0,0.25)",
      }}>
        {/* Top gold accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(194,159,96,0.4), rgba(194,159,96,0.6), rgba(194,159,96,0.4), transparent)" }} />

        <BookOpen size={16} color="#C29F60" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: "#DED3C8", letterSpacing: "0.04em" }}>
            My I AM Statements
          </div>
          <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 10, color: "rgba(194,159,96,0.9)" }}>
            {filled} of {CATEGORIES.length} categories written
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {saved && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 600,
            color: "#4ade80", letterSpacing: "0.1em",
            padding: "4px 10px", borderRadius: 4,
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.2)",
            boxShadow: "0 0 12px rgba(74,222,128,0.1)",
          }}>
            <Check size={11} /> Saved
          </div>
        )}

        {filled > 0 && (
          <button
            onClick={() => setShowVisionModal(true)}
            style={{
              ...raisedGoldBtn,
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 7,
              fontFamily: "Syne, system-ui, sans-serif",
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#C29F60",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.25)";
            }}
          >
            <Sparkles size={12} />
            {anySlideExists ? "Update Vision" : "Create Vision Video"}
          </button>
        )}

        <button
          onClick={exportPDF}
          style={{
            ...raisedGoldBtnPrimary,
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px", borderRadius: 7,
            fontFamily: "Syne, system-ui, sans-serif",
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#040d1c",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.3), 0 5px 16px rgba(0,0,0,0.6), 0 12px 36px rgba(194,159,96,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.25), 0 3px 10px rgba(0,0,0,0.5), 0 8px 24px rgba(194,159,96,0.25)";
          }}
        >
          <Download size={13} /> Export PDF
        </button>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "hidden" }}>

        {/* Mobile: category dropdown */}
        {isMobile && (
          <div style={{
            padding: "10px 16px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(3,8,26,0.2) 100%)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(194,159,96,0.12)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}>
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 8,
                ...raisedGoldBtn,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: !!(statements[activeId]?.being || statements[activeId]?.doing) ? "#C29F60" : "transparent",
                  border: `1.5px solid ${!!(statements[activeId]?.being || statements[activeId]?.doing) ? "#C29F60" : "rgba(194,159,96,0.4)"}`,
                  boxShadow: !!(statements[activeId]?.being || statements[activeId]?.doing) ? "0 0 6px rgba(194,159,96,0.5)" : "none",
                }} />
                <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: "#C29F60" }}>
                  {activeCategory.label}
                </span>
                <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.6)" }}>
                  {activeCategory.subtitle}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, color: "rgba(222,211,200,0.5)", letterSpacing: "0.1em" }}>
                  LIFE AREAS
                </span>
                <ChevronDown size={14} color="rgba(194,159,96,0.7)" style={{ transform: showMobileNav ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </div>
            </button>

            {showMobileNav && (
              <div style={{
                marginTop: 8, borderRadius: 10, overflow: "hidden", maxHeight: 340, overflowY: "auto",
                ...glassPanel,
              }}>
                {CATEGORIES.map((cat) => {
                  const isActive = cat.id === activeId;
                  const hasCont = !!(statements[cat.id]?.being || statements[cat.id]?.doing);
                  const status = visionStatus[cat.id] ?? "none";
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveId(cat.id); setShowMobileNav(false); }}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 14px", border: "none", cursor: "pointer",
                        background: isActive
                          ? "linear-gradient(135deg, rgba(194,159,96,0.14), rgba(194,159,96,0.06))"
                          : "transparent",
                        display: "flex", alignItems: "center", gap: 9,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        boxShadow: isActive ? "inset 0 1px 0 rgba(194,159,96,0.15), inset 0 -1px 0 rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                        background: hasCont ? "#C29F60" : "transparent",
                        border: `1.5px solid ${hasCont ? "#C29F60" : "rgba(194,159,96,0.3)"}`,
                        boxShadow: hasCont ? "0 0 6px rgba(194,159,96,0.5)" : "none",
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? "#C29F60" : "rgba(222,211,200,0.85)" }}>
                          {cat.label}
                        </div>
                        <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, color: "rgba(194,159,96,0.6)" }}>{cat.subtitle}</div>
                      </div>
                      {status === "synced" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0, boxShadow: "0 0 6px rgba(74,222,128,0.5)" }} />}
                      {status === "overridden" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0, boxShadow: "0 0 6px rgba(245,158,11,0.5)" }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Desktop: sidebar */}
        {!isMobile && (
          <nav style={{
            width: 210,
            overflowY: "auto",
            padding: "16px 10px",
            flexShrink: 0,
            position: "relative",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(3,8,26,0.18) 100%)",
            backdropFilter: "blur(16px) saturate(160%)",
            WebkitBackdropFilter: "blur(16px) saturate(160%)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.04), 4px 0 24px rgba(0,0,0,0.3)",
          }}>
            {/* Top inner highlight */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, rgba(194,159,96,0.3), rgba(255,255,255,0.08), transparent)" }} />

            <div style={{
              fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(194,159,96,0.7)", padding: "2px 12px 14px",
              borderBottom: "1px solid rgba(194,159,96,0.1)",
              marginBottom: 8,
            }}>
              Life Areas
            </div>

            {CATEGORIES.map((cat) => {
              const isActive = cat.id === activeId;
              const hasCont = !!(statements[cat.id]?.being || statements[cat.id]?.doing);
              const isSkipped = !!statements[cat.id]?.skipped;
              const status = visionStatus[cat.id] ?? "none";
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "9px 12px", borderRadius: 7,
                    marginBottom: 3,
                    display: "flex", alignItems: "center", gap: 9,
                    cursor: "pointer",
                    transition: "all 0.18s cubic-bezier(0.23,1,0.32,1)",
                    ...(isActive ? {
                      background: "linear-gradient(135deg, rgba(194,159,96,0.16) 0%, rgba(194,159,96,0.06) 100%)",
                      borderTop: "1px solid rgba(194,159,96,0.35)",
                      borderLeft: "1px solid rgba(194,159,96,0.18)",
                      borderRight: "1px solid rgba(0,0,0,0.15)",
                      borderBottom: "1px solid rgba(0,0,0,0.3)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.3), 0 0 16px rgba(194,159,96,0.08)",
                      transform: "translateX(2px)",
                    } : {
                      background: "transparent",
                      border: "1px solid transparent",
                      boxShadow: "none",
                      transform: "translateX(0)",
                    }),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)";
                      el.style.borderColor = "rgba(255,255,255,0.06)";
                      el.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "transparent";
                      el.style.borderColor = "transparent";
                      el.style.boxShadow = "none";
                    }
                  }}
                >
                  {isSkipped ? (
                    <div style={{
                      width: 14, height: 2, borderRadius: 1, flexShrink: 0,
                      background: "rgba(194,159,96,0.35)",
                      boxShadow: "0 0 4px rgba(194,159,96,0.2)",
                      transition: "all 0.2s",
                    }} />
                  ) : (
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                    background: hasCont ? "#C29F60" : "transparent",
                    border: `1.5px solid ${hasCont ? "#C29F60" : "rgba(194,159,96,0.3)"}`,
                    boxShadow: hasCont ? "0 0 8px rgba(194,159,96,0.5), 0 0 16px rgba(194,159,96,0.2)" : "none",
                    transition: "all 0.2s",
                  }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "Syne, system-ui, sans-serif", fontSize: 12,
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? "#C29F60" : "rgba(222,211,200,0.85)",
                      lineHeight: 1.25,
                    }}>
                      {cat.label}
                    </div>
                    <div style={{
                      fontFamily: "Syne, system-ui, sans-serif", fontSize: 9,
                      color: isActive ? "rgba(194,159,96,0.9)" : "rgba(194,159,96,0.55)",
                      letterSpacing: "0.04em", marginTop: 1,
                    }}>
                      {cat.subtitle}
                    </div>
                  </div>
                  {status === "synced" && (
                    <div title="Slide synced" style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#4ade80", flexShrink: 0,
                      boxShadow: "0 0 6px rgba(74,222,128,0.6)",
                    }} />
                  )}
                  {status === "overridden" && (
                    <div title="Slide manually edited" style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#f59e0b", flexShrink: 0,
                      boxShadow: "0 0 6px rgba(245,158,11,0.6)",
                    }} />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Main editor */}
        <main style={{
          flex: 1, overflowY: "auto",
          padding: isMobile ? "24px 16px" : "44px 52px",
          maxWidth: isMobile ? "100%" : 820,
        }}>
          {/* ── Category header panel ── */}
          <div style={{
            ...glassPanel,
            borderRadius: 14,
            padding: "28px 32px",
            marginBottom: 32,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Decorative top shimmer */}
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(to right, transparent, rgba(194,159,96,0.5), transparent)" }} />
            {/* Soft gold corner accent */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(194,159,96,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{
              fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "#C29F60", marginBottom: 10,
            }}>
              {activeCategory.subtitle}
            </div>
            <h1 style={{
              fontFamily: "Lora, Georgia, serif", fontSize: 34, fontWeight: 600,
              color: "#DED3C8", lineHeight: 1.1, marginBottom: 12,
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}>
              {activeCategory.label}
            </h1>
            <p style={{
              fontFamily: "Lora, Georgia, serif", fontStyle: "italic",
              fontSize: 14, color: "rgba(222,211,200,0.82)", lineHeight: 1.65,
            }}>
              Write your I AM declarations — who you are being and what you are doing in this area of your life.
            </p>
          </div>

          {/* BEING */}
          <StatementField
            badge="Being"
            badgeStyle={{ background: "rgba(194,159,96,0.12)", color: "#C29F60" }}
            prompt={activeCategory.beingPrompt}
            example={activeCategory.beingExample}
            value={activeStatement.being}
            onChange={(v) => update("being", v)}
            placeholder="I AM..."
            accentColor="#C29F60"
          />

          {/* Divider */}
          <div style={{ height: 1, margin: "36px 0", background: "linear-gradient(to right, rgba(194,159,96,0.25), rgba(194,159,96,0.08), transparent)", boxShadow: "0 1px 0 rgba(0,0,0,0.2)" }} />

          {/* DOING */}
          <StatementField
            badge="Doing"
            badgeStyle={{ background: "rgba(255,255,255,0.05)", color: "rgba(222,211,200,0.82)" }}
            prompt={activeCategory.doingPrompt}
            example={activeCategory.doingExample}
            value={activeStatement.doing}
            onChange={(v) => update("doing", v)}
            placeholder="I am..."
            accentColor="rgba(194,159,96,0.7)"
          />

          {/* ── Skip / Unskip ── */}
          <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
            {activeStatement.skipped ? (
              <>
                <span style={{
                  fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "rgba(194,159,96,0.5)",
                  padding: "5px 12px", borderRadius: 5,
                  background: "linear-gradient(180deg, rgba(194,159,96,0.1) 0%, rgba(194,159,96,0.04) 100%)",
                  borderTop: "1px solid rgba(194,159,96,0.28)",
                  borderLeft: "1px solid rgba(194,159,96,0.14)",
                  borderRight: "1px solid rgba(0,0,0,0.12)",
                  borderBottom: "1px solid rgba(0,0,0,0.22)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.2)",
                }}>
                  Section Skipped
                </span>
                <button
                  onClick={handleUnskip}
                  style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "5px 14px", borderRadius: 5, cursor: "pointer",
                    fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "rgba(222,211,200,0.72)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                    borderTop: "1px solid rgba(255,255,255,0.15)",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                    borderRight: "1px solid rgba(0,0,0,0.14)",
                    borderBottom: "1px solid rgba(0,0,0,0.28)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.3)",
                    transition: "transform 0.12s, box-shadow 0.12s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  Undo skip
                </button>
              </>
            ) : (
              <button
                onClick={handleSkip}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "5px 16px", borderRadius: 5, cursor: "pointer",
                  fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.16em", textTransform: "uppercase",
                  color: "rgba(222,211,200,0.55)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)",
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                  borderLeft: "1px solid rgba(255,255,255,0.07)",
                  borderRight: "1px solid rgba(0,0,0,0.14)",
                  borderBottom: "1px solid rgba(0,0,0,0.28)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.1), 0 2px 0 rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.25)",
                  transition: "transform 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(222,211,200,0.82)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(222,211,200,0.55)";
                }}
              >
                Skip this section →
              </button>
            )}
          </div>

          {/* ── Slide sync status ── */}
          {activeStatus !== "none" && (
            <div style={{
              marginTop: 32,
              padding: "16px 18px",
              borderRadius: 10,
              background: activeStatus === "overridden"
                ? "linear-gradient(180deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.04) 100%)"
                : "linear-gradient(180deg, rgba(74,222,128,0.08) 0%, rgba(74,222,128,0.03) 100%)",
              borderTop: `1px solid ${activeStatus === "overridden" ? "rgba(245,158,11,0.4)" : "rgba(74,222,128,0.35)"}`,
              borderLeft: `1px solid ${activeStatus === "overridden" ? "rgba(245,158,11,0.2)" : "rgba(74,222,128,0.18)"}`,
              borderRight: "1px solid rgba(0,0,0,0.12)",
              borderBottom: "1px solid rgba(0,0,0,0.28)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3), 0 0 24px ${activeStatus === "overridden" ? "rgba(245,158,11,0.06)" : "rgba(74,222,128,0.06)"}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              {activeStatus === "overridden" ? (
                <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, filter: "drop-shadow(0 0 4px rgba(245,158,11,0.4))" }} />
              ) : (
                <Check size={14} color="#4ade80" style={{ flexShrink: 0, filter: "drop-shadow(0 0 4px rgba(74,222,128,0.4))" }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 11, color: activeStatus === "overridden" ? "#f59e0b" : "#4ade80", letterSpacing: "0.06em", marginBottom: 2 }}>
                  {activeStatus === "overridden" ? "Slide manually edited" : "Slide synced"}
                </div>
                <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 11, color: "rgba(222,211,200,0.42)" }}>
                  {activeStatus === "overridden"
                    ? "This slide was edited in the Vision Editor. Push your updated statement to override."
                    : "This statement is live in your Vision Video."}
                </div>
              </div>
              <button
                onClick={() => updateCategorySlide(activeId)}
                style={{
                  ...raisedGoldBtn,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 6,
                  fontFamily: "Syne, system-ui, sans-serif",
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: updatedId === activeId ? "#4ade80" : "#C29F60",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                {updatedId === activeId ? (
                  <><Check size={10} /> Updated</>
                ) : (
                  <><RefreshCw size={10} /> Update Slide</>
                )}
              </button>
            </div>
          )}

          {/* Progress summary */}
          {filled > 0 && (
            <div style={{
              marginTop: 32,
              padding: "18px 22px",
              borderRadius: 12,
              ...glassPanel,
              background: "linear-gradient(180deg, rgba(194,159,96,0.07) 0%, rgba(194,159,96,0.02) 50%, rgba(3,8,26,0.2) 100%)",
              borderTop: "1px solid rgba(194,159,96,0.28)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(to right, transparent, rgba(194,159,96,0.4), transparent)" }} />
              <div>
                <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, fontWeight: 700, color: "#C29F60", letterSpacing: "0.08em", marginBottom: 3 }}>
                  {filled} of {CATEGORIES.length} areas complete
                </div>
                <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 11, color: "rgba(222,211,200,0.72)" }}>
                  {anySlideExists
                    ? `Synced to "${currentVisionTitle ?? "your vision"}"`
                    : "Ready to send to your Vision Video."}
                </div>
              </div>
              <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
                <button
                  onClick={() => setShowVisionModal(true)}
                  style={{
                    ...raisedGoldBtn,
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 14px", borderRadius: 6,
                    fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", color: "#C29F60",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <Sparkles size={10} /> {anySlideExists ? "Update Vision" : "Vision Video"}
                </button>
                <button
                  onClick={exportPDF}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 14px", borderRadius: 6,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.08) 100%)",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    borderLeft: "1px solid rgba(255,255,255,0.05)",
                    borderRight: "1px solid rgba(0,0,0,0.12)",
                    borderBottom: "1px solid rgba(0,0,0,0.28)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(194,159,96,0.6)",
                    transition: "transform 0.18s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <Download size={10} /> PDF
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

interface StatementFieldProps {
  badge: string;
  badgeStyle: React.CSSProperties;
  prompt: string;
  example: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accentColor: string;
}

function StatementField({ badge, badgeStyle, prompt, example, value, onChange, placeholder, accentColor }: StatementFieldProps) {
  const [showExample, setShowExample] = useState(false);
  const [focused, setFocused] = useState(false);

  const isBeing = badge === "Being";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {/* 3D raised badge */}
        <span style={{
          display: "inline-block",
          padding: "5px 14px",
          borderRadius: 5,
          fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          flexShrink: 0, marginTop: 2,
          // Raised glass embossment
          background: isBeing
            ? "linear-gradient(180deg, rgba(194,159,96,0.22) 0%, rgba(194,159,96,0.08) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          borderTop: isBeing ? "1px solid rgba(194,159,96,0.5)" : "1px solid rgba(255,255,255,0.16)",
          borderLeft: isBeing ? "1px solid rgba(194,159,96,0.28)" : "1px solid rgba(255,255,255,0.1)",
          borderRight: isBeing ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.1)",
          borderBottom: isBeing ? "1px solid rgba(0,0,0,0.32)" : "1px solid rgba(0,0,0,0.28)",
          boxShadow: isBeing
            ? "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.35), 0 0 12px rgba(194,159,96,0.08)"
            : "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.3)",
          color: badgeStyle.color,
        }}>
          {badge}
        </span>
        <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 14, color: "rgba(222,211,200,0.85)", lineHeight: 1.55 }}>
          {prompt}
        </span>
      </div>

      {/* Textarea — clearly distinct from background, glass panel with visible frame */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          display: "block",
          // Noticeably lighter than the page — glass white tint so the box clearly reads as a panel
          background: focused
            ? "linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(30,60,140,0.22) 100%)"
            : "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(20,48,120,0.18) 100%)",
          backdropFilter: "blur(18px) saturate(180%)",
          WebkitBackdropFilter: "blur(18px) saturate(180%)",
          // Always-visible gold border frames the box even when unfocused
          border: focused
            ? `1.5px solid ${accentColor}`
            : "1.5px solid rgba(194,159,96,0.28)",
          // Depth: inset top shadow (sunken), outer glow on focus
          boxShadow: focused
            ? `inset 0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 3px ${accentColor}20, 0 0 28px ${accentColor}18, 0 4px 20px rgba(0,0,0,0.25)`
            : "inset 0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.22), 0 0 0 1px rgba(194,159,96,0.08)",
          borderRadius: 10,
          padding: "20px 22px",
          color: "#EDE5DC",
          fontFamily: "Lora, Georgia, serif", fontWeight: 500,
          fontSize: 16, lineHeight: 1.85,
          resize: "vertical", outline: "none",
          minHeight: 148,
          WebkitFontSmoothing: "antialiased",
          transition: "box-shadow 0.25s, border-color 0.25s, background 0.25s",
        }}
      />

      {/* See an example */}
      <button
        onClick={() => setShowExample((s) => !s)}
        style={{
          marginTop: 9,
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "Syne, system-ui, sans-serif", fontSize: 10,
          color: "rgba(194,159,96,0.75)", letterSpacing: "0.07em", padding: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#C29F60"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(194,159,96,0.75)"; }}
      >
        {showExample ? "▲ Hide example" : "▼ See an example"}
      </button>

      {showExample && (
        <div style={{
          marginTop: 10,
          padding: "16px 20px",
          borderRadius: 8,
          background: "linear-gradient(180deg, rgba(194,159,96,0.07) 0%, rgba(194,159,96,0.02) 100%)",
          borderTop: "1px solid rgba(194,159,96,0.25)",
          borderLeft: "3px solid rgba(194,159,96,0.45)",
          borderRight: "1px solid rgba(0,0,0,0.15)",
          borderBottom: "1px solid rgba(0,0,0,0.3)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.25)",
          fontFamily: "Lora, Georgia, serif", fontStyle: "italic",
          fontSize: 13.5, color: "rgba(222,211,200,0.82)", lineHeight: 1.75,
        }}>
          {example}
        </div>
      )}
    </div>
  );
}
