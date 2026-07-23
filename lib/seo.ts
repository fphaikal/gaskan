import type { Metadata, MetadataRoute } from "next";

export const PRODUCTION_SITE_URL = "https://gaskan.smtijogja.sch.id";

export function normalizeSiteUrl(value: string | undefined): string {
  try {
    const url = new URL(value ?? "");

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return PRODUCTION_SITE_URL;
    }

    return url.origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

export const siteConfig = {
  name: "GASKAN",
  alternateName: "Gerbang Akses Pintar dan Kehadiran",
  title: "GASKAN — Sistem Absensi Digital SMTI Jogja",
  description:
    "Gerbang Akses Pintar dan Kehadiran — sistem absensi digital SMTI Jogja untuk memantau kehadiran siswa secara real-time.",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "id_ID",
  language: "id-ID",
  image: "/banner.webp",
} as const;

export function absoluteUrl(path: "/" | `/${string}`): string {
  if (path === "/") {
    return siteConfig.url;
  }

  return new URL(path, `${siteConfig.url}/`).toString();
}

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: "/" | "/team";
};

export function createPublicPageMetadata({
  title,
  description,
  path,
}: PublicPageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const image = absoluteUrl(siteConfig.image);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: image,
          alt: "GASKAN — Sistem Absensi Digital SMTI Jogja",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function buildSitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/team"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}

const publicPaths = ["/", "/team", "/llms.txt", "/sitemap.xml"];
const privatePaths = [
  "/api/",
  "/login",
  "/register",
  "/dashboard",
  "/students",
  "/classes",
  "/attendance",
  "/reports",
  "/settings",
  "/users",
  "/teams",
];

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "Claude-SearchBot",
          "Claude-User",
          "Googlebot",
        ],
        allow: publicPaths,
        disallow: privatePaths,
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: publicPaths,
        disallow: privatePaths,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
