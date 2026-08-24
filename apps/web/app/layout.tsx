import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { LocaleProvider } from "@/i18n/locale-provider";
import { messages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { managedPageMetadata } from "@/lib/seo";
import { CmsLiveRefresh } from "@/components/cms-live-refresh";
import { JsonLd } from "@/components/json-ld";
import { getPublicSettings } from "@/lib/public-api";
import { siteUrl } from "@/i18n/metadata";
import "./globals.css";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-manrope",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  variable: "--font-unbounded",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "home"); }

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const settings = await getPublicSettings(locale);
  const sameAs = [settings?.instagram, settings?.telegram, settings?.youtube].filter(Boolean);
  const identitySchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl()}/#organization`,
        name: "YASAWI STARTUP",
        url: siteUrl(),
        logo: `${siteUrl()}/brand/yasawi-startup-logo.png`,
        email: settings?.contactEmail,
        telephone: settings?.contactPhone,
        address: settings?.address ? { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "KZ" } : undefined,
        sameAs,
        parentOrganization: { "@type": "CollegeOrUniversity", name: "Akhmet Yassawi University", url: "https://ayu.edu.kz" },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl()}/#website`,
        name: "YASAWI STARTUP",
        url: siteUrl(),
        inLanguage: locale,
        publisher: { "@id": `${siteUrl()}/#organization` },
      },
    ],
  };
  return (
    <html lang={locale}>
      <body className={`${manrope.variable} ${unbounded.variable}`}><JsonLd data={identitySchema} /><LocaleProvider locale={locale} messages={messages[locale]}><CmsLiveRefresh />{children}</LocaleProvider></body>
    </html>
  );
}
