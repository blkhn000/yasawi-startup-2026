import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const localEnv = Object.fromEntries(readFileSync("../../.env", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
}));
const apiUrl = (process.env.TEST_API_URL ?? "http://127.0.0.1:4000/api").replace(/\/$/, "");
assert.ok(["127.0.0.1", "localhost"].includes(new URL(apiUrl).hostname), "This cleanup test may run only against a local API");

const login = await fetch(`${apiUrl}/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: process.env.TEST_ADMIN_EMAIL ?? localEnv.ADMIN_SEED_EMAIL, password: process.env.TEST_ADMIN_PASSWORD ?? localEnv.ADMIN_SEED_PASSWORD }),
});
assert.equal(login.status, 201, "Local admin login is required to clean up legal-consent test data");
const cookies = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")].filter(Boolean)).map((header) => header.split(";", 1)[0]).join("; ");

const createdIds = [];
const basePayload = {
  program: "incubation",
  name: "Legal Consent Test",
  email: `legal-consent-${Date.now()}@example.com`,
  phone: "+77001234567",
  idea: "Automated local test of versioned legal consent evidence.",
  consent: true,
  authorityConfirmed: true,
  locale: "kk",
};

try {
  const missingVersion = await submit(basePayload);
  if (missingVersion.response.status === 201) createdIds.push(missingVersion.body.id);
  assert.equal(missingVersion.response.status, 400, "An application without a consent version must be rejected");

  const staleVersion = await submit({ ...basePayload, email: `stale-consent-${Date.now()}@example.com`, consentVersion: "legacy-2026-08-19" });
  if (staleVersion.response.status === 201) createdIds.push(staleVersion.body.id);
  assert.equal(staleVersion.response.status, 400, "A stale consent version must be rejected");

  const accepted = await submit({ ...basePayload, consentVersion: "2026-09-08" });
  assert.equal(accepted.response.status, 201, JSON.stringify(accepted.body));
  createdIds.push(accepted.body.id);

  const listResponse = await fetch(`${apiUrl}/admin/applications?search=${encodeURIComponent(basePayload.email)}&pageSize=10`, { headers: { cookie: cookies } });
  assert.equal(listResponse.status, 200);
  const list = await listResponse.json();
  const stored = list.items.find((item) => item.id === accepted.body.id);
  assert.ok(stored, "The submitted application was not found");
  assert.equal(stored.consentVersion, "2026-09-08");
  assert.equal(stored.authorityConfirmed, true);
  assert.equal(stored.consent, true);
  assert.equal(stored.locale, "kk");
  assert.ok(stored.consentAt, "Consent timestamp is missing");
  assert.ok(stored.ipHash, "Hashed IP evidence is missing");
} finally {
  for (const id of createdIds) {
    const response = await fetch(`${apiUrl}/admin/applications/${id}`, { method: "DELETE", headers: { cookie: cookies } });
    assert.ok(response.ok, `Failed to clean up test application ${id}`);
  }
}

console.log("Versioned legal consent integration checks passed.");

async function submit(payload) {
  const response = await fetch(`${apiUrl}/applications`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : {} };
}
