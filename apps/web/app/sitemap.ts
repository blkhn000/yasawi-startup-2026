import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { absoluteUrl } from "@/i18n/metadata";
import { getPublicProjects } from "@/lib/public-api";

const staticPages = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/program", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/program/incubation", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/program/acceleration", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/program/it-education", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/startups", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/gallery", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/apply", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
];

function localizedEntries(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) {
  const languages = Object.fromEntries(locales.map((locale) => [locale, absoluteUrl(`/${locale}${path === "/" ? "" : path}`)]));
  return locales.map((locale) => ({
    url: languages[locale],
    changeFrequency,
    priority,
    alternates: { languages: { ...languages, "x-default": languages.ru } },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublicProjects("ru");
  const staticEntries = staticPages.flatMap((page) => localizedEntries(page.path, page.priority, page.changeFrequency));
  const projectEntries = (projects ?? []).flatMap((project) =>
    localizedEntries(`/startups/${project.slug || project.id}`, 0.7, "monthly"),
  );
  return [...staticEntries, ...projectEntries];
}
