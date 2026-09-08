import assert from "node:assert/strict";

const origin = (process.env.TEST_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const canonicalOrigin = (process.env.TEST_CANONICAL_ORIGIN || origin).replace(/\/$/, "");
const locales = ["kk", "ru", "en", "tr"];
const routes = ["", "/about", "/program", "/program/incubation", "/program/acceleration", "/program/it-education", "/startups", "/gallery", "/faq", "/apply", "/privacy", "/consent", "/terms"];
const legalRoutes = new Set(["/privacy", "/consent", "/terms"]);
const legalMarkers = { kk: "дербес деректер", ru: "персональных данных", en: "personal data", tr: "kişisel veri" };

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function request(path, init) {
  const response = await fetch(`${origin}${path}`, init);
  const body = await response.text();
  return { response, body };
}

const root = await fetch(`${origin}/`, { redirect: "manual" });
assert.equal(root.status, 308, "The unprefixed homepage must permanently redirect");
assert.equal(new URL(root.headers.get("location"), origin).pathname, "/ru", "The default locale must be Russian");

let checkedPages = 0;
for (const locale of locales) {
  for (const route of routes) {
    const path = `/${locale}${route}`;
    const { response, body } = await request(path);
    assert.equal(response.status, 200, `${path} must return 200`);
    assert.match(body, new RegExp(`<html[^>]+lang=["']${locale}["']`, "i"), `${path} must expose the correct html lang`);
    assert.match(body, /<title>[^<]{8,}<\/title>/i, `${path} must have a useful title`);
    assert.match(body, /<meta[^>]+name="description"[^>]+content="[^"]{30,}"/i, `${path} must have a useful description`);
    assert.match(body, new RegExp(`<link[^>]+rel="canonical"[^>]+href="${escapeRegex(`${canonicalOrigin}${path}`)}"`, "i"), `${path} must have a self canonical`);
    for (const alternate of [...locales, "x-default"]) {
      assert.match(body, new RegExp(`<link[^>]+rel="alternate"[^>]+hrefLang="${alternate}"`, "i"), `${path} is missing hreflang ${alternate}`);
    }
    assert.match(body, /property="og:title"/i, `${path} is missing Open Graph metadata`);
    assert.match(body, /property="og:image"/i, `${path} is missing an Open Graph image`);
    assert.match(body, /name="twitter:card" content="summary_large_image"/i, `${path} is missing Twitter Card metadata`);
    assert.match(body, /type="application\/ld\+json"/i, `${path} is missing structured data`);
    const h1Count = (body.match(/<h1(?:\s|>)/gi) || []).length;
    assert.equal(h1Count, 1, `${path} must contain exactly one h1, found ${h1Count}`);
    if (legalRoutes.has(route)) {
      const visibleHtml = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
      assert.match(visibleHtml, /990440008043/, `${path} must identify the operator by BIN`);
      assert.ok(visibleHtml.toLocaleLowerCase().includes(legalMarkers[locale]), `${path} is missing its localized personal-data terminology`);
      assert.doesNotMatch(visibleHtml, /\{(?:operator|bin|email|phone|address)\}/, `${path} contains an unresolved legal placeholder`);
    }
    checkedPages += 1;
  }
}

const { response: robotsResponse, body: robots } = await request("/robots.txt");
assert.equal(robotsResponse.status, 200, "robots.txt must return 200");
assert.match(robots, /Disallow: \/admin/i, "robots.txt must exclude the admin panel");
assert.match(robots, new RegExp(`Sitemap: ${escapeRegex(canonicalOrigin)}/sitemap\\.xml`, "i"), "robots.txt must reference the sitemap");

const { response: sitemapResponse, body: sitemap } = await request("/sitemap.xml");
assert.equal(sitemapResponse.status, 200, "sitemap.xml must return 200");
for (const locale of locales) {
  assert.match(sitemap, new RegExp(`<loc>${escapeRegex(canonicalOrigin)}/${locale}(?:<|/)`, "i"), `sitemap.xml is missing ${locale}`);
}
assert.match(sitemap, /hreflang="x-default"/i, "sitemap.xml must include x-default alternates");
assert.doesNotMatch(sitemap, /\/admin(?:<|\/)/i, "sitemap.xml must not include admin pages");

const admin = await request("/admin");
assert.equal(admin.response.status, 200, "/admin must remain accessible");
assert.match(admin.response.headers.get("x-robots-tag") || "", /noindex/i, "/admin must send X-Robots-Tag: noindex");
assert.match(admin.body, /<meta[^>]+name="robots"[^>]+noindex/i, "/admin must include a noindex meta tag");

const image = await fetch(`${origin}/opengraph-image`);
assert.equal(image.status, 200, "Open Graph image must return 200");
assert.match(image.headers.get("content-type") || "", /^image\//i, "Open Graph route must return an image");

console.log(`SEO audit passed: ${checkedPages} localized pages, robots, sitemap, admin noindex and social image.`);
