import { ArrowDown, ArrowUpRight, Building2, CircleCheck, Code2, ExternalLink, Rocket, ShieldCheck, Users, Zap } from "lucide-react";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import type { PublicHomeData } from "@/lib/public-api";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import { Eyebrow, Footer, Reveal } from "./site-shell";
import { Header } from "./site-header";
import { ResilientImage } from "./resilient-image";
import { officialLinks, partners as fallbackPartners, team } from "./trust-data";

type PublicTeamMember = PublicHomeData["team"][number] | (typeof team)[number];
type PublicPartner = (typeof fallbackPartners)[number];
type PublicNewsItem = PublicHomeData["news"][number];

const fallbackNews: PublicNewsItem[] = [
  { id: "319", title: "Digital Law Hackathon 2026", date: "30.04.2026", imageUrl: "https://ayu.edu.kz/admin/resimler/etkinlikler/buyuk/6a083dbc481faхакатон.jpg", url: "https://ayu.edu.kz/birimler/ru/310-ticarilestirme-ofisi/etkinlikler/319", location: "Библиотека, зал коворкинга", source: "AYU" },
  { id: "318", title: "Проект AI-Jan представлен на форуме Digital Qazaqstan 2026", date: "28.03.2026", imageUrl: "https://ayu.edu.kz/admin/resimler/etkinlikler/buyuk/6a04716f9da40мероприятие.jpg", url: "https://ayu.edu.kz/birimler/ru/310-ticarilestirme-ofisi/etkinlikler/318", location: "Шымкент", source: "AYU" },
  { id: "317", title: "В университете открылся инновационный офис AI Startup Hub", date: "12.03.2026", imageUrl: "https://ayu.edu.kz/admin/resimler/etkinlikler/buyuk/6a046d3995b05IMG_9836.JPG", url: "https://ayu.edu.kz/birimler/ru/310-ticarilestirme-ofisi/etkinlikler/317", location: "Офис AI Startup Hub", source: "AYU" },
];

