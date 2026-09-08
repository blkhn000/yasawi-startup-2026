import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const webLegal = readFileSync("apps/web/i18n/legal-documents.ts", "utf8");
const apiConsent = readFileSync("apps/api/src/applications/legal-consent.ts", "utf8");
const form = readFileSync("apps/web/components/apply-page-content.tsx", "utf8");
const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");

const webVersion = webLegal.match(/LEGAL_DOCUMENT_VERSION = "([^"]+)"/)?.[1];
const apiVersion = apiConsent.match(/CURRENT_CONSENT_VERSION = "([^"]+)"/)?.[1];
assert.ok(webVersion, "Web legal document version is missing");
assert.equal(apiVersion, webVersion, "Web and API consent versions must match");

for (const route of ["privacy", "consent", "terms"]) {
  assert.ok(existsSync(`apps/web/app/${route}/page.tsx`), `/${route} page is missing`);
}

for (const marker of [
  "990440008043",
  "трансграничная передача",
  "жалпыға бірдей қолжетімді",
  "cross-border transfer",
  "sınır ötesi aktarım",
]) assert.ok(webLegal.toLocaleLowerCase().includes(marker.toLocaleLowerCase()), `Legal disclosure is missing: ${marker}`);

for (const field of ["consentVersion", "authorityConfirmed", "consentAt", "ipHash", "userAgent"]) {
  assert.ok(schema.includes(field), `Consent evidence field is missing: ${field}`);
  assert.ok(form.includes(field) || ["consentAt", "ipHash", "userAgent"].includes(field), `Form evidence field is missing: ${field}`);
}

for (const path of ["docs/legal/production-compliance.md", "docs/legal/publication-consent-template.md"]) {
  assert.ok(existsSync(path), `${path} is missing`);
}

console.log(`Legal document audit passed for version ${webVersion}.`);
