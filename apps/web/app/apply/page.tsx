import type { Metadata } from "next";
import { ApplyPageContent } from "@/components/apply-page-content";
import { SiteLayout } from "@/components/site-shell";
import { getLocale } from "@/i18n/server";
import { managedPageMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/lib/public-api";

export async function generateMetadata(): Promise<Metadata> {
  return managedPageMetadata(await getLocale(), "apply");
}

export default async function ApplyPage() {
  const settings = await getPublicSettings(await getLocale());
  return <SiteLayout darkHeader><ApplyPageContent responseDays={settings?.responseDays} /></SiteLayout>;
}
