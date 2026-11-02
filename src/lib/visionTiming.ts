import type { VisionVideo, VisionSlide } from "@/types";

export const MIN_SLIDE_SECS = 2;
export const MAX_SLIDE_SECS = 60;
/** Cross-fade the player adds between slides (vision/play). */
export const FADE_SECS = 0.55;

export function clampSlideSecs(n: number): number {
  if (!Number.isFinite(n)) return MIN_SLIDE_SECS;
  // Tenths of a second, so an even split of a song can land exactly
  return Math.min(MAX_SLIDE_SECS, Math.max(MIN_SLIDE_SECS, Math.round(n * 10) / 10));
}

/** The vision's default seconds per slide. Older touch-editor visions stored milliseconds. */
export function defaultSlideSecs(v: Pick<VisionVideo, "slideDuration">): number {
  const d = v.slideDuration;
  if (!d || !Number.isFinite(d)) return 7;
  return clampSlideSecs(d > 120 ? d / 1000 : d);
}

/** Seconds this slide stays on screen: its own override, else the vision default. */
export function slideSecs(slide: Pick<VisionSlide, "duration">, v: Pick<VisionVideo, "slideDuration">): number {
  return slide.duration != null ? clampSlideSecs(slide.duration) : defaultSlideSecs(v);
}

/** Full playback length, including the fades between slides. */
export function totalSecs(v: VisionVideo): number {
  const fades = Math.max(0, v.slides.length - 1) * FADE_SECS;
  return v.slides.reduce((sum, s) => sum + slideSecs(s, v), 0) + fades;
}

/** 84 → "1:24" */
export function fmtRuntime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Set every slide to the same length: becomes the default and clears per-slide overrides. */
export function applyDurationToAll(v: VisionVideo, secs: number): VisionVideo {
  const d = clampSlideSecs(secs);
  return {
    ...v,
    slideDuration: d,
    slides: v.slides.map((s) => {
      if (s.duration == null) return s;
      const { duration: _drop, ...rest } = s;
      return rest;
    }),
  };
}

/** Set one slide's length. Matching the default clears the override. */
export function setSlideDuration(v: VisionVideo, slideId: string, secs: number | null): VisionVideo {
  const d = secs == null ? null : clampSlideSecs(secs);
  return {
    ...v,
    slides: v.slides.map((s) => {
      if (s.id !== slideId) return s;
      if (d == null || d === defaultSlideSecs(v)) {
        const { duration: _drop, ...rest } = s;
        return rest;
      }
      return { ...s, duration: d };
    }),
  };
}

/** Even per-slide length so the slideshow (fades included) ends with the music. */
export function evenSplitSecs(musicSecs: number, slideCount: number): { secs: number; capped: "min" | "max" | null } {
  const n = Math.max(1, slideCount);
  const raw = (musicSecs - (n - 1) * FADE_SECS) / n;
  const secs = clampSlideSecs(raw);
  return { secs, capped: raw < MIN_SLIDE_SECS ? "min" : raw > MAX_SLIDE_SECS ? "max" : null };
}

/** Reads an audio file's length in seconds, or null if the browser can't tell. */
export function loadAudioSecs(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) && a.duration > 0 ? a.duration : null);
    a.onerror = () => resolve(null);
    a.src = url;
  });
}
