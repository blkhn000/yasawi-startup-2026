import assert from "node:assert/strict";

const apiUrl = (process.env.TEST_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;

const health = await jsonRequest("/health");
assert.equal(health.status, "ok");
assert.equal(health.database, "ok");

const home = await jsonRequest("/public/home");
assert.ok(home.settings, "Public settings are missing");
assert.ok(Array.isArray(home.programs), "Programs must be an array");
assert.ok(Array.isArray(home.projects), "Projects must be an array");

if (email && password) {
  const loginResponse = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(loginResponse.status, 201, `Login returned ${loginResponse.status}`);

  const cookies = cookieHeader(loginResponse.headers.getSetCookie?.() ?? [loginResponse.headers.get("set-cookie")].filter(Boolean));
  assert.ok(cookies.includes("yasawi_access="), "Access cookie is missing");

  const dashboard = await jsonRequest("/admin/dashboard", { headers: { cookie: cookies } });
  assert.ok(dashboard.counters, "Admin dashboard counters are missing");

  const logoutResponse = await fetch(`${apiUrl}/auth/logout`, { method: "POST", headers: { cookie: cookies } });
  assert.equal(logoutResponse.status, 201, `Logout returned ${logoutResponse.status}`);
} else {
  console.warn("Admin smoke checks skipped: set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD.");
}

console.log("Yasawi API smoke test passed.");

async function jsonRequest(path, init) {
  const response = await fetch(`${apiUrl}${path}`, init);
  const body = await response.text();
  assert.ok(response.ok, `${path} returned ${response.status}: ${body}`);
  return JSON.parse(body);
}

function cookieHeader(setCookieHeaders) {
  return setCookieHeaders.map((header) => header.split(";", 1)[0]).join("; ");
}
