export const locales = ["kk", "ru", "en", "tr"] as const;
export type Locale = (typeof locales)[number];

export const localeCookie = "yasawi_locale";

export const localeNames: Record<Locale, string> = {
  kk: "Қазақша",
  ru: "Русский",
  en: "English",
  tr: "Türkçe",
};

export function normalizeLocale(value?: string | null): Locale {
  return locales.includes(value as Locale) ? value as Locale : "ru";
}

export function localeFromPath(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return locales.includes(segment as Locale) ? segment as Locale : null;
}

export function stripLocalePath(pathname: string) {
  const locale = localeFromPath(pathname);
  if (!locale) return pathname || "/";
  const stripped = pathname.slice(locale.length + 1);
  return stripped || "/";
}

export function localizedPath(locale: Locale, href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href.startsWith("/api/") || href === "/admin" || href.startsWith("/admin/")) return href;

  const hashIndex = href.indexOf("#");
  const queryIndex = href.indexOf("?");
  const suffixIndex = [hashIndex, queryIndex].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? href.length;
  const pathname = href.slice(0, suffixIndex);
  const suffix = href.slice(suffixIndex);
  const cleanPath = stripLocalePath(pathname);
  return `/${locale}${cleanPath === "/" ? "" : cleanPath}${suffix}`;
}
