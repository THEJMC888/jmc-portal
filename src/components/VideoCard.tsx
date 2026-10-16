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
          background: "linear-gradient(175deg, rgba(255,255,255,0.09) 0%, rgba(20,55,130,0.28) 20%, rgba(6,18,55,0.48) 50%, rgba(3,8,26,0.68) 100%)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          borderTop: "2px solid rgba(255,255,255,0.35)",
          borderLeft: "1px solid rgba(255,255,255,0.18)",
          borderRight: "1.5px solid rgba(194,159,96,0.15)",
          borderBottom: "1.5px solid rgba(140,145,155,0.5)",
          boxShadow: [
            "inset 0 3px 0 rgba(255,255,255,0.22)",
            "inset 0 1px 0 rgba(255,255,255,0.38)",
            "inset 2px 0 0 rgba(255,255,255,0.06)",
            "inset 0 -3px 8px rgba(0,0,0,0.55)",
            "inset -2px 0 5px rgba(0,0,0,0.25)",
            "0 2px 0 rgba(0,0,0,0.90)",
            "0 4px 0 rgba(0,0,0,0.75)",
            "0 6px 0 rgba(0,0,0,0.58)",
            "0 8px 0 rgba(0,0,0,0.42)",
            "0 10px 0 rgba(0,0,0,0.28)",
            "0 12px 0 rgba(0,0,0,0.16)",
            "0 14px 0 rgba(0,0,0,0.08)",
            "0 16px 0 rgba(0,0,0,0.04)",
            "0 20px 28px rgba(0,0,0,0.75)",
            "0 38px 65px rgba(0,0,0,0.58)",
            "5px 0 16px rgba(0,0,0,0.45)",
            "0 0 0 1px rgba(0,0,0,0.6)",
          ].join(", "),
          transition: "transform 0.28s cubic-bezier(0.23,1,0.32,1), box-shadow 0.28s cubic-bezier(0.23,1,0.32,1)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = [
            "inset 0 3px 0 rgba(255,255,255,0.28)",
            "inset 0 1px 0 rgba(255,255,255,0.45)",
            "inset 2px 0 0 rgba(255,255,255,0.08)",
            "inset 0 -3px 8px rgba(0,0,0,0.55)",
            "inset -2px 0 5px rgba(0,0,0,0.25)",
            "0 2px 0 rgba(0,0,0,0.90)",
            "0 4px 0 rgba(0,0,0,0.75)",
            "0 6px 0 rgba(0,0,0,0.58)",
            "0 8px 0 rgba(0,0,0,0.42)",
            "0 10px 0 rgba(0,0,0,0.28)",
            "0 12px 0 rgba(0,0,0,0.16)",
            "0 14px 0 rgba(0,0,0,0.08)",
            "0 16px 0 rgba(0,0,0,0.04)",
            "0 26px 35px rgba(0,0,0,0.82)",
            "0 46px 78px rgba(0,0,0,0.65)",
            "5px 0 16px rgba(0,0,0,0.45)",
            "0 0 0 1px rgba(0,0,0,0.6)",
          ].join(", ");
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(0)";
          el.style.boxShadow = [
            "inset 0 3px 0 rgba(255,255,255,0.22)",
            "inset 0 1px 0 rgba(255,255,255,0.38)",
            "inset 2px 0 0 rgba(255,255,255,0.06)",
            "inset 0 -3px 8px rgba(0,0,0,0.55)",
            "inset -2px 0 5px rgba(0,0,0,0.25)",
            "0 2px 0 rgba(0,0,0,0.90)",
            "0 4px 0 rgba(0,0,0,0.75)",
            "0 6px 0 rgba(0,0,0,0.58)",
            "0 8px 0 rgba(0,0,0,0.42)",
            "0 10px 0 rgba(0,0,0,0.28)",
            "0 12px 0 rgba(0,0,0,0.16)",
            "0 14px 0 rgba(0,0,0,0.08)",
            "0 16px 0 rgba(0,0,0,0.04)",
            "0 20px 28px rgba(0,0,0,0.75)",
            "0 38px 65px rgba(0,0,0,0.58)",
            "5px 0 16px rgba(0,0,0,0.45)",
            "0 0 0 1px rgba(0,0,0,0.6)",
          ].join(", ");
        }}
      >
        {/* Thumbnail — fixed height ensures all cards are uniform */}
        <div
          className="relative"
          style={{
            height: 200,
            flexShrink: 0,
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
        <div className="p-4 flex flex-col" style={{ height: 170, flexShrink: 0 }}>
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
