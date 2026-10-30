"use client";

import Link from "next/link";
import { ArrowRight, NotebookPen, Route, Sparkles, Fingerprint, Wind, GraduationCap } from "lucide-react";
import AttunementDashboardCard from "@/components/AttunementDashboardCard";

const syne = { fontFamily: "Syne, system-ui, sans-serif" };
const lora = { fontFamily: '"Lora", Georgia, serif' };
const avenir = { fontFamily: "Avenir, Nunito, system-ui, sans-serif" };

const PORTAL_LINKS = [
  { label: "Journal", description: "Reflect and capture what's moving through you.", href: "/journal", icon: NotebookPen },
  { label: "My Journey", description: "Revisit your coaching sessions and insights.", href: "/journey", icon: Route },
  { label: "Vision Video", description: "Bring your statements to life on screen.", href: "/vision", icon: Sparkles },
  { label: "My Blueprint", description: "Your personal design and documents.", href: "/blueprint", icon: Fingerprint },
  { label: "Meditations", description: "Guided practices to settle and attune.", href: "/meditations", icon: Wind },
  { label: "Course Library", description: "Your courses are being prepared.", href: "/library", icon: GraduationCap, comingSoon: true },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      {/* Hero row: Welcome copy (left) ‖ Primary Attunement (right) */}
      <div className="animate-fade-in-up flex flex-col md:flex-row gap-4 md:gap-5" style={{ alignItems: "stretch" }}>
        {/* Welcome text — natural width, vertically centred */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.22em", fontSize: "0.62rem", color: "#C29F60", marginBottom: "0.5rem", opacity: 0.85 }}>
            Member Portal
          </p>
          <h1 style={{ ...lora, fontWeight: 600, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#DED3C8", lineHeight: 1.1, marginBottom: "0.4rem" }}>
            Welcome Back
          </h1>
          <p style={{ ...avenir, color: "rgba(222,211,200,0.62)", fontSize: "0.9rem" }}>
            Continue your journey where you left off.
          </p>
        </div>

        {/* Primary Attunement — fills the remaining width, lowered to clear nav bar */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 10 }}>
          <AttunementDashboardCard />
        </div>
      </div>

      {/* Explore the portal */}
      <section className="animate-fade-in-up animate-fade-in-up-delay-1">
        <div className="flex items-center gap-3 mb-5">
          <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.15rem", color: "#DED3C8" }}>
            Explore Your Portal
          </h2>
          <div className="flex-1 glow-line" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {PORTAL_LINKS.map(({ label, description, href, icon: Icon, comingSoon }) => (
            <Link
              key={href}
              href={href}
              className="card-luxury p-4 md:p-5 transition-all group block"
              style={{ textDecoration: "none", opacity: comingSoon ? 0.7 : 1 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(194,159,96,0.1)", boxShadow: "0 0 12px rgba(194,159,96,0.12)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#C29F60" }} />
                </div>
                <h3 style={{ ...lora, fontWeight: 600, fontSize: "0.95rem", color: "#DED3C8", flex: 1 }}>
                  {label}
                </h3>
                {comingSoon ? (
                  <span style={{ ...syne, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontSize: "0.55rem", color: "rgba(194,159,96,0.7)" }}>
                    Coming Soon
                  </span>
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: "#C29F60" }} />
                )}
              </div>
              <p style={{ ...avenir, fontSize: "0.78rem", color: "rgba(222,211,200,0.5)" }}>
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
