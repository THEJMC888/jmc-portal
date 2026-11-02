"use client";

// Settings: encryption and recovery phrase, session timeout, download my
// data, delete my account. Copy follows the brand voice: no dashes or contractions.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, KeyRound, Loader2, Lock, Timer, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAccountKey, IDLE_TIMEOUT_KEY } from "@/lib/accountKeyContext";
import { issueNewRecoveryPhrase, signInWithDerivedPassword, signOutAndForgetKeys } from "@/lib/accountKeys";
import { forgetLocalVaultCopies } from "@/lib/vaultSync";
import { supabase } from "@/lib/supabase";
import { RecoveryPhraseStep } from "@/components/KeySteps";
import PortalCard, { PORTAL_ICON_COLOR } from "@/components/PortalCard";

const BODY: React.CSSProperties = { fontFamily: "Avenir, Nunito, system-ui, sans-serif", color: "rgba(222,211,200,0.6)", fontSize: "0.9rem", lineHeight: 1.6 };
const BUTTON: React.CSSProperties = {
  fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.72rem",
  background: "rgba(194,159,96,0.1)", border: "1px solid rgba(194,159,96,0.35)", color: "#C29F60", cursor: "pointer",
};
const DANGER: React.CSSProperties = { ...BUTTON, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.3)", color: "#fca5a5" };
const INPUT: React.CSSProperties = {
  background: "rgba(1,4,14,0.8)", border: "1.5px solid rgba(194,159,96,0.38)", color: "#DED3C8",
  fontFamily: "Avenir, Nunito, system-ui, sans-serif", borderRadius: 8, padding: "10px 14px", outline: "none", width: "100%",
};
const ERROR: React.CSSProperties = { color: "#f87171", fontSize: "0.85rem", fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

const TIMEOUTS = [
  { minutes: 0, label: "Never" },
  { minutes: 15, label: "After 15 minutes" },
  { minutes: 30, label: "After 30 minutes" },
  { minutes: 60, label: "After 1 hour" },
  { minutes: 240, label: "After 4 hours" },
];

export default function PrivacySettings() {
  const router = useRouter();
  const { user } = useAuth();
  const { contentKey, userId } = useAccountKey();
  const [phrase, setPhrase] = useState<string | null>(null);
  const [phraseError, setPhraseError] = useState("");
  const [timeout, setTimeoutMin] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteWord, setDeleteWord] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    try { setTimeoutMin(Number(localStorage.getItem(IDLE_TIMEOUT_KEY) ?? 0)); } catch { /* ignore */ }
  }, []);

  const chooseTimeout = (minutes: number) => {
    setTimeoutMin(minutes);
    try { localStorage.setItem(IDLE_TIMEOUT_KEY, String(minutes)); } catch { /* ignore */ }
  };

  const newPhrase = async () => {
    if (!userId) return;
    setPhraseError("");
    const p = await issueNewRecoveryPhrase(userId);
    if (p) setPhrase(p);
    else setPhraseError("Sign in again on this device to issue a new phrase.");
  };

  const download = async () => {
    if (!userId || !contentKey || !user?.email) return;
    setExporting(true);
    setExportError("");
    try {
      const { buildDataExport } = await import("@/lib/exportData");
      const blob = await buildDataExport(userId, user.email, contentKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `journeymen-collective-my-data-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setExportError("The download could not be prepared. Please try again.");
    }
    setExporting(false);
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || deleteWord !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");
    // Confirm it is really the member before erasing anything
    const check = await signInWithDerivedPassword(user.email, deletePassword);
    if (check.error) { setDeleteError("That password was not accepted."); setDeleting(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error ?? "Your account could not be deleted. Please try again.");
      setDeleting(false);
      return;
    }
    // Clear this device too
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("jmc_")).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    await forgetLocalVaultCopies();
    try { indexedDB.deleteDatabase("jmc-journal-e2ee"); } catch { /* none */ }
    await signOutAndForgetKeys();
    router.replace("/");
  };

  return (
    <>
      <PortalCard className="animate-fade-in-up animate-fade-in-up-delay-1" icon={<Lock className="w-4 h-4" style={{ color: PORTAL_ICON_COLOR }} />} title="Your Privacy">
        <p style={BODY} className="mb-4">
          Your journal, statements, vision videos, attunements and blueprint are encrypted on your own devices before they are saved.
          The portal holds only sealed copies, so no one at The Journeymen Collective can read them. Your password or your 24 word recovery phrase opens them on every device where you sign in.
        </p>
        {phrase ? (
          <RecoveryPhraseStep userId={userId ?? ""} phrase={phrase} onDone={() => setPhrase(null)} />
        ) : (
          <>
            <button type="button" onClick={newPhrase} disabled={!contentKey} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ ...BUTTON, opacity: contentKey ? 1 : 0.5 }}>
              <KeyRound size={13} /> Issue a new recovery phrase
            </button>
            <p style={{ ...BODY, fontSize: "0.8rem" }} className="mt-2">Your previous phrase stops working once you do.</p>
            {phraseError && <p style={ERROR} className="mt-2">{phraseError}</p>}
          </>
        )}
      </PortalCard>

      <PortalCard className="animate-fade-in-up animate-fade-in-up-delay-1" icon={<Timer className="w-4 h-4" style={{ color: PORTAL_ICON_COLOR }} />} title="Sign Out When Idle">
        <p style={BODY} className="mb-4">On this device, sign out and remove your key after a period without activity.</p>
        <select value={timeout} onChange={(e) => chooseTimeout(Number(e.target.value))} style={{ ...INPUT, maxWidth: 260 }}>
          {TIMEOUTS.map((t) => <option key={t.minutes} value={t.minutes}>{t.label}</option>)}
        </select>
      </PortalCard>

      <PortalCard className="animate-fade-in-up animate-fade-in-up-delay-1" icon={<Download className="w-4 h-4" style={{ color: PORTAL_ICON_COLOR }} />} title="Download My Data">
        <p style={BODY} className="mb-4">
          A zip of everything you have in the portal: journal entries with their photos and recordings, statements, vision videos, attunements, blueprint and your Journey notes. It is opened here on your device.
        </p>
        <button type="button" onClick={download} disabled={exporting || !contentKey} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ ...BUTTON, opacity: contentKey ? 1 : 0.5 }}>
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {exporting ? "Preparing" : "Download my data"}
        </button>
        {exportError && <p style={ERROR} className="mt-2">{exportError}</p>}
      </PortalCard>

      <PortalCard className="animate-fade-in-up animate-fade-in-up-delay-1" icon={<Trash2 className="w-4 h-4" style={{ color: "#fca5a5" }} />} title="Delete My Account">
        {!deleteOpen ? (
          <>
            <p style={BODY} className="mb-4">
              Permanently erase your account and everything the portal holds for you, including your Journey notes. This cannot be undone, so download your data first if you wish to keep it.
            </p>
            <button type="button" onClick={() => setDeleteOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={DANGER}>
              <Trash2 size={13} /> Delete my account
            </button>
          </>
        ) : (
          <form onSubmit={deleteAccount} className="space-y-3">
            <p style={BODY}>Enter your password and type DELETE to confirm.</p>
            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Password" autoComplete="current-password" required style={INPUT} />
            <input type="text" value={deleteWord} onChange={(e) => setDeleteWord(e.target.value)} placeholder="DELETE" autoCapitalize="characters" required style={INPUT} />
            {deleteError && <p style={ERROR}>{deleteError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={deleting || deleteWord !== "DELETE" || !deletePassword} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ ...DANGER, opacity: deleteWord === "DELETE" && deletePassword ? 1 : 0.5 }}>
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deleting ? "Deleting" : "Delete permanently"}
              </button>
              <button type="button" onClick={() => { setDeleteOpen(false); setDeleteError(""); }} style={{ ...BUTTON, background: "none", border: "none" }}>Cancel</button>
            </div>
          </form>
        )}
      </PortalCard>
    </>
  );
}
