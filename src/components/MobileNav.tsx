"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, GraduationCap, NotebookPen, Sparkles, Sun,
  Wind, Users, X, Menu, LogOut, BookOpen, Route, Fingerprint, Eye, UserPlus, Feather,
} from "lucide-react";
import { clsx } from "clsx";
import { signOutAndForgetKeys } from "@/lib/accountKeys";
import { useAuth } from "@/lib/auth";

const ADMIN_EMAIL = "rng@thejourneymencollective.com";

type NavItem = { label: string; href: string; icon: React.ElementType; comingSoon?: boolean; soonBadge?: boolean };

// Same destinations as the desktop Sidebar (Vision's sub-pages listed flat).
// soonBadge: shows the "Soon" tag but stays clickable (the page itself explains)
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",       href: "/dashboard",         icon: LayoutDashboard },
  { label: "Course Library",  href: "/library",           icon: GraduationCap, soonBadge: true },
  { label: "Vision Video",    href: "/vision",            icon: Sparkles },
  { label: "My Statements",   href: "/statements",        icon: BookOpen },
  { label: "My Attunements",  href: "/vision/attunement", icon: Sun },
  { label: "Journal",         href: "/journal",           icon: NotebookPen },
  { label: "Medicine Animals", href: "/totems",          icon: Feather },
  { label: "My Journey",      href: "/journey",           icon: Route },
  { label: "My Blueprint",    href: "/blueprint",         icon: Fingerprint },
  { label: "Meditations",     href: "/meditations",       icon: Wind },
  { label: "Community",       href: "/community",         icon: Users, comingSoon: true },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Vision Review",  href: "/admin/vision-review", icon: Eye },
  { label: "Course Access",  href: "/admin/courses",       icon: GraduationCap },
  { label: "Invite Members", href: "/admin/members",       icon: UserPlus },
];

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: 8,
        color: "rgba(222,211,200,0.75)",
        padding: 4,
      }}
    >
      <Menu size={22} />
    </button>
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;
  // Longest matching href wins, so /vision/attunement doesn't also light up Vision Video
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOutAndForgetKeys();
    router.push("/");
  };

  return (
    <>
      {/* Hamburger button — placed in the mobile top bar via layout */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden"
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: 8,
          color: "rgba(222,211,200,0.75)",
          padding: 4,
          position: "fixed", top: 10, right: 12, zIndex: 55,
        }}
      >
        <Menu size={22} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden"
          style={{
            position: "fixed", inset: 0, zIndex: 70,
            background: "rgba(2,4,12,0.65)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Drawer */}
      <nav
        className="md:hidden"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 260, zIndex: 80,
          background: "linear-gradient(180deg, rgba(4,13,38,0.97) 0%, rgba(2,6,22,0.99) 100%)",
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          borderLeft: "1px solid rgba(194,159,96,0.18)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.6)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.23,1,0.32,1)",
          display: "flex", flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid rgba(194,159,96,0.12)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          <span style={{
            fontFamily: "Syne, system-ui, sans-serif",
            fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.18em", fontSize: "0.6rem",
            color: "rgba(194,159,96,0.65)",
          }}>
            Portal
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(222,211,200,0.45)", padding: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map(({ label, href, icon: Icon, comingSoon, soonBadge }) => {
              const isActive = href === activeHref;
              return (
                <div key={href}>
                {href === ADMIN_ITEMS[0].href && (
                  <p style={{
                    fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.14em",
                    fontSize: "0.55rem", color: "rgba(194,159,96,0.45)",
                    padding: "14px 14px 4px",
                  }}>
                    Admin
                  </p>
                )}
                <Link
                  href={comingSoon ? "#" : href}
                  className={clsx(comingSoon && "pointer-events-none")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 10,
                    fontFamily: "Syne, system-ui, sans-serif",
                    fontSize: "0.88rem", fontWeight: isActive ? 700 : 400,
                    textDecoration: "none",
                    opacity: comingSoon ? 0.35 : 1,
                    transition: "all 0.15s",
                    ...(isActive ? {
                      background: "linear-gradient(135deg, rgba(194,159,96,0.15), rgba(194,159,96,0.06))",
                      border: "1px solid rgba(194,159,96,0.22)",
                      color: "#C29F60",
                      boxShadow: "0 0 12px rgba(194,159,96,0.1)",
                    } : {
                      background: "transparent",
                      border: "1px solid transparent",
                      color: "rgba(222,211,200,0.7)",
                    }),
                  }}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {(comingSoon || soonBadge) && (
                    <span style={{
                      fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      fontSize: "0.5rem", color: "rgba(194,159,96,0.4)",
                    }}>
                      Soon
                    </span>
                  )}
                </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sign out */}
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(194,159,96,0.1)" }}>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "11px 14px", borderRadius: 10,
              background: "none", border: "1px solid transparent", cursor: "pointer",
              fontFamily: "Syne, system-ui, sans-serif", fontSize: "0.88rem", fontWeight: 400,
              color: "rgba(222,211,200,0.4)", textAlign: "left",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#DED3C8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(222,211,200,0.4)"; }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            Sign out
          </button>
        </div>
      </nav>
    </>
  );
}
