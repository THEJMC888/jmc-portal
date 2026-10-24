"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

interface VideoPlayerPageProps {
  params: Promise<{ libraryId: string; videoId: string }>;
}

export default function BunnyVideoPlayerPage({ params }: VideoPlayerPageProps) {
  const { libraryId, videoId } = use(params);

  const embedUrl =
    `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}` +
    `?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="javascript:history.back()"
        onClick={(e) => { e.preventDefault(); history.back(); }}
        style={{ display: "inline-flex", alignItems: "center", gap: 8,
          textDecoration: "none", color: "rgba(222,211,200,0.5)" }}
      >
        <ArrowLeft size={14} />
        <span style={{ ...avenir, fontSize: "0.85rem" }}>Back</span>
      </Link>

      {/* Player */}
      <div style={{
        position: "relative", width: "100%", borderRadius: 16,
        overflow: "hidden", background: "#000",
        border: "1px solid rgba(255,255,255,0.07)",
        aspectRatio: "16 / 9",
      }}>
        <iframe
          src={embedUrl}
          title="Course Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      </div>
    </div>
  );
}
