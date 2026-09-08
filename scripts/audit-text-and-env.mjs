import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { chdir } from "node:process";
import { fileURLToPath } from "node:url";

chdir(fileURLToPath(new URL("../", import.meta.url)));

const roots = ["README.md", ".env.example", ".env.production.example", "docs", "apps/api/src", "apps/api/prisma", "apps/api/test", "apps/web/app", "apps/web/components", "apps/web/i18n", "apps/web/lib"];
const suspiciousSequences = ["Рџ", "РЎ", "Рђ", "РµР", "Р°Р", "СЃ", "вЂ", "Гј", "Д±", "Еџ", "Тљ", "У™"];
const ignored = new Set(["node_modules", ".next", "generated", "dist"]);
const suspicious = [];
let filesScanned = 0;

function walk(path) {
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path)) if (!ignored.has(name)) walk(join(path, name));
    return;
  }
  filesScanned += 1;
  const text = readFileSync(path, "utf8");
  const sequences = suspiciousSequences.filter((value) => text.includes(value));
  const replacementCharacters = (text.match(/�/g) ?? []).length;
  if (sequences.length || replacementCharacters) suspicious.push({ path, sequences, replacementCharacters });
}

for (const root of roots) walk(root);

const publicData = [];
if (process.argv.includes("--api")) {
  const apiUrl = (process.env.TEST_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
  const paths = ["home", "programs", "projects", "partners", "team?limit=100", "news?limit=100", "it-courses"];
  for (const locale of ["ru", "kk", "en", "tr"]) {
    for (const path of paths) {
      const separator = path.includes("?") ? "&" : "?";
      const response = await fetch(`${apiUrl}/public/${path}${separator}locale=${locale}`);
      if (!response.ok) throw new Error(`Public text audit failed to fetch ${path} (${locale}): ${response.status}`);
      const text = await response.text();
      const sequences = suspiciousSequences.filter((value) => text.includes(value));
      const replacementCharacters = (text.match(/�/g) ?? []).length;
      if (sequences.length || replacementCharacters) publicData.push({ path, locale, sequences, replacementCharacters });
    }
  }
}

const env = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
}));
const weak = (value) => !value || value.length < 32 || /replace|change|development-only/i.test(value);

console.log(JSON.stringify({
  text: { filesScanned, suspicious, publicData },
  environment: {
    nodeEnv: env.NODE_ENV,
    webOriginConfigured: Boolean(env.WEB_ORIGIN),
    cookieSecure: env.COOKIE_SECURE,
    jwtSecretStrong: !weak(env.JWT_ACCESS_SECRET),
    ipHashSaltStrong: !weak(env.IP_HASH_SALT),
    smtpConfigured: Boolean(env.SMTP_HOST),
    s3Configured: Boolean(env.S3_BUCKET),
    adminPasswordIntentionallyUnchanged: true,
  },
}, null, 2));
