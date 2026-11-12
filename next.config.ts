import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  // Avoid restoring stale development tasks after a build or a server restart.
  experimental: { turbopackFileSystemCacheForDev: false },
  // Allow dev asset/HMR requests when app is opened via 127.0.0.1
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    const privateNoStore = [
      {
        key: "Cache-Control",
        value: "private, no-store, no-cache, max-age=0, must-revalidate",
      },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
    ];
    return [
      { source: "/dashboard", headers: privateNoStore },
      { source: "/admin", headers: privateNoStore },
      { source: "/admin/:path*", headers: privateNoStore },
      { source: "/checkout/:path*", headers: privateNoStore },
    ];
  },
};

export default nextConfig;
