"use client";

// Holds the member's content key for the dashboard and shows the one time
// prompts around it: sign in again when this device has no key, and enter
// the new password when a reset on another device asked this one to re-wrap.

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";
import { checkDeviceKey, forgetDeviceKeys, signInWithDerivedPassword, signOutAndForgetKeys, unlockWithPassword } from "./accountKeys";
import { supabase } from "./supabase";

interface AccountKeyState {
  /** null until the key is ready on this device. */
  contentKey: CryptoKey | null;
  userId: string | null;
  status: "checking" | "ready" | "locked";
}

const AccountKeyContext = createContext<AccountKeyState>({ contentKey: null, userId: null, status: "checking" });

export function useAccountKey() {
  return useContext(AccountKeyContext);
}

export function AccountKeyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AccountKeyState>({ contentKey: null, userId: null, status: "checking" });
  const [needsRewrap, setNeedsRewrap] = useState(false);
  const userId = user?.id ?? null;

  const check = useCallback(async () => {
    if (!userId) return;
    const r = await checkDeviceKey(userId);
    setNeedsRewrap(r.needsRewrap);
    setState((prev) => {
      const next = { contentKey: r.contentKey ?? null, userId, status: r.state } as AccountKeyState;
      return prev.contentKey === next.contentKey && prev.status === next.status && prev.userId === userId ? prev : next;
    });
  }, [userId]);

  useEffect(() => {
    check();
    const onFocus = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => { document.removeEventListener("visibilitychange", onFocus); window.removeEventListener("focus", onFocus); };
  }, [check]);

  return (
    <AccountKeyContext.Provider value={state}>
      {children}
      {state.status === "locked" && <LockedOverlay waitingForOtherDevice={needsRewrap} />}
      {state.status === "ready" && needsRewrap && user?.email && userId && (
        <RewrapPrompt email={user.email} userId={userId} onDone={check} />
      )}
    </AccountKeyContext.Provider>
  );
}

// ─── Shared card chrome ───────────────────────────────────────────────────────
function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{
      width: "100%", maxWidth: 440, borderRadius: 14, padding: "26px 28px",
      background: "linear-gradient(160deg, rgba(13,31,60,0.98) 0%, rgba(4,12,32,0.99) 100%)",
      borderTop: "1.5px solid rgba(255,255,255,0.14)", borderBottom: "1.5px solid rgba(0,0,0,0.5)",
      boxShadow: "0 24px 80px rgba(0,0,0,0.85)",
    }}>
      {children}
    </div>
  );
}
const TITLE: React.CSSProperties = { fontFamily: "Lora, Georgia, serif", fontSize: 19, fontWeight: 600, color: "#DED3C8", margin: "0 0 10px" };
const BODY: React.CSSProperties = { fontFamily: "Avenir, Nunito, system-ui, sans-serif", fontSize: 13.5, lineHeight: 1.65, color: "rgba(222,211,200,0.7)", margin: "0 0 18px" };
const BUTTON: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 8, border: "none", cursor: "pointer",
  fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 11,
  color: "#08203A", background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)",
};

function LockedOverlay({ waitingForOtherDevice }: { waitingForOtherDevice: boolean }) {
  const router = useRouter();
  const signInAgain = async () => {
    await signOutAndForgetKeys();
    router.replace("/?unlock=1");
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(2,8,20,0.9)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Card>
        <h2 style={TITLE}>Your private content is sealed</h2>
        <p style={BODY}>
          {waitingForOtherDevice
            ? "Open the portal on the device where you are still signed in and enter your new password there. Then sign in here again and everything will be waiting for you."
            : "Your journal and private work are encrypted with a key that only your password can open. Sign in once more on this device to open them."}
        </p>
        <button type="button" onClick={signInAgain} style={BUTTON}>Sign in &gt;</button>
      </Card>
    </div>
  );
}

function RewrapPrompt({ email, userId, onDone }: { email: string; userId: string; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    // Signing in proves the new password before it wraps the key
    const r = await signInWithDerivedPassword(email, password);
    if (r.error || !r.secrets) { setError("That password was not accepted."); setBusy(false); return; }
    const { data } = await supabase.auth.getUser();
    if (data.user?.id !== userId) { await forgetDeviceKeys(); window.location.replace("/"); return; }
    const u = await unlockWithPassword(userId, r.secrets);
    setBusy(false);
    if (u.status === "ready") onDone();
    else setError("This device could not update your key. Please try again.");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(2,8,20,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Card>
        <form onSubmit={submit}>
          <h2 style={TITLE}>Your password was changed</h2>
          <p style={BODY}>
            Enter your new password here once. This device still holds your key, so your journal and private work will open on your other device too.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="New password"
            required
            style={{ width: "100%", borderRadius: 8, padding: "11px 14px", marginBottom: 12, outline: "none", background: "rgba(1,4,14,0.9)", border: "1.5px solid rgba(194,159,96,0.38)", color: "#DED3C8", fontSize: 14 }}
          />
          {error && <p style={{ ...BODY, color: "#f87171", margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" disabled={busy} style={BUTTON}>{busy ? "Updating" : "Update this device >"}</button>
        </form>
      </Card>
    </div>
  );
}
