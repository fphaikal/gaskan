# Public SEO and GEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` and `/team` crawlable, canonical, shareable, and understandable to search and AI retrieval systems while keeping authentication and dashboard routes non-indexable and blocking the selected model-training crawlers.

**Architecture:** Centralize canonical URLs, public-page metadata, JSON-LD, sitemap entries, and crawler policies in `lib/seo.ts`. Thin Next.js metadata routes and layouts consume that source of truth. Existing client UI remains intact; only the landing composition becomes a Server Component and the dashboard client shell moves behind a server metadata boundary.

**Tech Stack:** Next.js 16.2 App Router metadata APIs, React 19, TypeScript, Node.js 25 native type stripping, Node test runner.

---

### Task 1: Build the tested SEO source of truth

**Files:**
- Create: `tests/seo/seo.test.mjs`
- Create: `lib/seo.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing SEO unit tests**

Create `tests/seo/seo.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SITE_URL = "https://gaskan.smtijogja.sch.id";

let seo = {};

try {
  seo = await import("../../lib/seo.ts");
} catch {
  // The first RED run intentionally happens before lib/seo.ts exists.
}

const normalizeSiteUrl = seo.normalizeSiteUrl ?? (() => undefined);
const absoluteUrl = seo.absoluteUrl ?? (() => undefined);
const createPublicPageMetadata = seo.createPublicPageMetadata ?? (() => ({}));
const buildWebsiteJsonLd = seo.buildWebsiteJsonLd ?? (() => ({}));
const serializeJsonLd = seo.serializeJsonLd ?? (() => "");
const buildSitemap = seo.buildSitemap ?? (() => []);
const buildRobots = seo.buildRobots ?? (() => ({}));
const noIndexMetadata = seo.noIndexMetadata ?? {};

test("normalizes the canonical site origin", () => {
  assert.equal(
    normalizeSiteUrl("https://gaskan.smtijogja.sch.id/path/"),
    "https://gaskan.smtijogja.sch.id",
  );
  assert.equal(
    normalizeSiteUrl("not-a-url"),
    "https://gaskan.smtijogja.sch.id",
  );
  assert.equal(
    normalizeSiteUrl(undefined),
    "https://gaskan.smtijogja.sch.id",
  );
});

test("builds canonical absolute URLs without trailing drift", () => {
  assert.equal(absoluteUrl("/"), "https://gaskan.smtijogja.sch.id");
  assert.equal(
    absoluteUrl("/team"),
    "https://gaskan.smtijogja.sch.id/team",
  );
});

test("builds complete public page metadata", () => {
  const metadata = createPublicPageMetadata({
    title: "Tim GASKAN",
    description: "Tim pengembang GASKAN.",
    path: "/team",
  });

  assert.equal(
    metadata.alternates?.canonical,
    "https://gaskan.smtijogja.sch.id/team",
  );
  assert.equal(
    metadata.openGraph?.url,
    "https://gaskan.smtijogja.sch.id/team",
  );
  assert.equal(metadata.openGraph?.locale, "id_ID");
  assert.equal(metadata.twitter?.card, "summary_large_image");
  assert.deepEqual(metadata.robots, { index: true, follow: true });
});

test("builds safe WebSite JSON-LD", () => {
  const jsonLd = buildWebsiteJsonLd();
  const serialized = serializeJsonLd({
    ...jsonLd,
    description: "<script>alert(1)</script>",
  });

  assert.equal(jsonLd["@type"], "WebSite");
  assert.equal(jsonLd.url, "https://gaskan.smtijogja.sch.id");
  assert.equal(serialized.includes("<script>"), false);
  assert.equal(serialized.includes("\\u003cscript>"), true);
});

test("sitemap contains only the landing and public team pages", () => {
  assert.deepEqual(
    buildSitemap().map((entry) => entry.url),
    [
      "https://gaskan.smtijogja.sch.id",
      "https://gaskan.smtijogja.sch.id/team",
    ],
  );
});

