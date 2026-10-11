"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlaySquare, Users, Sparkles, BookOpen, LogOut, ChevronRight, NotebookPen } from "lucide-react";
import { clsx } from "clsx";
import BrandLogo from "./BrandLogo";

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
  { label: "Community", href: "/community", icon: Users, comingSoon: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-full w-64 hidden md:flex flex-col z-40"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(4,12,40,0.28) 15%, rgba(2,5,18,0.38) 100%)",
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
        borderTop: "none",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.06), 4px 0 40px rgba(0,0,0,0.6), 12px 0 80px rgba(0,0,0,0.4)",
      }}
    >
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
              color: "rgba(194,159,96,0.4)",
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  item.comingSoon && "opacity-40 cursor-not-allowed"
                )}
                style={
                  isGroupActive
                    ? {
                        background: "linear-gradient(135deg, rgba(0,180,240,0.12), rgba(0,80,180,0.07))",
                        border: "1px solid rgba(0,210,255,0.32)",
                        color: "#00d8ff",
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontWeight: 600,
                        boxShadow: "0 0 18px rgba(0,200,240,0.15), inset 0 0 14px rgba(0,140,220,0.06)",
                      }
                    : {
                        color: "rgba(222,211,200,0.55)",
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontWeight: 400,
                        border: "1px solid transparent",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isGroupActive && !item.comingSoon) {
                    (e.currentTarget as HTMLElement).style.color = "#DED3C8";
                    (e.currentTarget as HTMLElement).style.background = "rgba(194,159,96,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGroupActive && !item.comingSoon) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(222,211,200,0.55)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
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
                <div style={{ marginTop: 2, marginBottom: 4, paddingLeft: 16 }}>
                  <div style={{
                    borderLeft: "1px solid rgba(194,159,96,0.18)",
                    paddingLeft: 12,
                    display: "flex", flexDirection: "column", gap: 1,
                  }}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href || (child.href !== item.href && pathname.startsWith(child.href + "/"));
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "7px 10px", borderRadius: 6,
                            fontFamily: "Syne, system-ui, sans-serif",
                            fontSize: "0.72rem",
                            fontWeight: childActive ? 600 : 400,
                            color: childActive ? "#C29F60" : "rgba(222,211,200,0.5)",
                            background: childActive ? "rgba(194,159,96,0.08)" : "transparent",
                            border: `1px solid ${childActive ? "rgba(194,159,96,0.15)" : "transparent"}`,
                            textDecoration: "none",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (!childActive) {
                              (e.currentTarget as HTMLElement).style.color = "#DED3C8";
                              (e.currentTarget as HTMLElement).style.background = "rgba(194,159,96,0.04)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!childActive) {
                              (e.currentTarget as HTMLElement).style.color = "rgba(222,211,200,0.5)";
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                            }
                          }}
                        >
                          <ChildIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
                          {child.label}
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

        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            color: "rgba(222,211,200,0.4)",
            fontFamily: "Syne, system-ui, sans-serif",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#DED3C8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(222,211,200,0.4)")}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
