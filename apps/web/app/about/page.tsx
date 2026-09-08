import type { Metadata } from "next";
import "../pages.css";
import { ArrowUpRight, Globe2, Rocket, Users, Zap } from "lucide-react";
import { Eyebrow, PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import { getPublicPage, getPublicSettings } from "@/lib/public-api";
import { getLocale } from "@/i18n/server";
import { messages } from "@/i18n/messages";
import { managedPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "about"); }

type AboutContent = {
  hero: { eyebrow: string; title: string; outline: string; description: string };
  story: { eyebrow: string; title: string; outline: string; paragraphs: string[] };
  values: Array<{ title: string; text: string }>;
  stats: Array<{ value: string; label: string }>;
  contact: { eyebrow: string; title: string; buttonLabel: string };
};

const fallback: AboutContent = {
  hero: { eyebrow: "О бизнес-инкубаторе", title: "Точка притяжения", outline: "для тех, кто создаёт.", description: "Мы соединяем университетскую науку, предпринимательскую практику и энергию молодых основателей Туркестана." },
  story: { eyebrow: "Наша роль", title: "Создавать условия,", outline: "в которых идеи выживают.", paragraphs: ["YASAWI STARTUP работает с 2022 года и помогает студентам, исследователям и сотрудникам университета превращать наблюдения и научные разработки в востребованные решения.", "Мы даём структуру, сильное окружение и пространство, где можно быстро ошибаться, учиться и двигаться дальше."] },
  values: [{ title: "Действие", text: "Ценим запущенный эксперимент выше идеальной презентации." }, { title: "Открытость", text: "Объединяем людей разных специальностей вокруг общей проблемы." }, { title: "Скорость", text: "Быстро проверяем главное и не тратим месяцы на предположения." }, { title: "Масштаб", text: "Начинаем в Туркестане, но создаём продукты для большого мира." }],
  stats: [{ value: "2022", label: "год запуска" }, { value: "400+", label: "регистраций" }, { value: "7", label: "потоков" }, { value: "60", label: "часов в программе" }],
  contact: { eyebrow: "Мы в Туркестане", title: "Есть вопрос или идея?", buttonLabel: "Написать команде" },
};

const valueIcons = [Rocket, Users, Zap, Globe2];

export default async function AboutPage() {
  const locale = await getLocale();
  const copy = messages[locale];
  const [settings, managed] = await Promise.all([getPublicSettings(locale), getPublicPage<AboutContent>("about", locale)]);
  const content = managed ?? fallback;
  const email = settings?.contactEmail ?? "yassawi_commerc@ayu.edu.kz";
  const address = settings?.address ?? "ул. Бекзата Саттарханова, 29, Туркестан, Казахстан";
  return (
    <SiteLayout>
      <PageHero {...content.hero} />
      <section className="section shell about-story"><Reveal><Eyebrow>{content.story.eyebrow}</Eyebrow><h2>{content.story.title}<br /><span>{content.story.outline}</span></h2></Reveal><Reveal className="story-copy">{content.story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</Reveal></section>
      <section className="about-values"><div className="shell values-grid">{content.values.map((value, index) => { const Icon = valueIcons[index % valueIcons.length]; return <Reveal className="value-card" key={`${value.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><Icon /><h3>{value.title}</h3><p>{value.text}</p></Reveal>; })}</div></section>
      <section className="section shell"><Reveal className="section-head split-head"><div><Eyebrow>{copy.pages.aboutNumbers.eye}</Eyebrow><h2>{copy.pages.aboutNumbers.title}<br /><span>{copy.pages.aboutNumbers.outline}</span></h2></div><p>{copy.pages.aboutNumbers.text}</p></Reveal><div className="stats-grid">{content.stats.map((stat, index) => <Reveal className="stat" key={`${stat.label}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stat.value}</strong><p>{stat.label}</p></Reveal>)}</div></section>
      <section className="contact-strip"><div className="shell"><Reveal><Eyebrow>{content.contact.eyebrow}</Eyebrow><h2>{content.contact.title}</h2><p>{address} · {email}</p><a className="button primary" href={`mailto:${email}`}>{content.contact.buttonLabel} <ArrowUpRight /></a></Reveal></div></section>
    </SiteLayout>
  );
}
