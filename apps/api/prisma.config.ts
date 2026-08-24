import { defineConfig, env } from "prisma/config";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

for (const path of [join(process.cwd(), ".env"), join(process.cwd(), "..", "..", ".env")]) {
  try { loadEnvFile(path); } catch {}
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
