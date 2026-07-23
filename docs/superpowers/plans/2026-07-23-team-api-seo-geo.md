# Team API SEO and GEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the public team API data in the initial `/team` HTML and reuse its safe public fields for dynamic metadata, JSON-LD people/entity data, and crawlable social/custom links.

**Architecture:** Add a server data boundary that fetches, caches, validates, and strips private fields from the public team payload. Add pure SEO transforms for the dynamic description and `AboutPage`/`Organization`/`Person` graph. Keep the current interactive UI in a Client Component that receives normalized server data as props.

**Tech Stack:** Next.js 16.2 App Router, React 19 Server and Client Components, TypeScript, Node test runner through `tsx`

---

## File Map

- Create `lib/team.ts`: API origin, public types, payload normalization, cached server fetch.
- Create `lib/team-seo.ts`: dynamic description and JSON-LD builders.
- Create `app/team/TeamPageClient.tsx`: existing interactive team UI driven by props.
- Modify `app/team/page.tsx`: server fetch, JSON-LD script, Client Component boundary.
- Modify `app/team/layout.tsx`: API-derived `generateMetadata`.
- Modify `tests/seo/seo.test.mjs`: unit and route-contract regression coverage.
- Modify `.env.example`: correct API and WebSocket example origins.
- Modify `next.config.ts`: correct API fallback and allow the current image origin.

### Task 1: Define and test the public team data contract

**Files:**
- Create: `lib/team.ts`
- Modify: `tests/seo/seo.test.mjs`

- [ ] **Step 1: Write failing tests for normalization and the server fetch boundary**

Import the not-yet-created functions:

```js
import {
  fetchPublicTeamMembers,
  normalizeTeamMembers,
  TEAM_API_ORIGIN,
} from "../../lib/team.ts";
```

Add tests that submit an active member, an inactive member, unsafe links, a JSON-string `customLinks` value, and nested private `user` data:

```js
test("normalizeTeamMembers exposes only safe active public fields", () => {
  const members = normalizeTeamMembers({
    success: true,
    data: [
      {
        id: "active-1",
        name: "Active Member",
        role: "Frontend Developer",
        photoUrl: "/uploads/team/member.webp",
        github: "https://github.com/example",
        linkedin: "javascript:alert(1)",
        instagram: "",
        email: "private@example.com",
        userId: "private-user",
        user: { nis: "22100000", email: "private@example.com" },
        bio: "Builds the public interface.",
        customLinks: JSON.stringify([
          {
            label: "Portfolio",
            url: "https://portfolio.example/member",
            icon: "mingcute:link-2-line",
          },
          { label: "Unsafe", url: "data:text/html,bad" },
        ]),
        year: "2023 - Sekarang",
        order: 2,
        isActive: true,
      },
      {
        id: "inactive-1",
        name: "Inactive Member",
        role: "Developer",
        isActive: false,
      },
    ],
  });

  assert.deepEqual(members, [
    {
      id: "active-1",
      name: "Active Member",
      role: "Frontend Developer",
      photoUrl: `${TEAM_API_ORIGIN}/uploads/team/member.webp`,
      github: "https://github.com/example",
      linkedin: null,
      instagram: null,
      bio: "Builds the public interface.",
      customLinks: [
        {
          label: "Portfolio",
          url: "https://portfolio.example/member",
          icon: "mingcute:link-2-line",
        },
      ],
      year: "2023 - Sekarang",
      order: 2,
    },
  ]);

  assert.equal("email" in members[0], false);
  assert.equal("user" in members[0], false);
  assert.equal("userId" in members[0], false);
});

test("fetchPublicTeamMembers requests the configured endpoint and degrades safely", async () => {
  let requestedUrl = "";
  let requestedOptions;
  const fetcher = async (url, options) => {
    requestedUrl = String(url);
    requestedOptions = options;
    return new Response(
      JSON.stringify({
        success: true,
        data: [{ id: "member-1", name: "Member One", isActive: true }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const members = await fetchPublicTeamMembers({
    apiBase: "https://api.example.test/",
    fetcher,
  });

  assert.equal(requestedUrl, "https://api.example.test/api/team");
  assert.equal(requestedOptions.next.revalidate, 3600);
  assert.deepEqual(members.map((member) => member.name), ["Member One"]);

  const failed = await fetchPublicTeamMembers({
    fetcher: async () => {
      throw new Error("offline");
    },
  });
  assert.deepEqual(failed, []);
});
```