test("robots allows AI search and blocks named training crawlers", () => {
  const robots = buildRobots();
  const rules = Array.isArray(robots.rules) ? robots.rules : [];
  const training = rules.find(
    (rule) =>
      Array.isArray(rule.userAgent) &&
      rule.userAgent.includes("GPTBot"),
  ) ?? {};
  const retrieval = rules.find(
    (rule) =>
      Array.isArray(rule.userAgent) &&
      rule.userAgent.includes("OAI-SearchBot"),
  ) ?? {};

  assert.deepEqual(training.userAgent, [
    "GPTBot",
    "ClaudeBot",
    "Google-Extended",
  ]);
  assert.equal(training.disallow, "/");
  assert.equal(retrieval.allow, "/");
  assert.equal(retrieval.disallow, "/api/");
  assert.equal(
    robots.sitemap,
    "https://gaskan.smtijogja.sch.id/sitemap.xml",
  );
});

test("private route metadata is non-indexable", () => {
  assert.deepEqual(noIndexMetadata.robots, {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  });
});
```

- [ ] **Step 2: Run the tests and confirm the RED state**

Run:

```powershell
node --test tests/seo/seo.test.mjs
```

Expected: assertions fail because the SEO exports do not exist yet.

- [ ] **Step 3: Implement the central SEO helpers**

Create `lib/seo.ts`:

```ts
import type { Metadata, MetadataRoute } from "next";

export const PRODUCTION_SITE_URL = "https://gaskan.smtijogja.sch.id";

export function normalizeSiteUrl(value?: string): string {
  if (!value) return PRODUCTION_SITE_URL;

  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) {
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

export function absoluteUrl(path = "/"): string {
  if (path === "/") return siteConfig.url;
  return new URL(path.replace(/^\/+/, ""), `${siteConfig.url}/`).toString();
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
    title: { absolute: title },
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
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildSitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/team"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
        disallow: "/",
      },
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "Claude-SearchBot",
          "Claude-User",
          "Googlebot",
        ],
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
```

Add the script to `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test:seo": "node --test tests/seo/seo.test.mjs"
}
```

- [ ] **Step 4: Run the SEO tests and confirm GREEN**

Run:

```powershell
npm run test:seo
```

Expected: 7 tests pass, 0 fail.

- [ ] **Step 5: Commit the tested SEO source of truth**

```powershell
git add package.json lib/seo.ts tests/seo/seo.test.mjs
git commit -m "feat: add tested SEO configuration"
```

### Task 2: Wire public metadata and WebSite structured data

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/team/layout.tsx`

- [ ] **Step 1: Replace the root metadata block**

In `app/layout.tsx`, import `siteConfig`:

```ts
import { siteConfig } from "@/lib/seo";
```

Replace the existing `metadata` export with:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  verification: {
    google: "zGcUSdyFHTHDyelIHIQ-fAu2Ir0mG8xxa9b4ToiCiic",
  },
};
```

This preserves the already-added GSC token while adding the canonical metadata base.

- [ ] **Step 2: Make the landing composition server-rendered and add page metadata**

Remove the `'use client';` directive from `app/page.tsx`.

Add:

```ts
import type { Metadata } from "next";
import {
  buildWebsiteJsonLd,
  createPublicPageMetadata,
  serializeJsonLd,
  siteConfig,
} from "@/lib/seo";

export const metadata: Metadata = createPublicPageMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: "/",
});
```

Inside `RootPage`, before `return`, add:

```ts
const websiteJsonLd = serializeJsonLd(buildWebsiteJsonLd());
```

Render the JSON-LD as the first child of the page wrapper:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
/>
```

Keep all existing landing components and their order unchanged.

- [ ] **Step 3: Add route-specific metadata for the public team page**

Create `app/team/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo";

const description =
  "Kenali pembimbing dan tim multidisiplin yang membangun serta menjaga sistem absensi digital GASKAN SMTI Jogja.";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Tim GASKAN — Pengembang Sistem Absensi SMTI Jogja",
  description,
  path: "/team",
});

export default function TeamLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
```

- [ ] **Step 4: Verify helper tests and TypeScript compilation**

Run:

```powershell
npm run test:seo
npx tsc --noEmit
```

Expected: SEO tests pass and TypeScript exits with code 0.

- [ ] **Step 5: Commit public metadata**

```powershell
git add app/layout.tsx app/page.tsx app/team/layout.tsx
git commit -m "feat: add public SEO metadata and structured data"
```

### Task 3: Add non-indexable route-group boundaries

**Files:**
- Create: `components/layout/DashboardShell.tsx`
- Modify: `app/(dashboard)/layout.tsx`
- Create: `app/(auth)/layout.tsx`

- [ ] **Step 1: Move the existing dashboard client behavior into a shell**

