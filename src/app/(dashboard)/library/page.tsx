"use client";

const syne  = { fontFamily: "Syne, system-ui, sans-serif" };
const lora  = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

const GOLD = "#C29F60";

export default function LibraryPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const,
          letterSpacing: "0.22em", fontSize: "0.62rem", color: GOLD, marginBottom: "0.5rem", opacity: 0.85 }}>
          Course Library
        </p>
        <h1 style={{ ...lora, fontWeight: 600, fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          color: "#DED3C8", lineHeight: 1.1, marginBottom: "0.4rem" }}>
          Your Journeys
        </h1>
      </div>

      {/* Coming Soon */}
      <div
        className="card-luxury animate-fade-in-up"
        style={{ padding: "64px 32px", textAlign: "center" as const }}
      >
        {/* Gold accent top line */}
        <div style={{
          width: 48, height: 2, margin: "0 auto 28px",
          background: "linear-gradient(90deg, transparent, rgba(194,159,96,0.7), transparent)",
          borderRadius: 2,
        }} />

        <p style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const,
          letterSpacing: "0.28em", fontSize: "0.62rem", color: GOLD, marginBottom: 16, opacity: 0.85 }}>
          Coming Soon
        </p>
        <p style={{ ...avenir, color: "rgba(222,211,200,0.45)", fontSize: "0.88rem", maxWidth: 360, margin: "0 auto" }}>
          Your course library is being prepared. Check back shortly.
        </p>

        <div style={{
          width: 48, height: 2, margin: "28px auto 0",
          background: "linear-gradient(90deg, transparent, rgba(194,159,96,0.7), transparent)",
          borderRadius: 2,
        }} />
      </div>
    </div>
  );
}
