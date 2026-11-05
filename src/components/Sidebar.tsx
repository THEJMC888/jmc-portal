"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useLayoutEffect } from "react";
import { LayoutDashboard, PlaySquare, Users, Sparkles, BookOpen, LogOut, ChevronRight, ChevronLeft, NotebookPen, Wind, Lock, Route, Fingerprint, Eye, GraduationCap, UserPlus, Feather } from "lucide-react";
import { clsx } from "clsx";
import BrandLogo from "./BrandLogo";
import { signOutAndForgetKeys } from "@/lib/accountKeys";
import { useAuth } from "@/lib/auth";
import PhotoSlideshow from "./PhotoSlideshow";
import StatementsFirstPrompt from "./StatementsFirstPrompt";
import { useStatementsReady } from "@/hooks/useStatementsReady";

const ADMIN_EMAIL = "rng@thejourneymencollective.com";

interface NavChild { label: string; href: string; icon: React.ElementType; }
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  comingSoon?: boolean;
  /** Shows the "Soon" tag but stays clickable (the page itself explains) */
  soonBadge?: boolean;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Course Library", href: "/library", icon: GraduationCap, soonBadge: true },
  {
    label: "Vision Video", href: "/vision", icon: Sparkles,
    children: [
      { label: "My Statements", href: "/statements", icon: BookOpen },
      { label: "Editor", href: "/vision", icon: Sparkles },
      { label: "My Attunements", href: "/vision/attunement", icon: Sparkles },
    ],
  },
  { label: "Journal", href: "/journal", icon: NotebookPen },
  { label: "Medicine Animals", href: "/totems", icon: Feather },
  { label: "My Journey", href: "/journey", icon: Route },
  { label: "My Blueprint", href: "/blueprint", icon: Fingerprint },
  { label: "Meditations", href: "/meditations", icon: Wind },
  { label: "Community", href: "/community", icon: Users, comingSoon: true },
];

const ADMIN_LINKS = [
  { label: "Vision Review", href: "/admin/vision-review", icon: Eye },
  { label: "Course Access", href: "/admin/courses", icon: GraduationCap },
  { label: "Invite Members", href: "/admin/members", icon: UserPlus },
];

const COLLAPSED_KEY = "jmc_sidebar_collapsed";
const EXPANDED_W = 256;
const COLLAPSED_W = 72;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const statementsReady = useStatementsReady();
  const [showEditorPrompt, setShowEditorPrompt] = useState(false);
  // The dashboard layout only mounts the sidebar after auth resolves on the
  // client, so reading localStorage in the initializer can't cause a hydration mismatch.
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === "1"; } catch { return false; }
  });

  // Main content and fixed bars offset themselves by --sidebar-w; set it before paint
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", `${collapsed ? COLLAPSED_W : EXPANDED_W}px`);
    try { localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0"); } catch { /* ignore */ }
  }, [collapsed]);

  const handleSignOut = async () => {
    await signOutAndForgetKeys();
    router.push("/");
  };

  return (
    <>
    <aside
      className="fixed top-0 left-0 h-full hidden md:flex flex-col z-40 overflow-hidden"
      style={{
        width: collapsed ? COLLAPSED_W : EXPANDED_W,
        transition: "width 0.25s ease",
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
        className={clsx("py-4", collapsed ? "px-0 flex justify-center" : "px-4")}
        style={{ borderBottom: "1px solid rgba(194,159,96,0.1)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="logo" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
          {!collapsed && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/logo-text-white.png"
              alt="The Journeymen Collective"
              style={{ width: 140, height: "auto", objectFit: "contain" }}
            />
          )}
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
      <div className="px-5 py-3" style={{ visibility: collapsed ? "hidden" : "visible" }}>
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
                title={collapsed ? item.label : undefined}
                className={clsx(
                  "flex items-center gap-3 py-2.5 rounded-lg transition-all",
                  collapsed ? "justify-center px-0" : "px-3",
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
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && (item.comingSoon || item.soonBadge) && (
                  <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.55rem", color: "rgba(194,159,96,0.4)" }}>
                    Soon
                  </span>
                )}
                {!collapsed && isGroupActive && !item.comingSoon && !item.soonBadge && (
                  <ChevronRight
                    className="w-3 h-3"
                    style={{ transform: item.children ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                  />
                )}
              </Link>

              {/* Sub-items — shown when parent group is active */}
              {item.children && isGroupActive && !collapsed && (
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
        <div className={clsx("flex items-center gap-3 py-2 mb-1", collapsed ? "justify-center px-0" : "px-3")}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            title={collapsed ? "Member · Active" : undefined}
            style={{
              background: "linear-gradient(135deg, rgba(194,159,96,0.2), rgba(194,159,96,0.08))",
              border: "1px solid rgba(194,159,96,0.3)",
              color: "#C29F60",
              fontFamily: '"Lora", Georgia, serif',
            }}
          >
            M
          </div>
          {!collapsed && <div className="flex-1 min-w-0">
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
          </div>}
        </div>

        {isAdmin && (
          <div style={{ marginBottom: 4 }}>
            {!collapsed && (
              <p style={{
                fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(194,159,96,0.4)", fontFamily: "Syne,system-ui,sans-serif",
                fontWeight: 700, padding: "0 12px 4px",
              }}>
                Admin
              </p>
            )}
            {ADMIN_LINKS.map(({ label, href, icon: AdminIcon }) => (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={clsx("flex items-center gap-3 py-2 rounded-lg text-sm transition-all", collapsed ? "justify-center px-0" : "px-3")}
                style={{
                  color: pathname.startsWith(href) ? "#C29F60" : "rgba(222,211,200,0.5)",
                  background: pathname.startsWith(href) ? "rgba(194,159,96,0.08)" : "transparent",
                  fontFamily: "Syne, system-ui, sans-serif",
                  textDecoration: "none",
                }}
              >
                <AdminIcon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            ))}
          </div>
        )}

        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={clsx("flex items-center gap-3 py-2 rounded-lg text-sm transition-all w-full", collapsed ? "justify-center px-0" : "px-3")}
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
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>

      </div>{/* end nav content wrapper */}

      {/* Editor locked — prompt modal */}
      {showEditorPrompt && <StatementsFirstPrompt onClose={() => setShowEditorPrompt(false)} />}
    </aside>

    {/* Collapse toggle — sits on the sidebar's right edge, outside its overflow clip */}
    <button
      onClick={() => setCollapsed((c) => !c)}
      aria-label={collapsed ? "Expand menu" : "Collapse menu"}
      title={collapsed ? "Expand menu" : "Collapse menu"}
      className="hidden md:flex items-center justify-center"
      style={{
        position: "fixed", top: 26, left: "calc(var(--sidebar-w) - 12px)", zIndex: 45,
        width: 24, height: 24, borderRadius: "50%", cursor: "pointer",
        background: "#0d1f3c",
        border: "1px solid rgba(194,159,96,0.45)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
        color: "#C29F60",
        transition: "left 0.25s ease, border-color 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#C29F60"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(194,159,96,0.45)"; }}
    >
      <ChevronLeft
        className="w-3.5 h-3.5"
        style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.25s ease" }}
      />
    </button>
    </>
  );
}