- [ ] **Step 2: Run the SEO tests and verify RED**

Run:

```powershell
npm run test:seo
```

Expected: FAIL because `lib/team.ts` does not exist.

- [ ] **Step 3: Implement the public API boundary**

Create `lib/team.ts` with:

```ts
import { cache } from "react";

export const TEAM_API_ORIGIN = "https://gaskan-api.smtijogja.my.id";
const TEAM_REVALIDATE_SECONDS = 3600;
const TEAM_REQUEST_TIMEOUT_MS = 5000;

export type TeamCustomLink = {
  label: string;
  url: string;
  icon: string | null;
};

export type PublicTeamMember = {
  id: string;
  name: string;
  role: string;
  photoUrl: string | null;
  github: string | null;
  linkedin: string | null;
  instagram: string | null;
  bio: string | null;
  customLinks: TeamCustomLink[];
  year: string | null;
  order: number;
};

type FetchPublicTeamMembersOptions = {
  apiBase?: string;
  fetcher?: typeof fetch;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizePublicUrl(value: unknown): string | null {
  const candidate = text(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function resolveTeamPhotoUrl(
  value: unknown,
  apiBase = TEAM_API_ORIGIN,
): string | null {
  const candidate = text(value);
  if (!candidate || candidate.includes("0000")) return null;
  try {
    const url = new URL(candidate, `${apiBase.replace(/\/+$/, "")}/`);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeCustomLinks(value: unknown): TeamCustomLink[] {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const url = normalizePublicUrl(record.url);
    if (!url) return [];
    return [{
      label: text(record.label) ?? "Tautan",
      url,
      icon: text(record.icon),
    }];
  });
}

export function normalizeTeamMembers(
  payload: unknown,
  apiBase = TEAM_API_ORIGIN,
): PublicTeamMember[] {
  const source =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;
  if (!Array.isArray(source)) return [];

  return source
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const member = entry as Record<string, unknown>;
      if (member.isActive === false) return [];
      const id = text(member.id);
      const name = text(member.name);
      if (!id || !name) return [];
      const orderValue = Number(member.order);
      return [{
        id,
        name,
        role: text(member.role) ?? "Anggota Tim",
        photoUrl: resolveTeamPhotoUrl(member.photoUrl, apiBase),
        github: normalizePublicUrl(member.github),
        linkedin: normalizePublicUrl(member.linkedin),
        instagram: normalizePublicUrl(member.instagram),
        bio: text(member.bio),
        customLinks: normalizeCustomLinks(member.customLinks),
        year: text(member.year),
        order: Number.isFinite(orderValue) ? orderValue : 0,
      }];
    })
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
}

export async function fetchPublicTeamMembers({
  apiBase = process.env.NEXT_PUBLIC_API_BASE || TEAM_API_ORIGIN,
  fetcher = fetch,
}: FetchPublicTeamMembersOptions = {}): Promise<PublicTeamMember[]> {
  const baseUrl = apiBase.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TEAM_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetcher(`${baseUrl}/api/team`, {
      headers: { accept: "application/json" },
      next: { revalidate: TEAM_REVALIDATE_SECONDS, tags: ["public-team"] },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    return normalizeTeamMembers(await response.json(), baseUrl);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export const getPublicTeamMembers = cache(fetchPublicTeamMembers);
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```powershell
npm run test:seo
npx tsc --noEmit
```

Expected: all SEO tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit the data boundary**

```powershell
git add lib/team.ts tests/seo/seo.test.mjs
git commit -m "feat: add public team API data boundary"
```

### Task 2: Build API-derived metadata and structured data

**Files:**
- Create: `lib/team-seo.ts`
- Modify: `tests/seo/seo.test.mjs`

- [ ] **Step 1: Write failing metadata and JSON-LD tests**

Import:

```js
import {
  buildTeamMetadataDescription,
  buildTeamPageJsonLd,
} from "../../lib/team-seo.ts";
```

Add:

```js
test("team metadata description uses active API member counts", () => {
  const description = buildTeamMetadataDescription([
    { id: "1", name: "Mentor", role: "Pembimbing", customLinks: [] },
    { id: "2", name: "Builder", role: "Frontend Developer", customLinks: [] },
  ]);
  assert.match(description, /2 anggota aktif/);
  assert.match(description, /1 pembimbing/);
  assert.match(description, /1 anggota tim pengembang/);
  assert.match(buildTeamMetadataDescription([]), /tim multidisiplin/i);
});