export function HomePage({ initialData, copy, locale }: { initialData: PublicHomeData | null; copy: Messages; locale: Locale }) {
  const siteSettings = initialData?.settings ?? null;
  const programSettings = initialData?.programs ?? [];
  // Резервный контент нужен только при недоступном API. Пустой массив от CMS
  // означает осознанное решение администратора скрыть весь раздел.
  const latestNews = initialData ? initialData.news.slice(0, 3) : fallbackNews;
  const teamMembers: PublicTeamMember[] = initialData ? initialData.team.slice(0, 3) : team;
  const partnerItems: PublicPartner[] = initialData
    ? initialData.partners.map((partner) => ({ name: partner.name, image: partner.logoUrl, ...(partner.websiteUrl ? { href: partner.websiteUrl } : {}) })) as PublicPartner[]
    : fallbackPartners;

  const generatedStats = [
    { value: `${siteSettings?.totalParticipants ?? 0}+`, label: copy.home.statLabels[0], note: copy.home.statNotes[0] },
    { value: String(siteSettings?.currentCohort ?? 1), label: copy.home.statLabels[1], note: copy.home.statNotes[1] },
    { value: String(siteSettings?.incubationWeeks ?? 12), label: copy.home.statLabels[2], note: copy.home.statNotes[2] },
    { value: String(initialData?.startupCount ?? 0), label: copy.home.statLabels[3], note: copy.home.statNotes[3] },
  ];
  const displayStats = siteSettings?.contextStats?.length ? siteSettings.contextStats.map((stat) => {
    const source = stat.source ?? inferStatSource(stat.label);
    const liveValues = {
      currentCohort: String(siteSettings.currentCohort ?? stat.value),
      totalParticipants: `${siteSettings.totalParticipants ?? stat.value}+`,
      incubationWeeks: String(siteSettings.incubationWeeks ?? stat.value),
      startupCount: String(initialData?.startupCount ?? stat.value),
      manual: stat.value,
    };
    return { ...stat, value: liveValues[source] };
  }) : generatedStats;
  const cohortTitle = siteSettings?.nextCohortStatus === "closed" || siteSettings?.nextCohortStatus === "completed" ? copy.home.cohort.closed : siteSettings?.nextCohortStatus === "soon" ? copy.home.cohort.soon : copy.home.cohort.open;
  const cohortNote = siteSettings?.nextCohortDate || copy.home.cohort.note;
  const weeklyTargets = { kk: "апталық мақсаттар", ru: "еженедельные цели", en: "weekly targets", tr: "haftalık hedefler" }[locale];
  const programs = [
    { number: "01", title: copy.nav.incubation, text: copy.home.programTexts[0], meta: `12 ${copy.common.weeks} · ${copy.common.free.toLowerCase()}`, href: "/program/incubation", color: "mint" },
    { number: "02", title: copy.nav.acceleration, text: copy.home.programTexts[1], meta: `10 ${copy.common.weeks} · ${weeklyTargets}`, href: "/program/acceleration", color: "violet" },
    { number: "03", title: copy.nav.education, text: copy.home.programTexts[2], meta: copy.common.free, href: "/program/it-education", color: "acid" },
  ];
  const displayPrograms = programs.map((program) => {
    const managed = programSettings.find((item) => program.href.endsWith(item.slug));
    return managed ? { ...program, title: managed.title, meta: `${managed.duration}${managed.isFree ? ` · ${copy.common.free.toLowerCase()}` : ""}` } : program;
  });

  return (
    <main id="top">
      <Header />
      <section className="hero shell home-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-enter hero-enter-1"><Eyebrow>{siteSettings?.heroEyebrow || copy.home.eyebrow}</Eyebrow></div>
          <h1 className="hero-enter hero-enter-2">{siteSettings?.heroTitle || copy.home.title}<br /><span>{siteSettings?.heroOutline || copy.home.outline}</span></h1>
          <p className="hero-enter hero-enter-3">{siteSettings?.heroDescription || copy.home.description}</p>
          <div className="hero-actions hero-enter hero-enter-4"><Link className="button primary" href="/apply">{copy.common.apply} <Rocket size={18} /></Link><a className="button ghost" href="#programs">{copy.home.choose} <ArrowDown size={18} /></a></div>
          <div className="cohort-status hero-enter hero-enter-5"><i /><div><strong>{cohortTitle}</strong><span>{cohortNote}</span></div></div>
        </div>
        <div className="hero-orbit hero-orbit-enter"><div className="orbit orbit-one"><i /><i /><i /></div><div className="orbit orbit-two"><i /><i /></div><div className="orbit-core"><Rocket /><strong>LAUNCH</strong><small>YOUR IDEA</small></div><div className="orbit-label label-one"><Code2 size={15} /> prototype</div><div className="orbit-label label-two"><Users size={15} /> community</div><div className="orbit-label label-three"><Zap size={15} /> traction</div></div>
      </section>

      <section className="official-strip"><div className="shell"><div className="official-seal"><Building2 /><span>AYU</span></div><div><strong>{copy.home.operator}</strong><p>{copy.home.operatorName}</p></div><a href={officialLinks.office} target="_blank" rel="noreferrer">{copy.home.verify} <ExternalLink /></a></div></section>

      <section className="section shell" id="programs">
        <Reveal className="section-head split-head"><div><Eyebrow>{copy.home.entry}</Eyebrow><h2>{copy.home.chooseTitle}<br /><span>{copy.home.chooseOutline}</span></h2></div><p>{copy.home.chooseText}</p></Reveal>
        <div className="home-program-grid">{displayPrograms.map((program) => <Reveal className={`home-program-card ${program.color}`} key={program.href}><span>{program.number}</span><small>{program.meta}</small><h3>{program.title}</h3><p>{program.text}</p><Link href={program.href}>{copy.common.more} <ArrowUpRight /></Link></Reveal>)}</div>
      </section>

      <section className="proof-section">
        <div className="shell"><Reveal className="section-head split-head light-head"><div><Eyebrow>{copy.home.proofEye}</Eyebrow><h2>{copy.home.proofTitle}<br /><span>{copy.home.proofOutline}</span></h2></div><div><p>{copy.home.proofText}</p><a className="proof-source" href={officialLinks.office} target="_blank" rel="noreferrer"><ShieldCheck /> {copy.home.source}</a></div></Reveal><div className="proof-grid">{displayStats.map((stat, i) => <Reveal className="proof-stat" key={stat.label}><span>0{i + 1}</span><strong>{stat.value}</strong><h3>{stat.label}</h3><p>{stat.note}</p></Reveal>)}</div></div>
      </section>

      <section className="selection-section"><div className="shell"><Reveal className="section-head"><Eyebrow>{copy.home.selectionEye}</Eyebrow><h2>{copy.home.selectionTitle}<br /><span>{copy.home.selectionOutline}</span></h2></Reveal><div className="selection-grid">{copy.home.selection.map(([title, text], index) => <Reveal key={title}><span>{String(index + 1).padStart(2, "0")}</span><CircleCheck /><h3>{title}</h3><p>{text}</p></Reveal>)}</div><Reveal className="human-help"><Users /><div><strong>{copy.home.help}</strong><span>{copy.home.helpText} {siteSettings?.contactEmail || "yassawi_commerc@ayu.edu.kz"}</span></div><a href={`mailto:${siteSettings?.contactEmail || "yassawi_commerc@ayu.edu.kz"}`}>{copy.common.ask} <ArrowUpRight /></a></Reveal></div></section>

      <section className="section shell team-section">
        <Reveal className="section-head split-head"><div><Eyebrow>{copy.home.teamEye}</Eyebrow><h2>{copy.home.teamTitle}<br /><span>{copy.home.teamOutline}</span></h2></div><div><p>{copy.home.teamText}</p></div></Reveal>
        <div className="trust-team-grid">{teamMembers.map((member) => <Reveal className="trust-person" key={member.email}>{member.profileUrl ? <a className="person-photo" href={member.profileUrl} target="_blank" rel="noreferrer"><ResilientImage src={member.image} alt={member.name} fill sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" loading="lazy" referrerPolicy="no-referrer" /><span>{copy.home.teamPhoto}</span></a> : <div className="person-photo"><ResilientImage src={member.image} alt={member.name} fill sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" loading="lazy" referrerPolicy="no-referrer" /><span>{copy.home.teamPhoto}</span></div>}<small>YASAWI STARTUP</small><h3>{member.name}</h3><p>{member.role}</p><a href={`mailto:${member.email}`}>{member.email} <ArrowUpRight /></a></Reveal>)}</div>
      </section>

      <section className="ecosystem-section" id="partners"><div className="shell"><Reveal className="partners-intro"><Eyebrow>{copy.home.partnersEye}</Eyebrow><h2>{copy.home.partnersTitle}<br /><span>{copy.home.partnersOutline}</span></h2><p>{copy.home.partnersText}</p></Reveal><div className="ecosystem-logos">{partnerItems.map((partner) => { const logo = <Image src={partner.image} alt={partner.name} width={240} height={125} sizes="(max-width: 700px) 50vw, 240px" loading="lazy" />; return partner.href ? <a href={partner.href} key={partner.name} target="_blank" rel="noreferrer" aria-label={partner.name}>{logo}</a> : <div key={partner.name}>{logo}</div>; })}</div></div></section>

      <section className="latest-section"><div className="shell"><Reveal className="section-head split-head"><div><Eyebrow>{copy.home.newsEye}</Eyebrow><h2>{copy.home.newsTitle}<br /><span>{copy.home.newsOutline}</span></h2></div><a className="text-link" href={officialLinks.office} target="_blank" rel="noreferrer">{copy.home.universityNews} <ExternalLink /></a></Reveal><div className="latest-grid">{latestNews.map((news) => <Reveal key={news.id}><a className="latest-card-image" href={news.url} target="_blank" rel="noreferrer" aria-label={`${copy.home.openPublication}: ${news.title}`}><ResilientImage src={news.imageUrl} alt={news.title} fill sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" loading="lazy" referrerPolicy="no-referrer" /></a><div className="latest-card-copy"><div className="latest-card-meta"><small>{news.date}</small><span>{news.source}</span></div><h3>{news.title}</h3><p>{news.summary || news.location}</p><a href={news.url} target="_blank" rel="noreferrer">{copy.home.openPublication} <ArrowUpRight /></a></div></Reveal>)}</div></div></section>

      <section className="final-cta compact-cta"><Reveal className="shell cta-content"><Eyebrow>{copy.home.ctaEye}</Eyebrow><h2>{copy.home.ctaTitle}<br /><span>{copy.home.ctaOutline}</span></h2><p>{copy.home.ctaText}</p><Link className="button primary dark-button" href="/apply">{copy.common.apply} <ArrowUpRight /></Link></Reveal></section>
      <Footer />
    </main>
  );
}

function inferStatSource(label: string): "manual" | "currentCohort" | "totalParticipants" | "incubationWeeks" | "startupCount" {
  const normalized = label.toLowerCase();
  if (/участ|қатыс|participant|katılımc/.test(normalized)) return "totalParticipants";
  if (/поток|лек|cohort|dönem/.test(normalized)) return "currentCohort";
  if (/недел|апта|week|hafta/.test(normalized)) return "incubationWeeks";
  if (/стартап|startup|girişim/.test(normalized)) return "startupCount";
  return "manual";
}
