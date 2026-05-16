import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: { dynamic: 0 },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.openfoodfacts.org" },
      { protocol: "https", hostname: "static.openfoodfacts.org" },
      { protocol: "https", hostname: "world.openfoodfacts.org" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
