import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowUpRight, BrainCircuit, CircleCheck, Rocket, Zap } from "lucide-react";
import { Eyebrow, PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import { getPublicProgram } from "@/lib/public-api";
import { getLocale } from "@/i18n/server";
import { messages } from "@/i18n/messages";
import { programPageCopy } from "@/i18n/program-pages";

const metricLabels = {
  kk: ["Өсу қарқыны", "LTV / CAC", "Конверсия", "Қайта оралу", "Белсенді пайдаланушылар", "Түсім", "TRL ілгерілеуі", "Пилоттар / келісімшарттар"],
  ru: ["Темп роста", "LTV / CAC", "Конверсия", "Удержание", "Активные пользователи", "Выручка", "Прогресс TRL", "Пилоты / контракты"],
  en: ["Growth rate", "LTV / CAC", "Conversion", "Retention", "Active users", "Revenue", "TRL progress", "Pilots / contracts"],
  tr: ["Büyüme oranı", "LTV / CAC", "Dönüşüm", "Kullanıcı tutma", "Aktif kullanıcılar", "Gelir", "TRL ilerlemesi", "Pilotlar / sözleşmeler"],
};
import { managedPageMetadata } from "@/lib/seo";
import { ProgramJsonLd } from "@/components/program-json-ld";

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "acceleration"); }

export default async function AccelerationPage() {
  const locale = await getLocale();
  const copy = programPageCopy[locale].acceleration;
  const common = messages[locale];
  const program = await getPublicProgram("acceleration", locale);
  return <SiteLayout darkHeader><ProgramJsonLd locale={locale} path="/program/acceleration" program={program} fallbackName={common.nav.acceleration} fallbackDescription={copy.hero[2]} /><PageHero dark eyebrow={program?.title ?? common.nav.acceleration} title={copy.hero[0]} outline={copy.hero[1]} description={program?.shortDescription || copy.hero[2]} />
    <section className="program-facts-bar acceleration-facts"><div className="shell">{[[String(program?.durationWeeks ?? 10), common.common.weeks], [program?.price ?? "0 ₸", common.common.price], [`${program?.runsPerYear ?? 2}×`, common.common.runs], [program?.equity ?? "0%", common.common.equity]].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>
    <section className="section shell acceleration-entry"><Reveal><Eyebrow>{copy.entry[0]}</Eyebrow><h2>{copy.entry[1]}</h2></Reveal><div className="entry-checklist">{copy.criteria.map(([title, text]) => <Reveal className="entry-card" key={title}><CircleCheck /><h3>{title}</h3><p>{text}</p></Reveal>)}</div><p className="entry-note">{copy.noMvp} <Link href="/program/incubation">{copy.incubation}</Link></p></section>
    <section className="acceleration-roadmap"><div className="shell"><Reveal className="section-head light-head"><Eyebrow>{copy.roadmap[0]}</Eyebrow><h2>{copy.roadmap[1]}</h2></Reveal><div className="acceleration-steps">{copy.steps.map(([weeks, title, text], i) => <Reveal className="acceleration-step" key={title}><div><span>0{i + 1}</span><small>{copy.weekLabel} {weeks}</small></div><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>
    <section className="section shell metrics-section"><Reveal><Eyebrow>{copy.metrics[0]}</Eyebrow><h2>{copy.metrics[1]}</h2></Reveal><div className="metric-cloud">{metricLabels[locale].map((metric, i) => <Reveal className={i % 3 === 0 ? "metric-accent" : ""} key={metric}><Zap />{metric}</Reveal>)}</div></section>
    <section className="program-outcomes acceleration-outcomes"><div className="shell"><Reveal><Eyebrow>{copy.result[0]}</Eyebrow><h2>{copy.result[1]}</h2></Reveal><div className="outcomes-list">{copy.outcomes.map((item, i) => <Reveal key={item}><span>0{i + 1}</span><strong>{item}</strong></Reveal>)}</div><Link className="button primary" href="/apply?program=acceleration">{copy.button} <ArrowUpRight /></Link></div></section>
  </SiteLayout>;
}