Create `components/layout/DashboardShell.tsx` with the current dashboard layout behavior:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { goeyToast as toast } from "goey-toast";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const role = (user.role || "").toLowerCase();
    const adminOnlyPaths = ["/semester", "/admin", "/config", "/log/error"];

    if (
      adminOnlyPaths.some((path) => pathname.startsWith(path)) &&
      !["admin", "developer"].includes(role)
    ) {
      toast.error(
        "Akses Ditolak: Halaman ini khusus untuk Role Admin & Developer",
      );
      router.push("/home");
      return;
    }

    const staffPaths = [
      "/absensi",
      "/siswa",
      "/log",
      "/kelas",
      "/monitor",
      "/jurusan",
    ];

    if (
      staffPaths.some((path) => pathname.startsWith(path)) &&
      !["admin", "developer", "guru"].includes(role)
    ) {
      if (!pathname.startsWith("/siswa/") && pathname !== "/log/kehadiran") {
        toast.error(
          "Akses Ditolak: Halaman ini khusus untuk Pengajar & Staff",
        );
        router.push("/home");
      }
    }
  }, [user, isLoading, pathname, router]);

  if (!mounted) {
    return (
      <div
        className="flex min-h-screen bg-background text-foreground items-center justify-center"
        suppressHydrationWarning
      >
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-background text-foreground"
      suppressHydrationWarning
    >
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the dashboard route-group layout with a server boundary**

Replace `app/(dashboard)/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata;

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
```

- [ ] **Step 3: Add the authentication route-group metadata boundary**

Create `app/(auth)/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata;

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
```

- [ ] **Step 4: Run tests and TypeScript**

```powershell
npm run test:seo
npx tsc --noEmit
```

Expected: all commands exit with code 0.

- [ ] **Step 5: Commit the non-indexable boundaries**

```powershell
git add 'app/(auth)/layout.tsx' 'app/(dashboard)/layout.tsx' components/layout/DashboardShell.tsx
git commit -m "feat: keep private routes out of search indexes"
```

### Task 4: Publish sitemap, crawler policy, and llms.txt

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `public/llms.txt`
- Modify: `proxy.ts`
- Modify: `tests/seo/seo.test.mjs`

- [ ] **Step 1: Add a failing test for the AI-readable public summary**

Append to `tests/seo/seo.test.mjs`:

```js
test("llms.txt describes only canonical public resources", async () => {
  let content = "";

  try {
    content = await readFile(
      new URL("../../public/llms.txt", import.meta.url),
      "utf8",
    );
  } catch {
    // RED until public/llms.txt is created.
  }

  assert.match(content, /^# GASKAN/m);
  assert.match(content, /https:\/\/gaskan\.smtijogja\.sch\.id\/team/);
  assert.doesNotMatch(content, /\/login|\/home|\/teams/);
});
```

Add this import at the top of the test file:

```js
import { readFile } from "node:fs/promises";
```

- [ ] **Step 2: Run the focused test and confirm RED**

```powershell
npm run test:seo
```

Expected: the `llms.txt` test fails because the file is absent.

- [ ] **Step 3: Add thin Next.js metadata routes**

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap();
}
```

Create `app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { buildRobots } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
```

- [ ] **Step 4: Add the root llms.txt file**

Create `public/llms.txt`:

```md
# GASKAN

> GASKAN adalah Gerbang Akses Pintar dan Kehadiran, sistem absensi digital SMTI Jogja untuk memantau kehadiran siswa secara real-time.

GASKAN merupakan aplikasi web internal sekolah dengan halaman publik yang menjelaskan fungsi sistem dan tim pengembangnya. Halaman autentikasi dan dashboard bukan sumber informasi publik.

## Halaman Publik

- [GASKAN](https://gaskan.smtijogja.sch.id): Informasi utama, fitur, statistik, dan pertanyaan umum tentang sistem absensi digital GASKAN.
- [Tim GASKAN](https://gaskan.smtijogja.sch.id/team): Informasi pembimbing dan tim multidisiplin yang membangun serta menjaga GASKAN.

## Fakta Utama

- Nama: GASKAN
- Kepanjangan: Gerbang Akses Pintar dan Kehadiran
- Institusi: SMTI Jogja
- Bahasa utama: Bahasa Indonesia
- Jenis sistem: Sistem absensi digital dan pemantauan kehadiran siswa
```

- [ ] **Step 5: Make the public discovery routes bypass authentication**

In `proxy.ts`, replace the public path constants with:

```ts
const AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"];
const DISCOVERY_PATHS = ["/team", "/robots.txt", "/sitemap.xml", "/llms.txt"];
const PUBLIC_PATHS = ["/", ...AUTH_PATHS, ...DISCOVERY_PATHS];
```

Keep the existing exact-match `isPublicPath` logic so `/teams` remains protected.

- [ ] **Step 6: Run the tests and confirm GREEN**

```powershell
npm run test:seo
npx tsc --noEmit
```

Expected: 8 SEO tests pass and TypeScript exits with code 0.

- [ ] **Step 7: Commit crawl and discovery routes**

```powershell
git add app/sitemap.ts app/robots.ts public/llms.txt proxy.ts tests/seo/seo.test.mjs
git commit -m "feat: add search and AI discovery routes"
```

### Task 5: Perform production-level verification

**Files:**
- Verify only; no expected source changes

- [ ] **Step 1: Run the complete automated checks**

```powershell
npm run test:seo
npx tsc --noEmit
npm run build
```

Expected:

- 8 SEO tests pass
- TypeScript exits with code 0
- Next.js production build exits with code 0

- [ ] **Step 2: Inspect generated metadata**

Run:

```powershell
rg -n -F 'google-site-verification' .next/server/app -g '*.html'
rg -n -F 'rel="canonical"' .next/server/app -g '*.html'
rg -n -F 'application/ld+json' .next/server/app/index.html
rg -n -F 'noindex' .next/server/app -g '*.html'
```

Expected:

- Google verification is present
- `/` and `/team` have their self-referencing canonical URLs
- landing HTML contains `WebSite` JSON-LD
- authentication and dashboard HTML contain `noindex`

- [ ] **Step 3: Start the production server and verify public responses**

Run in PowerShell:

```powershell
$seoServer = Start-Process -FilePath "npm.cmd" -ArgumentList "run","start","--","-p","3100" -WorkingDirectory (Get-Location) -PassThru -WindowStyle Hidden
try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
      $null = Invoke-WebRequest -Uri "http://localhost:3100/" -UseBasicParsing
      $ready = $true
      break
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  if (-not $ready) { throw "Next.js server did not become ready" }

  $home = Invoke-WebRequest -Uri "http://localhost:3100/" -UseBasicParsing
  $team = Invoke-WebRequest -Uri "http://localhost:3100/team" -UseBasicParsing
  $robots = Invoke-WebRequest -Uri "http://localhost:3100/robots.txt" -UseBasicParsing
  $sitemap = Invoke-WebRequest -Uri "http://localhost:3100/sitemap.xml" -UseBasicParsing
  $llms = Invoke-WebRequest -Uri "http://localhost:3100/llms.txt" -UseBasicParsing

  if ($home.StatusCode -ne 200) { throw "Landing page is not public" }
  if ($team.StatusCode -ne 200) { throw "Team page is not public" }
  if ($robots.Content -notmatch "OAI-SearchBot") { throw "OAI-SearchBot is not allowed" }
  if ($robots.Content -notmatch "Claude-SearchBot") { throw "Claude-SearchBot is not allowed" }
  if ($robots.Content -notmatch "User-Agent: GPTBot[\s\S]*Disallow: /") { throw "GPTBot is not blocked" }
  if ($sitemap.Content -match "/login|/home|/teams") { throw "Private URL leaked into sitemap" }
  if ($llms.Content -notmatch "# GASKAN") { throw "llms.txt is invalid" }
} finally {
  if ($seoServer -and -not $seoServer.HasExited) {
    Stop-Process -Id $seoServer.Id -Force
  }
}
```

Expected: the script completes without throwing.

- [ ] **Step 4: Confirm the final diff and working tree**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors and no unexpected files. If every implementation task was committed, the working tree is clean.

- [ ] **Step 5: Record deployment follow-up**

After deployment, the operator must:

1. Confirm `NEXT_PUBLIC_SITE_URL=https://gaskan.smtijogja.sch.id` in production.
2. Open the deployed `/robots.txt`, `/sitemap.xml`, and `/llms.txt`.
3. Submit `/sitemap.xml` in Google Search Console.
4. Use Search Console URL Inspection for `/` and `/team`.
5. Allow time for recrawling; indexing and appearance in search or AI answers are not guaranteed.
