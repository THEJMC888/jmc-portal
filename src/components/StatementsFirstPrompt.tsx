"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

/** Pass onClose to show this over the page; without it, it sits in the page. */
export default function StatementsFirstPrompt({ onClose }: { onClose?: () => void }) {
  const router = useRouter();

  const card = (
    <div
      className="card-luxury text-center"
      onClick={(e) => e.stopPropagation()}
      style={{ position: "relative", padding: "36px 28px", maxWidth: 420, width: "100%" }}
    >
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 16, background: "none", border: "none", cursor: "pointer",
            color: "rgba(222,211,200,0.4)", fontSize: 18, lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <Lock style={{ width: 32, height: 32, color: "rgba(194,159,96,0.6)" }} />
      </div>
      <h2 style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 600, fontSize: 22, color: "#DED3C8", lineHeight: 1.2, marginBottom: 14 }}>
        Complete My Statements First
      </h2>
      <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.65)", lineHeight: 1.75, marginBottom: 30 }}>
        The Vision Video Editor is built on the foundation of your personal statements: who you are being and what you are doing in each area of your life. Complete My Statements to unlock the editor.
      </p>
      <button
        onClick={() => { onClose?.(); router.push("/statements"); }}
        style={{
          background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
          border: "none",
          color: "#08203A",
          boxShadow: [
            "inset 0 1px 0 rgba(240,220,170,0.4)",
            "inset 0 -2px 4px rgba(0,0,0,0.25)",
            "0 2px 0 rgba(20,12,0,0.85)", "0 4px 0 rgba(20,12,0,0.5)",
            "0 6px 0 rgba(20,12,0,0.25)", "0 8px 16px rgba(0,0,0,0.5)",
          ].join(", "),
          cursor: "pointer",
          borderRadius: 8,
          padding: "11px 28px",
          fontFamily: "Syne, system-ui, sans-serif",
          fontWeight: 700, fontSize: 12,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}
      >
        Begin My Statements →
      </button>
    </div>
  );

  if (!onClose) return <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>{card}</div>;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200, padding: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(2,8,20,0.75)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {card}
    </div>
  );
}
