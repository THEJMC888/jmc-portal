import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import FlowerOfLife from "@/components/FlowerOfLife";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "transparent" }}
    >
      <Sidebar />
      <MobileNav />
      <main className="flex-1 md:ml-64 min-h-screen relative">
        {/* Flower of Life watermark */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none overflow-hidden">
          <FlowerOfLife
            className="w-full h-full translate-x-1/4 -translate-y-1/4"
            opacity={0.045}
          />
        </div>
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
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
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
