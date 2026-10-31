import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The journal records voice and video and dictates, so the portal itself may ask for them
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  // Strict-Transport-Security — only sent over HTTPS (Vercel handles this in prod)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Content-Security-Policy, still report only: check the live console for
  // violations, then rename the key to Content-Security-Policy to enforce it.
  // 'wasm-unsafe-eval' lets Argon2id (hash-wasm) derive keys in the browser.
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",   // Next.js hydration uses inline scripts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      "connect-src 'self' data: blob: https://*.supabase.co wss://*.supabase.co https://*.vercel-storage.com",
      "frame-src https://iframe.mediadelivery.net",              // Bunny course video player
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: 200 * 1024 * 1024, // 200 MB — needed for large meditation file uploads
  },
  images: {
    domains: [
      "vz-cdn.b-cdn.net",       // Bunny.net CDN
      "storage.bunnycdn.com",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
