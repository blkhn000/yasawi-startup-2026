import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowUpRight } from "lucide-react";
import { StartupGallery } from "@/components/startup-gallery";
import { Eyebrow, PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import { getPublicProjects } from "@/lib/public-api";
import { getLocale } from "@/i18n/server";
import { messages } from "@/i18n/messages";
import { managedPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/i18n/metadata";
import { localizedPath } from "@/i18n/config";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "startups"); }

export default async function StartupsPage() {
  const locale = await getLocale();
  const copy = messages[locale];
  const projects = await getPublicProjects(locale);
  const projectCount = projects?.length ?? 15;
  return (
    <SiteLayout>
      {projects && <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: copy.nav.startups, numberOfItems: projects.length, itemListElement: projects.map((project, index) => ({ "@type": "ListItem", position: index + 1, name: project.name, url: absoluteUrl(localizedPath(locale, `/startups/${project.slug || project.id}`)) })) }} />}
      <PageHero eyebrow={copy.pages.startups.eye} title={`${projectCount} ${copy.pages.startups.ideas}`} outline={`${projectCount} ${copy.pages.startups.paths}`} description={copy.pages.startups.description} />
      <section className="gallery-section"><div className="shell"><Reveal className="gallery-intro"><Eyebrow>{copy.pages.startups.choose}</Eyebrow><p>{copy.pages.startups.photo}</p></Reveal><StartupGallery initialProjects={projects} /></div></section>
      <section className="portfolio-principles"><div className="shell"><Reveal><Eyebrow>{copy.pages.startups.markets}</Eyebrow><h2>{copy.pages.startups.marketsTitle}<br /><span>{copy.pages.startups.marketsOutline}</span></h2></Reveal><div className="portfolio-principle-grid">{copy.pages.startups.principles.map(([title, text], index) => <Reveal key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>
      <section className="startup-manifesto"><div className="shell"><Reveal><Eyebrow>{copy.pages.startups.story}</Eyebrow><h2>{copy.pages.startups.big}<br /><span>{copy.pages.startups.first}</span></h2><Link className="button primary dark-button" href="/apply">{copy.pages.startups.launch} <ArrowUpRight /></Link></Reveal></div></section>
    </SiteLayout>
  );
}
