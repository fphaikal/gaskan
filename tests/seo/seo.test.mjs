import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

process.env.NEXT_PUBLIC_SITE_URL = "https://gaskan.smtijogja.sch.id";

const seo = await import("../../lib/seo.ts").catch(() => ({}));
const publicPaths = await import("../../lib/public-paths.ts").catch(() => ({}));

function getExport(name) {
  assert.equal(
    typeof seo[name],
    "function",
    `Expected lib/seo.ts to export ${name}()`,
  );

  return seo[name];
}

test("normalizeSiteUrl returns a valid origin or the production fallback", () => {
  const normalizeSiteUrl = getExport("normalizeSiteUrl");

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

test("resolveSiteUrl always uses the canonical domain in production", () => {
  const resolveSiteUrl = getExport("resolveSiteUrl");

  assert.equal(
    resolveSiteUrl("http://localhost:3000", "production"),
    "https://gaskan.smtijogja.sch.id",
  );
});

test("resolveSiteUrl preserves a valid local origin during development", () => {
  const resolveSiteUrl = getExport("resolveSiteUrl");

  assert.equal(
    resolveSiteUrl("http://localhost:3000/path", "development"),
    "http://localhost:3000",
  );
});

test("resolveSiteUrl falls back for invalid non-production URLs", () => {
  const resolveSiteUrl = getExport("resolveSiteUrl");

  assert.equal(
    resolveSiteUrl("not-a-url", "development"),
    "https://gaskan.smtijogja.sch.id",
  );
});

test("absoluteUrl builds canonical URLs without a trailing slash on the root", () => {
  const absoluteUrl = getExport("absoluteUrl");

  assert.equal(absoluteUrl("/"), "https://gaskan.smtijogja.sch.id");
  assert.equal(
    absoluteUrl("/team"),
    "https://gaskan.smtijogja.sch.id/team",
  );
});

test("absoluteUrl keeps protocol-relative input on the configured site origin", () => {
  const absoluteUrl = getExport("absoluteUrl");

  assert.equal(
    absoluteUrl("//evil.example/x"),
    "https://gaskan.smtijogja.sch.id/evil.example/x",
  );
  assert.equal(
    absoluteUrl("/\\evil.example/x"),
    "https://gaskan.smtijogja.sch.id/evil.example/x",
  );
  assert.equal(
    absoluteUrl("/\\/evil.example/x"),
    "https://gaskan.smtijogja.sch.id/evil.example/x",
  );
  assert.equal(
    absoluteUrl("//\\\\evil.example/x"),
    "https://gaskan.smtijogja.sch.id/evil.example/x",
  );
});

test("createPublicPageMetadata returns complete public page metadata", () => {
  const createPublicPageMetadata = getExport("createPublicPageMetadata");

  const metadata = createPublicPageMetadata({
    title: "Tim GASKAN",
    description: "Tim pengembang GASKAN.",
    path: "/team",
  });

  assert.equal(
    metadata.alternates.canonical,
    "https://gaskan.smtijogja.sch.id/team",
  );
  assert.equal(
    metadata.openGraph.url,
    "https://gaskan.smtijogja.sch.id/team",
  );
  assert.equal(metadata.openGraph.locale, "id_ID");
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.deepEqual(metadata.robots, {
    index: true,
    follow: true,
  });
});

test("website JSON-LD describes the production site and serializes safely", () => {
  const buildWebsiteJsonLd = getExport("buildWebsiteJsonLd");
  const serializeJsonLd = getExport("serializeJsonLd");

  const website = buildWebsiteJsonLd();

  assert.equal(website["@type"], "WebSite");
  assert.equal(website.url, "https://gaskan.smtijogja.sch.id");
  assert.equal(
    serializeJsonLd({ payload: "</script><script>alert(1)</script>" }),
    '{"payload":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}',
  );
});

test("buildSitemap includes only the landing and public team routes", () => {
  const buildSitemap = getExport("buildSitemap");

  assert.deepEqual(
    buildSitemap().map(({ url }) => url),
    [
      "https://gaskan.smtijogja.sch.id",
      "https://gaskan.smtijogja.sch.id/team",
    ],
  );
});

test("buildRobots separates AI retrieval crawlers from training crawlers", () => {
  const buildRobots = getExport("buildRobots");

  const robots = buildRobots();
  const [retrievalRule, trainingRule] = robots.rules;

  assert.deepEqual(trainingRule.userAgent, [
    "GPTBot",
    "ClaudeBot",
    "Google-Extended",
  ]);
  assert.equal(trainingRule.disallow, "/");
  assert.ok(retrievalRule.userAgent.includes("OAI-SearchBot"));
  assert.ok(retrievalRule.allow.includes("/"));
  assert.ok(retrievalRule.disallow.includes("/api/"));
  assert.equal(
    robots.sitemap,
    "https://gaskan.smtijogja.sch.id/sitemap.xml",
  );
});

test("buildRobots blocks every current private top-level application route", () => {
  const buildRobots = getExport("buildRobots");
  const robots = buildRobots();
  const [retrievalRule, , wildcardRule] = robots.rules;
  const currentPrivateRoutes = [
    "/api/",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/home",
    "/absensi",
    "/admin",
    "/config",
    "/izin",
    "/jurusan",
    "/kalender",
    "/kelas",
    "/log",
    "/monitor",
    "/profile",
    "/reshuffle",
    "/semester",
    "/siswa",
    "/teams",
  ];

  for (const route of currentPrivateRoutes) {
    assert.ok(
      retrievalRule.disallow.includes(route),
      `retrieval crawler policy must disallow ${route}`,
    );
    assert.ok(
      wildcardRule.disallow.includes(route),
      `wildcard crawler policy must disallow ${route}`,
    );
  }
});

test("noIndexMetadata blocks indexing for standard and Google crawlers", () => {
  assert.deepEqual(seo.noIndexMetadata?.robots, {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  });
});

test("the SEO test script uses an explicit Node 20-compatible TypeScript runner", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8"),
  );

  assert.equal(
    packageJson.scripts["test:seo"],
    "tsx --test tests/seo/seo.test.mjs",
  );
  assert.equal(typeof packageJson.devDependencies.tsx, "string");
});

