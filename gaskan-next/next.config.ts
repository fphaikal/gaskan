import type { NextConfig } from "next";
import path from "path";

const targetApi = process.env.NEXT_PUBLIC_API_BASE || "https://api.tierkun.my.id";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.tierkun.my.id',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    if (!targetApi) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${targetApi}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${targetApi}/uploads/:path*`,
      },
      {
        source: "/file/:path*",
        destination: `${targetApi}/file/:path*`,
      },
    ];
  },
};

export default nextConfig;
