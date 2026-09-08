import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../database/prisma.service";
import { localizeRecord } from "./localization";
import { curatedNewsTranslations } from "./news-translations";

export interface PublicNewsItem { id: string; title: string; summary: string; date: string; imageUrl: string; url: string; location: string; source: "AYU" | "YASAWI" }
export interface NewsSyncResult { success: boolean; items: PublicNewsItem[]; importedItems: number; usedCache: boolean; error?: string }
type ParsedNews = Omit<PublicNewsItem, "source">;

const AYU_BASE_URL = "https://ayu.edu.kz/birimler/";
const DEFAULT_SOURCE_URL = "https://ayu.edu.kz/birimler/ru/310-ticarilestirme-ofisi/";

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly sourceUrl = process.env.AYU_NEWS_SOURCE_URL ?? DEFAULT_SOURCE_URL;
  private readonly requestTimeoutMs = positiveNumber(process.env.AYU_NEWS_TIMEOUT_MS, 20_000);
  private readonly requestAttempts = positiveNumber(process.env.AYU_NEWS_REQUEST_ATTEMPTS, 3);
  private refreshPromise: Promise<NewsSyncResult> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async list(limit = 6, locale = "ru"): Promise<PublicNewsItem[]> {
    const items = await this.prisma.newsItem.findMany({ where: { published: true }, orderBy: [{ eventDate: "desc" }, { sortOrder: "asc" }], take: Math.min(30, Math.max(1, limit)) });
    if (items.length) return items.map((item) => toPublic(localizeRecord(item, locale), locale));
    return (await this.refresh()).items;
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledRefresh() { await this.refresh(); }

  async refresh(): Promise<NewsSyncResult> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.performRefresh();
    const promise = this.refreshPromise;
    try { return await promise; } finally { this.refreshPromise = null; }
  }

  private async performRefresh(): Promise<NewsSyncResult> {
    await this.setSync("running");
    try {
      const parsed = this.parse(await this.fetchSource());
      if (!parsed.length) throw new Error("No AYU event cards found");

      for (const [index, item] of parsed.entries()) {
        const existing = await this.prisma.newsItem.findUnique({ where: { externalId: item.id } });
        if (existing?.manualOverride) continue;
        const curatedTranslations = curatedNewsTranslations[item.id];
        const shouldAddTranslations = curatedTranslations && (!existing || !isNonEmptyRecord(existing.translations));
        await this.prisma.newsItem.upsert({
          where: { externalId: item.id },
          create: { externalId: item.id, title: item.title, eventDate: parseDate(item.date), imageUrl: item.imageUrl, sourceUrl: item.url, location: item.location, translations: curatedTranslations ?? {}, source: "ayu", syncedAt: new Date(), sortOrder: index, published: true },
          update: { title: item.title, eventDate: parseDate(item.date), imageUrl: item.imageUrl, sourceUrl: item.url, location: item.location, ...(shouldAddTranslations ? { translations: curatedTranslations } : {}), syncedAt: new Date(), sortOrder: index },
        });
      }
      await this.setSync("success", parsed.length);
      return { success: true, items: parsed.map((item) => ({ ...item, summary: "", source: "AYU" as const })), importedItems: parsed.length, usedCache: false };
    } catch (error) {
      const message = errorMessage(error);
      this.logger.warn(`News sync failed: ${message}`);
      await this.setSync("failed", undefined, message);
      const cached = await this.prisma.newsItem.findMany({ where: { published: true }, orderBy: { eventDate: "desc" }, take: 6 });
      return { success: false, items: cached.map((item) => toPublic(item, "ru")), importedItems: 0, usedCache: cached.length > 0, error: message };
    }
  }

  private async fetchSource() {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.requestAttempts; attempt += 1) {
      try {
        const response = await fetch(this.sourceUrl, {
          headers: { "User-Agent": "YasawiStartup/2.0 (+https://ayu.edu.kz)", Accept: "text/html,application/xhtml+xml" },
          signal: AbortSignal.timeout(this.requestTimeoutMs),
        });
        if (!response.ok) throw new Error(`AYU responded with ${response.status}`);
        return await response.text();
      } catch (error) {
        lastError = error;
        if (attempt < this.requestAttempts) await delay(attempt * 500);
      }
    }
    throw new Error(`AYU request failed after ${this.requestAttempts} attempts: ${errorMessage(lastError)}`);
  }

  private parse(html: string): ParsedNews[] {
    return html.split(/<div\b[^>]*class=["'][^"']*\bevent-card\b[^"']*["'][^>]*>/i).slice(1).map((card) => this.parseCard(card)).filter((item): item is ParsedNews => item !== null).filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 12);
  }

  private parseCard(card: string): ParsedNews | null {
    const imageBlock = card.match(/<div class="event-card_img"[\s\S]*?<img\b([^>]+)>/i)?.[1];
    const titleBlock = card.match(/<h3 class="event-card_title[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const date = card.match(/<i class="fal fa-clock"><\/i>\s*([^<]+)/i)?.[1];
    const location = card.match(/<i class="fal fa-location-dot"><\/i>\s*([^<]+)/i)?.[1];
    if (!imageBlock || !titleBlock || !date) return null;
    const imageSource = imageBlock.match(/\bsrc="([^"]+)"/i)?.[1];
    if (!imageSource) return null;
    const url = new URL(this.decode(titleBlock[1]), AYU_BASE_URL).href;
    return { id: url.split("/").filter(Boolean).at(-1) ?? url, title: this.clean(titleBlock[2]), summary: "", date: normalizeDate(this.clean(date)), imageUrl: new URL(this.decode(imageSource), AYU_BASE_URL).href.replace("/kucuk/", "/buyuk/"), url, location: location ? this.clean(location) : "Туркестан" };
  }

  private setSync(status: "running" | "success" | "failed", count?: number, error?: string) {
    const now = new Date();
    return this.prisma.syncState.upsert({ where: { source: "ayu-news" }, create: { source: "ayu-news", status, lastAttemptAt: now, lastSuccessAt: status === "success" ? now : undefined, itemsCount: count ?? 0, lastError: error }, update: { status, lastAttemptAt: now, ...(status === "success" ? { lastSuccessAt: now, itemsCount: count ?? 0, lastError: null } : {}), ...(error ? { lastError: error } : {}) } });
  }
  private clean(value: string) { return this.decode(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(); }
  private decode(value: string) { const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", laquo: "«", raquo: "»" }; return value.replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16))).replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code))).replace(/&([a-z]+);/gi, (entity, name: string) => named[name.toLowerCase()] ?? entity); }
}

function normalizeDate(value: string) { return value.match(/\d{2}\.\d{2}\.\d{4}/)?.[0] ?? value.slice(0, 10); }
function parseDate(value: string) { const [day, month, year] = value.split(".").map(Number); const date = day && month && year ? new Date(Date.UTC(year, month - 1, day, 12)) : new Date(value); return Number.isNaN(date.valueOf()) ? new Date() : date; }
function formatDate(date: Date, locale: string) { return new Intl.DateTimeFormat({ kk: "kk-KZ", en: "en-GB", tr: "tr-TR", ru: "ru-RU" }[locale] ?? "ru-RU", { timeZone: "Asia/Almaty" }).format(date); }
function toPublic(item: { id: string; externalId: string | null; title: string; summary: string; eventDate: Date; imageUrl: string; sourceUrl: string; location: string; source: "manual" | "ayu" }, locale: string): PublicNewsItem { return { id: item.externalId ?? item.id, title: item.title, summary: item.summary, date: formatDate(item.eventDate, locale), imageUrl: item.imageUrl, url: item.sourceUrl, location: item.location, source: item.source === "ayu" ? "AYU" : "YASAWI" }; }
function isNonEmptyRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0; }
function positiveNumber(value: string | undefined, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback; }
function errorMessage(error: unknown) { if (!(error instanceof Error)) return "unknown error"; const cause = "cause" in error && error.cause instanceof Error ? `: ${error.cause.message}` : ""; return `${error.message}${cause}`; }
function delay(milliseconds: number) { return new Promise<void>((resolve) => setTimeout(resolve, milliseconds)); }
