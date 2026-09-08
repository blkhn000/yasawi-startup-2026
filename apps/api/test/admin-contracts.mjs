import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const apiUrl = (process.env.TEST_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
const localEnv = existsSync("../../.env") ? Object.fromEntries(readFileSync("../../.env", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
})) : {};
const email = process.env.TEST_ADMIN_EMAIL ?? localEnv.ADMIN_SEED_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD ?? localEnv.ADMIN_SEED_PASSWORD;
assert.ok(email && password, "Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD for admin contract checks");

const login = await fetch(`${apiUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
assert.equal(login.status, 201, `Login failed: ${login.status}`);
const cookies = cookieHeader(login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")].filter(Boolean));

const [settings, projects, programs, cohorts, partners, team, news, pages, users, courses, integrations] = await Promise.all([
  get("settings"), get("projects"), get("programs"), get("cohorts"), get("partners"), get("team"), get("news"), get("pages"), get("users"), get("it-courses"), get("integrations"),
]);
assert.equal(integrations.smtp.service, "smtp");
assert.equal(integrations.storage.service, "storage");
assert.equal(integrations.smtp.configured, false, "Local SMTP should remain explicitly unconfigured until credentials are provided");
assert.equal((await post("integrations/storage/check")).reachable, true, "Media storage health check failed");

await patch("settings", pick(settings, ["currentCohort", "totalParticipants", "incubationWeeks", "nextCohortStatus", "nextCohortDate", "responseDays", "contactEmail", "contactPhone", "address", "whatsapp", "instagram", "telegram", "youtube", "contextStats", "heroEyebrow", "heroTitle", "heroOutline", "heroDescription"]));
if (projects[0]) await patch(`projects/${projects[0].id}`, pick(projects[0], ["name", "summary", "description", "tags", "stage", "trlLevel", "cohortLabel", "websiteUrl", "demoUrl", "presentationUrl", "socialUrl", "featured", "sortOrder", "published"]));
if (programs[0]) await patch(`programs/${programs[0].slug}`, pick(programs[0], ["title", "shortDescription", "description", "duration", "durationWeeks", "price", "runsPerYear", "equity", "isFree", "status", "format", "capacity", "applicationDeadline", "startDate", "endDate", "sortOrder", "published"]));
if (cohorts[0]) await patch(`cohorts/${cohorts[0].id}`, pick(cohorts[0], ["programId", "number", "title", "status", "capacity", "applicationDeadline", "startDate", "endDate", "published"]));
if (partners[0]) await patch(`partners/${partners[0].id}`, pick(partners[0], ["name", "logoUrl", "websiteUrl", "alt", "sortOrder", "published"]));
if (team[0]) await patch(`team/${team[0].id}`, pick(team[0], ["name", "role", "email", "phone", "imageUrl", "profileUrl", "sortOrder", "published"]));
const manuallyManagedNews = news.find((item) => item.source === "manual");
if (manuallyManagedNews) await patch(`news/${manuallyManagedNews.id}`, pick(manuallyManagedNews, ["title", "summary", "eventDate", "imageUrl", "sourceUrl", "location", "sortOrder", "published"]));
if (pages[0]) await patch(`pages/${pages[0].id}`, pick(pages[0], ["key", "page", "content", "seoTitle", "seoDescription", "status"]));
if (users[0]) await patch(`users/${users[0].id}`, pick(users[0], ["name", "role", "active"]));
if (courses[0]) await patch(`it-courses/${courses[0].id}`, pick(courses[0], ["slug", "title", "shortDescription", "description", "dateLabel", "format", "duration", "includes", "imageUrl", "sortOrder", "published"]));

const [publicHome, publicPrograms, publicProjects, publicPartners, publicTeam, publicNews, publicCourses] = await Promise.all([
  publicGet("home"), publicGet("programs"), publicGet("projects"), publicGet("partners"), publicGet("team?limit=100"), publicGet("news?limit=100"), publicGet("it-courses"),
]);
assert.equal(publicHome.settings.currentCohort, settings.currentCohort, "Site settings do not reach the public API");
assert.equal(publicHome.settings.contactEmail, settings.contactEmail, "Contacts do not reach the public API");
assert.equal(publicHome.startupCount, projects.filter((item) => item.published).length, "Published project counter is out of sync");
assert.deepEqual(sorted(publicPrograms.map((item) => item.slug)), sorted(programs.filter((item) => item.published).map((item) => item.slug)), "Published programs are out of sync");
assert.deepEqual(sorted(publicProjects.map((item) => item.databaseId)), sorted(projects.filter((item) => item.published).map((item) => item.databaseId)), "Published projects are out of sync");
assert.equal(publicPartners.length, partners.filter((item) => item.published).length, "Published partners are out of sync");
assert.equal(publicTeam.length, team.filter((item) => item.published).length, "Published team is out of sync");
assert.equal(publicNews.length, news.filter((item) => item.published).length, "Published news are out of sync");
assert.equal(publicCourses.length, courses.filter((item) => item.published).length, "Published IT courses are out of sync");

const publishedPage = pages.find((item) => item.status === "published");
if (publishedPage) {
  const publicPage = await publicGet(`pages/${publishedPage.key}`);
  assert.equal(publicPage.key, publishedPage.key, "Published page is out of sync");
}

console.log("Admin frontend/backend contracts passed.");

async function get(path) {
  const response = await fetch(`${apiUrl}/admin/${path}`, { headers: { cookie: cookies } });
  const body = await response.text();
  assert.ok(response.ok, `GET ${path} failed: ${response.status} ${body}`);
  return JSON.parse(body);
}
async function patch(path, body) {
  const response = await fetch(`${apiUrl}/admin/${path}`, { method: "PATCH", headers: { cookie: cookies, "content-type": "application/json" }, body: JSON.stringify(body) });
  const responseBody = await response.text();
  assert.ok(response.ok, `PATCH ${path} failed: ${response.status} ${responseBody}`);
}
async function post(path, body) {
  const response = await fetch(`${apiUrl}/admin/${path}`, { method: "POST", headers: { cookie: cookies, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const responseBody = await response.text();
  assert.ok(response.ok, `POST ${path} failed: ${response.status} ${responseBody}`);
  return JSON.parse(responseBody);
}
async function publicGet(path) {
  const response = await fetch(`${apiUrl}/public/${path}`);
  const body = await response.text();
  assert.ok(response.ok, `GET public/${path} failed: ${response.status} ${body}`);
  return JSON.parse(body);
}
function pick(source, keys) { return Object.fromEntries(keys.map((key) => [key, source[key]])); }
function cookieHeader(headers) { return headers.map((header) => header.split(";", 1)[0]).join("; "); }
function sorted(values) { return [...values].sort(); }
