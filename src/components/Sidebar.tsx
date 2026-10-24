"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, PlaySquare, Users, Sparkles, BookOpen, LogOut, ChevronRight, NotebookPen, Wind, Lock, Route, Fingerprint, Eye } from "lucide-react";
import { clsx } from "clsx";
import BrandLogo from "./BrandLogo";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import PhotoSlideshow from "./PhotoSlideshow";

const ADMIN_EMAIL = "rng@thejourneymencollective.com";

interface NavChild { label: string; href: string; icon: React.ElementType; }
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  comingSoon?: boolean;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Video Library", href: "/library", icon: PlaySquare },
  {
    label: "Vision Video", href: "/vision", icon: Sparkles,
    children: [
      { label: "My Statements", href: "/statements", icon: BookOpen },
      { label: "Editor", href: "/vision", icon: Sparkles },
    ],
  },
  { label: "Journal", href: "/journal", icon: NotebookPen },
  { label: "My Journey", href: "/journey", icon: Route },
  { label: "My Blueprint", href: "/blueprint", icon: Fingerprint },
  { label: "Meditations", href: "/meditations", icon: Wind },
  { label: "Community", href: "/community", icon: Users, comingSoon: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [statementsReady, setStatementsReady] = useState(false);
  const [showEditorPrompt, setShowEditorPrompt] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jmc_statements_v1");
      if (raw) {
        const data = JSON.parse(raw) as Record<string, { being: string; doing: string; skipped?: boolean }>;
        setStatementsReady(Object.values(data).some((c) => c.being?.trim() || c.doing?.trim() || c.skipped));
      }
    } catch { /* ignore */ }
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside
      className="fixed top-0 left-0 h-full w-64 hidden md:flex flex-col z-40 overflow-hidden"
      style={{
        background: "#0d1f3c",
        borderTop: "none",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.06), 4px 0 40px rgba(0,0,0,0.6), 12px 0 80px rgba(0,0,0,0.4)",
      }}
    >
      {/* Nature photo background — full opacity */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <PhotoSlideshow interval={60000} transitionMs={2500} />
      </div>

      {/* Nav content — sits above the photo */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

      {/* Logo */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: "1px solid rgba(194,159,96,0.1)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="logo" style={{ width: 36, height: 36, borderRadius: "50%" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-text-white.png"
            alt="The Journeymen Collective"
            style={{ width: 140, height: "auto", objectFit: "contain" }}
          />
        </Link>
      </div>

      {/* Nav panel — no background overlay, photo shows through fully */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}>

      {/* Portal label */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-px"
            style={{ background: "linear-gradient(to right, rgba(194,159,96,0.25), transparent)" }}
          />
          <span
            style={{
              fontFamily: "Syne, system-ui, sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontSize: "0.6rem",
              color: "rgba(194,159,96,0.9)",
              textShadow: "none",
            }}
          >
            Portal
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "linear-gradient(to left, rgba(194,159,96,0.25), transparent)" }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isGroupActive = pathname === item.href || pathname.startsWith(item.href + "/")
            || (item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")));
          const isExactActive = pathname === item.href;

          return (
            <div key={item.href}>
              {/* Parent item */}
              <Link
                href={item.comingSoon ? "#" : item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  item.comingSoon && "opacity-40 cursor-not-allowed"
                )}
                style={
                  isGroupActive
                    ? {
                        // Active — navy glass lift, gold text
                        background: "rgba(2,12,30,0.45)",
                        borderTop: "1px solid rgba(255,255,255,0.18)",
                        borderLeft: "1px solid rgba(255,255,255,0.10)",
                        borderRight: "1px solid rgba(0,0,0,0.25)",
                        borderBottom: "1px solid rgba(0,0,0,0.30)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 8px rgba(0,0,0,0.35)",
                        color: "#C29F60",
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        textShadow: "0 1px 4px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.80)",
                      }
                    : {
                        // Inactive — 5% navy tint
                        background: "rgba(2,12,30,0.05)",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                        borderRight: "1px solid rgba(0,0,0,0.10)",
                        borderBottom: "1px solid rgba(0,0,0,0.15)",
                        color: "rgba(222,211,200,0.92)",
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 2px 14px rgba(0,0,0,0.85), 0 4px 20px rgba(0,0,0,0.6)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isGroupActive && !item.comingSoon) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(2,12,30,0.12)";
                    (e.currentTarget as HTMLElement).style.borderTopColor = "rgba(255,255,255,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGroupActive && !item.comingSoon) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(2,12,30,0.05)";
                    (e.currentTarget as HTMLElement).style.borderTopColor = "rgba(255,255,255,0.08)";
                  }
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.95)) drop-shadow(0 2px 6px rgba(0,0,0,0.8))" }}
                />
                <span className="flex-1">{item.label}</span>
                {item.comingSoon && (
                  <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.55rem", color: "rgba(194,159,96,0.4)" }}>
                    Soon
                  </span>
                )}
                {isGroupActive && !item.comingSoon && (
                  <ChevronRight
                    className="w-3 h-3"
                    style={{ transform: item.children ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                  />
                )}
              </Link>

              {/* Sub-items — shown when parent group is active */}
              {item.children && isGroupActive && (
                <div style={{ marginTop: 14, marginBottom: 6, paddingLeft: 16 }}>
                  <div style={{
                    borderLeft: "1px solid rgba(194,159,96,0.18)",
                    paddingLeft: 12,
                    display: "flex", flexDirection: "column", gap: 1,
                  }}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href || (child.href !== item.href && pathname.startsWith(child.href + "/"));
                      const isEditorLink = child.href === "/vision";
                      const locked = isEditorLink && !statementsReady;
                      return locked ? (
                          <button
                            key={child.href}
                            onClick={() => setShowEditorPrompt(true)}
                            style={{
                              width: "100%", textAlign: "left", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "9px 12px", borderRadius: 6,
                              transition: "all 0.15s",
                              background: "rgba(2,12,30,0.05)",
                              borderTop: "1px solid rgba(255,255,255,0.07)",
                              borderLeft: "1px solid rgba(255,255,255,0.04)",
                              borderRight: "1px solid rgba(0,0,0,0.10)",
                              borderBottom: "1px solid rgba(0,0,0,0.14)",
                              color: "rgba(222,211,200,0.38)",
                              fontFamily: "Syne, system-ui, sans-serif",
                              fontWeight: 600,
                              fontSize: "0.82rem",
                              textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 2px 14px rgba(0,0,0,0.85), 0 4px 20px rgba(0,0,0,0.6)",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(2,12,30,0.12)";
                              (e.currentTarget as HTMLElement).style.borderTopColor = "rgba(255,255,255,0.12)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(2,12,30,0.05)";
                              (e.currentTarget as HTMLElement).style.borderTopColor = "rgba(255,255,255,0.07)";
                            }}
                          >
                            <Lock style={{ width: 12, height: 12, flexShrink: 0, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.95))" }} />
                            <span style={{ flex: 1 }}>{child.label}</span>
                          </button>
                        ) : (
                          <Link
                            key={child.href}
                            href={child.href}
                            style={
                              childActive
                                ? {
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "9px 12px", borderRadius: 6,
                                    textDecoration: "none", transition: "all 0.15s",
                                    background: "rgba(2,12,30,0.45)",
                                    borderTop: "1px solid rgba(255,255,255,0.18)",
                                    borderLeft: "1px solid rgba(255,255,255,0.10)",
                                    borderRight: "1px solid rgba(0,0,0,0.25)",
                                    borderBottom: "1px solid rgba(0,0,0,0.30)",
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 8px rgba(0,0,0,0.35)",
                                    color: "#C29F60",
                                    fontFamily: "Syne, system-ui, sans-serif",
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    textShadow: "0 1px 4px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.80)",
                                  }
                                : {
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "9px 12px", borderRadius: 6,
                                    textDecoration: "none", transition: "all 0.15s",
                                    background: "rgba(2,12,30,0.05)",
                                    borderTop: "1px solid rgba(255,255,255,0.07)",
                                    borderLeft: "1px solid rgba(255,255,255,0.04)",
                                    borderRight: "1px solid rgba(0,0,0,0.10)",
                                    borderBottom: "1px solid rgba(0,0,0,0.14)",
                                    color: "rgba(222,211,200,0.88)",
                                    fontFamily: "Syne, system-ui, sans-serif",
                                    fontWeight: 600,
                                    fontSize: "0.82rem",
                                    textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 2px 14px rgba(0,0,0,0.85), 0 4px 20px rgba(0,0,0,0.6)",
                                  }
                            }
                            onMouseEnter={(e) => {
                              if (!childActive) {
                                (e.currentTarget as HTMLElement).style.background = "rgba(2,12,30,0.12)";
                                (e.currentTarget as HTMLElement).style.borderTopColor = "rgba(255,255,255,0.12)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!childActive) {
                                (e.currentTarget as HTMLElement).style.background = "rgba(2,12,30,0.05)";
                                (e.currentTarget as HTMLElement).style.borderTopColor = "rgba(255,255,255,0.07)";
                              }
                            }}
                          >
                            <ChildIcon style={{ width: 13, height: 13, flexShrink: 0, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.95)) drop-shadow(0 2px 6px rgba(0,0,0,0.8))" }} />
                            <span style={{ flex: 1 }}>{child.label}</span>
                          </Link>
                        );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      </div>{/* end branded glass panel */}

      {/* Bottom divider */}
      <div className="px-5 py-2">
        <div
          className="h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(194,159,96,0.15), transparent)" }}
        />
      </div>

      {/* User & Logout */}
      <div className="p-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(194,159,96,0.2), rgba(194,159,96,0.08))",
              border: "1px solid rgba(194,159,96,0.3)",
              color: "#C29F60",
              fontFamily: '"Lora", Georgia, serif',
            }}
          >
            M
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{
                fontFamily: "Syne, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: "0.85rem",
                color: "#DED3C8",
              }}
            >
              Member
            </p>
            <p
              className="truncate"
              style={{
                fontFamily: "Syne, system-ui, sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "0.55rem",
                color: "#1D7458",
              }}
            >
              Active
            </p>
          </div>
        </div>

        {isAdmin && (
          <div style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(194,159,96,0.4)", fontFamily: "Syne,system-ui,sans-serif",
              fontWeight: 700, padding: "0 12px 4px",
            }}>
              Admin
            </p>
            <Link
              href="/admin/vision-review"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                color: pathname.startsWith("/admin/vision-review") ? "#C29F60" : "rgba(222,211,200,0.5)",
                background: pathname.startsWith("/admin/vision-review") ? "rgba(194,159,96,0.08)" : "transparent",
                fontFamily: "Syne, system-ui, sans-serif",
                textDecoration: "none",
              }}
            >
              <Eye className="w-4 h-4" />
              Vision Review
            </Link>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full"
          style={{
            color: "rgba(222,211,200,0.4)",
            fontFamily: "Syne, system-ui, sans-serif",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#DED3C8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(222,211,200,0.4)")}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      </div>{/* end nav content wrapper */}

      {/* Editor locked — prompt modal */}
      {showEditorPrompt && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(2,8,28,0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={() => setShowEditorPrompt(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(160deg, rgba(13,31,60,0.97) 0%, rgba(2,8,28,0.99) 100%)",
              borderTop: "1.5px solid rgba(194,159,96,0.45)",
              borderLeft: "1px solid rgba(194,159,96,0.2)",
              borderRight: "1px solid rgba(0,0,0,0.4)",
              borderBottom: "1.5px solid rgba(0,0,0,0.6)",
              boxShadow: "0 8px 0 rgba(0,0,0,0.6), 0 16px 0 rgba(0,0,0,0.35), 0 32px 60px rgba(0,0,0,0.7)",
              borderRadius: 18,
              padding: "40px 44px",
              maxWidth: 420,
              width: "90%",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setShowEditorPrompt(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(222,211,200,0.4)", fontSize: 18, lineHeight: 1,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#DED3C8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(222,211,200,0.4)"; }}
            >
              ✕
            </button>

            {/* Lock icon */}
            <div style={{ marginBottom: 20 }}>
              <Lock style={{ width: 32, height: 32, color: "rgba(194,159,96,0.6)" }} />
            </div>

            <h2 style={{
              fontFamily: "Lora, Georgia, serif",
              fontWeight: 600, fontSize: 22, color: "#DED3C8",
              lineHeight: 1.2, marginBottom: 14,
            }}>
              Complete My Statements First
            </h2>
            <p style={{
              fontFamily: "Lora, Georgia, serif",
              fontStyle: "italic", fontSize: 13,
              color: "rgba(222,211,200,0.65)", lineHeight: 1.75, marginBottom: 30,
            }}>
              The Vision Video Editor is built on the foundation of your personal statements — who you are being and what you are doing in each area of your life. Complete My Statements to unlock the editor.
            </p>
            <button
              onClick={() => { setShowEditorPrompt(false); router.push("/statements"); }}
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
                transition: "transform 0.1s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              Begin My Statements →
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
