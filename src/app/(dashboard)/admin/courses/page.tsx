"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Course, UserCourseAccess } from "@/types";

const ADMIN_EMAIL = "rng@thejourneymencollective.com";
const syne  = { fontFamily: "Syne, system-ui, sans-serif" };
const lora  = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };
const GOLD = "#C29F60";

interface AccessRow extends UserCourseAccess {
  email?: string;
}

function GrantModal({
  course,
  token,
  onClose,
  onGranted,
}: {
  course: Course;
  token: string;
  onClose: () => void;
  onGranted: () => void;
}) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleGrant() {
    if (!email.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/courses/access", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_email: email.trim().toLowerCase(), course_id: course.id }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to grant access"); return; }
    onGranted();
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(2,8,28,0.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div className="card-luxury" style={{
        width: "100%", maxWidth: 440, padding: "28px 24px",
        outline: `1.5px solid ${GOLD}44`, outlineOffset: "-1px",
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...lora, fontWeight: 700, fontSize: "1.05rem", color: "#DED3C8", marginBottom: 4 }}>
          Grant Access
        </h3>
        <p style={{ ...avenir, fontSize: "0.78rem", color: "rgba(222,211,200,0.5)", marginBottom: 20 }}>
          {course.title}
        </p>

        <label style={{ ...syne, fontSize: "0.62rem", fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase" as const,
          color: "rgba(222,211,200,0.5)", display: "block", marginBottom: 8 }}>
          Member Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleGrant(); }}
          placeholder="member@example.com"
          style={{
            width: "100%", boxSizing: "border-box" as const,
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#DED3C8", fontSize: "0.88rem", ...avenir, outline: "none",
          }}
        />

        {error && (
          <p style={{ ...avenir, fontSize: "0.78rem", color: "#ff6b6b", marginBottom: 12 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(222,211,200,0.55)", ...syne, fontSize: "0.72rem",
              fontWeight: 700, letterSpacing: "0.1em",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGrant}
            disabled={saving || !email.trim()}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 10, cursor: "pointer",
              background: `linear-gradient(180deg, #DEC272 0%, #A07A28 44%, #D4B462 86%)`,
              border: "none", color: "#08203A",
              ...syne, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em",
              opacity: saving || !email.trim() ? 0.5 : 1,
            }}
          >
            {saving ? "Granting…" : "Grant Access"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseSection({
  course,
  token,
}: {
  course: Course;
  token: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [accessList, setAccessList] = useState<AccessRow[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [showGrant, setShowGrant] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadAccess = useCallback(async () => {
    setLoadingAccess(true);
    const res = await fetch(`/api/courses/access?course_id=${course.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setAccessList(data);
    setLoadingAccess(false);
  }, [course.id, token]);

  useEffect(() => {
    if (expanded) loadAccess();
  }, [expanded, loadAccess]);

  async function handleRevoke(userId: string) {
    setRevoking(userId);
    await fetch("/api/courses/access", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, course_id: course.id }),
    });
    await loadAccess();
    setRevoking(null);
  }

  return (
    <div className="card-luxury" style={{ outline: "1px solid rgba(255,255,255,0.06)", outlineOffset: "-1px" }}>
      {/* Course header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: "18px 20px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ flex: 1, textAlign: "left" as const }}>
          <p style={{ ...lora, fontWeight: 700, fontSize: "0.95rem", color: "#DED3C8" }}>
            {course.title}
          </p>
          {course.subtitle && (
            <p style={{ ...avenir, fontSize: "0.75rem", color: "rgba(222,211,200,0.45)", marginTop: 2 }}>
              {course.subtitle}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); setShowGrant(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 20, cursor: "pointer",
              background: `rgba(194,159,96,0.12)`, border: `1px solid rgba(194,159,96,0.3)`,
              color: GOLD, ...syne, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
            }}
          >
            <UserPlus size={11} /> Grant
          </button>
          {expanded
            ? <ChevronUp size={16} style={{ color: "rgba(222,211,200,0.4)" }} />
            : <ChevronDown size={16} style={{ color: "rgba(222,211,200,0.4)" }} />}
        </div>
      </button>

      {/* Access list */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ ...syne, fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              color: "rgba(222,211,200,0.35)" }}>
              {loadingAccess ? "Loading…" : `${accessList.length} member${accessList.length !== 1 ? "s" : ""} with access`}
            </span>
            <button onClick={loadAccess} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(222,211,200,0.3)", padding: 4,
            }}>
              <RefreshCw size={12} />
            </button>
          </div>

          {accessList.length === 0 && !loadingAccess && (
            <p style={{ ...avenir, fontSize: "0.8rem", color: "rgba(222,211,200,0.3)", textAlign: "center" as const, padding: "12px 0" }}>
              No members have access yet.
            </p>
          )}

          <div className="space-y-2">
            {accessList.map(row => (
              <div key={row.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ ...avenir, fontSize: "0.82rem", color: "#DED3C8" }}>
                    {row.email ?? row.user_id}
                  </p>
                  <p style={{ ...syne, fontSize: "0.6rem", color: "rgba(222,211,200,0.35)",
                    letterSpacing: "0.06em" }}>
                    Granted {new Date(row.granted_at).toLocaleDateString()}
                    {row.expires_at ? ` · Expires ${new Date(row.expires_at).toLocaleDateString()}` : " · Lifetime"}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(row.user_id)}
                  disabled={revoking === row.user_id}
                  style={{
                    background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)",
                    borderRadius: 8, padding: "6px 8px", cursor: "pointer",
                    color: "#ff6b6b", opacity: revoking === row.user_id ? 0.4 : 1,
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGrant && (
        <GrantModal
          course={course}
          token={token}
          onClose={() => setShowGrant(false)}
          onGranted={loadAccess}
        />
      )}
    </div>
  );
}

export default function AdminCoursesPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    if (session.user?.email !== ADMIN_EMAIL) { router.replace("/dashboard"); return; }

    fetch("/api/courses", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCourses(d); })
      .finally(() => setLoading(false));
  }, [session, router]);

  if (!session || session.user?.email !== ADMIN_EMAIL) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const,
          letterSpacing: "0.22em", fontSize: "0.62rem", color: GOLD, marginBottom: "0.5rem" }}>
          Admin
        </p>
        <h1 style={{ ...lora, fontWeight: 600, fontSize: "clamp(1.5rem, 4vw, 2rem)",
          color: "#DED3C8", lineHeight: 1.1, marginBottom: "0.4rem" }}>
          Course Access
        </h1>
        <p style={{ ...avenir, color: "rgba(222,211,200,0.62)", fontSize: "0.9rem" }}>
          Grant or revoke member access to each course.
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card-luxury animate-pulse" style={{ height: 72 }} />)}
        </div>
      )}

      {!loading && (
        <div className="space-y-4 animate-fade-in-up">
          {courses.map(c => (
            <CourseSection key={c.id} course={c} token={session.access_token} />
          ))}
        </div>
      )}
    </div>
  );
}
