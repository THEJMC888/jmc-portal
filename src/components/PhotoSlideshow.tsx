"use client";
import { useState, useEffect } from "react";
import { MORNING_PHOTOS, AFTERNOON_PHOTOS, EVENING_PHOTOS, NIGHT_PHOTOS } from "@/lib/portalPhotos";

// Build high-res slideshow URLs from the shared portal photo library
const PARAMS = "?auto=format&fit=crop&w=1920&q=80";
const MORNING   = MORNING_PHOTOS.map((u) => `${u}${PARAMS}`);
const AFTERNOON = AFTERNOON_PHOTOS.map((u) => `${u}${PARAMS}`);
const EVENING   = EVENING_PHOTOS.map((u) => `${u}${PARAMS}`);
const NIGHT     = NIGHT_PHOTOS.map((u) => `${u}${PARAMS}`);

const BUCKETS = { morning: MORNING, afternoon: AFTERNOON, evening: EVENING, night: NIGHT } as const;
type Bucket = keyof typeof BUCKETS;

function getTimeBucket(): Bucket {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

interface Props {
  interval?: number;
  transitionMs?: number;
}

export default function PhotoSlideshow({ interval = 60000, transitionMs = 2500 }: Props) {
  const [photos] = useState<string[]>(() => BUCKETS[getTimeBucket()]);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      const swap = window.setTimeout(() => {
        setIdx(i => (i + 1) % photos.length);
        setFading(false);
      }, transitionMs);
      return () => clearTimeout(swap);
    }, interval);
    return () => clearInterval(t);
  }, [interval, transitionMs, photos]);

  const nextIdx = (idx + 1) % photos.length;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${photos[idx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${photos[nextIdx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: fading ? 1 : 0,
          transition: fading ? `opacity ${transitionMs}ms ease-in-out` : "none",
        }}
      />
    </div>
  );
}
