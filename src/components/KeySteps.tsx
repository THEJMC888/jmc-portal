"use client";

// Steps shown inside the sign in and password cards while the account key is
// set up or recovered. All copy follows the brand voice: no dashes or contractions.

import { useState } from "react";
import {
  PasswordSecrets, UnlockResult, confirmRecoveryPhrase, recoverWithPhrase,
  requestRewrapFromSignedInDevice, startFresh,
} from "@/lib/accountKeys";

const LABEL: React.CSSProperties = {
  fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.15em", fontSize: "0.65rem", color: "rgba(222,211,200,0.6)",
};
const BODY: React.CSSProperties = {
  fontFamily: "Avenir, Nunito, system-ui, sans-serif", color: "rgba(222,211,200,0.7)",
  fontSize: "0.85rem", lineHeight: 1.6,
};
const GOLD_BUTTON: React.CSSProperties = {
  width: "100%", padding: "0.9rem 1rem", borderRadius: 8, border: "none", cursor: "pointer",
  fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.14em", fontSize: "0.75rem", color: "#08203A",
  background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
  borderTop: "1px solid rgba(240,215,150,0.5)", borderBottom: "1px solid rgba(30,15,0,0.65)",
  boxShadow: "inset 0 1px 0 rgba(240,220,170,0.4), 0 2px 0 rgba(20,12,0,0.85), 0 4px 0 rgba(20,12,0,0.5), 0 8px 18px rgba(0,0,0,0.5)",
};
const QUIET_BUTTON: React.CSSProperties = {
  width: "100%", padding: "0.8rem 1rem", borderRadius: 8, cursor: "pointer", textAlign: "left",
  fontFamily: "Avenir, Nunito, system-ui, sans-serif", fontSize: "0.85rem", color: "#DED3C8",
  background: "rgba(1,4,14,0.55)", border: "1px solid rgba(194,159,96,0.3)",
};
const ERROR: React.CSSProperties = {
  color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
  borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.8rem",
};

// ─── Recovery phrase, shown once ──────────────────────────────────────────────
export function RecoveryPhraseStep({ userId, phrase, onDone }: { userId: string; phrase: string; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [copiedOnce, setCopiedOnce] = useState(false);
  const [busy, setBusy] = useState(false);
  const words = phrase.split(" ");

  // Some embedded browsers block the clipboard. Never let a failed copy look
  // like it worked, or a member may "save" whatever was on the clipboard before.
  const copy = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(phrase); ok = true; } catch { /* try the older way */ }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = phrase;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    setCopyFailed(!ok);
    if (ok) { setCopied(true); setCopiedOnce(true); setTimeout(() => setCopied(false), 2000); }
  };
  const done = async () => {
    setBusy(true);
    await confirmRecoveryPhrase(userId).catch(() => {});
    onDone();
  };

  return (
    <div className="space-y-4">
      <div style={LABEL}>Your recovery phrase</div>
      <p style={BODY}>
        Your journal and private work are encrypted on your own devices. Not even The Journeymen Collective can read them.
        If you ever forget your password, these 24 words are the only way back in. Write them down and keep them somewhere safe.
      </p>
      <ol
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "6px 10px",
          listStyle: "none", padding: "12px 14px", margin: 0, borderRadius: 8,
          background: "rgba(1,4,14,0.75)", border: "1px solid rgba(194,159,96,0.3)",
          fontFamily: "ui-monospace, Menlo, monospace", fontSize: "0.8rem", color: "#EDE5DC", userSelect: "all",
        }}
      >
        {words.map((w, i) => (
          <li key={i}><span style={{ color: "rgba(194,159,96,0.6)", display: "inline-block", width: 22 }}>{i + 1}</span>{w}</li>
        ))}
      </ol>
      <button type="button" onClick={copy} style={{ ...QUIET_BUTTON, textAlign: "center", fontSize: "0.75rem" }}>
        {copied ? "Copied" : "Copy the 24 words"}
      </button>
      {copyFailed && (
        <p style={ERROR}>This browser does not allow copying. Please write the 24 words down by hand, or open the portal in Safari or Chrome to copy them.</p>
      )}
      {copiedOnce && !copyFailed && (
        <p style={{ ...BODY, fontSize: "0.8rem" }}>Paste them somewhere safe now and check that all 24 words are there.</p>
      )}
      <label style={{ ...BODY, display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} style={{ marginTop: 4, accentColor: "#C29F60" }} />
        <span>I have saved my recovery phrase somewhere safe.</span>
      </label>
      <button type="button" onClick={done} disabled={!saved || busy} style={{ ...GOLD_BUTTON, opacity: saved ? 1 : 0.5, cursor: saved ? "pointer" : "not-allowed" }}>
        {busy ? "One moment" : "Continue >"}
      </button>
    </div>
  );
}

