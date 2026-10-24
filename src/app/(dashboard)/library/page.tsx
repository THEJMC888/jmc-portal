"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Play, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Course } from "@/types";

const syne  = { fontFamily: "Syne, system-ui, sans-serif" };
const lora  = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

const GOLD = "#C29F60";

const COURSE_ICONS: Record<string, string> = {
  "4444-journey": "⟁",
  "222-journey":  "◈",
  "vision-creation": "✦",
};

const COURSE_COLORS: Record<string, { accent: string; bg: string }> = {
  "4444-journey":  { accent: "#C29F60", bg: "rgba(194,159,96,0.08)" },
  "222-journey":   { accent: "#7B9EC4", bg: "rgba(123,158,196,0.08)" },
  "vision-creation": { accent: "#A87DCF", bg: "rgba(168,125,207,0.08)" },
};

function CourseCard({ course }: { course: Course }) {
  const icon   = COURSE_ICONS[course.slug] ?? "◉";
  const colors = COURSE_COLORS[course.slug] ?? { accent: GOLD, bg: "rgba(194,159,96,0.08)" };

  return (
    <Link
      href={course.hasAccess ? `/courses/${course.slug}` : `/courses/${course.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="card-luxury"
        style={{
          padding: "28px 24px",
          cursor: "pointer",
          outline: course.hasAccess
            ? `1.5px solid ${colors.accent}55`
            : "1.5px solid rgba(255,255,255,0.07)",
          outlineOffset: "-1px",
          transition: "transform 0.18s, outline-color 0.18s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent bar top */}
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: 2,
          background: course.hasAccess
            ? `linear-gradient(90deg, transparent, ${colors.accent}88, transparent)`
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          borderRadius: "0 0 4px 4px",
        }} />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: colors.bg,
            border: `1px solid ${colors.accent}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, color: colors.accent,
          }}>
            {icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...syne, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase" as const, color: `${colors.accent}99`, marginBottom: 4 }}>
              {course.hasAccess ? "Full Access" : course.requires_access ? "Access Required" : "Open"}
            </p>
            <h3 style={{ ...lora, fontWeight: 700, fontSize: "1.05rem", color: "#DED3C8", lineHeight: 1.2 }}>
              {course.title}
            </h3>
            {course.subtitle && (
              <p style={{ ...avenir, fontSize: "0.75rem", color: "rgba(222,211,200,0.5)", marginTop: 2 }}>
                {course.subtitle}
              </p>
            )}
          </div>

          {/* Status icon */}
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: course.hasAccess ? `${colors.accent}18` : "rgba(255,255,255,0.04)",
            border: course.hasAccess ? `1px solid ${colors.accent}33` : "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {course.hasAccess
              ? <ChevronRight size={14} style={{ color: colors.accent }} />
              : <Lock size={12} style={{ color: "rgba(222,211,200,0.3)" }} />
            }
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p style={{ ...avenir, fontSize: "0.78rem", color: "rgba(222,211,200,0.55)",
            lineHeight: 1.55, marginBottom: 18 }}>
            {course.description}
          </p>
        )}

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {course.hasAccess ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20,
              background: `${colors.accent}18`,
              border: `1px solid ${colors.accent}33` }}>
              <Play size={10} style={{ color: colors.accent }} />
              <span style={{ ...syne, fontSize: "0.62rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase" as const, color: colors.accent }}>
                Watch Now
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)" }}>
              <Lock size={10} style={{ color: "rgba(222,211,200,0.3)" }} />
              <span style={{ ...syne, fontSize: "0.62rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase" as const,
                color: "rgba(222,211,200,0.3)" }}>
                Request Access
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function LibraryPage() {
  const { session } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/courses", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourses(data); })
      .finally(() => setLoading(false));
  }, [session]);

  const myCourses  = courses.filter(c => c.hasAccess);
  const otherCourses = courses.filter(c => !c.hasAccess);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const,
          letterSpacing: "0.22em", fontSize: "0.62rem", color: GOLD, marginBottom: "0.5rem", opacity: 0.85 }}>
          Course Library
        </p>
        <h1 style={{ ...lora, fontWeight: 600, fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          color: "#DED3C8", lineHeight: 1.1, marginBottom: "0.4rem" }}>
          Your Journeys
        </h1>
        <p style={{ ...avenir, color: "rgba(222,211,200,0.62)", fontSize: "0.9rem" }}>
          Each course is a complete transformational arc. Your active courses are unlocked below.
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-luxury animate-pulse" style={{ height: 180 }} />
          ))}
        </div>
      )}

      {!loading && myCourses.length > 0 && (
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.1rem", color: "#DED3C8" }}>
              Active Courses
            </h2>
            <div className="flex-1 glow-line" />
            <span style={{ ...syne, fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase" as const,
              color: "rgba(222,211,200,0.35)" }}>
              {myCourses.length} course{myCourses.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-4">
            {myCourses.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      )}

      {!loading && otherCourses.length > 0 && (
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.1rem", color: "#DED3C8" }}>
              Available Courses
            </h2>
            <div className="flex-1 glow-line" />
          </div>
          <div className="space-y-4">
            {otherCourses.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      )}

      {!loading && courses.length === 0 && (
        <div className="card-luxury" style={{ padding: "48px 32px", textAlign: "center" as const }}>
          <p style={{ ...avenir, color: "rgba(222,211,200,0.4)", fontSize: "0.9rem" }}>
            No courses available yet. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
