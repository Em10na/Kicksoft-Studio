import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // web-push utilise des modules Node.js natifs (crypto, http2…)
  // qu'il ne faut pas bundler — Turbopack/webpack les laisse en externe
  serverExternalPackages: ["web-push"],
};

export default nextConfig;
