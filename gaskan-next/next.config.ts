import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.tierkun.my.id/api/:path*",
      },
    ];
  },
};

export default nextConfig;
