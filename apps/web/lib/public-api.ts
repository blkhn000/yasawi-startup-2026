export type PublicProgram = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  duration: string;
  durationWeeks: number | null;
  price: string;
  runsPerYear: number;
  equity: string;
  isFree: boolean;
  status: "open" | "soon" | "closed" | "completed";
  format: string;
  capacity: number | null;
  published: boolean;
};

export type PublicSettings = {
  currentCohort?: number;
  totalParticipants?: number;
  incubationWeeks?: number;
  responseDays?: number;
  nextCohortStatus?: "open" | "soon" | "closed" | "completed";
  nextCohortDate?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  whatsapp?: string | null;
  instagram?: string | null;
  telegram?: string | null;
  youtube?: string | null;
  contextStats?: Array<{ value: string; label: string; note?: string; source?: "manual" | "currentCohort" | "totalParticipants" | "incubationWeeks" | "startupCount" }>;
  heroEyebrow?: string;
  heroTitle?: string;
  heroOutline?: string;
  heroDescription?: string;
};

export type PublicHomeData = {
  settings: Required<Pick<PublicSettings, "contactEmail" | "contactPhone" | "address">> & PublicSettings;
  programs: PublicProgram[];
  news: Array<{ id: string; title: string; summary?: string; date: string; imageUrl: string; url: string; location: string; source: "AYU" | "YASAWI" }>;
  team: Array<{ id: string; name: string; role: string; email: string; phone?: string | null; image: string; profileUrl: string | null; source: "YASAWI" }>;
  partners: Array<{ name: string; logoUrl: string; websiteUrl?: string | null }>;
  itCourses: ItCourse[];
  startupCount: number;
};

export type PublicNewsItem = PublicHomeData["news"][number];

export type PublicProject = {
  id: string;
  slug: string;
  name: string;
  text: string;
  summary: string;
  description: string;
  tags: string[];
  accent: string;
  secondary: string;
  glyph: string;
  stage: string;
  trlLevel: number | null;
  cohort: string;
  visual: string;
  websiteUrl: string | null;
  demoUrl?: string | null;
  presentationUrl?: string | null;
  socialUrl?: string | null;
  media: Array<{ url: string; kind: string; alt: string }>;
};

export type ItCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  dateLabel: string;
  format: string;
  duration: string;
  includes: string[];
  imageUrl: string | null;
};

export type PublicPageRecord<T> = {
  key: string;
  page: string;
  content: T;
  seoTitle: string | null;
  seoDescription: string | null;
};

const origin = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
const localized = (path: string, locale: Locale = "ru") => `${origin}${path}${path.includes("?") ? "&" : "?"}locale=${locale}`;

export async function getPublicPrograms(locale: Locale = "ru"): Promise<PublicProgram[] | null> {
  try {
    const response = await fetch(localized("/api/public/programs", locale), { cache: "no-store" });
    return response.ok ? response.json() as Promise<PublicProgram[]> : null;
  } catch { return null; }
}

export async function getPublicProgram(slug: string, locale: Locale = "ru"): Promise<PublicProgram | null> {
  try {
    const response = await fetch(localized(`/api/public/programs/${slug}`, locale), { cache: "no-store" });
    return response.ok ? response.json() as Promise<PublicProgram> : null;
  } catch { return null; }
}

export async function getPublicSettings(locale: Locale = "ru"): Promise<PublicSettings | null> {
  try {
    const response = await fetch(localized("/api/public/site-settings", locale), { cache: "no-store" });
    return response.ok ? response.json() as Promise<PublicSettings> : null;
  } catch { return null; }
}

export async function getPublicHome(locale: Locale = "ru"): Promise<PublicHomeData | null> {
  try {
    const response = await fetch(localized("/api/public/home", locale), { cache: "no-store" });
    return response.ok ? response.json() as Promise<PublicHomeData> : null;
  } catch { return null; }
}

export async function getPublicNews(locale: Locale = "ru", limit = 60): Promise<PublicNewsItem[] | null> {
  try {
    const response = await fetch(localized(`/api/public/news?limit=${limit}`, locale), { cache: "no-store" });
    return response.ok ? response.json() as Promise<PublicNewsItem[]> : null;
  } catch { return null; }
}

export async function getPublicProjects(locale: Locale = "ru"): Promise<PublicProject[] | null> {
  try {
    const response = await fetch(localized("/api/public/projects", locale), { cache: "no-store" });
    return response.ok ? response.json() as Promise<PublicProject[]> : null;
  } catch { return null; }
}

export async function getItCourses(locale: Locale = "ru"): Promise<ItCourse[] | null> {
  try {
    const response = await fetch(localized("/api/public/it-courses", locale), { cache: "no-store" });
    return response.ok ? response.json() as Promise<ItCourse[]> : null;
  } catch { return null; }
}

export async function getPublicPage<T>(key: string, locale: Locale = "ru"): Promise<T | null> {
  return (await getPublicPageRecord<T>(key, locale))?.content ?? null;
}

export async function getPublicPageRecord<T>(key: string, locale: Locale = "ru"): Promise<PublicPageRecord<T> | null> {
  try {
    const response = await fetch(localized(`/api/public/pages/${key}`, locale), { cache: "no-store" });
    if (!response.ok) return null;
    return response.json() as Promise<PublicPageRecord<T>>;
  } catch { return null; }
}
import type { Locale } from "@/i18n/config";
