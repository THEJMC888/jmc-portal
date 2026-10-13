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
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1444927714506-2952ff8e7775?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1493246507009-87bde65b0a88?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1426604522555-4ecca1920972?auto=format&fit=crop&w=1920&q=80",
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
