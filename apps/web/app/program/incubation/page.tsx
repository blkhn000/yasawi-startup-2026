import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowUpRight, CircleCheck, FlaskConical, Rocket, Users } from "lucide-react";
import { Eyebrow, PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import { getPublicProgram } from "@/lib/public-api";
import { getLocale } from "@/i18n/server";
import { messages } from "@/i18n/messages";
import { programPageCopy } from "@/i18n/program-pages";
import { managedPageMetadata } from "@/lib/seo";
import { ProgramJsonLd } from "@/components/program-json-ld";

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "incubation"); }

export default async function IncubationPage() {
  const locale = await getLocale();
  const copy = programPageCopy[locale].incubation;
  const common = messages[locale];
  const program = await getPublicProgram("incubation", locale);
  return <SiteLayout darkHeader><ProgramJsonLd locale={locale} path="/program/incubation" program={program} fallbackName={common.nav.incubation} fallbackDescription={copy.hero[2]} /><PageHero dark eyebrow={program?.title ?? common.nav.incubation} title={copy.hero[0]} outline={copy.hero[1]} description={program?.shortDescription || copy.hero[2]} />
    <section className="program-facts-bar"><div className="shell">{[[String(program?.durationWeeks ?? 12), common.common.weeks], [program?.price ?? "0 ₸", common.common.price], [`${program?.runsPerYear ?? 2}×`, common.common.runs], [program?.equity ?? "0%", common.common.equity]].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>
    <section className="section shell program-audience"><Reveal><Eyebrow>{copy.audience[0]}</Eyebrow><h2>{copy.audience[1]}<br /><span>{copy.audience[2]}</span></h2><p>{copy.audience[3]}</p></Reveal><div className="requirements-list">{copy.requirements.map((item) => <Reveal className="requirement" key={item}><CircleCheck /><span>{item}</span></Reveal>)}</div></section>
    <section className="program-phases"><div className="shell"><Reveal className="section-head light-head"><Eyebrow>{copy.track[0]}</Eyebrow><h2>{copy.track[1]}</h2></Reveal><div className="phase-grid">{copy.phases.map(([weeks, title, text, result], i) => <Reveal className="phase-card" key={title}><span>0{i + 1}</span><small>{weeks}</small><h3>{title}</h3><p>{text}</p><strong>{result}</strong></Reveal>)}</div></div></section>
    <section className="section shell"><Reveal className="section-head split-head"><div><Eyebrow>{copy.science[0]}</Eyebrow><h2>{copy.science[1]}</h2></div><p>{copy.science[2]}</p></Reveal><div className="science-track">{[[FlaskConical, ...copy.scienceSteps[0]], [Rocket, ...copy.scienceSteps[1]], [Users, ...copy.scienceSteps[2]]].map(([ItemIcon, title, text]) => { const Icon = ItemIcon as typeof Rocket; return <Reveal className="science-step" key={String(title)}><Icon /><h3>{String(title)}</h3><p>{String(text)}</p></Reveal>; })}</div></section>
    <section className="program-outcomes"><div className="shell"><Reveal><Eyebrow>{copy.result[0]}</Eyebrow><h2>{copy.result[1]}</h2></Reveal><div className="outcomes-list">{copy.outcomes.map((item, i) => <Reveal key={item}><span>0{i + 1}</span><strong>{item}</strong></Reveal>)}</div><Link className="button primary" href="/apply?program=incubation">{copy.button} <ArrowUpRight /></Link></div></section>
  </SiteLayout>;
}
