// The portal's raised 3D card (card-luxury), with the gold icon tile and Lora
// title used by the dashboard tiles. Use it for every new panel so it matches
// Dashboard, Course Library, Vision Video, Journal and the other tabs.

import type { ReactNode } from "react";

const lora = { fontFamily: '"Lora", Georgia, serif' };

export const PORTAL_ICON_COLOR = "#C29F60";

export function PortalCardTitle({ icon, title, badge }: { icon: ReactNode; title: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(194,159,96,0.1)", boxShadow: "0 0 12px rgba(194,159,96,0.12)" }}
      >
        {icon}
      </div>
      <h2 style={{ ...lora, fontWeight: 600, fontSize: "1.05rem", color: "#DED3C8", flex: 1 }}>{title}</h2>
      {badge}
    </div>
  );
}

export default function PortalCard({
  icon, title, badge, className = "", children,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`card-luxury p-5 md:p-6 ${className}`}>
      <PortalCardTitle icon={icon} title={title} badge={badge} />
      {children}
    </section>
  );
}