test("llms.txt describes only canonical public resources", async () => {
  const llmsText = await readFile(
    new URL("../../public/llms.txt", import.meta.url),
    "utf8",
  ).catch(() => "");
  const linkTargets = [
    ...llmsText.matchAll(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g),
  ].map((match) => match[1]);

  assert.match(llmsText, /^# GASKAN/m);
  assert.deepEqual(linkTargets, [
    "https://gaskan.smtijogja.sch.id",
    "https://gaskan.smtijogja.sch.id/team",
  ]);
  assert.doesNotMatch(llmsText, /\/login|\/home|\/teams/);
});

test("public route lists define the exact auth and discovery contract", () => {
  assert.deepEqual(publicPaths.AUTH_PATHS, [
    "/login",
    "/forgot-password",
    "/reset-password",
  ]);
  assert.deepEqual(publicPaths.DISCOVERY_PATHS, [
    "/team",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
  ]);
  assert.deepEqual(publicPaths.PUBLIC_PATHS, [
    "/",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/team",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
  ]);
});

test("isPublicPath permits only exact public route matches", () => {
  assert.equal(typeof publicPaths.isPublicPath, "function");

  const intendedPublicRoutes = [
    "/",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/team",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
  ];
  const protectedRoutes = [
    "/teams",
    "/team/member",
    "/home",
    "/api/user",
  ];

  for (const route of intendedPublicRoutes) {
    assert.equal(publicPaths.isPublicPath(route), true, `${route} must be public`);
  }

  for (const route of protectedRoutes) {
    assert.equal(
      publicPaths.isPublicPath(route),
      false,
      `${route} must remain protected`,
    );
  }
});