// ─── Password changed without this device holding the key ────────────────────
export function RecoverAccessStep({
  userId, secrets, onReady,
}: {
  userId: string;
  secrets: PasswordSecrets;
  /** phrase is set when a new key was made and its phrase must be shown. */
  onReady: (phrase?: string) => void;
}) {
  const [mode, setMode] = useState<"choose" | "phrase" | "elsewhere" | "fresh">("choose");
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async (run: () => Promise<UnlockResult>) => {
    setBusy(true);
    setError("");
    const r = await run();
    setBusy(false);
    if (r.status === "ready") onReady(r.phrase);
    else setError(r.status === "error" ? r.message : "Your content could not be opened.");
  };

  if (mode === "phrase") {
    return (
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handle(() => recoverWithPhrase(userId, phrase, secrets)); }}>
        <div style={LABEL}>Enter your recovery phrase</div>
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          rows={4}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="The 24 words, separated by spaces"
          style={{
            width: "100%", borderRadius: 8, padding: "12px 14px", resize: "vertical", outline: "none",
            background: "rgba(1,4,14,0.9)", border: "1.5px solid rgba(194,159,96,0.38)", color: "#DED3C8",
            fontFamily: "ui-monospace, Menlo, monospace", fontSize: "0.85rem",
          }}
        />
        {error && <p style={ERROR}>{error}</p>}
        <button type="submit" disabled={busy} style={GOLD_BUTTON}>{busy ? "Opening" : "Open my content >"}</button>
        <BackLink onClick={() => { setMode("choose"); setError(""); }} />
      </form>
    );
  }

  if (mode === "elsewhere") {
    return (
      <div className="space-y-4">
        <div style={LABEL}>Use your other device</div>
        <p style={BODY}>
          Open the portal on the phone or computer where you are still signed in. It will ask for your new password once,
          and then your content opens everywhere. When that is done, sign in here again.
        </p>
        <button type="button" onClick={() => onReady()} style={GOLD_BUTTON}>Continue to the portal &gt;</button>
        <BackLink onClick={() => setMode("choose")} />
      </div>
    );
  }

  if (mode === "fresh") {
    return (
      <div className="space-y-4">
        <div style={LABEL}>Start fresh</div>
        <p style={BODY}>
          Without your recovery phrase or a signed in device, your earlier journal entries and private work cannot be opened by anyone,
          including us. They stay sealed. You can begin again with a new key, and everything you create from now on will be yours as before.
        </p>
        {error && <p style={ERROR}>{error}</p>}
        <button type="button" disabled={busy} onClick={() => handle(() => startFresh(userId, secrets))} style={GOLD_BUTTON}>
          {busy ? "Preparing" : "Start fresh >"}
        </button>
        <BackLink onClick={() => { setMode("choose"); setError(""); }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div style={LABEL}>Open your private content</div>
      <p style={BODY}>
        Your password is new, so your encrypted content needs one more step on this device. Choose whichever you have.
      </p>
      <button type="button" style={QUIET_BUTTON} onClick={() => setMode("phrase")}>I have my 24 word recovery phrase</button>
      <button
        type="button"
        style={QUIET_BUTTON}
        onClick={async () => { await requestRewrapFromSignedInDevice(userId).catch(() => {}); setMode("elsewhere"); }}
      >
        I am still signed in on another device
      </button>
      <button type="button" style={{ ...QUIET_BUTTON, color: "rgba(222,211,200,0.6)" }} onClick={() => setMode("fresh")}>
        I have neither
      </button>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...BODY, background: "none", border: "none", cursor: "pointer", display: "block", margin: "0 auto", fontSize: "0.75rem", color: "rgba(194,159,96,0.8)" }}>
      Back
    </button>
  );
}
