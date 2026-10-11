"use client";

import { Wind } from "lucide-react";

export default function MeditationsPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 pb-24 md:pb-8">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(194,159,96,0.12), rgba(194,159,96,0.04))",
            border: "1px solid rgba(194,159,96,0.2)",
            boxShadow: "0 0 40px rgba(194,159,96,0.08)",
          }}
        >
          <Wind style={{ width: 36, height: 36, color: "rgba(194,159,96,0.6)" }} />
        </div>

        <div>
          <h1
            style={{
              fontFamily: "Lora, Georgia, serif",
              fontWeight: 400,
              fontSize: "1.75rem",
              color: "#DED3C8",
              marginBottom: "0.5rem",
            }}
          >
            Meditations
          </h1>
          <p
            style={{
              fontFamily: "Avenir, Nunito, system-ui, sans-serif",
              color: "rgba(222,211,200,0.45)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}
          >
            Guided meditations and breathwork sessions are coming soon.
          </p>
        </div>

        <div
          className="px-4 py-2 rounded-full"
          style={{
            fontFamily: "Syne, system-ui, sans-serif",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: "0.6rem",
            color: "rgba(194,159,96,0.5)",
            border: "1px solid rgba(194,159,96,0.18)",
          }}
        >
          Coming Soon
        </div>
      </div>
    </main>
  );
}
