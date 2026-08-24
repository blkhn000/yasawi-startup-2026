import assert from "node:assert/strict";
import { hash } from "bcryptjs";
import { validate } from "class-validator";
import { CreateAdminDto } from "../src/auth/auth.dto";
import { inspectRuntimeEnvironment, isStrongPassword } from "../src/config/runtime-environment";
import { usesKnownDefaultPassword } from "../src/security/security-startup.service";

const validProduction = inspectRuntimeEnvironment({
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://database.example/yasawi",
  JWT_ACCESS_SECRET: "access-secret-with-more-than-32-characters-unique",
  ADMIN_SEED_PASSWORD: "Safe-Admin-Password-2026!",
  COOKIE_SECURE: "true",
  IP_HASH_SALT: "ip-hash-salt-with-more-than-32-characters",
  WEB_ORIGIN: "https://startup.example.kz",
  PUBLIC_API_URL: "https://api.example.kz",
});
assert.deepEqual(validProduction.errors, []);

const requiredIntegrations = inspectRuntimeEnvironment({
  ...{
    NODE_ENV: "production", DATABASE_URL: "postgresql://database.example/yasawi",
    JWT_ACCESS_SECRET: "access-secret-with-more-than-32-characters-unique", COOKIE_SECURE: "true",
    IP_HASH_SALT: "ip-hash-salt-with-more-than-32-characters", WEB_ORIGIN: "https://startup.example.kz",
  },
  REQUIRE_SMTP: "true",
  REQUIRE_S3: "true",
});
assert.ok(requiredIntegrations.errors.some((error) => error.includes("SMTP is required")));
assert.ok(requiredIntegrations.errors.some((error) => error.includes("S3 is required")));

const partialIntegrations = inspectRuntimeEnvironment({
  DATABASE_URL: "postgresql://database.example/yasawi",
  JWT_ACCESS_SECRET: "access-secret-with-more-than-32-characters-unique",
  SMTP_USER: "mailer",
  S3_BUCKET: "yasawi-media",
});
assert.ok(partialIntegrations.errors.some((error) => error.includes("SMTP configuration is incomplete")));
assert.ok(partialIntegrations.errors.some((error) => error.includes("S3 configuration is incomplete")));

const unsafeProduction = inspectRuntimeEnvironment({
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://database.example/yasawi",
  JWT_ACCESS_SECRET: "replace-with-at-least-32-random-characters",
  ADMIN_SEED_PASSWORD: "ChangeMe-2026!",
  COOKIE_SECURE: "false",
  WEB_ORIGIN: "http://localhost:3000,*",
  PUBLIC_API_URL: "http://api.example.kz",
});
assert.ok(unsafeProduction.errors.length >= 6);
assert.ok(unsafeProduction.errors.some((error) => error.includes("ADMIN_SEED_PASSWORD")));
assert.ok(unsafeProduction.errors.some((error) => error.includes("COOKIE_SECURE")));
assert.ok(unsafeProduction.errors.some((error) => error.includes("IP_HASH_SALT")));
assert.ok(unsafeProduction.errors.some((error) => error.includes("WEB_ORIGIN")));

assert.equal(isStrongPassword("ChangeMe-2026!"), false);
assert.equal(isStrongPassword("Safe-Admin-Password-2026!"), true);

void verifyPasswordHashes();

async function verifyPasswordHashes() {
  assert.equal(await usesKnownDefaultPassword(await hash("ChangeMe-2026!", 4)), true);
  assert.equal(await usesKnownDefaultPassword(await hash("Safe-Admin-Password-2026!", 4)), false);
  const weakAdmin = Object.assign(new CreateAdminDto(), { email: "editor@example.kz", name: "Editor", password: "simple-password" });
  const strongAdmin = Object.assign(new CreateAdminDto(), { email: "editor@example.kz", name: "Editor", password: "Safe-Editor-Password-2026!" });
  assert.ok((await validate(weakAdmin)).some((error) => error.property === "password"));
  assert.equal((await validate(strongAdmin)).length, 0);
  console.log("Runtime security configuration contracts passed.");
}
