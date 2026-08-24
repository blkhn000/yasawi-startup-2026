import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowUpRight, CircleCheck } from "lucide-react";
import { ItCourseGrid } from "@/components/it-course-grid";
import { Eyebrow, PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import { getItCourses, getPublicProgram, type ItCourse } from "@/lib/public-api";
import { getLocale } from "@/i18n/server";
import { messages } from "@/i18n/messages";
import { programPageCopy } from "@/i18n/program-pages";
import { managedPageMetadata } from "@/lib/seo";
import { ProgramJsonLd } from "@/components/program-json-ld";

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "education"); }

export default async function ItEducationPage() {
  const locale = await getLocale();
  const copy = programPageCopy[locale].education;
  const common = messages[locale];
  const [program, managedCourses] = await Promise.all([getPublicProgram("it-education", locale), getItCourses(locale)]);
  const fallbackCourses: ItCourse[] = [
    { id: "frontend", slug: "frontend", title: "Frontend", shortDescription: "HTML, CSS, JavaScript и создание современных веб-интерфейсов.", description: "Практический путь от первой страницы до интерактивного приложения.", dateLabel: "Дата будет объявлена", format: "Офлайн + практика", duration: "8 недель", includes: ["HTML и CSS", "JavaScript", "React", "Итоговый проект"], imageUrl: null },
    { id: "ai-data", slug: "ai-data", title: "AI & Data", shortDescription: "Основы искусственного интеллекта, работа с данными и AI-инструментами.", description: "Освойте основы анализа данных и соберите первый AI-прототип.", dateLabel: "Дата будет объявлена", format: "Офлайн + практика", duration: "6 недель", includes: ["Python", "Работа с данными", "AI-инструменты", "Прототип"], imageUrl: null },
    { id: "backend", slug: "backend", title: "Backend", shortDescription: "Логика приложений, API, базы данных и серверная разработка.", description: "Соберите серверную часть и API для собственного проекта.", dateLabel: "Дата будет объявлена", format: "Офлайн + практика", duration: "8 недель", includes: ["Node.js", "REST API", "PostgreSQL", "Публикация"], imageUrl: null },
    { id: "digital-product", slug: "digital-product", title: "Digital Product", shortDescription: "UX-мышление, командная работа и запуск полезного цифрового продукта.", description: "Проверьте проблему, спроектируйте решение и представьте продукт.", dateLabel: "Дата будет объявлена", format: "Воркшопы", duration: "4 недели", includes: ["Исследование", "UX", "Прототип", "Питч"], imageUrl: null },
  ];
  const courses = managedCourses === null ? fallbackCourses : managedCourses;
  return <SiteLayout><ProgramJsonLd locale={locale} path="/program/it-education" program={program} fallbackName={common.nav.education} fallbackDescription={copy.hero[2]} /><PageHero eyebrow={program?.title ?? common.nav.education} title={copy.hero[0]} outline={copy.hero[1]} description={program?.shortDescription || copy.hero[2]} />
    <section className="it-banner"><div className="shell"><Reveal><strong>0 ₸</strong><div><h2>{copy.banner[0]}</h2><p>{copy.banner[1]}</p></div><Link className="button dark-button" href="/apply?program=it-education">{copy.banner[2]} <ArrowUpRight /></Link></Reveal></div></section>
    <section className="section shell"><Reveal className="section-head split-head"><div><Eyebrow>{copy.directions[0]}</Eyebrow><h2>{copy.directions[1]}</h2></div><p>{copy.directions[2]}</p></Reveal><ItCourseGrid courses={courses} /></section>
    <section className="learning-path"><div className="shell"><Reveal className="section-head light-head"><Eyebrow>{copy.learning[0]}</Eyebrow><h2>{copy.learning[1]}</h2></Reveal><div className="learning-steps">{copy.steps.map(([title, text], index) => <Reveal key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>
    <section className="section shell it-for-whom"><Reveal><Eyebrow>{copy.audience[0]}</Eyebrow><h2>{copy.audience[1]}</h2></Reveal><div>{copy.people.map((item) => <Reveal className="requirement" key={item}><CircleCheck /><span>{item}</span></Reveal>)}</div><Link className="button primary" href="/apply?program=it-education">{common.common.apply} <ArrowUpRight /></Link></section>
  </SiteLayout>;
}
