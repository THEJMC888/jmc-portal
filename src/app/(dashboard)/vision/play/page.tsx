"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import type { VisionVideo, VisionSlide, SlideBackground, SlideElement } from "@/types";

const CURRENT_ID_KEY = "jmc_current_vision_id";
const visionKey = (id: string) => `jmc_vision_${id}`;
const LEGACY_KEY = "jmc_vision_v2";
const VW = 1600;
const VH = 900;
const KB_ANIM = ["kenBurns0", "kenBurns1", "kenBurns2", "kenBurns3"] as const;

// ─── Background renderer ────────────────────────────────────────────────────
function SlideBg({ bg, kbKey, dur }: { bg: SlideBackground; kbKey: number; dur: number }) {
  if (bg.type === "image" && bg.imageDataUrl) {
    return (
      <>
        <div
          key={`kb-${kbKey}`}
          className={KB_ANIM[kbKey % 4]}
          style={{
            position: "absolute", inset: "-12%",
            backgroundImage: `url(${bg.imageDataUrl})`,
            backgroundSize: "cover", backgroundPosition: "center",
            animationDuration: `${dur + 2}s`,
            animationTimingFunction: "ease-out",
            animationFillMode: "forwards",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: `rgba(0,0,0,${bg.overlayOpacity ?? 0.4})`,
        }} />
      </>
    );
  }
  if (bg.type === "gradient" && bg.gradient) {
    const { from, to, angle } = bg.gradient;
    return <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${angle}deg, ${from}, ${to})` }} />;
  }
  return <div style={{ position: "absolute", inset: 0, background: bg.color ?? "#040d1c" }} />;
}

// ─── Element renderer ───────────────────────────────────────────────────────
function SlideElements({ elements, animKey }: { elements: SlideElement[]; animKey: number }) {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  return (
    <>
      {sorted.map((el) => (
        <div
          key={el.id}
          style={{
            position: "absolute",
            left: el.x, top: el.y, width: el.width, height: el.height,
            zIndex: el.zIndex,
            display: "flex", alignItems: "center",
            justifyContent:
              el.textAlign === "left" ? "flex-start"
              : el.textAlign === "right" ? "flex-end"
              : "center",
          }}
        >
          {el.type === "text" && el.text && (
            <span
              key={`text-${animKey}`}
              style={{
                fontFamily: el.fontFamily ?? 'Georgia, serif',
                fontSize: el.fontSize ?? 64,
                fontWeight: el.fontWeight ?? "700",
                fontStyle: el.fontStyle ?? "normal",
                color: el.color ?? "#ffffff",
                textAlign: el.textAlign ?? "center",
                textShadow: el.textShadow
                  ? "0 4px 28px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.7)"
                  : "none",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflow: "hidden",
                display: "block",
                width: "100%",
                animation: "visionFadeUp 0.9s ease 0.3s both",
              }}
            >
              {el.text}
            </span>
          )}
          {el.type === "image" && el.imageDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={el.imageDataUrl}
              alt=""
              style={{
                width: "100%", height: "100%",
                objectFit: el.objectFit ?? "contain",
                display: "block",
              }}
            />
          )}
        </div>
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER
// ═══════════════════════════════════════════════════════════════════════════

export default function VisionPlayerPage() {
  const router = useRouter();
  const [vision, setVision] = useState<VisionVideo | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ended, setEnded] = useState(false);
  const [kbKey, setKbKey] = useState(0);
  const [stageScale, setStageScale] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctrlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the currently active vision (multi-vision system, with legacy fallback)
  useEffect(() => {
    try {
      const id = localStorage.getItem(CURRENT_ID_KEY);
      const key = id ? visionKey(id) : LEGACY_KEY;
      const s = localStorage.getItem(key);
      if (!s && id) {
        // Try legacy as last resort
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) setVision(JSON.parse(legacy));
      } else if (s) {
        setVision(JSON.parse(s));
      }
    } catch { /* noop */ }
  }, []);

  // Scale stage to viewport
  useEffect(() => {
    const update = () => setStageScale(Math.min(window.innerWidth / VW, window.innerHeight / VH));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Audio
  useEffect(() => {
    if (!vision?.musicDataUrl) return;
    const audio = new Audio(vision.musicDataUrl);
    audio.loop = true; audio.volume = 0.7;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, [vision?.musicDataUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // Goto slide
  const goToSlide = useCallback((idx: number) => {
    if (!vision || isTransitioning) return;
    clearTimeout(timerRef.current!);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIdx(idx);
      setKbKey((k) => k + 1);
      setIsTransitioning(false);
    }, 550);
  }, [vision, isTransitioning]);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || !vision || isTransitioning || ended) return;
    timerRef.current = setTimeout(() => {
      const next = currentIdx + 1;
      if (next >= vision.slides.length) {
        setIsPlaying(false); setEnded(true);
        audioRef.current?.pause();
        return;
      }
      setIsTransitioning(true);
      setTimeout(() => { setCurrentIdx(next); setKbKey((k) => k + 1); setIsTransitioning(false); }, 550);
    }, vision.slideDuration * 1000);
    return () => clearTimeout(timerRef.current!);
  }, [isPlaying, currentIdx, vision, isTransitioning, ended]);

  // Toggle play
  const togglePlay = useCallback(() => {
    setIsPlaying((p) => {
      const next = !p;
      if (next) { audioRef.current?.play().catch(() => {}); setEnded(false); }
      else { audioRef.current?.pause(); clearTimeout(timerRef.current!); }
      return next;
    });
  }, []);

  // Controls visibility
  const showCtrlsFor = useCallback(() => {
    setShowControls(true);
    clearTimeout(ctrlTimerRef.current!);
    ctrlTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    if (!isPlaying) { setShowControls(true); clearTimeout(ctrlTimerRef.current!); }
  }, [isPlaying]);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (!vision) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#040d1c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "Syne,system-ui,sans-serif", color: "rgba(222,211,200,0.35)", letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "0.75rem" }}>
          No vision found — go back and create one first
        </p>
      </div>
    );
  }

  const slide = vision.slides[currentIdx];
  if (!slide) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", overflow: "hidden", userSelect: "none" }}
      onMouseMove={isPlaying ? showCtrlsFor : undefined}
    >
      {/* ── Scaled stage ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "relative",
          width: VW, height: VH,
          transform: `scale(${stageScale})`,
          transformOrigin: "center center",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Slide content */}
          <div style={{ position: "absolute", inset: 0, opacity: isTransitioning ? 0 : 1, transition: "opacity 0.55s ease" }}>
            {/* Background */}
            <SlideBg bg={slide.background} kbKey={kbKey} dur={vision.slideDuration} />

            {/* Ambient teal glow */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(29,116,88,0.1), transparent 60%)", pointerEvents: "none" }} />

            {/* Elements */}
            <SlideElements elements={slide.elements} animKey={kbKey} />
          </div>
        </div>
      </div>

      {/* ── Centre play button ── */}
      {!isPlaying && !ended && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          <button
            onClick={togglePlay}
            style={{
              width: 84, height: 84, borderRadius: "50%",
              background: "rgba(194,159,96,0.14)", border: "2px solid rgba(194,159,96,0.45)",
              color: "#C29F60", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Play style={{ width: 30, height: 30, fill: "currentColor", marginLeft: 4 }} />
          </button>
        </div>
      )}

      {/* ── End screen ── */}
      {ended && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "rgba(4,13,28,0.88)", gap: 24, zIndex: 10,
        }}>
          <p style={{ fontFamily: '"Lora", Georgia, serif', fontWeight: 700, fontSize: "clamp(20px, 3vw, 44px)", color: "rgba(222,211,200,0.9)" }}>
            Your Vision Awaits
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => { setCurrentIdx(0); setKbKey((k) => k + 1); setEnded(false); setIsPlaying(false); if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.pause(); } }}
              style={{ padding: "11px 28px", borderRadius: 8, background: "rgba(194,159,96,0.1)", border: "1px solid rgba(194,159,96,0.3)", color: "#C29F60", fontFamily: "Syne,system-ui,sans-serif", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Watch Again
            </button>
            <button
              onClick={() => router.push("/vision")}
              style={{ padding: "11px 28px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(222,211,200,0.6)", fontFamily: "Syne,system-ui,sans-serif", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Edit Vision
            </button>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: showControls ? 1 : 0, transition: "opacity 0.4s ease",
        pointerEvents: showControls ? "auto" : "none", zIndex: 20,
      }}>
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)",
        }}>
          <p style={{ fontFamily: '"Lora", Georgia, serif', fontWeight: 600, fontSize: "clamp(12px, 1.5vw, 18px)", color: "rgba(255,255,255,0.72)", letterSpacing: "0.03em" }}>
            {vision.title}
          </p>
          <button
            onClick={() => router.push("/vision")}
            style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.55)", transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "16px 24px 28px",
          background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)",
        }}>
          {/* Progress dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 16 }}>
            {vision.slides.map((_, i) => (
              <button
                key={i}
                onClick={() => !isTransitioning && goToSlide(i)}
                style={{
                  width: i === currentIdx ? 26 : 6, height: 6, borderRadius: 3,
                  background: i === currentIdx ? "#C29F60" : "rgba(255,255,255,0.28)",
                  border: "none", cursor: "pointer", padding: 0, transition: "all 0.35s ease",
                }}
              />
            ))}
          </div>

          {/* Playback controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <button
              onClick={() => currentIdx > 0 && goToSlide(currentIdx - 1)}
              disabled={currentIdx === 0}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.75)", opacity: currentIdx === 0 ? 0.3 : 1 }}
            >
              <SkipBack style={{ width: 19, height: 19 }} />
            </button>

            <button
              onClick={togglePlay}
              style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(194,159,96,0.18)", border: "1.5px solid rgba(194,159,96,0.48)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#C29F60", transition: "transform 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isPlaying ? <Pause style={{ width: 18, height: 18 }} /> : <Play style={{ width: 18, height: 18, fill: "currentColor", marginLeft: 2 }} />}
            </button>

            <button
              onClick={() => currentIdx < vision.slides.length - 1 && goToSlide(currentIdx + 1)}
              disabled={currentIdx === vision.slides.length - 1}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.75)", opacity: currentIdx === vision.slides.length - 1 ? 0.3 : 1 }}
            >
              <SkipForward style={{ width: 19, height: 19 }} />
            </button>

            {vision.musicDataUrl && (
              <button
                onClick={() => setMuted((m) => !m)}
                style={{ width: 38, height: 38, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: muted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)" }}
              >
                {muted ? <VolumeX style={{ width: 18, height: 18 }} /> : <Volume2 style={{ width: 18, height: 18 }} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* JMC badge */}
      <div style={{ position: "absolute", bottom: 12, right: 16, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,159,96,0.18)", zIndex: 5 }}>
        The Journeymen Collective
      </div>
    </div>
  );
}
