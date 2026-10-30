"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { supabase } from "@/lib/supabase";

const INPUT_STYLE: React.CSSProperties = {
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
};

const CARD_SHADOW = [
  "inset 0 4px 0 rgba(255,255,255,0.28)",
  "inset 0 2px 0 rgba(255,255,255,0.42)",
  "inset 0 1px 0 rgba(255,255,255,0.5)",
  "inset 2px 0 0 rgba(255,255,255,0.08)",
  "inset 0 -4px 10px rgba(0,0,0,0.7)",
  "inset -2px 0 6px rgba(0,0,0,0.3)",
  "6px 0 18px rgba(0,0,0,0.55)",
  "10px 0 30px rgba(0,0,0,0.35)",
  "0 2px 0 rgba(0,0,0,0.95)", "0 4px 0 rgba(0,0,0,0.88)", "0 6px 0 rgba(0,0,0,0.80)",
  "0 8px 0 rgba(0,0,0,0.72)", "0 10px 0 rgba(0,0,0,0.62)", "0 12px 0 rgba(0,0,0,0.52)",
  "0 14px 0 rgba(0,0,0,0.42)", "0 16px 0 rgba(0,0,0,0.32)", "0 18px 0 rgba(0,0,0,0.22)",
  "0 20px 0 rgba(0,0,0,0.14)", "0 22px 0 rgba(0,0,0,0.08)", "0 24px 0 rgba(0,0,0,0.04)",
  "0 26px 30px rgba(0,0,0,0.85)", "0 40px 70px rgba(0,0,0,0.7)", "0 70px 120px rgba(0,0,0,0.55)",
  "0 0 0 1px rgba(0,0,0,0.75)",
].join(", ");

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    // Supabase fires an AUTH_STATE_CHANGE with event=PASSWORD_RECOVERY
    // which sets the session from the URL hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Invite links from the Supabase dashboard arrive as implicit-flow tokens in
    // the hash (#access_token=…&type=invite), which the PKCE browser client
    // rejects — so set the session from them by hand.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error_description")) {
      setError(`${hash.get("error_description")} — please request a new link.`);
    } else if (hash.get("type") === "invite") {
      setIsInvite(true);
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (error) setError(`${error.message} — please request a new invite link.`);
          else setReady(true);
          window.history.replaceState(null, "", window.location.pathname);
        });
      }
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace("/dashboard");
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "transparent" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(29,116,88,0.12), transparent 70%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(194,159,96,0.06), transparent)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(194,159,96,0.4), transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(194,159,96,0.4), transparent)" }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <BrandLogo size="lg" showText={false} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-text-white.png"
            alt="The Journeymen Collective"
            className="mx-auto"
            style={{ width: 260, height: "auto", objectFit: "contain" }}
          />
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
          <div className="mx-auto w-14 h-px mt-4" style={{ background: "linear-gradient(to right, transparent, #C29F60, transparent)" }} />
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(175deg, rgba(45,108,195,0.98) 0%, rgba(28,72,148,0.99) 15%, rgba(10,26,78,1) 45%, rgba(3,9,28,1) 100%)",
            backdropFilter: "blur(32px) saturate(220%)",
            WebkitBackdropFilter: "blur(32px) saturate(220%)",
            borderTop: "2px solid rgba(255,255,255,0.48)",
            borderLeft: "1px solid rgba(255,255,255,0.22)",
            borderRight: "1.5px solid rgba(194,159,96,0.18)",
            borderBottom: "1.5px solid rgba(160,165,175,0.7)",
            boxShadow: CARD_SHADOW,
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
            {isInvite ? "Welcome to the Collective" : "Set new password"}
          </h2>
          <p
            style={{
              fontFamily: "Avenir, Nunito, system-ui, sans-serif",
              color: "rgba(222,211,200,0.55)",
              fontSize: "0.875rem",
              marginBottom: "1.75rem",
            }}
          >
            {!ready && error
              ? "This link can't be used."
              : isInvite
                ? (ready ? "Choose a password to finish setting up your account." : "Verifying your invite link…")
                : (ready ? "Choose a new password for your account." : "Verifying your reset link…")}
          </p>

          {!ready ? (
            <div style={{ textAlign: "center", color: error ? "#f87171" : "rgba(222,211,200,0.4)", fontFamily: "Syne, system-ui, sans-serif", fontSize: "0.8rem", padding: "2rem 0" }}>
              {error || "Loading…"}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="block mb-2"
                  style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "0.65rem", color: "rgba(222,211,200,0.6)" }}
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full rounded-lg px-4 py-3 pr-12 text-sm transition-all focus:outline-none"
                    style={INPUT_STYLE}
                    onFocus={(e) => { e.target.style.border = "1.5px solid rgba(194,159,96,0.75)"; e.target.style.borderTop = "1.5px solid rgba(194,159,96,0.5)"; }}
                    onBlur={(e) => { e.target.style.border = "1.5px solid rgba(194,159,96,0.38)"; e.target.style.borderTop = "1.5px solid rgba(194,159,96,0.22)"; }}
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
                <p style={{ fontFamily: "Avenir, Nunito, system-ui, sans-serif", fontSize: "0.72rem", color: "rgba(222,211,200,0.35)", marginTop: "0.4rem" }}>
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block mb-2"
                  style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "0.65rem", color: "rgba(222,211,200,0.6)" }}
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-3 text-sm transition-all focus:outline-none"
                  style={INPUT_STYLE}
                  onFocus={(e) => { e.target.style.border = "1.5px solid rgba(194,159,96,0.75)"; e.target.style.borderTop = "1.5px solid rgba(194,159,96,0.5)"; }}
                  onBlur={(e) => { e.target.style.border = "1.5px solid rgba(194,159,96,0.38)"; e.target.style.borderTop = "1.5px solid rgba(194,159,96,0.22)"; }}
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
                    "inset 0 -2px 4px rgba(0,0,0,0.25)",
                    "0 2px 0 rgba(20,12,0,0.85)", "0 4px 0 rgba(20,12,0,0.65)",
                    "0 6px 0 rgba(20,12,0,0.4)", "0 8px 0 rgba(20,12,0,0.2)",
                    "0 10px 20px rgba(0,0,0,0.6)", "0 4px 30px rgba(194,159,96,0.25)",
                  ].join(", "),
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {loading ? "Saving…" : "Set New Password >"}
              </button>
            </form>
          )}
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
