"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, RefreshCw, Send, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ADMIN_EMAIL = "rng@thejourneymencollective.com";
const syne  = { fontFamily: "Syne, system-ui, sans-serif" };
const lora  = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };
const GOLD = "#C29F60";

interface Member {
  id: string;
  email: string;
  invited_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  status: "active" | "pending";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const smallButton: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "6px 10px", borderRadius: 8, cursor: "pointer",
  background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
  ...syne, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
};

export default function AdminMembersPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = session?.access_token;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/admin/invites", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (Array.isArray(data)) setMembers(data);
    else setError(data.error ?? "Couldn't load members.");
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!session) return;
    if (session.user?.email !== ADMIN_EMAIL) { router.replace("/dashboard"); return; }
    load();
  }, [session, router, load]);

  const invite = async (address: string, rowId?: string) => {
    setError(""); setNotice("");
    if (rowId) setBusyId(rowId); else setSending(true);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: address }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(`Invite sent to ${address}.`);
      if (!rowId) setEmail("");
      await load();
    } else {
      setError(data.error ?? "Couldn't send the invite.");
    }
    if (rowId) setBusyId(null); else setSending(false);
  };

  const withdraw = async (member: Member) => {
    if (!confirm(`Withdraw the invite for ${member.email}? Their invite link will stop working.`)) return;
    setError(""); setNotice("");
    setBusyId(member.id);
    const res = await fetch("/api/admin/invites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: member.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(`Invite for ${member.email} withdrawn.`);
      await load();
    } else {
      setError(data.error ?? "Couldn't withdraw the invite.");
    }
    setBusyId(null);
  };

  if (!session || session.user?.email !== ADMIN_EMAIL) return null;

  const pendingCount = members.filter(m => m.status === "pending").length;

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
          Invite Members
        </h1>
        <p style={{ ...avenir, color: "rgba(222,211,200,0.62)", fontSize: "0.9rem" }}>
          Invitees get an email with a link to choose their password and enter the portal.
        </p>
      </div>

      {/* Invite form */}
      <form
        className="card-luxury animate-fade-in-up"
        style={{ padding: "22px 20px" }}
        onSubmit={e => { e.preventDefault(); if (email.trim()) invite(email.trim()); }}
      >
        <label htmlFor="invite-email" style={{ ...syne, fontSize: "0.62rem", fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase" as const,
          color: "rgba(222,211,200,0.5)", display: "block", marginBottom: 8 }}>
          Email Address
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="member@example.com"
            style={{
              flex: 1, minWidth: 0, boxSizing: "border-box" as const,
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#DED3C8", fontSize: "0.88rem", ...avenir, outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={sending || !email.trim()}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 20px", borderRadius: 10, cursor: "pointer",
              background: `linear-gradient(180deg, #DEC272 0%, #A07A28 44%, #D4B462 86%)`,
              border: "none", color: "#08203A",
              ...syne, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em",
              opacity: sending || !email.trim() ? 0.5 : 1,
            }}
          >
            <UserPlus className="w-4 h-4" />
            {sending ? "Sending…" : "Send Invite"}
          </button>
        </div>
        {error && <p style={{ ...avenir, fontSize: "0.8rem", color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
        {notice && <p style={{ ...avenir, fontSize: "0.8rem", color: "#4ade80", marginTop: 12 }}>{notice}</p>}
      </form>

      {/* Member list */}
      <section className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.15rem", color: "#DED3C8" }}>
            Members
          </h2>
          {!loading && (
            <span style={{ ...avenir, fontSize: "0.75rem", color: "rgba(222,211,200,0.45)" }}>
              {members.length} total · {pendingCount} pending
            </span>
          )}
          <div className="flex-1 glow-line" />
          <button onClick={load} aria-label="Refresh" style={{ ...smallButton, color: "rgba(222,211,200,0.55)" }}>
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card-luxury animate-pulse" style={{ height: 60 }} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="card-luxury flex flex-col sm:flex-row sm:items-center gap-3" style={{ padding: "14px 18px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...avenir, fontSize: "0.9rem", color: "#DED3C8", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.email}
                  </p>
                  <p style={{ ...avenir, fontSize: "0.72rem", color: "rgba(222,211,200,0.45)" }}>
                    {m.status === "active"
                      ? `Last signed in ${formatDate(m.last_sign_in_at)}`
                      : `Invited ${formatDate(m.invited_at ?? m.created_at)} · hasn't signed in yet`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{
                    ...syne, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "4px 9px", borderRadius: 999,
                    color: m.status === "active" ? "#4ade80" : GOLD,
                    background: m.status === "active" ? "rgba(74,222,128,0.1)" : "rgba(194,159,96,0.12)",
                  }}>
                    {m.status === "active" ? "Active" : "Pending"}
                  </span>
                  {m.status === "pending" && (
                    <>
                      <button
                        onClick={() => invite(m.email, m.id)}
                        disabled={busyId === m.id}
                        style={{ ...smallButton, color: GOLD, opacity: busyId === m.id ? 0.5 : 1 }}
                      >
                        <Send className="w-3 h-3" /> Resend
                      </button>
                      <button
                        onClick={() => withdraw(m)}
                        disabled={busyId === m.id}
                        style={{ ...smallButton, color: "rgba(255,107,107,0.8)", opacity: busyId === m.id ? 0.5 : 1 }}
                      >
                        <X className="w-3 h-3" /> Withdraw
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
