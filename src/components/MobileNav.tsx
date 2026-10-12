"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlaySquare, NotebookPen, Sparkles, Wind } from "lucide-react";

const MOBILE_NAV = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Library", href: "/library", icon: PlaySquare },
  { label: "Journal", href: "/journal", icon: NotebookPen },
  { label: "Vision", href: "/vision", icon: Sparkles },
  { label: "Meditations", href: "/meditations", icon: Wind },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-50"
      style={{
        background: "rgba(4,13,28,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(194,159,96,0.18)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-3">
        {MOBILE_NAV.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
            >
              <div
                className="flex items-center justify-center w-10 h-8 rounded-lg transition-all"
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, rgba(194,159,96,0.22), rgba(194,159,96,0.08))",
                        boxShadow: "0 0 12px rgba(194,159,96,0.25), inset 0 1px 0 rgba(194,159,96,0.2)",
                      }
                    : { background: "transparent" }
                }
              >
                <Icon
                  style={{
                    width: 18,
                    height: 18,
                    color: isActive ? "#C29F60" : "rgba(222,211,200,0.45)",
                    transition: "color 0.2s",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "Syne, system-ui, sans-serif",
                  fontSize: "0.58rem",
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isActive ? "#C29F60" : "rgba(222,211,200,0.4)",
                  transition: "color 0.2s",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
