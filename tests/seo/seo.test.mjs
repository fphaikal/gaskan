import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SITE_URL = "https://gaskan.smtijogja.sch.id";

const seo = await import("../../lib/seo.ts").catch(() => ({}));

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

test("absoluteUrl builds canonical URLs without a trailing slash on the root", () => {
  const absoluteUrl = getExport("absoluteUrl");

  assert.equal(absoluteUrl("/"), "https://gaskan.smtijogja.sch.id");
  assert.equal(
    absoluteUrl("/team"),
    "https://gaskan.smtijogja.sch.id/team",
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
