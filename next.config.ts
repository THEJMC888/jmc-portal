import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "vz-cdn.b-cdn.net",       // Bunny.net CDN
      "storage.bunnycdn.com",
    ],
  },
};

export default nextConfig;
