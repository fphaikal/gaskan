import type { NextConfig } from "next";
import path from "path";

const targetApi = process.env.NEXT_PUBLIC_API_BASE || "";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    if (!targetApi) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${targetApi}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
