import type { Metadata } from "next";
import "./globals.css";
import QuantumBackground from "@/components/QuantumBackground";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "The Journeymen Collective™ | Member Portal",
  description:
    "Enter the portal to clarity. Expertly guided transformation for purpose-driven leaders.",
  icons: {
    icon: "/logo-mark.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white antialiased">
        <QuantumBackground />
        <AuthProvider>
          <div style={{ position: "relative", zIndex: 1 }}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
