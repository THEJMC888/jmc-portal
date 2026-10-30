"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import FlowerOfLife from "@/components/FlowerOfLife";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(194,159,96,0.3)", borderTopColor: "#C29F60" }}
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "transparent" }}>
      <Sidebar />
      <MobileNav />
      <main className="flex-1 min-w-0 md:ml-[var(--sidebar-w)] min-h-screen relative" style={{ transition: "margin-left 0.25s ease" }}>
        {/* Flower of Life watermark */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none overflow-hidden">
          <FlowerOfLife
            className="w-full h-full translate-x-1/4 -translate-y-1/4"
            opacity={0.045}
          />
        </div>
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 h-14 sticky top-0 z-30"
          style={{
            background: "rgba(2,4,12,0.55)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderBottom: "1px solid rgba(0,200,240,0.08)",
            boxShadow: "0 1px 0 rgba(194,159,96,0.06)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="JMC" style={{ width: 30, height: 30, borderRadius: "50%" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-text-white.png" alt="The Journeymen Collective" style={{ height: 18, objectFit: "contain" }} />
          <div style={{ width: 30 }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
