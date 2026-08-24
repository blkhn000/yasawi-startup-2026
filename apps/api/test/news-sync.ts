import assert from "node:assert/strict";
import type { PrismaService } from "../src/database/prisma.service";
import { NewsService } from "../src/content/news.service";

process.env.AYU_NEWS_REQUEST_ATTEMPTS = "1";
process.env.AYU_NEWS_TIMEOUT_MS = "1000";

const originalFetch = globalThis.fetch;
void run();

async function run() {
try {
  const successDatabase = databaseMock();
  globalThis.fetch = async () => new Response(`
    <div class="event-card featured">
      <div class="event-card_img"><img src="/uploads/kucuk/demo.jpg"></div>
      <h3 class="event-card_title"><a href="/birimler/ru/news/demo-day">Demo &amp; Day</a></h3>
      <i class="fal fa-clock"></i> 21.08.2026
      <i class="fal fa-location-dot"></i> Туркестан
    </div>
  `, { status: 200, headers: { "content-type": "text/html" } });

  const success = await new NewsService(successDatabase.prisma).refresh();
  assert.equal(success.success, true);
  assert.equal(success.importedItems, 1);
  assert.equal(success.usedCache, false);
  assert.equal(success.items[0]?.title, "Demo & Day");
  assert.equal(successDatabase.syncStates.at(-1)?.status, "success");

  const cachedItem = {
    id: "cached-id", externalId: "cached", title: "Cached news", summary: "", eventDate: new Date("2026-08-20T12:00:00Z"),
    imageUrl: "https://example.com/cached.jpg", sourceUrl: "https://example.com/cached", location: "Туркестан", source: "ayu" as const,
  };
  const failureDatabase = databaseMock([cachedItem]);
  globalThis.fetch = async () => new Response("Unavailable", { status: 503 });

  const failure = await new NewsService(failureDatabase.prisma).refresh();
  assert.equal(failure.success, false);
  assert.equal(failure.importedItems, 0);
  assert.equal(failure.usedCache, true);
  assert.equal(failure.items[0]?.id, "cached");
  assert.match(failure.error ?? "", /AYU responded with 503/);
  assert.equal(failureDatabase.syncStates.at(-1)?.status, "failed");

  console.log("News synchronization success/fallback contracts passed.");
} finally {
  globalThis.fetch = originalFetch;
}
}

function databaseMock(cached: Array<Record<string, unknown>> = []) {
  const records = new Map<string, Record<string, unknown>>();
  const syncStates: Array<{ status: string }> = [];
  const prisma = {
    newsItem: {
      findMany: async () => cached,
      findUnique: async ({ where }: { where: { externalId: string } }) => records.get(where.externalId) ?? null,
      upsert: async ({ where, create, update }: { where: { externalId: string }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const item = { ...(records.get(where.externalId) ?? create), ...update };
        records.set(where.externalId, item);
        return item;
      },
    },
    syncState: {
      upsert: async ({ create, update }: { create: { status: string }; update: { status: string } }) => {
        const state = syncStates.length ? update : create;
        syncStates.push(state);
        return state;
      },
    },
  } as unknown as PrismaService;
  return { prisma, syncStates };
}
