# Public SEO and GEO Optimization Design

## Goal

Improve the search-engine and generative-answer visibility of the two public GASKAN pages while improving social sharing quality and marking authentication and internal dashboard routes as non-indexable.

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
- `/llms.txt`

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

## Generative Engine Optimization

GEO will build on the same canonical, crawlable, text-first public pages used for SEO. There is no separate AI-only version of the landing or team content.

The crawl policy will explicitly allow search and user-request crawlers used by the named providers:

- OpenAI: `OAI-SearchBot` and `ChatGPT-User`
- Anthropic: `Claude-SearchBot` and `Claude-User`
- Google: `Googlebot`, which is also the crawler used for Google Search AI features

The crawl policy will explicitly block known model-training controls for those providers:

- OpenAI: `GPTBot`
- Anthropic: `ClaudeBot`
- Google: `Google-Extended`

Blocking these training crawlers does not block the corresponding search crawlers. Other standards-compliant crawlers will follow the default public-site rules. Crawler names and provider policies can change, so this list represents the documented controls at implementation time rather than a permanent guarantee for every AI system.

A root-level `llms.txt` file will provide a concise Markdown summary of GASKAN and direct links to the canonical landing and team pages. It is a supplementary discovery aid based on an emerging convention; it is not treated as a universal indexing standard or a replacement for crawlable HTML, canonical metadata, structured data, or the sitemap.

## Sitemap and Robots

`app/sitemap.ts` will return exactly the two canonical public URLs:

- `https://gaskan.smtijogja.sch.id`
- `https://gaskan.smtijogja.sch.id/team`

`app/robots.ts` will:

- Allow normal crawling of the public site
- Explicitly allow the documented OpenAI, Anthropic, and Google search/retrieval crawlers
- Explicitly block `GPTBot`, `ClaudeBot`, and `Google-Extended`
- Disallow API endpoints from crawling
- Advertise `https://gaskan.smtijogja.sch.id/sitemap.xml`

Private HTML routes will rely on page-level `noindex` metadata rather than robots blocking, so crawlers that encounter those URLs can read the directive.

## Failure Handling

- Site URL configuration will normalize trailing slashes and fall back to the confirmed production origin when no deployment environment value exists.
- Metadata routes will remain static and independent of backend availability.
- `llms.txt` will contain only public, non-sensitive facts already presented on the site.
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
- `app/robots.ts`: search, AI retrieval, training-crawler, API, and sitemap policies
- `public/llms.txt`: concise AI-readable summary and canonical public links
- `proxy.ts`: public access for `/team`, `robots.txt`, `sitemap.xml`, and `llms.txt`

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
5. A request to `/llms.txt` to confirm public access and content.
6. Checks that search/retrieval crawlers are allowed and the selected training crawlers are blocked.
7. A diff check to confirm no unrelated UI or application behavior changed.

## Out of Scope

- Redesigning landing or team page visuals
- Creating a new social image
- Changing team API behavior or server-rendering team members
- Adding analytics or advertising tags
- Allowing the named providers' model-training crawlers
- Search Console submission or deployment
- Content marketing, backlink acquisition, or additional public pages
