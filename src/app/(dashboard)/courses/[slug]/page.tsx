"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Play, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Course, CourseVideo } from "@/types";

const syne  = { fontFamily: "Syne, system-ui, sans-serif" };
const lora  = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

const COURSE_COLORS: Record<string, { accent: string; bg: string }> = {
  "4444-journey":    { accent: "#C29F60", bg: "rgba(194,159,96,0.08)" },
  "222-journey":     { accent: "#7B9EC4", bg: "rgba(123,158,196,0.08)" },
  "vision-creation": { accent: "#A87DCF", bg: "rgba(168,125,207,0.08)" },
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

interface EpisodeRowProps {
  video: CourseVideo;
  index: number;
  accent: string;
  bunnyLibraryId?: string;
}

function EpisodeRow({ video, index, accent, bunnyLibraryId }: EpisodeRowProps) {
  const hasPlayer = bunnyLibraryId && video.bunny_video_id;
  const href = hasPlayer
    ? `/video/bunny/${bunnyLibraryId}/${video.bunny_video_id}`
    : "#";

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", display: "block" }}
      onClick={!hasPlayer ? (e) => e.preventDefault() : undefined}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "14px 18px", borderRadius: 12,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
          cursor: hasPlayer ? "pointer" : "default",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => {
          if (hasPlayer) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.045)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)";
        }}
      >
        {/* Episode number / play */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: hasPlayer ? `${accent}18` : "rgba(255,255,255,0.04)",
          border: `1px solid ${hasPlayer ? accent + "33" : "rgba(255,255,255,0.06)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: hasPlayer ? accent : "rgba(222,211,200,0.25)",
        }}>
          {hasPlayer
            ? <Play size={12} />
            : <span style={{ ...syne, fontSize: "0.65rem", fontWeight: 700 }}>{index + 1}</span>
          }
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...lora, fontWeight: 600, fontSize: "0.85rem", color: "#DED3C8",
            marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {video.title}
          </p>
          {video.description && (
            <p style={{ ...avenir, fontSize: "0.72rem", color: "rgba(222,211,200,0.45)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {video.description}
            </p>
          )}
        </div>

        {/* Duration */}
        {video.duration_seconds > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Clock size={11} style={{ color: "rgba(222,211,200,0.3)" }} />
            <span style={{ ...syne, fontSize: "0.62rem", color: "rgba(222,211,200,0.35)",
              fontWeight: 600, letterSpacing: "0.05em" }}>
              {formatDuration(video.duration_seconds)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default function CoursePage({ params }: CoursePageProps) {
  const { slug } = use(params);
  const { session } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const colors = COURSE_COLORS[slug] ?? { accent: "#C29F60", bg: "rgba(194,159,96,0.08)" };

  useEffect(() => {
    if (!session?.access_token) return;
    fetch(`/api/courses/${slug}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setCourse(data.course);
        setVideos(data.videos ?? []);
      })
      .finally(() => setLoading(false));
  }, [session, slug]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-luxury animate-pulse" style={{ height: 120 }} />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{
              height: 64, borderRadius: 12, background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="space-y-6">
        <Link href="/library" className="inline-flex items-center gap-2 text-sm" style={{ color: "rgba(222,211,200,0.5)" }}>
          <ArrowLeft size={14} /> Back to Library
        </Link>
        <div className="card-luxury" style={{ padding: "48px 32px", textAlign: "center" as const }}>
          <p style={{ ...avenir, color: "rgba(222,211,200,0.4)" }}>Course not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/library" className="inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: "rgba(222,211,200,0.5)", textDecoration: "none" }}>
        <ArrowLeft size={14} />
        <span style={avenir}>Back to Library</span>
      </Link>

      {/* Course header */}
      <div className="card-luxury animate-fade-in-up" style={{
        padding: "28px 24px",
        outline: `1.5px solid ${colors.accent}44`, outlineOffset: "-1px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: 2,
          background: `linear-gradient(90deg, transparent, ${colors.accent}88, transparent)`,
          borderRadius: "0 0 4px 4px",
        }} />

        <p style={{ ...syne, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase" as const, color: `${colors.accent}99`, marginBottom: 8 }}>
          The Journeymen Collective
        </p>
        <h1 style={{ ...lora, fontWeight: 700, fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
          color: "#DED3C8", lineHeight: 1.15, marginBottom: 6 }}>
          {course.title}
        </h1>
        {course.subtitle && (
          <p style={{ ...avenir, fontSize: "0.85rem", color: "rgba(222,211,200,0.55)", marginBottom: 12 }}>
            {course.subtitle}
          </p>
        )}
        {course.description && (
          <p style={{ ...avenir, fontSize: "0.82rem", color: "rgba(222,211,200,0.45)", lineHeight: 1.6 }}>
            {course.description}
          </p>
        )}
      </div>

      {/* Access gate */}
      {!course.hasAccess && (
        <div className="card-luxury animate-fade-in-up" style={{
          padding: "36px 28px", textAlign: "center" as const,
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: "0 auto 16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={20} style={{ color: "rgba(222,211,200,0.35)" }} />
          </div>
          <h3 style={{ ...lora, fontWeight: 700, fontSize: "1rem", color: "#DED3C8", marginBottom: 8 }}>
            Access Required
          </h3>
          <p style={{ ...avenir, fontSize: "0.82rem", color: "rgba(222,211,200,0.45)",
            maxWidth: 340, margin: "0 auto 24px", lineHeight: 1.6 }}>
            This course is available to members who have been granted access. Contact your coach or admin to get started.
          </p>
          <a
            href={`mailto:rng@thejourneymencollective.com?subject=Access Request: ${course.title}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: 24,
              background: `linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(8,20,52,0.55) 100%)`,
              border: "1px solid rgba(255,255,255,0.12)",
              textDecoration: "none",
              ...syne, fontSize: "0.72rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              color: "rgba(222,211,200,0.7)",
            }}
          >
            Request Access
          </a>
        </div>
      )}

      {/* Episode list */}
      {course.hasAccess && (
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.1rem", color: "#DED3C8" }}>
              Episodes
            </h2>
            <div className="flex-1 glow-line" />
            <span style={{ ...syne, fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase" as const,
              color: "rgba(222,211,200,0.35)" }}>
              {videos.length} episode{videos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {videos.length > 0 ? (
            <div className="space-y-2">
              {videos.map((v, i) => (
                <EpisodeRow
                  key={v.id}
                  video={v}
                  index={i}
                  accent={colors.accent}
                  bunnyLibraryId={course.bunny_library_id}
                />
              ))}
            </div>
          ) : (
            <div style={{
              padding: "36px 24px", borderRadius: 12, textAlign: "center" as const,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <p style={{ ...avenir, fontSize: "0.85rem", color: "rgba(222,211,200,0.35)" }}>
                Episodes are being uploaded. Check back soon.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
