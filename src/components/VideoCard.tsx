"use client";

import Link from "next/link";
import { Play, CheckCircle, Clock } from "lucide-react";
import { Video } from "@/types";
import { formatDuration, getProgressPercent } from "@/lib/mockData";

interface VideoCardProps {
  video: Video;
  showCategory?: boolean;
}

export default function VideoCard({ video, showCategory = true }: VideoCardProps) {
  const progress = getProgressPercent(video.id, video.duration);
  const isCompleted = progress === 100;
  const isInProgress = progress > 0 && progress < 100;

  return (
    <Link href={`/video/${video.id}`} className="group block">
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.065) 0%, rgba(6,18,55,0.22) 18%, rgba(3,8,26,0.34) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "1px solid rgba(255,255,255,0.18)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(0,0,0,0.4)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.45), 0 10px 32px rgba(0,0,0,0.4), 0 28px 72px rgba(0,0,0,0.28)",
          transition: "transform 0.28s cubic-bezier(0.23,1,0.32,1), box-shadow 0.28s cubic-bezier(0.23,1,0.32,1)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(-5px) scale(1.008)";
          el.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.15), 0 4px 14px rgba(0,0,0,0.55), 0 18px 52px rgba(0,0,0,0.5), 0 44px 96px rgba(0,0,0,0.35), 0 0 40px rgba(0,170,240,0.1)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(0) scale(1)";
          el.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.45), 0 10px 32px rgba(0,0,0,0.4), 0 28px 72px rgba(0,0,0,0.28)";
        }}
      >
        {/* Thumbnail */}
        <div
          className="relative aspect-video"
          style={{
            background: "linear-gradient(135deg, #08254D, #053372, #0B4B32)",
          }}
        >
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
              style={{
                background: "rgba(194,159,96,0.15)",
                border: "1px solid rgba(194,159,96,0.3)",
              }}
            >
              <Play className="w-5 h-5 ml-0.5" style={{ color: "#C29F60" }} />
            </div>
          </div>

          {/* Completed badge */}
          {isCompleted && (
            <div
              className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1"
              style={{
                background: "rgba(29,116,88,0.25)",
                border: "1px solid rgba(29,116,88,0.4)",
              }}
            >
              <CheckCircle className="w-3 h-3" style={{ color: "#1D7458" }} />
              <span style={{ fontSize: "0.65rem", color: "#1D7458", fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Done
              </span>
            </div>
          )}

          {/* Duration badge */}
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded px-2 py-0.5"
            style={{ background: "rgba(4,13,28,0.8)" }}
          >
            <Clock className="w-3 h-3" style={{ color: "rgba(222,211,200,0.5)" }} />
            <span style={{ fontSize: "0.7rem", color: "rgba(222,211,200,0.5)", fontFamily: "Avenir, Nunito, system-ui, sans-serif" }}>
              {formatDuration(video.duration)}
            </span>
          </div>

          {/* Progress bar */}
          {(isInProgress || isCompleted) && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "rgba(194,159,96,0.1)" }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: isCompleted ? "#1D7458" : "#C29F60",
                }}
              />
            </div>
          )}
        </div>

        {/* Info — fixed height keeps all cards uniform */}
        <div className="p-4 flex flex-col flex-1" style={{ minHeight: 118 }}>
          {showCategory && video.categoryName && (
            <p
              className="mb-1"
              style={{
                fontFamily: "Syne, system-ui, sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "0.6rem",
                color: "#C29F60",
              }}
            >
              {video.categoryName}
            </p>
          )}

          {/* H3 — Noto Serif Bold */}
          <h3
            className="mb-1 line-clamp-2 transition-colors"
            style={{
              fontFamily: '"Lora", Georgia, serif',
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "#DED3C8",
              lineHeight: 1.35,
            }}
          >
            {video.title}
          </h3>

          <p
            className="line-clamp-2"
            style={{
              fontFamily: "Avenir, Nunito, system-ui, sans-serif",
              fontSize: "0.78rem",
              color: "rgba(222,211,200,0.5)",
              lineHeight: 1.5,
            }}
          >
            {video.description}
          </p>

          {isInProgress && (
            <p
              className="mt-2"
              style={{
                fontFamily: "Syne, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "0.7rem",
                color: "rgba(194,159,96,0.7)",
              }}
            >
              {progress}% complete
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
