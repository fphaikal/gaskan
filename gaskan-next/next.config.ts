import type { NextConfig } from "next";
import path from "path";

const targetApi = process.env.NEXT_PUBLIC_API_BASE || "https://api.tierkun.my.id";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${targetApi}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
