import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { Eyebrow, PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import { getLocale } from "@/i18n/server";
import { messages } from "@/i18n/messages";
import { managedPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "faq"); }

export default async function FaqPage() {
  const locale = await getLocale();
  const copy = messages[locale];
  return (
    <SiteLayout>
      <PageHero eyebrow={copy.nav.faq} title={copy.pages.faq.title} outline={copy.pages.faq.outline} description={copy.pages.faq.description} />
      <section className="section shell faq-page-layout">
        <aside><Reveal><Eyebrow>{copy.pages.faq.noAnswer}</Eyebrow><h2>{copy.pages.faq.write}</h2><p>{copy.pages.faq.text}</p><a className="text-link" href="mailto:yassawi_commerc@ayu.edu.kz">{copy.common.ask} <ArrowUpRight /></a></Reveal></aside>
        <FaqAccordion />
      </section>
    </SiteLayout>
  );
}
