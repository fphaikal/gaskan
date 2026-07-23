import type { NextConfig } from "next";

const targetApi =
  process.env.NEXT_PUBLIC_API_BASE || "https://gaskan-api.smtijogja.my.id";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gaskan-api.smtijogja.my.id',
      },
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
