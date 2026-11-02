"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldX, Loader2, QrCode, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Factor } from "@supabase/supabase-js";
import PrivacySettings from "@/components/PrivacySettings";
import PortalCard, { PORTAL_ICON_COLOR } from "@/components/PortalCard";

type EnrollStep = "idle" | "qr" | "verify" | "done";

export default function SettingsPage() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [enrollStep, setEnrollStep] = useState<EnrollStep>("idle");
  const [enrollId, setEnrollId] = useState("");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [unenrollId, setUnenrollId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFactors = async () => {
    setLoadingFactors(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.all ?? []);
    setLoadingFactors(false);
  };

  useEffect(() => { loadFactors(); }, []);

  const startEnroll = async () => {
    setError("");
    setLoading(true);
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (err || !data) {
      setError(err?.message ?? "Could not start enrollment");
      setLoading(false);
      return;
    }
    setEnrollId(data.id);
    setQrUri(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrollStep("qr");
    setLoading(false);
  };

  const verifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollId,
      code: verifyCode.replace(/\s/g, ""),
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setEnrollStep("done");
    setSuccess("Two-factor authentication is now active.");
    setVerifyCode("");
    setLoading(false);
    loadFactors();
  };

  const unenroll = async (factorId: string) => {
    setError("");
    setUnenrollId(factorId);
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId });
    setUnenrollId("");
    if (err) {
      setError(err.message);
    } else {
      setSuccess("Two-factor authentication removed.");
      loadFactors();
    }
  };

  const hasTotp = factors.some(f => f.factor_type === "totp" && f.status === "verified");

  const inputStyle = {
    background: "rgba(1,4,14,0.8)",
    border: "1.5px solid rgba(194,159,96,0.38)",
    borderTop: "1.5px solid rgba(194,159,96,0.22)",
    color: "#DED3C8",
    fontFamily: "Avenir, Nunito, system-ui, sans-serif",
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.65), inset 0 1px 4px rgba(0,0,0,0.45)",
  };

  const btnStyle = {
    fontFamily: "Syne, system-ui, sans-serif",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    fontSize: "0.75rem",
    background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
    color: "#08203A",
    border: "none",
    borderTop: "1px solid rgba(240,215,150,0.5)",
    boxShadow: "inset 0 1px 0 rgba(240,220,170,0.4), 0 2px 0 rgba(20,12,0,0.85), 0 4px 0 rgba(20,12,0,0.65), 0 8px 20px rgba(0,0,0,0.5)",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
  };

  return (
    <div className="max-w-2xl space-y-6 md:space-y-7">
      <div className="animate-fade-in-up">
        <p style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", fontSize: "0.62rem", color: "#C29F60", marginBottom: "0.5rem", opacity: 0.85 }}>
          Your Account
        </p>
        <h1 style={{ fontFamily: '"Lora", Georgia, serif', fontWeight: 600, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#DED3C8", lineHeight: 1.1, marginBottom: "0.4rem" }}>
          Account Settings
        </h1>
      </div>

      {/* Two-Factor Authentication */}
      <PortalCard
        className="animate-fade-in-up animate-fade-in-up-delay-1"
        icon={hasTotp
          ? <ShieldCheck className="w-4 h-4" style={{ color: "#4ade80" }} />
          : <Shield className="w-4 h-4" style={{ color: PORTAL_ICON_COLOR }} />}
        title="Two-Factor Authentication"
        badge={hasTotp && (
            <span
              className="rounded-full px-3 py-1 text-xs"
              style={{
                background: "rgba(74,222,128,0.12)",
                border: "1px solid rgba(74,222,128,0.3)",
                color: "#4ade80",
                fontFamily: "Syne, system-ui, sans-serif",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Active
            </span>
        )}
      >

        {loadingFactors ? (
          <div className="flex items-center gap-2" style={{ color: "rgba(222,211,200,0.4)" }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontFamily: "Avenir, Nunito, system-ui, sans-serif", fontSize: "0.875rem" }}>
              Loading…
            </span>
          </div>
        ) : (
          <>
            {error && (
              <p className="mb-4 text-sm rounded-lg px-4 py-3" style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                {error}
              </p>
            )}
            {success && (
              <p className="mb-4 text-sm rounded-lg px-4 py-3" style={{ color: "#86efac", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.2)" }}>
                {success}
              </p>
            )}

            {/* Not enrolled */}
            {!hasTotp && enrollStep === "idle" && (
              <>
                <p
                  className="mb-5"
                  style={{
                    fontFamily: "Avenir, Nunito, system-ui, sans-serif",
                    color: "rgba(222,211,200,0.55)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  Add a second layer of security. After entering your password, you&apos;ll be asked for a
                  6-digit code from your authenticator app (Google Authenticator, Authy, or 1Password).
                </p>
                <button
                  onClick={startEnroll}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg transition-all"
                  style={btnStyle}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                  {loading ? "Setting up…" : "Enable Two-Factor Auth"}
                </button>
              </>
            )}

            {/* QR code display */}
            {enrollStep === "qr" && (
              <div className="space-y-5">
                <p style={{ fontFamily: "Avenir, Nunito, system-ui, sans-serif", color: "rgba(222,211,200,0.6)", fontSize: "0.875rem" }}>
                  Scan this QR code with your authenticator app, then enter the 6-digit code below to confirm.
                </p>
                <div
                  className="flex justify-center p-4 rounded-xl"
                  style={{ background: "#fff", width: "fit-content" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUri} alt="QR code for authenticator" width={180} height={180} />
                </div>
                {secret && (
                  <div>
                    <p style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.65rem", color: "rgba(222,211,200,0.45)", marginBottom: "0.4rem" }}>
                      Manual entry key
                    </p>
                    <code style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#C29F60", letterSpacing: "0.1em", background: "rgba(194,159,96,0.08)", padding: "4px 8px", borderRadius: "6px" }}>
                      {secret}
                    </code>
                  </div>
                )}
                <form onSubmit={verifyEnroll} className="space-y-4">
                  <div>
                    <label
                      htmlFor="verify-code"
                      className="block mb-2"
                      style={{
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        fontSize: "0.65rem",
                        color: "rgba(222,211,200,0.6)",
                      }}
                    >
                      Confirm Code
                    </label>
                    <input
                      id="verify-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      maxLength={7}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="000 000"
                      autoFocus
                      className="w-full max-w-xs rounded-lg px-4 py-3 text-center tracking-widest transition-all focus:outline-none"
                      style={{ ...inputStyle, fontSize: "1.4rem" }}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={loading || verifyCode.replace(/\s/g, "").length < 6}
                      className="flex items-center gap-2 px-5 py-3 rounded-lg disabled:opacity-50 transition-all"
                      style={btnStyle}
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      {loading ? "Verifying…" : "Confirm & Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEnrollStep("idle"); setError(""); setVerifyCode(""); }}
                      style={{
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "rgba(194,159,96,0.5)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Enrolled — show remove option */}
            {hasTotp && (
              <div className="space-y-4">
                <p style={{ fontFamily: "Avenir, Nunito, system-ui, sans-serif", color: "rgba(222,211,200,0.55)", fontSize: "0.9rem" }}>
                  Your account is protected with an authenticator app. You&apos;ll need your code each time you sign in.
                </p>
                <div className="flex flex-wrap gap-3">
                  {factors.filter(f => f.factor_type === "totp" && f.status === "verified").map(f => (
                    <button
                      key={f.id}
                      onClick={() => unenroll(f.id)}
                      disabled={unenrollId === f.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                      style={{
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fontSize: "0.7rem",
                        background: "rgba(248,113,113,0.06)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        color: "#fca5a5",
                        cursor: unenrollId ? "not-allowed" : "pointer",
                        opacity: unenrollId === f.id ? 0.6 : 1,
                      }}
                    >
                      {unenrollId === f.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldX size={13} />}
                      Remove Authenticator
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </PortalCard>

      <PrivacySettings />
    </div>
  );
}
