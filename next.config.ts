import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for Next dev server assets when accessed via the DDEV domain.
  allowedDevOrigins: ["devotionstreak.ddev.site", "127.0.0.1", "localhost"]
};

export default nextConfig;
