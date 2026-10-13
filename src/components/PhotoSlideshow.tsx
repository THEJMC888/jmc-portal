"use client";
import { useState, useEffect } from "react";

const PHOTOS = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1500534314209-a157d0e67958?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1444927714506-2952ff8e7775?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1493246507009-87bde65b0a88?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1431440870543-8f69240d0b8e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1501179691627-eeaa65ea017c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1436891620584-47fd0e3e0448?auto=format&fit=crop&w=1920&q=80",
];

interface Props {
  interval?: number;
  transitionMs?: number;
}

export default function PhotoSlideshow({ interval = 7000, transitionMs = 2500 }: Props) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      const swap = window.setTimeout(() => {
        setIdx(i => (i + 1) % PHOTOS.length);
        setFading(false);
      }, transitionMs);
      return () => clearTimeout(swap);
    }, interval);
    return () => clearInterval(t);
  }, [interval, transitionMs]);

  const nextIdx = (idx + 1) % PHOTOS.length;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Base layer — current photo */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${PHOTOS[idx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Top layer — next photo fades in */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${PHOTOS[nextIdx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: fading ? 1 : 0,
          transition: fading ? `opacity ${transitionMs}ms ease-in-out` : "none",
        }}
      />
    </div>
  );
}
