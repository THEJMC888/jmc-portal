"use client";

// Holds the member's content key for the dashboard and shows the one time
// prompts around it: sign in again when this device has no key, and enter
// the new password when a reset on another device asked this one to re-wrap.

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";
import {
  type PasswordSecrets, checkDeviceKey, forgetDeviceKeys, signInWithDerivedPassword, signOutAndForgetKeys, unlockWithPassword,
} from "./accountKeys";
import { supabase } from "./supabase";
import { VAULT_EVENT, syncVault } from "./vaultSync";

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

/** Call reload whenever a sync brings in changes of these kinds from another device. */
export function useVaultRefresh(kinds: string[], reload: () => void) {
  const key = kinds.join(",");
  useEffect(() => {
    const wanted = key.split(",");
    const onSync = (e: Event) => {
      const changed = (e as CustomEvent<{ kinds: string[] }>).detail?.kinds ?? [];
      if (changed.some((k) => wanted.includes(k))) reload();
    };
    window.addEventListener(VAULT_EVENT, onSync);
    return () => window.removeEventListener(VAULT_EVENT, onSync);
  }, [key, reload]);
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

  const firstSyncDone = useVaultSync(state.status === "ready" ? userId : null, state.contentKey);
  useIdleTimeout(!!userId);

  return (
    <AccountKeyContext.Provider value={state}>
      {firstSyncDone ? children : <SyncingNotice />}
      {state.status === "locked" && <LockedOverlay waitingForOtherDevice={needsRewrap} />}
      {state.status === "ready" && needsRewrap && user?.email && userId && (
        <RewrapPrompt email={user.email} userId={userId} onDone={check} />
      )}
    </AccountKeyContext.Provider>
  );
}

// ─── Session timeout ──────────────────────────────────────────────────────────
// A per device choice in Settings. Activity in any tab of the portal counts.
export const IDLE_TIMEOUT_KEY = "jmc_idle_timeout_min";
const LAST_ACTIVE_KEY = "jmc_last_active";

function useIdleTimeout(active: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let lastWrite = 0;
    const mark = () => {
      const now = Date.now();
      if (now - lastWrite < 15_000) return;
      lastWrite = now;
      try { localStorage.setItem(LAST_ACTIVE_KEY, String(now)); } catch { /* ignore */ }
    };
    mark();
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const check = window.setInterval(async () => {
      let minutes = 0, last = Date.now();
      try {
        minutes = Number(localStorage.getItem(IDLE_TIMEOUT_KEY) ?? 0);
        last = Number(localStorage.getItem(LAST_ACTIVE_KEY) ?? Date.now());
      } catch { return; }
      if (minutes > 0 && Date.now() - last > minutes * 60_000) {
        window.clearInterval(check);
        await signOutAndForgetKeys();
        router.replace("/?timeout=1");
      }
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, mark));
      window.clearInterval(check);
    };
  }, [active, router]);
}

// ─── Vault sync ───────────────────────────────────────────────────────────────
const SYNCED_FLAG = (userId: string) => `jmc_vault_synced_${userId}`;

/**
 * Keeps Statements, Vision Videos, Attunements and Blueprint in step with
 * every other device: on load, when the tab regains focus, every 20 seconds
 * while visible, when it is hidden (to push edits), and on Realtime changes.
 * A device that has never synced waits for its first pull (at most 4 seconds)
 * so pages open with the member's content rather than an empty state.
 */
function useVaultSync(userId: string | null, contentKey: CryptoKey | null): boolean {
  const [firstDone, setFirstDone] = useState(() => {
    if (!userId) return true;
    try { return localStorage.getItem(SYNCED_FLAG(userId)) === "1"; } catch { return true; }
  });

  useEffect(() => {
    if (!userId || !contentKey) return;
    let cancelled = false;
    const run = () => syncVault(userId, contentKey)
      .then(() => { try { localStorage.setItem(SYNCED_FLAG(userId), "1"); } catch { /* ignore */ } })
      .catch(() => {});
    const first = run();
    const timeout = window.setTimeout(() => { if (!cancelled) setFirstDone(true); }, 4000);
    first.finally(() => { if (!cancelled) setFirstDone(true); });

    const onVisibility = () => run();
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") run(); }, 20_000);

    let debounce: number | undefined;
    const channel = supabase
      .channel(`vault-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_vault", filter: `user_id=eq.${userId}` }, () => {
        window.clearTimeout(debounce);
        debounce = window.setTimeout(run, 800);
      })
      .subscribe();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearTimeout(debounce);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(channel);
    };
  }, [userId, contentKey]);

  // Before the key is ready there is nothing to wait for
  return firstDone || !contentKey;
}

function SyncingNotice() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(194,159,96,0.3)", borderTopColor: "#C29F60" }} />
      <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.6)" }}>
        Bringing your work to this device
      </p>
    </div>
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
  const [code, setCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<PasswordSecrets | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const rewrap = async (s: PasswordSecrets) => {
    const u = await unlockWithPassword(userId, s);
    setBusy(false);
    if (u.status === "ready") onDone();
    else setError("This device could not update your key. Please try again.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (mfaFactorId && secrets) {
      // Signing in again started a fresh session: restore its second factor
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code: code.replace(/\s/g, "") });
      if (err) { setError(err.message); setBusy(false); return; }
      return rewrap(secrets);
    }
    // Signing in proves the new password before it wraps the key
    const r = await signInWithDerivedPassword(email, password);
    if (r.error || !r.secrets) { setError("That password was not accepted."); setBusy(false); return; }
    const { data } = await supabase.auth.getUser();
    if (data.user?.id !== userId) { await forgetDeviceKeys(); window.location.replace("/"); return; }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp[0]) {
        setSecrets(r.secrets);
        setMfaFactorId(factors.totp[0].id);
        setBusy(false);
        return;
      }
    }
    return rewrap(r.secrets);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(2,8,20,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Card>
        <form onSubmit={submit}>
          <h2 style={TITLE}>Your password was changed</h2>
          <p style={BODY}>
            Enter your new password here once. This device still holds your key, so your journal and private work will open on your other device too.
          </p>
          {mfaFactorId ? (
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              placeholder="Code from your authenticator app"
              required
              style={{ width: "100%", borderRadius: 8, padding: "11px 14px", marginBottom: 12, outline: "none", background: "rgba(1,4,14,0.9)", border: "1.5px solid rgba(194,159,96,0.38)", color: "#DED3C8", fontSize: 14 }}
            />
          ) : (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="New password"
              required
              style={{ width: "100%", borderRadius: 8, padding: "11px 14px", marginBottom: 12, outline: "none", background: "rgba(1,4,14,0.9)", border: "1.5px solid rgba(194,159,96,0.38)", color: "#DED3C8", fontSize: 14 }}
            />
          )}
          {error && <p style={{ ...BODY, color: "#f87171", margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" disabled={busy} style={BUTTON}>{busy ? "Updating" : "Update this device >"}</button>
        </form>
      </Card>
    </div>
  );
}
