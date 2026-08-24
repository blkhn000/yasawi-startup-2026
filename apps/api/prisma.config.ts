import { defineConfig } from "prisma/config";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

for (const path of [join(process.cwd(), ".env"), join(process.cwd(), "..", "..", ".env")]) {
  try { loadEnvFile(path); } catch {}
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
