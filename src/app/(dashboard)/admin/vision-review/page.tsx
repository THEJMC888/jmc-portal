"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, AlertCircle, Eye, X, ChevronLeft, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { VisionSubmission } from "@/types";

const ADMIN_EMAIL = "rng@thejourneymencollective.com";

const STATUS_LABELS: Record<VisionSubmission["status"], string> = {
  pending: "Pending Review",
  approved: "Approved",
  needs_revision: "Needs Revision",
};

const STATUS_COLORS: Record<VisionSubmission["status"], { bg: string; color: string; border: string }> = {
  pending:        { bg: "rgba(194,159,96,0.12)",  color: "#C29F60",  border: "rgba(194,159,96,0.3)" },
  approved:       { bg: "rgba(29,116,88,0.12)",   color: "#1D7458",  border: "rgba(29,116,88,0.35)" },
  needs_revision: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b",  border: "rgba(255,107,107,0.3)" },
};

function StatusPill({ status }: { status: VisionSubmission["status"] }) {
  const c = STATUS_COLORS[status];
  const icons = { pending: Clock, approved: CheckCircle, needs_revision: AlertCircle };
  const Icon = icons[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      <Icon size={10} />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface ReviewModalProps {
  submission: VisionSubmission;
  onClose: () => void;
  onSave: (id: string, status: VisionSubmission["status"], feedback: string) => Promise<void>;
}

function ReviewModal({ submission, onClose, onSave }: ReviewModalProps) {
  const [status, setStatus] = useState<VisionSubmission["status"]>(submission.status);
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(submission.id, status, feedback);
    setSaving(false);
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(4,13,28,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#0a1628", border: "1px solid rgba(194,159,96,0.2)",
        borderRadius: 12, padding: 28, maxWidth: 560, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{
              margin: 0, color: "#DED3C8",
              fontFamily: '"Lora",Georgia,serif', fontSize: 18, fontWeight: 700,
            }}>
              {submission.visionTitle}
            </h2>
            <p style={{ margin: "4px 0 0", color: "rgba(222,211,200,0.5)", fontSize: 12, fontFamily: "Syne,system-ui,sans-serif" }}>
              {submission.userName} · {submission.userEmail} · {submission.slideCount} slides
            </p>
            <p style={{ margin: "4px 0 0", color: "rgba(222,211,200,0.4)", fontSize: 11, fontFamily: "Syne,system-ui,sans-serif" }}>
              Submitted {new Date(submission.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "rgba(222,211,200,0.4)", padding: 4,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Status selector */}
        <div style={{ marginBottom: 18 }}>
          <label style={{
            display: "block", marginBottom: 8,
            color: "rgba(222,211,200,0.6)", fontSize: 11,
            fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Review Decision
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["pending", "approved", "needs_revision"] as const).map((s) => {
              const c = STATUS_COLORS[s];
              const selected = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1, padding: "8px 6px",
                    borderRadius: 8,
                    border: selected ? `1.5px solid ${c.border}` : "1px solid rgba(255,255,255,0.08)",
                    background: selected ? c.bg : "rgba(255,255,255,0.03)",
                    color: selected ? c.color : "rgba(222,211,200,0.45)",
                    fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                    letterSpacing: "0.05em", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback textarea */}
        <div style={{ marginBottom: 22 }}>
          <label style={{
            display: "block", marginBottom: 8,
            color: "rgba(222,211,200,0.6)", fontSize: 11,
            fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Feedback for Member <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share what's working well, what to refine, or any encouragement…"
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(194,159,96,0.2)",
              borderRadius: 8, padding: "10px 14px",
              color: "#DED3C8", fontSize: 13,
              fontFamily: '"Lora",Georgia,serif',
              resize: "vertical", outline: "none",
              lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "rgba(222,211,200,0.5)",
            fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
            letterSpacing: "0.06em", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 24px", borderRadius: 8,
              border: "1px solid rgba(194,159,96,0.4)",
              background: saved ? "rgba(29,116,88,0.2)" : "rgba(194,159,96,0.15)",
              color: saved ? "#1D7458" : "#C29F60",
              fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
              letterSpacing: "0.06em", cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "all 0.3s",
            }}
          >
            {saved ? "Saved ✓" : saving ? "Saving…" : "Save Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VisionReviewPage() {
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const [submissions, setSubmissions] = useState<VisionSubmission[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<VisionSubmission | null>(null);
  const [filter, setFilter] = useState<VisionSubmission["status"] | "all">("all");

  const isAdmin = user?.email === ADMIN_EMAIL;

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/vision-submissions", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load submissions");
      const data: VisionSubmission[] = await res.json();
      setSubmissions(data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setFetching(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.replace("/"); return; }
      if (!isAdmin) { router.replace("/dashboard"); return; }
      load();
    }
  }, [loading, user, isAdmin, load, router]);

  const handleSaveReview = async (
    id: string,
    status: VisionSubmission["status"],
    feedback: string,
  ) => {
    if (!session?.access_token) return;
    const res = await fetch("/api/vision-submissions", {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status, feedback: feedback || undefined }),
    });
    if (res.ok) {
      const updated: VisionSubmission = await res.json();
      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
    setReviewing(null);
  };

  const filtered = filter === "all" ? submissions : submissions.filter(s => s.status === filter);

  const counts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    approved: submissions.filter(s => s.status === "approved").length,
    needs_revision: submissions.filter(s => s.status === "needs_revision").length,
  };

  if (loading || (fetching && submissions.length === 0)) {
    return (
      <div style={{
        minHeight: "100vh", background: "#040d1c",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(222,211,200,0.4)", fontFamily: "Syne,system-ui,sans-serif",
      }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#040d1c", padding: "0 0 48px" }}>
      {reviewing && (
        <ReviewModal
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onSave={handleSaveReview}
        />
      )}

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(194,159,96,0.1)",
        background: "rgba(4,13,28,0.95)",
        padding: "16px 24px",
        display: "flex", alignItems: "center", gap: 16,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "rgba(222,211,200,0.45)", display: "flex", alignItems: "center", gap: 5,
            padding: 0, fontSize: 12, fontFamily: "Syne,system-ui,sans-serif",
          }}
        >
          <ChevronLeft size={14} /> Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: "rgba(194,159,96,0.2)" }} />
        <h1 style={{
          margin: 0, flex: 1,
          color: "#DED3C8", fontFamily: '"Lora",Georgia,serif',
          fontSize: 18, fontWeight: 700,
        }}>
          Vision Review Queue
        </h1>
        <button
          onClick={load}
          disabled={fetching}
          style={{
            background: "transparent", border: "1px solid rgba(194,159,96,0.2)",
            borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            color: "rgba(194,159,96,0.6)", display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontFamily: "Syne,system-ui,sans-serif",
          }}
        >
          <RefreshCw size={11} style={{ animation: fetching ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 0" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {(["all", "pending", "approved", "needs_revision"] as const).map((f) => {
            const active = filter === f;
            const c = f === "all" ? null : STATUS_COLORS[f];
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px", borderRadius: 20,
                  border: active && c ? `1.5px solid ${c.border}` : active ? "1.5px solid rgba(222,211,200,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  background: active && c ? c.bg : active ? "rgba(222,211,200,0.06)" : "transparent",
                  color: active && c ? c.color : active ? "#DED3C8" : "rgba(222,211,200,0.4)",
                  fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                  letterSpacing: "0.06em", cursor: "pointer", textTransform: "capitalize",
                }}
              >
                {f === "all" ? "All" : STATUS_LABELS[f]} ({counts[f]})
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 8,
            background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
            color: "#ff6b6b", fontSize: 13, fontFamily: "Syne,system-ui,sans-serif",
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {filtered.length === 0 && !fetching && (
          <div style={{
            padding: "48px 24px", textAlign: "center",
            color: "rgba(222,211,200,0.35)", fontFamily: "Syne,system-ui,sans-serif",
            fontSize: 14,
          }}>
            {filter === "all" ? "No submissions yet." : `No ${STATUS_LABELS[filter as VisionSubmission["status"]].toLowerCase()} submissions.`}
          </div>
        )}

        {/* Submission list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((sub) => (
            <div
              key={sub.id}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(194,159,96,0.12)",
                borderRadius: 10, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{
                    color: "#DED3C8", fontFamily: '"Lora",Georgia,serif',
                    fontSize: 15, fontWeight: 700,
                  }}>
                    {sub.visionTitle}
                  </span>
                  <StatusPill status={sub.status} />
                </div>
                <div style={{ color: "rgba(222,211,200,0.5)", fontSize: 12, fontFamily: "Syne,system-ui,sans-serif" }}>
                  {sub.userName}
                  {sub.userEmail !== sub.userName && (
                    <span style={{ opacity: 0.6 }}> · {sub.userEmail}</span>
                  )}
                  <span style={{ opacity: 0.5 }}> · {sub.slideCount} slides</span>
                </div>
                <div style={{ color: "rgba(222,211,200,0.35)", fontSize: 11, fontFamily: "Syne,system-ui,sans-serif", marginTop: 4 }}>
                  Submitted {new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {sub.reviewedAt && (
                    <span>
                      {" · "}Reviewed {new Date(sub.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
                {sub.feedback && (
                  <div style={{
                    marginTop: 8, padding: "8px 12px",
                    background: "rgba(194,159,96,0.06)",
                    borderLeft: "2px solid rgba(194,159,96,0.3)",
                    borderRadius: "0 6px 6px 0",
                    color: "rgba(222,211,200,0.65)", fontSize: 12,
                    fontFamily: '"Lora",Georgia,serif',
                    lineHeight: 1.5,
                  }}>
                    {sub.feedback}
                  </div>
                )}
              </div>
              <button
                onClick={() => setReviewing(sub)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid rgba(194,159,96,0.3)",
                  background: "rgba(194,159,96,0.08)", color: "#C29F60",
                  fontSize: 12, fontFamily: "Syne,system-ui,sans-serif", fontWeight: 700,
                  letterSpacing: "0.06em", cursor: "pointer", flexShrink: 0,
                }}
              >
                <Eye size={13} /> Review
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
