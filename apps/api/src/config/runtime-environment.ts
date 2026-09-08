const knownUnsafePasswords = new Set(["ChangeMe-2026!", "replace-with-a-strong-password", "password", "admin123"]);
const knownUnsafeSecrets = new Set(["replace-with-at-least-32-random-characters", "change-me"]);

export type RuntimeEnvironmentReport = { errors: string[]; warnings: string[] };

export function inspectRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env): RuntimeEnvironmentReport {
  const production = env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!env.DATABASE_URL) errors.push("DATABASE_URL is required");
  if (!isSecret(env.JWT_ACCESS_SECRET)) errors.push("JWT_ACCESS_SECRET must be a unique secret with at least 32 characters");
  validateSmtp(env, errors);
  validateS3(env, errors);

  if (production) {
    if (env.ADMIN_SEED_PASSWORD && !isStrongPassword(env.ADMIN_SEED_PASSWORD)) errors.push("ADMIN_SEED_PASSWORD must be changed from the default and contain at least 14 characters");
    if (env.COOKIE_SECURE !== "true") errors.push("COOKIE_SECURE must be true in production");
    if (!isSecret(env.IP_HASH_SALT)) errors.push("IP_HASH_SALT must be a unique secret with at least 32 characters");
    if (env.PERSONAL_DATA_STORAGE_COUNTRY !== "KZ") errors.push("PERSONAL_DATA_STORAGE_COUNTRY must be KZ after confirming the database, backups and personal-data logs are hosted in Kazakhstan");
    validateProductionOrigins(env.WEB_ORIGIN, errors);
    if (env.PUBLIC_API_URL && !env.PUBLIC_API_URL.startsWith("https://")) errors.push("PUBLIC_API_URL must use HTTPS in production");
    if (env.REQUIRE_SMTP === "true" && !hasCompleteSmtp(env)) errors.push("SMTP is required but not completely configured");
    if (env.REQUIRE_S3 === "true" && !hasCompleteS3(env)) errors.push("S3 is required but not completely configured");
    if (env.TRUST_PROXY !== "true") warnings.push("TRUST_PROXY is disabled; enable it when HTTPS is terminated by a reverse proxy");
  } else {
    if (!isStrongPassword(env.ADMIN_SEED_PASSWORD)) warnings.push("The development administrator still uses a default or weak password");
    if (!isSecret(env.IP_HASH_SALT)) warnings.push("IP_HASH_SALT is not configured; the development-only fallback is being used");
  }

  if (!hasCompleteSmtp(env)) warnings.push("SMTP is not configured; application email notifications are disabled");
  if (!hasCompleteS3(env)) warnings.push("S3 is not configured; uploaded media requires persistent local storage");
  if (production && env.SWAGGER_ENABLED === "true") warnings.push("Swagger is publicly enabled in production");

  return { errors, warnings };
}

export function assertRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const report = inspectRuntimeEnvironment(env);
  if (report.errors.length) throw new Error(`Unsafe runtime configuration:\n- ${report.errors.join("\n- ")}`);
  return report;
}

export function isStrongPassword(value: string | undefined) {
  return Boolean(value && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{14,}$/.test(value) && !knownUnsafePasswords.has(value));
}

function isSecret(value: string | undefined) {
  return Boolean(value && value.length >= 32 && !knownUnsafeSecrets.has(value));
}

function validateProductionOrigins(value: string | undefined, errors: string[]) {
  const origins = value?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];
  if (!origins.length) { errors.push("WEB_ORIGIN is required in production"); return; }
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (url.protocol !== "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") throw new Error();
      if (url.pathname !== "/" || url.search || url.hash) throw new Error();
    } catch {
      errors.push(`WEB_ORIGIN contains an unsafe production origin: ${origin}`);
    }
  }
}

function hasCompleteSmtp(env: NodeJS.ProcessEnv) {
  if (!env.SMTP_HOST) return false;
  return Boolean(env.SMTP_FROM && (!env.SMTP_USER || env.SMTP_PASSWORD));
}

function hasCompleteS3(env: NodeJS.ProcessEnv) {
  if (!env.S3_BUCKET) return false;
  return Boolean(env.S3_PUBLIC_URL && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
}

function validateSmtp(env: NodeJS.ProcessEnv, errors: string[]) {
  const fields = [env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASSWORD].filter(Boolean);
  if (!fields.length) return;
  const port = Number(env.SMTP_PORT || 587);
  if (!env.SMTP_HOST || !env.SMTP_FROM || (env.SMTP_USER && !env.SMTP_PASSWORD)) errors.push("SMTP configuration is incomplete");
  if (!Number.isInteger(port) || port < 1 || port > 65_535) errors.push("SMTP_PORT must be an integer between 1 and 65535");
}

function validateS3(env: NodeJS.ProcessEnv, errors: string[]) {
  const fields = [env.S3_BUCKET, env.S3_ACCESS_KEY_ID, env.S3_SECRET_ACCESS_KEY, env.S3_PUBLIC_URL].filter(Boolean);
  if (!fields.length) return;
  if (!hasCompleteS3(env)) errors.push("S3 configuration is incomplete");
  if (env.S3_PUBLIC_URL) {
    try { new URL(env.S3_PUBLIC_URL); } catch { errors.push("S3_PUBLIC_URL must be a valid URL"); }
  }
}
