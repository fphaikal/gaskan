# Public SEO Optimization Design

## Goal

Improve the search-engine visibility and social sharing quality of the two public GASKAN pages while preventing authentication and internal dashboard routes from appearing in search results.

## Canonical Site

- Production origin: `https://gaskan.smtijogja.sch.id`
- Indexable pages:
  - `/`
  - `/team`
- Non-indexable pages:
  - Authentication routes such as `/login`, `/forgot-password`, and `/reset-password`
  - All routes inside the dashboard route group, including the internal `/teams` workspace

## Architecture

SEO configuration will use the metadata APIs and metadata route conventions provided by the installed Next.js 16 version. Shared site identity and URL values will be centralized so metadata, sitemap, robots, and structured data cannot drift apart.

The root layout will define site-wide identity, the Google verification token, default Open Graph and Twitter sharing fields, and the production metadata base. The landing page and public team route will each define their own self-referencing canonical URL, title, and description.

The landing page composition does not use browser-only state, so it will become a Server Component while continuing to render the existing client-side landing sections. This allows the page to export its route-specific metadata and render `WebSite` JSON-LD in the initial HTML without changing the visual experience.

Authentication and dashboard route groups will override inherited metadata with `noindex`. Because the dashboard layout currently contains client-side hooks, its interactive shell will be separated from the server layout so the server layout can export route-group metadata without changing dashboard behavior.

## Public Route Access

The request proxy currently treats only `/` and authentication pages as public. It will be updated so unauthenticated crawlers and visitors can access:

- `/team`
- `/robots.txt`
- `/sitemap.xml`

The internal `/teams` route remains protected.

## Metadata

### Landing page

- Title: `GASKAN — Sistem Absensi Digital SMTI Jogja`
- Description: a concise description of GASKAN as the digital attendance and smart-access system for SMTI Jogja
- Canonical URL: `https://gaskan.smtijogja.sch.id`
- Open Graph type: `website`
- Open Graph locale: `id_ID`
- Twitter card: `summary_large_image`
- Social image: `/banner.webp`

### Public team page

- Title: `Tim GASKAN — Pengembang Sistem Absensi SMTI Jogja`
- Description: identifies the mentors and multidisciplinary development team behind GASKAN
- Canonical URL: `https://gaskan.smtijogja.sch.id/team`
- Open Graph and Twitter fields use the same site identity and social image

No `keywords` meta tag will be added. Search-facing titles, descriptions, headings, and visible copy remain the source of page relevance.

## Structured Data

The landing page will include one JSON-LD `WebSite` entity containing:

- `@context`
- `@type`
- `name`
- `alternateName`
- `url`
- `description`
- `inLanguage`

The structured data will contain only facts already visible on the site. `SoftwareApplication` rich-result markup will not be added because the site does not expose the review or rating data required by Google's supported software-app result.

## Sitemap and Robots

`app/sitemap.ts` will return exactly the two canonical public URLs:

- `https://gaskan.smtijogja.sch.id`
- `https://gaskan.smtijogja.sch.id/team`

`app/robots.ts` will:

- Allow normal crawling of the public site
- Disallow API endpoints from crawling
- Advertise `https://gaskan.smtijogja.sch.id/sitemap.xml`

Private HTML routes will rely on page-level `noindex` metadata rather than robots blocking, so crawlers that encounter those URLs can read the directive.

## Failure Handling

- Site URL configuration will normalize trailing slashes and fall back to the confirmed production origin when no deployment environment value exists.
- Metadata routes will remain static and independent of backend availability.
- Existing UI and client-side data fetching on `/team` will remain unchanged; this task does not make the team API a build dependency.
- Structured data serialization will escape `<` characters to prevent an embedded JSON value from becoming executable HTML.

## Files

Expected additions or changes:

- `lib/site-config.ts`: canonical site identity and URL helpers
- `app/layout.tsx`: shared metadata defaults and existing Google verification token
- `app/page.tsx`: server composition, landing metadata, and `WebSite` JSON-LD
- `app/team/layout.tsx`: public team metadata
- `app/(auth)/layout.tsx`: authentication-route `noindex`
- `app/(dashboard)/layout.tsx`: server metadata boundary
- `components/layout/DashboardShell.tsx`: existing dashboard client behavior moved without functional changes
- `app/sitemap.ts`: two public canonical URLs
- `app/robots.ts`: crawl policy and sitemap reference
- `proxy.ts`: public access for `/team` and metadata routes

## Verification

Verification will include:

1. Targeted tests for shared URL normalization and generated metadata-route values.
2. A production Next.js build.
3. Inspection of rendered HTML for:
   - Google verification
   - canonical links
   - Open Graph and Twitter fields
   - JSON-LD
   - `noindex` on authentication and dashboard route outputs
4. Requests to `/robots.txt` and `/sitemap.xml` to confirm public access and exact contents.
5. A diff check to confirm no unrelated UI or application behavior changed.

## Out of Scope

- Redesigning landing or team page visuals
- Creating a new social image
- Changing team API behavior or server-rendering team members
- Adding analytics or advertising tags
- Search Console submission or deployment
- Content marketing, backlink acquisition, or additional public pages
