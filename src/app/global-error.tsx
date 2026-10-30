"use client";

// Last-resort screen when the root layout itself fails, so it can't rely on
// the layout's background, fonts or components.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#02040C",
          color: "#DED3C8",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 16,
        }}
      >
        <div>
          <h1 style={{ fontWeight: 400, fontSize: "1.35rem", marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "rgba(222,211,200,0.6)", marginBottom: 24 }}>Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{ background: "#C29F60", color: "#140C00", border: "none", borderRadius: 8, padding: "0.8rem 1.4rem", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
