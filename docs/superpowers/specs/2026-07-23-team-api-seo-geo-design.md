# Team API SEO and GEO Design

## Goal

Make the public `/team` page use `https://gaskan-api.smtijogja.my.id/api/team` as the source of truth for its visible member content, search metadata, and machine-readable entity data.

Only active team members are public. Search engines and generative-answer systems should receive the same names, roles, periods, biographies, photos, social profiles, and custom public links that visitors see.

## Considered Approaches

### 1. Keep the current client fetch and add static JSON-LD

This is the smallest change, but the JSON-LD would become a second hardcoded source of truth and could drift from the administration data. Member cards would also remain absent from the initial HTML.

### 2. Fetch the API only from `generateMetadata`

This makes the description dynamic but does not solve discoverability of member cards or provide a reusable data source for structured data.

### 3. Use one cached server data source for metadata, HTML, and JSON-LD

This is the selected approach. A server-only data function fetches and normalizes the public API payload. The route uses that function for dynamic metadata and server-rendered content, while the existing interactive modal remains in a Client Component. The same normalized data also produces JSON-LD.

## Architecture

### `lib/team.ts`

This module owns the external API contract and exposes only a public `TeamMember` shape. It will:

- Use `NEXT_PUBLIC_API_BASE`, with `https://gaskan-api.smtijogja.my.id` as the fallback origin.
- Request `${baseUrl}/api/team` with a one-hour Next.js revalidation window.
- Accept both `{ success, data }` and direct-array API response shapes.
- Keep active members only and sort them by `order`.
- Whitelist public fields instead of forwarding the backend object.
- Normalize photos and public links.
- Return an empty array on timeout, non-2xx responses, invalid payloads, or network errors.

The public shape contains `id`, `name`, `role`, `photoUrl`, `github`, `linkedin`, `instagram`, `bio`, `customLinks`, `year`, and `order`. It intentionally excludes `email`, `userId`, timestamps, and the nested `user` object, including NIS and email.

### `lib/team-seo.ts`

This pure module transforms normalized members into:

- A dynamic page description containing the active total and the pembimbing/developer split.
- An `AboutPage` JSON-LD graph whose main entity is the GASKAN organization.
- A `Person` entry for every active member.
- `sameAs` values made only from valid HTTP(S) GitHub, LinkedIn, Instagram, and custom URLs.

Social and custom links remain regular, crawlable anchors in the rendered HTML. They do not receive `nofollow` or `ugc`. These are outbound entity references from the school site; they can strengthen identity association and provide link signals to the destination profiles, but they are not inbound backlinks to GASKAN.

### `/team` route

`app/team/page.tsx` becomes a Server Component. It fetches normalized members, serializes the JSON-LD safely, renders the structured-data script, and passes the data to `TeamPageClient`.

`app/team/TeamPageClient.tsx` keeps the current layout, grouping, modal, and event handlers. It no longer fetches team data after hydration. Because its initial props come from the server page, member names, roles, biographies, and links are present in the first HTML response.

`app/team/layout.tsx` exports `generateMetadata`. The title and canonical URL remain stable; the description, Open Graph description, and Twitter description use the API-derived team summary. If the API is unavailable, the existing static description remains the fallback.

## Data Flow

1. Next.js renders `/team`.
2. `getPublicTeamMembers()` requests the public team API through the configured API origin.
3. The response is filtered, sorted, and reduced to public fields.
4. The normalized data feeds the metadata description, server-rendered member cards, and JSON-LD graph.
5. Next.js caches the API result for up to one hour and revalidates it in the background.
6. If the API fails, `/team` still renders its navigation, heading, empty state, static fallback metadata, and a valid JSON-LD page shell.

## URL and Link Rules

- Relative image paths are resolved against the configured API origin.
- Placeholder images containing `/0000.` are omitted from JSON-LD.
- Social and custom links must use `http:` or `https:`.
- Invalid, blank, `javascript:`, `data:`, and malformed URLs are discarded.
- Duplicate `sameAs` links are removed.
- Custom link labels and icon names remain display-only and do not affect structured-data semantics.

## Error Handling and Performance

- The server request uses an explicit timeout so an unhealthy backend cannot block rendering indefinitely.
- Failed API requests degrade to an empty public list and static metadata without exposing error details to visitors.
- A one-hour revalidation interval balances freshness with backend load. Team membership changes infrequently, so per-request fetching is unnecessary.
- The fetch request is shared by Next.js across metadata and page rendering when possible, avoiding duplicate upstream work.

## Testing

Automated tests will cover:

- API payload filtering and public-field whitelisting.
- Link and photo normalization.
- Dynamic description counts and fallback copy.
- JSON-LD `AboutPage`, organization, member `Person` entries, and `sameAs` values.
- Exclusion of private backend fields and unsafe URLs.
- Existing canonical, robots, sitemap, and `llms.txt` contracts.

TypeScript compilation and a production build will verify the Server/Client Component boundary and Next.js metadata behavior.
