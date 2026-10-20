"use client";

import { useState, useEffect, useCallback } from "react";
import { Route, Plus, Check, Users, User, ChevronDown, ChevronUp, FileText, X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "rng@thejourneymencollective.com";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

interface CoachingSession {
  id: string;
  memberEmail?: string;
  title: string;
  date: string;
  sessionType: "solo" | "group";
  summary: string;
  takeaways: string[];
  actionItems: ActionItem[];
  coachNotes: string;
  transcript?: string;
}

// ─── DB mapping ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToSession(row: any): CoachingSession {
  return {
    id: row.id,
    memberEmail: row.member_email ?? undefined,
    title: row.title,
    date: row.date,
    sessionType: row.session_type,
    summary: row.summary ?? "",
    takeaways: row.takeaways ?? [],
    actionItems: row.action_items ?? [],
    coachNotes: row.coach_notes ?? "",
    transcript: row.transcript || undefined,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function formatDateShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Add Session Modal ────────────────────────────────────────────────────────
function AddSessionModal({
  isAdmin,
  onClose,
  onSave,
}: {
  isAdmin: boolean;
  onClose: () => void;
  onSave: (s: Omit<CoachingSession, "id">) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"solo" | "group">("solo");
  const [memberEmail, setMemberEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [takeaways, setTakeaways] = useState("");
  const [actions, setActions] = useState("");
  const [coachNotes, setCoachNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!title.trim() || !summary.trim()) return;
    setSaving(true);
    await onSave({
      memberEmail: memberEmail.trim() || undefined,
      title: title.trim(),
      date,
      sessionType: type,
      summary: summary.trim(),
      takeaways: takeaways.split("\n").map(t => t.trim()).filter(Boolean),
      actionItems: actions
        .split("\n")
        .map((t, i) => ({ id: `ai-${Date.now()}-${i}`, text: t.trim(), completed: false }))
        .filter(a => a.text),
      coachNotes: coachNotes.trim(),
      transcript: transcript.trim() || undefined,
    });
    setSaving(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(2,12,30,0.55)", border: "1px solid rgba(255,255,255,0.1)",
    borderTop: "1px solid rgba(0,0,0,0.3)", borderRadius: 7, padding: "10px 14px",
    color: "#DED3C8", fontFamily: "Syne, system-ui, sans-serif", fontSize: 13,
    outline: "none", boxSizing: "border-box",
    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35)",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
    letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,159,96,0.7)",
    display: "block", marginBottom: 5,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(2,8,20,0.82)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto",
        background: "linear-gradient(160deg, rgba(13,31,60,0.97) 0%, rgba(4,12,32,0.99) 100%)",
        borderTop: "1.5px solid rgba(255,255,255,0.14)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        borderRight: "1px solid rgba(0,0,0,0.3)",
        borderBottom: "1.5px solid rgba(0,0,0,0.5)",
        borderRadius: 14,
        boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        padding: "28px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(194,159,96,0.7)", marginBottom: 4 }}>
              Add Session
            </div>
            <h2 style={{ fontFamily: "Lora, Georgia, serif", fontSize: 22, fontWeight: 600, color: "#DED3C8", margin: 0 }}>
              New Coaching Session
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.4)", padding: 4 }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Session Title</label>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Clarity & Direction" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Session Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["solo", "group"] as const).map(t => (
                  <button key={t} onClick={() => setType(t)} style={{
                    flex: 1, padding: "10px 0", borderRadius: 7, cursor: "pointer",
                    fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: type === t
                      ? "linear-gradient(180deg, #DEC272 0%, #A07A28 50%, #D4B462 100%)"
                      : "rgba(2,12,30,0.55)",
                    color: type === t ? "#08203A" : "rgba(222,211,200,0.6)",
                    border: type === t ? "1px solid rgba(240,220,170,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: type === t ? "0 2px 0 rgba(20,12,0,0.7), 0 4px 12px rgba(0,0,0,0.4)" : "none",
                  }}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Admin-only: assign session to a member by email */}
          {isAdmin && (
            <div>
              <label style={labelStyle}>Member Email (assign to client)</label>
              <input
                style={inputStyle}
                type="email"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                placeholder="client@example.com — leave blank for unassigned"
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Session Summary</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={summary} onChange={e => setSummary(e.target.value)} placeholder="What was the core theme and breakthrough of this session?" />
          </div>

          <div>
            <label style={labelStyle}>Key Takeaways (one per line)</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={takeaways} onChange={e => setTakeaways(e.target.value)} placeholder="Each takeaway on its own line..." />
          </div>

          <div>
            <label style={labelStyle}>Action Items (one per line)</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={actions} onChange={e => setActions(e.target.value)} placeholder="Each action item on its own line..." />
          </div>

          {isAdmin && (
            <div>
              <label style={labelStyle}>Coach&apos;s Notes</label>
              <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={coachNotes} onChange={e => setCoachNotes(e.target.value)} placeholder="Private observations and patterns to track..." />
            </div>
          )}

          <div>
            <label style={labelStyle}>Transcript (optional — paste full text)</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "monospace", fontSize: 11 }} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste the Fireflies transcript here..." />
          </div>

          <button onClick={handle} disabled={saving} style={{
            marginTop: 4, padding: "13px 0", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.16em", textTransform: "uppercase",
            background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)",
            color: "#08203A",
            border: "1.5px solid rgba(240,220,170,0.45)",
            boxShadow: "0 2px 0 rgba(20,12,0,0.85), 0 4px 0 rgba(20,12,0,0.55), 0 8px 20px rgba(0,0,0,0.5)",
            opacity: saving ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {saving && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
            {saving ? "Saving..." : "Save Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Session Detail ───────────────────────────────────────────────────────────
function SessionDetail({
  session,
  isAdmin,
  onToggleAction,
}: {
  session: CoachingSession;
  isAdmin: boolean;
  onToggleAction: (sessionId: string, actionId: string) => void;
}) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", flex: 1 }}>
      {/* Eyebrow */}
      <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(194,159,96,0.65)", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        Coaching Session · {formatDate(session.date)}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 10px", borderRadius: 12,
          background: session.sessionType === "group" ? "rgba(0,180,200,0.1)" : "rgba(194,159,96,0.08)",
          border: `1px solid ${session.sessionType === "group" ? "rgba(0,200,220,0.2)" : "rgba(194,159,96,0.18)"}`,
          color: session.sessionType === "group" ? "rgba(0,210,230,0.8)" : "rgba(194,159,96,0.75)",
          fontSize: 8, letterSpacing: "0.14em",
        }}>
          {session.sessionType === "group" ? <Users style={{ width: 9, height: 9 }} /> : <User style={{ width: 9, height: 9 }} />}
          {session.sessionType === "group" ? "Group Session" : "Solo Session"}
        </span>
        {isAdmin && session.memberEmail && (
          <span style={{
            padding: "3px 10px", borderRadius: 12,
            background: "rgba(130,80,200,0.08)",
            border: "1px solid rgba(180,140,255,0.18)",
            color: "rgba(180,140,255,0.7)",
            fontSize: 8, letterSpacing: "0.1em",
          }}>
            {session.memberEmail}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 600, fontSize: 28, color: "#DED3C8", margin: "0 0 24px", lineHeight: 1.2 }}>
        {session.title}
      </h1>

      {/* Summary */}
      <div style={{
        background: "rgba(2,12,30,0.45)", borderRadius: 10,
        borderTop: "1px solid rgba(255,255,255,0.1)", borderLeft: "2px solid rgba(0,180,200,0.3)",
        borderRight: "1px solid rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(0,0,0,0.3)",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)",
        padding: "18px 20px", marginBottom: 24,
      }}>
        <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,200,220,0.6)", marginBottom: 8 }}>
          Session Summary
        </div>
        <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13.5, color: "rgba(222,211,200,0.82)", lineHeight: 1.8, margin: 0 }}>
          {session.summary}
        </p>
      </div>

      {/* Key Takeaways */}
      {session.takeaways.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(194,159,96,0.7)", marginBottom: 12 }}>
            Key Takeaways
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {session.takeaways.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  background: "rgba(194,159,96,0.12)",
                  border: "1px solid rgba(194,159,96,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700,
                  color: "rgba(194,159,96,0.8)",
                }}>
                  {i + 1}
                </div>
                <p style={{ fontFamily: "Lora, Georgia, serif", fontSize: 13, color: "rgba(222,211,200,0.85)", lineHeight: 1.75, margin: 0 }}>
                  {t}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {session.actionItems.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(194,159,96,0.7)", marginBottom: 12 }}>
            Action Items
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {session.actionItems.map((item) => (
              <button key={item.id} onClick={() => onToggleAction(session.id, item.id)} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                background: item.completed ? "rgba(29,116,88,0.1)" : "rgba(2,12,30,0.3)",
                border: `1px solid ${item.completed ? "rgba(29,116,88,0.25)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 8, padding: "11px 14px", cursor: "pointer",
                textAlign: "left", transition: "all 0.15s",
                boxShadow: "inset 0 1px 4px rgba(0,0,0,0.2)",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                  background: item.completed ? "rgba(29,116,88,0.5)" : "transparent",
                  border: `1.5px solid ${item.completed ? "rgba(29,116,88,0.7)" : "rgba(255,255,255,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {item.completed && <Check style={{ width: 11, height: 11, color: "#6EE7B7" }} />}
                </div>
                <span style={{
                  fontFamily: "Lora, Georgia, serif", fontSize: 13, lineHeight: 1.65,
                  color: item.completed ? "rgba(222,211,200,0.45)" : "rgba(222,211,200,0.85)",
                  textDecoration: item.completed ? "line-through" : "none",
                  transition: "all 0.15s",
                }}>
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coach's Notes — admin only */}
      {isAdmin && session.coachNotes && (
        <div style={{
          background: "rgba(130,80,200,0.07)", borderRadius: 10,
          borderTop: "1px solid rgba(180,140,255,0.18)", borderLeft: "2px solid rgba(180,140,255,0.3)",
          borderRight: "1px solid rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(0,0,0,0.3)",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)",
          padding: "18px 20px", marginBottom: 24,
        }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(180,140,255,0.7)", marginBottom: 8 }}>
            Coach&apos;s Notes
          </div>
          <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.75)", lineHeight: 1.8, margin: 0 }}>
            {session.coachNotes}
          </p>
        </div>
      )}

      {/* Transcript */}
      {session.transcript && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16 }}>
          <button onClick={() => setTranscriptOpen(o => !o)} style={{
            display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
            cursor: "pointer", padding: 0, marginBottom: transcriptOpen ? 14 : 0,
          }}>
            <FileText style={{ width: 13, height: 13, color: "rgba(194,159,96,0.5)" }} />
            <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,159,96,0.55)" }}>
              Full Transcript
            </span>
            {transcriptOpen
              ? <ChevronUp style={{ width: 12, height: 12, color: "rgba(194,159,96,0.4)" }} />
              : <ChevronDown style={{ width: 12, height: 12, color: "rgba(194,159,96,0.4)" }} />
            }
          </button>
          {transcriptOpen && (
            <pre style={{
              fontFamily: "ui-monospace, monospace", fontSize: 11.5, lineHeight: 1.9,
              color: "rgba(222,211,200,0.65)", whiteSpace: "pre-wrap", wordBreak: "break-word",
              background: "rgba(2,8,20,0.5)", borderRadius: 8, padding: "16px 18px",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "inset 0 3px 10px rgba(0,0,0,0.4)",
              maxHeight: 320, overflowY: "auto",
            }}>
              {session.transcript}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyJourneyPage() {
  const { user, session, loading: authLoading } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from("coaching_sessions")
      .select("*")
      .order("date", { ascending: false });

    if (dbError) {
      setError(dbError.message);
    } else if (data) {
      const mapped = data.map(dbToSession);
      setSessions(mapped);
      if (mapped.length > 0 && !selectedId) {
        setSelectedId(mapped[0].id);
      }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (!authLoading && session) {
      loadSessions();
    } else if (!authLoading && !session) {
      setLoading(false);
    }
  }, [authLoading, session, loadSessions]);

  const addSession = async (s: Omit<CoachingSession, "id">) => {
    if (!session) return;
    const { data, error: dbError } = await supabase
      .from("coaching_sessions")
      .insert({
        member_email: s.memberEmail ?? null,
        title: s.title,
        date: s.date,
        session_type: s.sessionType,
        summary: s.summary,
        takeaways: s.takeaways,
        action_items: s.actionItems,
        coach_notes: s.coachNotes,
        transcript: s.transcript ?? null,
      })
      .select()
      .single();

    if (!dbError && data) {
      const newSession = dbToSession(data);
      setSessions(prev => [newSession, ...prev]);
      setSelectedId(newSession.id);
    }
  };

  const toggleAction = async (sessionId: string, actionId: string) => {
    const target = sessions.find(s => s.id === sessionId);
    if (!target) return;

    const updatedItems = target.actionItems.map(a =>
      a.id === actionId ? { ...a, completed: !a.completed } : a
    );

    // Optimistic update
    setSessions(prev =>
      prev.map(s => s.id === sessionId ? { ...s, actionItems: updatedItems } : s)
    );

    await supabase
      .from("coaching_sessions")
      .update({ action_items: updatedItems })
      .eq("id", sessionId);
  };

  const selected = sessions.find(s => s.id === selectedId) ?? null;

  const isReady = !authLoading && !loading;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden", gap: 0, margin: "-32px" }}>
      {showAdd && isAdmin && (
        <AddSessionModal
          isAdmin={isAdmin}
          onClose={() => setShowAdd(false)}
          onSave={addSession}
        />
      )}

      {/* Left sidebar list */}
      <div style={{
        width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(2,8,24,0.35)",
      }}>
        {/* Header */}
        <div style={{ padding: "28px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(194,159,96,0.65)" }}>
              My Journey
            </div>
            {isAdmin && (
              <button onClick={() => setShowAdd(true)} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: "linear-gradient(180deg, #DEC272 0%, #A07A28 50%, #D4B462 100%)",
                color: "#08203A", border: "1px solid rgba(240,220,170,0.4)",
                boxShadow: "0 2px 0 rgba(20,12,0,0.7), 0 4px 8px rgba(0,0,0,0.4)",
              }}>
                <Plus style={{ width: 10, height: 10 }} />
                Add
              </button>
            )}
          </div>
          <p style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, color: "rgba(222,211,200,0.45)", margin: 0 }}>
            {isReady
              ? `${sessions.length} coaching ${sessions.length === 1 ? "session" : "sessions"}`
              : "Loading…"
            }
          </p>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {!isReady ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 32 }}>
              <Loader2 style={{ width: 20, height: 20, color: "rgba(194,159,96,0.4)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ padding: "16px 12px", fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, color: "rgba(255,100,100,0.7)" }}>
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: "24px 12px", textAlign: "center", fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(222,211,200,0.35)" }}>
              No sessions yet
            </div>
          ) : (
            sessions.map(s => {
              const isActive = s.id === selectedId;
              const completedCount = s.actionItems.filter(a => a.completed).length;
              return (
                <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                  width: "100%", textAlign: "left", padding: "12px 12px",
                  borderRadius: 8, marginBottom: 3, cursor: "pointer",
                  background: isActive ? "rgba(2,12,30,0.55)" : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  borderTop: isActive ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
                  boxShadow: isActive ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.3)" : "none",
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, color: "rgba(194,159,96,0.55)", fontWeight: 700, letterSpacing: "0.12em" }}>
                      {formatDateShort(s.date)}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "2px 7px", borderRadius: 10,
                      background: s.sessionType === "group" ? "rgba(0,180,200,0.1)" : "rgba(194,159,96,0.07)",
                      border: `1px solid ${s.sessionType === "group" ? "rgba(0,200,220,0.18)" : "rgba(194,159,96,0.15)"}`,
                      fontSize: 7.5, fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: s.sessionType === "group" ? "rgba(0,200,220,0.7)" : "rgba(194,159,96,0.65)",
                    }}>
                      {s.sessionType === "group" ? <Users style={{ width: 8, height: 8 }} /> : <User style={{ width: 8, height: 8 }} />}
                      {s.sessionType}
                    </span>
                  </div>
                  <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? "#DED3C8" : "rgba(222,211,200,0.75)", marginBottom: 5, lineHeight: 1.3 }}>
                    {s.title}
                  </div>
                  {isAdmin && s.memberEmail && (
                    <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, color: "rgba(180,140,255,0.5)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.memberEmail}
                    </div>
                  )}
                  {s.actionItems.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{
                        height: 3, flex: 1, borderRadius: 2,
                        background: "rgba(255,255,255,0.07)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%", borderRadius: 2,
                          width: `${(completedCount / s.actionItems.length) * 100}%`,
                          background: "rgba(29,116,88,0.7)",
                          transition: "width 0.3s",
                        }} />
                      </div>
                      <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, color: "rgba(222,211,200,0.35)", flexShrink: 0 }}>
                        {completedCount}/{s.actionItems.length}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right detail */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {!isReady ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 style={{ width: 28, height: 28, color: "rgba(194,159,96,0.3)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : selected ? (
          <SessionDetail session={selected} isAdmin={isAdmin} onToggleAction={toggleAction} />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 48 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(194,159,96,0.08)", border: "1px solid rgba(194,159,96,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Route style={{ width: 28, height: 28, color: "rgba(194,159,96,0.5)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 600, fontSize: 22, color: "#DED3C8", margin: "0 0 8px" }}>
                Your journey begins here
              </h2>
              <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.5)", margin: "0 0 24px" }}>
                Coaching sessions will appear here as they are added.
              </p>
              {isAdmin && (
                <button onClick={() => setShowAdd(true)} style={{
                  padding: "11px 24px", borderRadius: 8, cursor: "pointer",
                  fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)",
                  color: "#08203A", border: "1.5px solid rgba(240,220,170,0.4)",
                  boxShadow: "0 2px 0 rgba(20,12,0,0.85), 0 4px 12px rgba(0,0,0,0.5)",
                }}>
                  + Add First Session
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
