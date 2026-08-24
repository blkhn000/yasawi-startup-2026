import "server-only";
import type { Locale } from "@/i18n/config";
import { pageMetadata, type SeoPage } from "@/i18n/metadata";
import { getPublicPageRecord } from "@/lib/public-api";

export async function managedPageMetadata(locale: Locale, page: SeoPage, cmsKey: string = page) {
  const managed = await getPublicPageRecord<Record<string, unknown>>(cmsKey, locale);
  return pageMetadata(locale, page, {
    title: managed?.seoTitle,
    description: managed?.seoDescription,
  });
}
