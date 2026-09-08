export const supportedLocales = ["kk", "ru", "en", "tr"] as const;
export type SupportedLocale = typeof supportedLocales[number];

export function normalizeLocale(value?: string | null): SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale) ? value as SupportedLocale : "ru";
}

export function localizeRecord<T extends { translations?: unknown }>(record: T, input?: string | null): Omit<T, "translations"> {
  const locale = normalizeLocale(input);
  const { translations, ...base } = record;
  if (locale === "ru" || !isRecord(translations)) return base;
  const translated = translations[locale];
  if (!isRecord(translated)) return base;

  const localized = deepMerge(base, translated);
  const baseStats = "contextStats" in base && Array.isArray(base.contextStats) ? base.contextStats : null;
  const translatedStats = Array.isArray(translated.contextStats) ? translated.contextStats : null;
  if (!baseStats || !translatedStats) return localized;

  return {
    ...localized,
    contextStats: translatedStats.map((stat, index) => {
      if (!isRecord(stat)) return stat;
      const baseStat = baseStats[index];
      return isRecord(baseStat) && stat.source === undefined ? { ...stat, source: baseStat.source } : stat;
    }),
  } as Omit<T, "translations">;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(base: T, translated: Record<string, unknown>): T {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(translated)) {
    const baseValue = merged[key];
    merged[key] = isRecord(baseValue) && isRecord(value) ? deepMerge(baseValue, value) : value;
  }
  return merged as T;
}
