"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle, CheckCircle, BookOpen } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import { MOCK_VIDEOS, MOCK_CATEGORIES, MOCK_PROGRESS } from "@/lib/mockData";
import AttunementDashboardCard from "@/components/AttunementDashboardCard";

const syne = { fontFamily: "Syne, system-ui, sans-serif" };
const lora = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

export default function DashboardPage() {
  const inProgressVideos = MOCK_VIDEOS.filter((v) => {
    const p = MOCK_PROGRESS[v.id];
    return p && !p.completed && p.progressSeconds > 0;
  });
  const completedCount = Object.values(MOCK_PROGRESS).filter((p) => p.completed).length;
  const recentVideos = MOCK_VIDEOS.slice(0, 4);

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.22em", fontSize: "0.62rem", color: "#C29F60", marginBottom: "0.5rem", opacity: 0.85 }}>
          Member Portal
        </p>
        <h1 style={{ ...lora, fontWeight: 600, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#DED3C8", lineHeight: 1.1, marginBottom: "0.4rem" }}>
          Welcome Back
        </h1>
        <p style={{ ...avenir, color: "rgba(222,211,200,0.62)", fontSize: "0.9rem" }}>
          Continue your journey where you left off.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-fade-in-up animate-fade-in-up-delay-1" style={{ alignItems: "stretch" }}>
        {/* Primary Attunement — first and featured */}
        <AttunementDashboardCard />
        {[
          { icon: PlayCircle, label: "In Progress", value: inProgressVideos.length, color: "#C29F60", bg: "rgba(194,159,96,0.1)", glow: "rgba(194,159,96,0.12)" },
          { icon: CheckCircle, label: "Completed", value: completedCount, color: "#1D7458", bg: "rgba(29,116,88,0.1)", glow: "rgba(29,116,88,0.08)" },
          { icon: BookOpen, label: "Available", value: MOCK_VIDEOS.length, color: "#DED3C8", bg: "rgba(222,211,200,0.07)", glow: "transparent" },
        ].map(({ icon: Icon, label, value, color, bg, glow }) => (
          <div
            key={label}
            className="card-luxury p-4 md:p-5"
            style={{ boxShadow: `0 4px 24px ${glow}`, height: "100%", boxSizing: "border-box" }}
          >
            <div className="flex items-center gap-2 md:gap-3 mb-3">
              <div
                className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: bg, boxShadow: `0 0 12px ${glow}` }}
              >
                <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color }} />
              </div>
              <span style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontSize: "0.55rem", color: "rgba(222,211,200,0.55)" }}>
                {label}
              </span>
            </div>
            <p style={{ ...lora, fontWeight: 500, fontSize: "clamp(1.4rem, 3vw, 1.75rem)", color: "#DED3C8" }}>{value}</p>
            <p style={{ ...avenir, fontSize: "0.7rem", color: "rgba(222,211,200,0.4)" }}>videos</p>
          </div>
        ))}
      </div>

      {/* Continue Watching */}
      {inProgressVideos.length > 0 && (
        <section className="animate-fade-in-up animate-fade-in-up-delay-2">
          <div className="flex items-center gap-3 mb-5">
            <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.15rem", color: "#DED3C8" }}>
              Continue Watching
            </h2>
            <div className="flex-1 glow-line" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {inProgressVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by Category */}
      <section className="animate-fade-in-up animate-fade-in-up-delay-2">
        <div className="flex items-center gap-3 mb-5">
          <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.15rem", color: "#DED3C8" }}>
            Browse by Category
          </h2>
          <div className="flex-1 glow-line" />
          <Link
            href="/library"
            className="flex items-center gap-1 transition-colors flex-shrink-0"
            style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontSize: "0.6rem", color: "#C29F60" }}
          >
            View All <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {MOCK_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/library?category=${cat.slug}`}
              className="card-luxury p-4 md:p-5 transition-all group block"
              style={{ textDecoration: "none" }}
            >
              <span className="text-xl md:text-2xl mb-2 md:mb-3 block">{cat.icon}</span>
              <h3 style={{ ...lora, fontWeight: 600, fontSize: "0.85rem", color: "#DED3C8", marginBottom: "0.2rem" }}>
                {cat.name}
              </h3>
              <p style={{ ...avenir, fontSize: "0.72rem", color: "rgba(222,211,200,0.45)" }}>
                {cat.videoCount} videos
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Content */}
      <section className="animate-fade-in-up animate-fade-in-up-delay-3">
        <div className="flex items-center gap-3 mb-5">
          <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.15rem", color: "#DED3C8" }}>
            Latest Content
          </h2>
          <div className="flex-1 glow-line" />
          <Link
            href="/library"
            className="flex items-center gap-1 transition-colors flex-shrink-0"
            style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontSize: "0.6rem", color: "#C29F60" }}
          >
            View All <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {recentVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
}
