"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
        setLoading(false);
      }
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #08254D 0%, #040d1c 50%, #0B4B32 100%)",
      }}
    >
      {/* Soft radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(29,116,88,0.12), transparent 70%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(194,159,96,0.06), transparent)",
        }}
      />

      {/* Brand accent lines */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(194,159,96,0.4), transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(194,159,96,0.4), transparent)" }}
      />

      <div className="relative w-full max-w-md">
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
            background: "linear-gradient(175deg, rgba(35,90,168,0.97) 0%, rgba(20,55,120,0.99) 18%, rgba(8,22,65,1) 50%, rgba(3,9,28,1) 100%)",
            backdropFilter: "blur(28px) saturate(200%)",
            WebkitBackdropFilter: "blur(28px) saturate(200%)",
            borderTop: "2px solid rgba(255,255,255,0.38)",
            borderLeft: "1px solid rgba(255,255,255,0.18)",
            borderRight: "1px solid rgba(0,0,0,0.55)",
            borderBottom: "2px solid rgba(0,0,0,0.8)",
            boxShadow: [
              /* bright glass inner bevel — top face catching light */
              "inset 0 3px 0 rgba(255,255,255,0.22)",
              "inset 0 1px 0 rgba(255,255,255,0.35)",
              /* inner bottom cave shadow */
              "inset 0 -3px 6px rgba(0,0,0,0.6)",
              /* stacked cast layers — 16px of visible thickness */
              "0 2px 0 rgba(0,0,0,0.92)",
              "0 4px 0 rgba(0,0,0,0.82)",
              "0 6px 0 rgba(0,0,0,0.72)",
              "0 8px 0 rgba(0,0,0,0.62)",
              "0 10px 0 rgba(0,0,0,0.5)",
              "0 12px 0 rgba(0,0,0,0.38)",
              "0 14px 0 rgba(0,0,0,0.26)",
              "0 16px 0 rgba(0,0,0,0.14)",
              /* soft drop shadows bleeding out from the thickness */
              "0 18px 24px rgba(0,0,0,0.75)",
              "0 30px 60px rgba(0,0,0,0.65)",
              "0 60px 100px rgba(0,0,0,0.5)",
              /* crisp dark outline */
              "0 0 0 1px rgba(0,0,0,0.65)",
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
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p
            style={{
              fontFamily: "Avenir, Nunito, system-ui, sans-serif",
              color: "rgba(222,211,200,0.55)",
              fontSize: "0.875rem",
              marginBottom: "1.75rem",
            }}
          >
            {mode === "signin" ? "Enter the portal to clarity." : "Your private space awaits."}
          </p>

          {notice && (
            <p className="mb-4 text-sm rounded-lg px-4 py-3" style={{ color: "#86efac", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.2)" }}>
              {notice}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  background: "rgba(1,5,16,0.85)",
                  border: "1px solid rgba(0,0,0,0.6)",
                  borderTop: "1px solid rgba(0,0,0,0.8)",
                  color: "#DED3C8",
                  fontFamily: "Avenir, Nunito, system-ui, sans-serif",
                  boxShadow: [
                    "inset 0 2px 6px rgba(0,0,0,0.7)",
                    "inset 0 1px 3px rgba(0,0,0,0.5)",
                    "inset 0 0 0 1px rgba(0,0,0,0.3)",
                    "0 1px 0 rgba(255,255,255,0.04)",
                  ].join(", "),
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(194,159,96,0.45)";
                  e.target.style.boxShadow = [
                    "inset 0 2px 6px rgba(0,0,0,0.7)",
                    "inset 0 1px 3px rgba(0,0,0,0.5)",
                    "inset 0 0 0 1px rgba(0,0,0,0.3)",
                    "0 1px 0 rgba(255,255,255,0.04)",
                    "0 0 0 2px rgba(194,159,96,0.12)",
                  ].join(", ");
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(0,0,0,0.6)";
                  e.target.style.boxShadow = [
                    "inset 0 2px 6px rgba(0,0,0,0.7)",
                    "inset 0 1px 3px rgba(0,0,0,0.5)",
                    "inset 0 0 0 1px rgba(0,0,0,0.3)",
                    "0 1px 0 rgba(255,255,255,0.04)",
                  ].join(", ");
                }}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
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
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={mode === "signup" ? 8 : undefined}
                  className="w-full rounded-lg px-4 py-3 pr-12 text-sm transition-all focus:outline-none"
                  style={{
                    background: "rgba(1,5,16,0.85)",
                    border: "1px solid rgba(0,0,0,0.6)",
                    borderTop: "1px solid rgba(0,0,0,0.8)",
                    color: "#DED3C8",
                    fontFamily: "Avenir, Nunito, system-ui, sans-serif",
                    boxShadow: [
                      "inset 0 2px 6px rgba(0,0,0,0.7)",
                      "inset 0 1px 3px rgba(0,0,0,0.5)",
                      "inset 0 0 0 1px rgba(0,0,0,0.3)",
                      "0 1px 0 rgba(255,255,255,0.04)",
                    ].join(", "),
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(194,159,96,0.45)";
                    e.target.style.boxShadow = [
                      "inset 0 2px 6px rgba(0,0,0,0.7)",
                      "inset 0 1px 3px rgba(0,0,0,0.5)",
                      "inset 0 0 0 1px rgba(0,0,0,0.3)",
                      "0 1px 0 rgba(255,255,255,0.04)",
                      "0 0 0 2px rgba(194,159,96,0.12)",
                    ].join(", ");
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(0,0,0,0.6)";
                    e.target.style.boxShadow = [
                      "inset 0 2px 6px rgba(0,0,0,0.7)",
                      "inset 0 1px 3px rgba(0,0,0,0.5)",
                      "inset 0 0 0 1px rgba(0,0,0,0.3)",
                      "0 1px 0 rgba(255,255,255,0.04)",
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
              {mode === "signup" && (
                <p style={{ fontFamily: "Avenir, Nunito, system-ui, sans-serif", fontSize: "0.72rem", color: "rgba(222,211,200,0.35)", marginTop: "0.4rem" }}>
                  Minimum 8 characters
                </p>
              )}
            </div>

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
                  ? "linear-gradient(160deg, #A8894E, #B89860)"
                  : "linear-gradient(160deg, #D4B47A 0%, #C29F60 40%, #A8884A 100%)",
                color: "#06183A",
                boxShadow: loading ? "none" : [
                  "inset 0 1px 0 rgba(255,255,255,0.35)",  /* inner top bevel */
                  "inset 0 -2px 0 rgba(0,0,0,0.2)",        /* inner bottom shadow */
                  "0 4px 16px rgba(0,0,0,0.5)",            /* near drop */
                  "0 8px 32px rgba(0,0,0,0.4)",            /* ambient drop */
                  "0 4px 40px rgba(194,159,96,0.4)",       /* gold glow */
                  "0 2px 12px rgba(194,159,96,0.3)",       /* near gold glow */
                ].join(", "),
                textShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(160deg, #DEC080 0%, #CDA96A 40%, #B8924F 100%)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(160deg, #D4B47A 0%, #C29F60 40%, #A8884A 100%)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = [
                    "inset 0 1px 3px rgba(0,0,0,0.2)",
                    "0 2px 8px rgba(0,0,0,0.4)",
                    "0 2px 20px rgba(194,159,96,0.2)",
                  ].join(", ");
                }
              }}
              onMouseUp={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
            >
              {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : (mode === "signin" ? "Access The Portal Now" : "Create Account >")}
            </button>
          </form>

          <div
            className="mt-6 pt-6 text-center space-y-3"
            style={{ borderTop: "1px solid rgba(194,159,96,0.1)" }}
          >
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }}
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
              {mode === "signin" ? "New member? Create account >" : "Already have an account? Sign in >"}
            </button>
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
