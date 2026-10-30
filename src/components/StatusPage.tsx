import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

interface StatusPageProps {
  title: string;
  message: string;
  /** Optional primary action (e.g. "Try again") rendered before the home link */
  action?: { label: string; onClick: () => void };
}

const BUTTON_STYLE: React.CSSProperties = {
  fontFamily: "Syne, system-ui, sans-serif",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontSize: "0.7rem",
  padding: "0.8rem 1.4rem",
  borderRadius: 8,
  cursor: "pointer",
};

// Shared layout for the 404 and error screens so they match the portal look.
export default function StatusPage({ title, message, action }: StatusPageProps) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          background: "rgba(2,4,12,0.6)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(194,159,96,0.22)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex justify-center mb-6">
          <BrandLogo size="md" showText={false} />
        </div>
        <h1
          style={{
            fontFamily: "Syne, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: "1.35rem",
            color: "#DED3C8",
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: "Avenir, Nunito, system-ui, sans-serif",
            color: "rgba(222,211,200,0.6)",
            fontSize: "0.9rem",
            marginBottom: "1.75rem",
          }}
        >
          {message}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              style={{
                ...BUTTON_STYLE,
                background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)",
                color: "#140C00",
                border: "none",
              }}
            >
              {action.label}
            </button>
          )}
          <Link
            href="/dashboard"
            style={{
              ...BUTTON_STYLE,
              color: "#C29F60",
              border: "1px solid rgba(194,159,96,0.4)",
            }}
          >
            Back to the portal
          </Link>
        </div>
      </div>
    </main>
  );
}