test("team JSON-LD publishes people and safe social and custom sameAs links", () => {
  const jsonLd = buildTeamPageJsonLd([
    {
      id: "member-1",
      name: "Member One",
      role: "Backend Developer",
      photoUrl: "https://api.example.test/member.webp",
      github: "https://github.com/member",
      linkedin: null,
      instagram: "https://instagram.com/member",
      bio: "Builds services.",
      customLinks: [
        { label: "Portfolio", url: "https://member.example/", icon: null },
      ],
      year: "2023 - Sekarang",
      order: 1,
    },
  ]);

  assert.equal(jsonLd["@type"], "AboutPage");
  assert.equal(jsonLd.mainEntity["@type"], "Organization");
  assert.equal(jsonLd.mainEntity.member[0]["@type"], "Person");
  assert.deepEqual(jsonLd.mainEntity.member[0].sameAs, [
    "https://github.com/member",
    "https://instagram.com/member",
    "https://member.example/",
  ]);
  assert.equal(JSON.stringify(jsonLd).includes("email"), false);
  assert.equal(JSON.stringify(jsonLd).includes("nis"), false);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run `npm run test:seo`.

Expected: FAIL because `lib/team-seo.ts` does not exist.

- [ ] **Step 3: Implement pure SEO transforms**

Create `lib/team-seo.ts`:

```ts
import { absoluteUrl, siteConfig } from "./seo";
import type { PublicTeamMember } from "./team";

export const TEAM_FALLBACK_DESCRIPTION =
  "Kenali pembimbing dan tim multidisiplin yang membangun serta menjaga sistem absensi digital GASKAN SMTI Jogja.";

export function buildTeamMetadataDescription(
  members: Pick<PublicTeamMember, "role">[],
): string {
  if (members.length === 0) return TEAM_FALLBACK_DESCRIPTION;
  const mentors = members.filter((member) =>
    member.role.toLowerCase().includes("pembimbing"),
  ).length;
  const developers = members.length - mentors;
  return `Kenali ${members.length} anggota aktif Tim GASKAN SMTI Jogja: ${mentors} pembimbing dan ${developers} anggota tim pengembang sistem absensi digital.`;
}

export function buildTeamPageJsonLd(members: PublicTeamMember[]) {
  const teamUrl = absoluteUrl("/team");
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Tim GASKAN",
    url: teamUrl,
    description: buildTeamMetadataDescription(members),
    inLanguage: siteConfig.language,
    mainEntity: {
      "@type": "Organization",
      name: siteConfig.name,
      alternateName: siteConfig.alternateName,
      url: absoluteUrl("/"),
      member: members.map((member) => {
        const sameAs = [
          member.github,
          member.linkedin,
          member.instagram,
          ...member.customLinks.map((link) => link.url),
        ].filter((url): url is string => Boolean(url));
        const description = [
          member.bio,
          member.year ? `Anggota Tim GASKAN periode ${member.year}.` : null,
        ]
          .filter((value): value is string => Boolean(value))
          .join(" ");
        return {
          "@type": "Person",
          name: member.name,
          jobTitle: member.role,
          ...(description ? { description } : {}),
          ...(member.photoUrl ? { image: member.photoUrl } : {}),
          ...(sameAs.length > 0 ? { sameAs: [...new Set(sameAs)] } : {}),
          memberOf: {
            "@type": "Organization",
            name: siteConfig.name,
            url: absoluteUrl("/"),
          },
        };
      }),
    },
  };
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```powershell
npm run test:seo
npx tsc --noEmit
```

Expected: all tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit SEO transforms**

```powershell
git add lib/team-seo.ts tests/seo/seo.test.mjs
git commit -m "feat: generate team metadata and structured data"
```

### Task 3: Render the API data on the server

**Files:**
- Create: `app/team/TeamPageClient.tsx`
- Modify: `app/team/page.tsx`
- Modify: `app/team/layout.tsx`
- Modify: `tests/seo/seo.test.mjs`

- [ ] **Step 1: Write a failing route-boundary regression test**

Read the route sources and assert:

```js
test("the public team route renders API data and JSON-LD from the server", async () => {
  const pageSource = await readFile(
    new URL("../../app/team/page.tsx", import.meta.url),
    "utf8",
  );
  const layoutSource = await readFile(
    new URL("../../app/team/layout.tsx", import.meta.url),
    "utf8",
  );
  const clientSource = await readFile(
    new URL("../../app/team/TeamPageClient.tsx", import.meta.url),
    "utf8",
  ).catch(() => "");

  assert.doesNotMatch(pageSource, /^["']use client["'];/m);
  assert.match(pageSource, /getPublicTeamMembers/);
  assert.match(pageSource, /buildTeamPageJsonLd/);
  assert.match(pageSource, /application\/ld\+json/);
  assert.match(pageSource, /<TeamPageClient team=\{team\}/);
  assert.match(layoutSource, /export async function generateMetadata/);
  assert.match(layoutSource, /buildTeamMetadataDescription/);
  assert.match(clientSource, /team: PublicTeamMember\[\]/);
  assert.doesNotMatch(clientSource, /api\.get\(['"]\/team['"]\)/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run `npm run test:seo`.

Expected: FAIL because the route is still a Client Component and `TeamPageClient.tsx` does not exist.

- [ ] **Step 3: Move the interactive page into a prop-driven Client Component**

Move the current `app/team/page.tsx` content to `app/team/TeamPageClient.tsx`, then:

- Keep `"use client"`.
- Remove `api`, `useEffect`, and `useCallback`.
- Remove `API_BASE`, the client fetch function, and loading state.
- Import `PublicTeamMember` from `@/lib/team`.
- Export this signature:

```tsx
export function TeamPageClient({
  team,
}: {
  team: PublicTeamMember[];
}) {
```

- Keep grouping and modal behavior.
- Use the already-normalized `member.photoUrl` directly.
- Use `member.customLinks` directly.
- Render social/custom anchors with `target="_blank"` and `rel="noopener noreferrer"` and without `nofollow` or `ugc`.
- Add `aria-label={s.name}` and `title={s.name}` to icon-only anchors.
- Remove the loading branch so the first conditional is the empty-state branch.

- [ ] **Step 4: Create the Server Component route**

Replace `app/team/page.tsx` with:

```tsx
import { serializeJsonLd } from "@/lib/seo";
import { getPublicTeamMembers } from "@/lib/team";
import { buildTeamPageJsonLd } from "@/lib/team-seo";
import { TeamPageClient } from "./TeamPageClient";

export default async function PublicTeamPage() {
  const team = await getPublicTeamMembers();
  const jsonLd = serializeJsonLd(buildTeamPageJsonLd(team));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <TeamPageClient team={team} />
    </>
  );
}
```

- [ ] **Step 5: Generate route metadata from the same data**

Replace the static metadata export in `app/team/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo";
import { getPublicTeamMembers } from "@/lib/team";
import { buildTeamMetadataDescription } from "@/lib/team-seo";

export async function generateMetadata(): Promise<Metadata> {
  const team = await getPublicTeamMembers();
  return createPublicPageMetadata({
    title: "Tim GASKAN — Pengembang Sistem Absensi SMTI Jogja",
    description: buildTeamMetadataDescription(team),
    path: "/team",
  });
}

export default function TeamLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
```

- [ ] **Step 6: Run route tests, TypeScript, and the SEO suite**

Run:

```powershell
npm run test:seo
npx tsc --noEmit
```

Expected: all tests pass and TypeScript exits 0.

- [ ] **Step 7: Commit the server-rendered route**

```powershell
git add app/team/page.tsx app/team/layout.tsx app/team/TeamPageClient.tsx tests/seo/seo.test.mjs
git commit -m "feat: server-render public team discovery data"
```

### Task 4: Correct the API fallback configuration

**Files:**
- Modify: `.env.example`
- Modify: `next.config.ts`
- Modify: `tests/seo/seo.test.mjs`

- [ ] **Step 1: Write a failing configuration regression test**

```js
test("team-facing configuration defaults to the SMTI Jogja API origin", async () => {
  const envExample = await readFile(
    new URL("../../.env.example", import.meta.url),
    "utf8",
  );
  const nextConfig = await readFile(
    new URL("../../next.config.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    envExample,
    /NEXT_PUBLIC_API_BASE=https:\/\/gaskan-api\.smtijogja\.my\.id/,
  );
  assert.match(
    envExample,
    /NEXT_PUBLIC_WS_BASE=wss:\/\/gaskan-api\.smtijogja\.my\.id/,
  );
  assert.match(nextConfig, /gaskan-api\.smtijogja\.my\.id/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run `npm run test:seo`.

Expected: FAIL because `.env.example` and the Next.js fallback still use the legacy origin.

- [ ] **Step 3: Update the defaults**

Set:

```dotenv
NEXT_PUBLIC_API_BASE=https://gaskan-api.smtijogja.my.id
NEXT_PUBLIC_WS_BASE=wss://gaskan-api.smtijogja.my.id
```

In `next.config.ts`, change the fallback:

```ts
const targetApi =
  process.env.NEXT_PUBLIC_API_BASE || "https://gaskan-api.smtijogja.my.id";
```

Add the current origin to `images.remotePatterns`:

```ts
{
  protocol: "https",
  hostname: "gaskan-api.smtijogja.my.id",
},
```

Retain the legacy image hostname because existing API records may still contain absolute legacy photo URLs.

- [ ] **Step 4: Run tests and TypeScript**

Run:

```powershell
npm run test:seo
npx tsc --noEmit
```

Expected: all tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit configuration**

```powershell
git add .env.example next.config.ts tests/seo/seo.test.mjs
git commit -m "fix: use the current GASKAN API origin"
```

### Task 5: Production verification

**Files:**
- Verify only.

- [ ] **Step 1: Run complete checks**

```powershell
npm run test:seo
npx tsc --noEmit
npm run build
```

Expected:

- SEO suite reports zero failures.
- TypeScript exits 0.
- Next.js production build exits 0 and includes `/team`.

- [ ] **Step 2: Inspect the generated team HTML**

Search the build output:

```powershell
rg -n -F 'application/ld+json' .next/server/app/team -g '*.html'
rg -n -F 'Fahreza Pasha Haikal' .next/server/app/team -g '*.html'
rg -n -F 'https://github.com/' .next/server/app/team -g '*.html'
```

Expected: generated `/team` HTML contains JSON-LD, an API member name, and crawlable social URLs when the API is reachable during the build.

If the API is unavailable during build, start the production server and request `/team`; the route must still return 200 with fallback metadata and no leaked private fields.

- [ ] **Step 3: Verify no private fields are emitted**

```powershell
rg -n -i '\"nis\"|\"email\"|\"userId\"' .next/server/app/team -g '*.html'
```

Expected: no matches in the team HTML.

- [ ] **Step 4: Check the final diff**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors and a clean working tree after task commits.
