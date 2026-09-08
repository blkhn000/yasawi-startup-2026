import type { Metadata } from "next";
import "../pages.css";
import { legalContacts, LegalDocumentPage } from "@/components/legal-document-page";
import { legalDocuments } from "@/i18n/legal-documents";
import { getLocale } from "@/i18n/server";
import { getPublicSettings } from "@/lib/public-api";
import { managedPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "consent"); }

export default async function ConsentPage() {
  const locale = await getLocale();
  const settings = await getPublicSettings(locale);
  return <LegalDocumentPage document={legalDocuments[locale].consent} locale={locale} contacts={legalContacts(locale, {
    email: settings?.contactEmail, phone: settings?.contactPhone, address: settings?.address,
  })} />;
}
