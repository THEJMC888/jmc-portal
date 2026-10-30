"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import PhotoSlideshow from "@/components/PhotoSlideshow";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  // Redirect if already signed in
  useEffect(() => {
    // Invite / password links can land on the Site URL — send them on to choose a password
    const hash = window.location.hash;
    if (hash.includes("type=invite") || hash.includes("type=recovery") || hash.includes("error_description")) {
      router.replace(`/auth/reset-password${hash}`);
      return;
    }
    // "Send me a new link" from the password page opens the reset form directly
    if (new URLSearchParams(window.location.search).get("forgot") === "1") {
      setMode("forgot");
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setNotice("Check your email for a password reset link.");
        setMode("signin");
      }
      setLoading(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totp = factors?.totp[0];
          if (totp) {
            setMfaFactorId(totp.id);
            setMfaStep(true);
            setLoading(false);
            return;
          }
        }
        if (!keepSignedIn) {
          window.addEventListener("beforeunload", () => {
            supabase.auth.signOut();
          });
        }
        router.push("/dashboard");
      }
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId!,
      code: mfaCode.replace(/\s/g, ""),
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "transparent" }}
    >
      {/* Awe-inspiring nature photo slideshow */}
      <PhotoSlideshow interval={60000} transitionMs={2500} />

      {/* Dark cinematic overlay — keeps card + logo readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(2,5,18,0.42) 0%, rgba(2,5,18,0.28) 45%, rgba(2,5,18,0.48) 100%)",
          zIndex: 1,
        }}
      />

      {/* Soft radial glow + brand accents + card — all above the overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(29,116,88,0.12), transparent 70%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(194,159,96,0.06), transparent)",
        }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(194,159,96,0.4), transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(194,159,96,0.4), transparent)" }} />
      </div>

      <div className="relative w-full max-w-md" style={{ zIndex: 2 }}>
        {/* Logo & Brand Identity */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <BrandLogo size="lg" showText={false} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-text-white.png"
              alt="The Journeymen Collective"
              style={{ width: 260, height: "auto", objectFit: "contain" }}
            />
          </div>
          <p
            style={{
              fontFamily: "Syne, system-ui, sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              fontSize: "0.62rem",
              color: "#C29F60",
              marginTop: "0.5rem",
            }}
          >
            Member Portal
          </p>
          <div
            className="mx-auto w-14 h-px mt-4"
            style={{ background: "linear-gradient(to right, transparent, #C29F60, transparent)" }}
          />
        </div>

        {/* Login / Sign-up Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(175deg, rgba(45,108,195,0.55) 0%, rgba(28,72,148,0.60) 15%, rgba(10,26,78,0.70) 45%, rgba(3,9,28,0.78) 100%)",
            backdropFilter: "blur(32px) saturate(220%)",
            WebkitBackdropFilter: "blur(32px) saturate(220%)",
            borderTop: "2px solid rgba(255,255,255,0.48)",
            borderLeft: "1px solid rgba(255,255,255,0.22)",
            borderRight: "1.5px solid rgba(194,159,96,0.18)",
            borderBottom: "1.5px solid rgba(160,165,175,0.7)",
            boxShadow: [
              /* specular top-face highlights — glass catching overhead light */
              "inset 0 4px 0 rgba(255,255,255,0.28)",
              "inset 0 2px 0 rgba(255,255,255,0.42)",
              "inset 0 1px 0 rgba(255,255,255,0.5)",
              /* inner left edge light */
              "inset 2px 0 0 rgba(255,255,255,0.08)",
              /* inner bottom + right cave shadow */
              "inset 0 -4px 10px rgba(0,0,0,0.7)",
              "inset -2px 0 6px rgba(0,0,0,0.3)",
              /* right-side cast shadow for definition */
              "6px 0 18px rgba(0,0,0,0.55)",
              "10px 0 30px rgba(0,0,0,0.35)",
              /* stacked cast layers — 24px of visible thickness */
              "0 2px 0 rgba(0,0,0,0.95)",
              "0 4px 0 rgba(0,0,0,0.88)",
              "0 6px 0 rgba(0,0,0,0.80)",
              "0 8px 0 rgba(0,0,0,0.72)",
              "0 10px 0 rgba(0,0,0,0.62)",
              "0 12px 0 rgba(0,0,0,0.52)",
              "0 14px 0 rgba(0,0,0,0.42)",
              "0 16px 0 rgba(0,0,0,0.32)",
              "0 18px 0 rgba(0,0,0,0.22)",
              "0 20px 0 rgba(0,0,0,0.14)",
              "0 22px 0 rgba(0,0,0,0.08)",
              "0 24px 0 rgba(0,0,0,0.04)",
              /* large soft drop shadows */
              "0 26px 30px rgba(0,0,0,0.85)",
              "0 40px 70px rgba(0,0,0,0.7)",
              "0 70px 120px rgba(0,0,0,0.55)",
              /* crisp dark outline */
              "0 0 0 1px rgba(0,0,0,0.75)",
            ].join(", "),
          }}
        >
          <h2
            style={{
              fontFamily: "Syne, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: "1.25rem",
              color: "#DED3C8",
              marginBottom: "0.25rem",
            }}
          >
            {mfaStep ? "Two-factor auth" : mode === "signin" ? "Welcome back" : "Reset your password"}
          </h2>
          {!mfaStep && mode === "forgot" && (
            <p
              style={{
                fontFamily: "Avenir, Nunito, system-ui, sans-serif",
                color: "rgba(222,211,200,0.55)",
                fontSize: "0.875rem",
                marginBottom: "1.75rem",
              }}
            >
              Enter your email and we&apos;ll send you a reset link.
            </p>
          )}
          {mfaStep && (
            <p
              style={{
                fontFamily: "Avenir, Nunito, system-ui, sans-serif",
                color: "rgba(222,211,200,0.55)",
                fontSize: "0.875rem",
                marginBottom: "1.75rem",
              }}
            >
              Open your authenticator app and enter the 6-digit code.
            </p>
          )}

          {notice && (
            <p className="mb-4 text-sm rounded-lg px-4 py-3" style={{ color: "#86efac", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.2)" }}>
              {notice}
            </p>
          )}

          {mfaStep && (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="mfa-code"
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
                  Authenticator Code
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  maxLength={7}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000 000"
                  autoFocus
                  className="w-full rounded-lg px-4 py-3 text-sm text-center tracking-widest transition-all focus:outline-none"
                  style={{
                    background: "rgba(1,4,14,0.9)",
                    border: "1.5px solid rgba(194,159,96,0.38)",
                    borderTop: "1.5px solid rgba(194,159,96,0.22)",
                    color: "#DED3C8",
                    fontFamily: "Avenir, Nunito, system-ui, sans-serif",
                    fontSize: "1.5rem",
                    letterSpacing: "0.35em",
                    boxShadow: ["inset 0 2px 8px rgba(0,0,0,0.75)", "inset 0 1px 4px rgba(0,0,0,0.55)"].join(", "),
                  }}
                  required
                />
              </div>
              {error && (
                <p className="text-sm rounded-lg px-4 py-3" style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || mfaCode.replace(/\s/g, "").length < 6}
                className="w-full py-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "Syne, system-ui, sans-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontSize: "0.8rem",
                  background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
                  color: "#08203A",
                  border: "none",
                  borderTop: "1px solid rgba(240,215,150,0.5)",
                  borderBottom: "1px solid rgba(30,15,0,0.65)",
                  boxShadow: ["inset 0 1px 0 rgba(240,220,170,0.4)", "0 2px 0 rgba(20,12,0,0.85)", "0 4px 0 rgba(20,12,0,0.65)", "0 10px 20px rgba(0,0,0,0.6)"].join(", "),
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {loading ? "Verifying..." : "Verify Code >"}
              </button>
            </form>
          )}

          {!mfaStep && <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
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
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm transition-all focus:outline-none"
                style={{
                  background: "rgba(1,4,14,0.9)",
                  border: "1.5px solid rgba(194,159,96,0.38)",
                  borderTop: "1.5px solid rgba(194,159,96,0.22)",
                  color: "#DED3C8",
                  fontFamily: "Avenir, Nunito, system-ui, sans-serif",
                  boxShadow: [
                    "inset 0 2px 8px rgba(0,0,0,0.75)",
                    "inset 0 1px 4px rgba(0,0,0,0.55)",
                    "0 1px 0 rgba(194,159,96,0.08)",
                  ].join(", "),
                }}
                onFocus={(e) => {
                  e.target.style.border = "1.5px solid rgba(194,159,96,0.75)";
                  e.target.style.borderTop = "1.5px solid rgba(194,159,96,0.5)";
                  e.target.style.boxShadow = [
                    "inset 0 2px 8px rgba(0,0,0,0.75)",
                    "inset 0 1px 4px rgba(0,0,0,0.55)",
                    "0 0 0 2px rgba(194,159,96,0.14)",
                    "0 0 12px rgba(194,159,96,0.1)",
                  ].join(", ");
                }}
                onBlur={(e) => {
                  e.target.style.border = "1.5px solid rgba(194,159,96,0.38)";
                  e.target.style.borderTop = "1.5px solid rgba(194,159,96,0.22)";
                  e.target.style.boxShadow = [
                    "inset 0 2px 8px rgba(0,0,0,0.75)",
                    "inset 0 1px 4px rgba(0,0,0,0.55)",
                    "0 1px 0 rgba(194,159,96,0.08)",
                  ].join(", ");
                }}
                required
              />
            </div>

            {mode !== "forgot" && <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  style={{
                    fontFamily: "Syne, system-ui, sans-serif",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontSize: "0.65rem",
                    color: "rgba(222,211,200,0.6)",
                  }}
                >
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}
                    style={{
                      fontFamily: "Syne, system-ui, sans-serif",
                      fontWeight: 600,
                      fontSize: "0.6rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "rgba(194,159,96,0.5)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C29F60")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(194,159,96,0.5)")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-3 pr-12 text-sm transition-all focus:outline-none"
                  style={{
                    background: "rgba(1,4,14,0.9)",
                    border: "1.5px solid rgba(194,159,96,0.38)",
                    borderTop: "1.5px solid rgba(194,159,96,0.22)",
                    color: "#DED3C8",
                    fontFamily: "Avenir, Nunito, system-ui, sans-serif",
                    boxShadow: [
                      "inset 0 2px 8px rgba(0,0,0,0.75)",
                      "inset 0 1px 4px rgba(0,0,0,0.55)",
                      "0 1px 0 rgba(194,159,96,0.08)",
                    ].join(", "),
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1.5px solid rgba(194,159,96,0.75)";
                    e.target.style.borderTop = "1.5px solid rgba(194,159,96,0.5)";
                    e.target.style.boxShadow = [
                      "inset 0 2px 8px rgba(0,0,0,0.75)",
                      "inset 0 1px 4px rgba(0,0,0,0.55)",
                      "0 0 0 2px rgba(194,159,96,0.14)",
                      "0 0 12px rgba(194,159,96,0.1)",
                    ].join(", ");
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1.5px solid rgba(194,159,96,0.38)";
                    e.target.style.borderTop = "1.5px solid rgba(194,159,96,0.22)";
                    e.target.style.boxShadow = [
                      "inset 0 2px 8px rgba(0,0,0,0.75)",
                      "inset 0 1px 4px rgba(0,0,0,0.55)",
                      "0 1px 0 rgba(194,159,96,0.08)",
                    ].join(", ");
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(222,211,200,0.4)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>}

            {mode === "signin" && (
              <label
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                onClick={() => setKeepSignedIn(k => !k)}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  background: keepSignedIn
                    ? "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)"
                    : "rgba(1,4,14,0.9)",
                  border: keepSignedIn ? "none" : "1.5px solid rgba(194,159,96,0.38)",
                  boxShadow: keepSignedIn
                    ? "0 1px 0 rgba(20,12,0,0.85), inset 0 1px 0 rgba(240,220,170,0.4)"
                    : "inset 0 2px 6px rgba(0,0,0,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {keepSignedIn && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#08203A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontFamily: "Syne, system-ui, sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(222,211,200,0.55)",
                  userSelect: "none",
                }}>
                  Keep me signed in
                </span>
              </label>
            )}

            {error && (
              <p className="text-sm rounded-lg px-4 py-3" style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Syne, system-ui, sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontSize: "0.8rem",
                background: loading
                  ? "linear-gradient(180deg, #B89A58 0%, #987A38 50%, #B89A58 100%)"
                  : "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
                color: "#08203A",
                border: "none",
                borderTop: "1px solid rgba(240,215,150,0.5)",
                borderBottom: "1px solid rgba(30,15,0,0.65)",
                boxShadow: loading ? "none" : [
                  "inset 0 1px 0 rgba(240,220,170,0.4)",
                  "inset 1px 0 0 rgba(220,195,140,0.12)",
                  "inset -1px 0 0 rgba(0,0,0,0.2)",
                  "inset 0 -2px 4px rgba(0,0,0,0.25)",
                  "0 2px 0 rgba(20,12,0,0.85)",
                  "0 4px 0 rgba(20,12,0,0.65)",
                  "0 6px 0 rgba(20,12,0,0.4)",
                  "0 8px 0 rgba(20,12,0,0.2)",
                  "0 10px 20px rgba(0,0,0,0.6)",
                  "0 4px 30px rgba(194,159,96,0.25)",
                ].join(", "),
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(180deg, #EACE7E 0%, #D4AC58 20%, #AC8430 44%, #CCA24E 66%, #E0C06E 86%, #ECD484 100%)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = [
                    "inset 0 2px 6px rgba(0,0,0,0.5)",
                    "inset 0 1px 0 rgba(255,248,200,0.3)",
                    "0 1px 0 rgba(40,20,0,0.9)",
                    "0 2px 8px rgba(0,0,0,0.5)",
                    "0 2px 20px rgba(194,159,60,0.25)",
                  ].join(", ");
                }
              }}
              onMouseUp={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
            >
              {loading
                ? (mode === "forgot" ? "Sending..." : "Signing in...")
                : (mode === "forgot" ? "Send Reset Link >" : "Enter The Portal To Clarity")}
            </button>
          </form>}

          <div
            className="mt-6 pt-6 text-center space-y-3"
            style={{ borderTop: "1px solid rgba(194,159,96,0.1)" }}
          >
            {!mfaStep && mode === "signin" ? (
              <p
                style={{
                  fontFamily: "Syne, system-ui, sans-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.65rem",
                  color: "rgba(222,211,200,0.4)",
                }}
              >
                Membership is by invitation
              </p>
            ) : !mfaStep ? (
              <button
                onClick={() => { setMode("signin"); setError(""); setNotice(""); }}
                style={{
                  fontFamily: "Syne, system-ui, sans-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.65rem",
                  color: "rgba(194,159,96,0.6)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C29F60")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(194,159,96,0.6)")}
              >
                {"< Back to sign in"}
              </button>
            ) : (
              <button
                onClick={() => { setMfaStep(false); setMfaCode(""); setError(""); }}
                style={{
                  fontFamily: "Syne, system-ui, sans-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.65rem",
                  color: "rgba(194,159,96,0.6)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C29F60")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(194,159,96,0.6)")}
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p
          className="text-center mt-8"
          style={{
            fontFamily: "Syne, system-ui, sans-serif",
            fontSize: "0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "rgba(222,211,200,0.25)",
          }}
        >
          © {new Date().getFullYear()} The Journeymen Collective™
        </p>
      </div>
    </main>
  );
}
