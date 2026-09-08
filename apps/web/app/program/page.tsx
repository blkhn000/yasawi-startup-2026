import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowUpRight, BrainCircuit, Code2, Rocket } from "lucide-react";
import { Eyebrow, PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import { getPublicPrograms } from "@/lib/public-api";
import { getLocale } from "@/i18n/server";
import { messages } from "@/i18n/messages";
import { managedPageMetadata } from "@/lib/seo";

const programFacts = {
  kk: { equity: "0% үлес", targets: "Апталық мақсаттар", demo: "Demo Day", practice: "Тәжірибе" },
  ru: { equity: "0% доли", targets: "Еженедельные цели", demo: "Demo Day", practice: "Практика" },
  en: { equity: "0% equity", targets: "Weekly targets", demo: "Demo Day", practice: "Practice" },
  tr: { equity: "%0 hisse", targets: "Haftalık hedefler", demo: "Demo Day", practice: "Uygulama" },
};

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "programs"); }

export default async function ProgramsPage() {
  const locale = await getLocale();
  const copy = messages[locale];
  const facts = programFacts[locale];
  const managedPrograms = await getPublicPrograms(locale);
  const programs = [
    { href: "/program/incubation", number: "01", icon: Rocket, title: copy.nav.incubation, subtitle: copy.pages.programs.subtitles[0], text: copy.home.programTexts[0], facts: [copy.common.free, `12 ${copy.common.weeks}`, facts.equity], className: "incubation" },
    { href: "/program/acceleration", number: "02", icon: BrainCircuit, title: copy.nav.acceleration, subtitle: copy.pages.programs.subtitles[1], text: copy.home.programTexts[1], facts: [facts.targets, `10 ${copy.common.weeks}`, facts.demo], className: "acceleration" },
    { href: "/program/it-education", number: "03", icon: Code2, title: copy.nav.education, subtitle: copy.pages.programs.subtitles[2], text: copy.home.programTexts[2], facts: [copy.common.free, "IT", facts.practice], className: "education" },
  ];
  const displayPrograms = managedPrograms === null ? programs : managedPrograms.map((managed) => {
    const program = programs.find((item) => item.href.endsWith(managed.slug));
    if (!program) return null;
    return { ...program, title: managed.title, text: managed.shortDescription || program.text, facts: [managed.isFree ? copy.common.free : copy.common.paid, managed.duration, managed.status === "open" ? copy.common.open : managed.status === "soon" ? copy.common.soon : copy.common.closed] };
  }).filter((program): program is (typeof programs)[number] => program !== null);
  return <SiteLayout><PageHero eyebrow={copy.pages.programs.eye} title={copy.pages.programs.title} outline={copy.pages.programs.outline} description={copy.pages.programs.description} /><section className="section shell program-catalog">{displayPrograms.map((program) => { const Icon = program.icon; return <Reveal className={`program-catalog-card ${program.className}`} key={program.href}><div className="program-card-top"><span>{program.number}</span><Icon /></div><small>{program.subtitle}</small><h2>{program.title}</h2><p>{program.text}</p><div className="program-fact-tags">{program.facts.map((fact) => <span key={fact}>{fact}</span>)}</div><Link href={program.href}>{copy.pages.programs.details} <ArrowUpRight /></Link></Reveal>; })}</section></SiteLayout>;
}
