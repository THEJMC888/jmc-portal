import type { VisionVideo, VisionSlide } from "@/types";

export const MIN_SLIDE_SECS = 2;
export const MAX_SLIDE_SECS = 60;

export function clampSlideSecs(n: number): number {
  if (!Number.isFinite(n)) return MIN_SLIDE_SECS;
  return Math.min(MAX_SLIDE_SECS, Math.max(MIN_SLIDE_SECS, Math.round(n)));
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

export function totalSecs(v: VisionVideo): number {
  return v.slides.reduce((sum, s) => sum + slideSecs(s, v), 0);
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
