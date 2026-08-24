import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CircleCheck, Rocket } from "lucide-react";
import { projects } from "@/components/data";
import { Eyebrow, Reveal, SiteLayout } from "@/components/site-shell";
import { getLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { localizedMetadata } from "@/i18n/metadata";
import { absoluteUrl } from "@/i18n/metadata";
import { localizedPath } from "@/i18n/config";
import { JsonLd } from "@/components/json-ld";
import { getPublicProjects, getPublicSettings, type PublicProject } from "@/lib/public-api";

type PageProps = { params: Promise<{ slug: string }> };

const narratives: Record<string, { problem: string; solution: string; next: string }> = {
  "ai-jan": { problem: "Школьникам бывает сложно вовремя и безопасно обратиться за психологической поддержкой.", solution: "AI-Jan создаёт конфиденциальный цифровой канал первичного общения и помогает направить ребёнка к подходящему специалисту.", next: "Расширить пилот, проверить сценарии с психологами и измерить влияние на доступность помощи." },
  "ai-keden": { problem: "Участники внешнеэкономической деятельности сталкиваются со сложными процедурами и разрозненной информацией.", solution: "AI-Keden использует интеллектуальные инструменты для навигации по сервисам и повышения качества взаимодействия с государственными органами.", next: "Подготовить пилотное внедрение и интеграционный план совместно с отраслевыми партнёрами." },
  "tatti-matti": { problem: "Традиционные казахские сладости проигрывают современным продуктам в упаковке и позиционировании.", solution: "Команда переосмысляет рецептуры и создаёт узнаваемый культурный бренд для нового поколения покупателей.", next: "Расширить линейку, протестировать новые каналы продаж и подготовить масштабирование производства." },
  "khoja-group": { problem: "Малому бизнесу нужна доступная брендированная упаковка с меньшим экологическим следом.", solution: "Khoja Group производит практичную упаковку с индивидуальным дизайном для локальных компаний.", next: "Автоматизировать заказы и увеличить долю перерабатываемых материалов в продуктовой линейке." },
  "bilim-space": { problem: "Одинаковая образовательная траектория не учитывает темп, пробелы и цели каждого студента.", solution: "Bilim Space формирует персональные рекомендации на основе прогресса и помогает планировать обучение.", next: "Проверить MVP на нескольких учебных группах и подтвердить влияние на вовлечённость." },
  "aqua-grow": { problem: "Избыточный полив увеличивает расходы фермеров и создаёт нагрузку на водные ресурсы.", solution: "AquaGrow объединяет данные датчиков и рекомендации по поливу в простом интерфейсе.", next: "Завершить полевой пилот и сравнить расход воды с традиционным режимом управления." },
  "sana-health": { problem: "Люди часто поздно замечают риски здоровья и не понимают, к какому специалисту обращаться.", solution: "Sana Health помогает структурировать симптомы и предлагает понятный маршрут дальнейших действий.", next: "Провести экспертную валидацию сценариев и подготовить безопасный пользовательский пилот." },
  "qadam": { problem: "Гости Туркестана видят достопримечательности, но не всегда узнают связанные с ними истории.", solution: "Qadam превращает город в интерактивный маршрут с локальными сюжетами, аудио и рекомендациями.", next: "Добавить авторские маршруты и протестировать партнёрства с туристическими организациями." },
  "qamqor": { problem: "Молодым людям не хватает простых инструментов для планирования бюджета и финансовых целей.", solution: "Qamqor объясняет ежедневные решения понятным языком и помогает формировать устойчивые привычки.", next: "Проверить востребованность ключевых сценариев и подготовить первую публичную версию." },
  "qazaq-materials": { problem: "Промышленным компаниям нужны новые материалы с заданными характеристиками и локальной производственной базой.", solution: "Команда разрабатывает функциональные композиты и проверяет их свойства в лабораторных условиях.", next: "Повысить уровень технологической готовности и определить площадку для промышленного пилота." },
  "dombra-lab": { problem: "Ученикам сложно поддерживать регулярную практику, а цифровые материалы по домбре разрознены.", solution: "Dombra Lab объединяет интерактивные уроки, обратную связь и архив произведений в одном продукте.", next: "Запустить тестовую группу учеников и привлечь преподавателей к созданию программы." },
  "taza-qala": { problem: "Городские экологические вопросы заметны жителям, но обращения и данные остаются разрозненными.", solution: "Taza Qala собирает наблюдения на карте и помогает сообществу формировать прозрачные инициативы.", next: "Провести районный пилот и определить процесс взаимодействия с городскими службами." },
  "campus-flow": { problem: "Студенческие события и возможности теряются между чатами, таблицами и социальными сетями.", solution: "Campus Flow объединяет клубы, мероприятия, регистрацию и поиск команды в едином пространстве.", next: "Запустить продукт внутри одного факультета и измерить активность организаторов и участников." },
  "bio-step": { problem: "Контроль качества сельхозпродукции требует доступных и быстрых методов первичного анализа.", solution: "BioStep исследует биотехнологический подход к мониторингу ключевых показателей продукции.", next: "Подтвердить воспроизводимость метода и подготовить план лабораторной валидации." },
  "jetkiz": { problem: "Небольшие магазины теряют время и маржу из-за неэффективного планирования локальной доставки.", solution: "Jetkiz собирает заказы, маршруты и статусы курьеров в одном лёгком SaaS-продукте.", next: "Увеличить число платящих клиентов и автоматизировать построение маршрутов." },
};

export const dynamic = "force-dynamic";

const fallbackProjects: PublicProject[] = projects.map((project) => ({
  ...project,
  slug: project.id,
  summary: project.text,
  description: "",
  trlLevel: null,
  websiteUrl: null,
  media: [],
}));

async function getProjects(locale: Locale) {
  return (await getPublicProjects(locale)) ?? fallbackProjects;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const project = (await getProjects(locale)).find((item) => item.id === slug);
  const cover = project?.media.find((item) => item.kind === "cover") ?? project?.media[0];
  return project
    ? localizedMetadata(locale, { title: `${project.name} — YASAWI STARTUP`, description: project.text, path: `/startups/${project.slug || project.id}`, image: cover?.url })
    : { title: "Проект не найден — YASAWI STARTUP", robots: { index: false, follow: false } };
}

export default async function StartupProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const copy = {
    ru: { back: "Все проекты", stage: "СТАДИЯ", program: "ПРОГРАММА", eye: "О проекте", title: "От проблемы к проверяемому решению.", labels: ["ПРОБЛЕМА", "РЕШЕНИЕ", "СЛЕДУЮЩИЙ ШАГ"], generic: ["Команда исследует конкретную проблему пользователей и проверяет её значимость на практике.", "Проверить ключевые гипотезы, собрать обратную связь и подготовить следующий пилот."], focus: "Текущий фокус", focusTitle: "Двигаться дальше через проверку.", focusText: "Команда продолжает тестировать ключевые гипотезы, работать с пользователями и готовить проект к следующей стадии развития.", checks: ["Обратная связь пользователей", "Проверка бизнес-модели", "Подготовка следующего пилота"], contact: "Связаться с проектом", related: "Похожие проекты", explore: "Исследуйте дальше.", portfolio: "Всё портфолио", open: "Открыть проект" },
    kk: { back: "Барлық жобалар", stage: "КЕЗЕҢ", program: "БАҒДАРЛАМА", eye: "Жоба туралы", title: "Мәселеден тексерілетін шешімге.", labels: ["МӘСЕЛЕ", "ШЕШІМ", "КЕЛЕСІ ҚАДАМ"], generic: ["Команда пайдаланушылардың нақты мәселесін зерттеп, оның маңызын тәжірибеде тексереді.", "Негізгі гипотезаларды тексеріп, кері байланыс жинап, келесі пилотты дайындау."], focus: "Қазіргі мақсат", focusTitle: "Тексеру арқылы алға жылжу.", focusText: "Команда негізгі гипотезаларды тексеруді, пайдаланушылармен жұмысты және жобаны келесі кезеңге дайындауды жалғастырады.", checks: ["Пайдаланушы пікірі", "Бизнес-модельді тексеру", "Келесі пилотты дайындау"], contact: "Жобамен байланысу", related: "Ұқсас жобалар", explore: "Әрі қарай зерттеңіз.", portfolio: "Барлық портфолио", open: "Жобаны ашу" },
    en: { back: "All projects", stage: "STAGE", program: "PROGRAM", eye: "About the project", title: "From a problem to a testable solution.", labels: ["PROBLEM", "SOLUTION", "NEXT STEP"], generic: ["The team studies a specific user problem and validates its importance in practice.", "Test the critical hypotheses, collect feedback and prepare the next pilot."], focus: "Current focus", focusTitle: "Move forward through validation.", focusText: "The team continues testing critical hypotheses, working with users and preparing the project for its next stage.", checks: ["User feedback", "Business model validation", "Next pilot preparation"], contact: "Contact the project", related: "Related projects", explore: "Keep exploring.", portfolio: "Full portfolio", open: "Open project" },
    tr: { back: "Tüm projeler", stage: "AŞAMA", program: "PROGRAM", eye: "Proje hakkında", title: "Sorundan test edilebilir çözüme.", labels: ["SORUN", "ÇÖZÜM", "SONRAKİ ADIM"], generic: ["Ekip belirli bir kullanıcı sorununu araştırır ve önemini uygulamada doğrular.", "Kritik hipotezleri test etmek, geri bildirim toplamak ve sonraki pilotu hazırlamak."], focus: "Mevcut odak", focusTitle: "Doğrulayarak ilerlemek.", focusText: "Ekip kritik hipotezleri test etmeyi, kullanıcılarla çalışmayı ve projeyi sonraki aşamaya hazırlamayı sürdürüyor.", checks: ["Kullanıcı geri bildirimi", "İş modeli doğrulaması", "Sonraki pilot hazırlığı"], contact: "Projeyle iletişime geç", related: "Benzer projeler", explore: "Keşfetmeye devam edin.", portfolio: "Tüm portföy", open: "Projeyi aç" },
  }[locale];
  const [publicProjects, settings] = await Promise.all([getProjects(locale), getPublicSettings(locale)]);
  const project = publicProjects.find((item) => item.id === slug);
  if (!project) notFound();
  const narrative = locale === "ru" && narratives[project.id] ? { ...narratives[project.id], solution: project.description || narratives[project.id].solution } : {
    problem: copy.generic[0],
    solution: project.description || project.text,
    next: copy.generic[1],
  };
  const related = publicProjects.filter((item) => item.id !== project.id && item.tags.some((tag) => project.tags.includes(tag))).slice(0, 3);
  const projectStyle = { "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties;
  const cover = project.media.find((item) => item.kind === "cover") ?? project.media[0];
  const contactHref = project.socialUrl || `mailto:${settings?.contactEmail || "yassawi_commerc@ayu.edu.kz"}`;

  return (
    <SiteLayout darkHeader>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWork", name: project.name, description: project.description || project.text, url: absoluteUrl(localizedPath(locale, `/startups/${project.slug || project.id}`)), image: cover?.url, keywords: project.tags.join(", "), inLanguage: locale, creator: { "@type": "Organization", name: "YASAWI STARTUP", "@id": `${absoluteUrl("/")}#organization` } }} />
      <section className="project-detail-hero" style={projectStyle}>
        <div className="project-detail-grid" />
        <div className="shell project-detail-layout">
          <Reveal className="project-detail-copy"><Link className="project-back" href="/startups"><ArrowLeft /> {copy.back}</Link><div className="active-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h1>{project.name}</h1><p>{project.text}</p><div className="project-detail-facts"><div><small>{copy.stage}</small><strong>{project.stage}</strong></div><div><small>{copy.program}</small><strong>{project.cohort}</strong></div></div></Reveal>
          <Reveal className={`project-detail-visual generative-visual visual-${project.visual}`}>{cover ? <Image src={cover.url} alt={cover.alt || project.name} fill sizes="(max-width: 1000px) 90vw, 45vw" priority /> : <><div className="visual-mesh" /><i /><i /><i /><i /><i /><span>{project.glyph}</span></>}</Reveal>
        </div>
      </section>

      <section className="section shell project-narrative">
        <Reveal className="project-narrative-title"><Eyebrow>{copy.eye}</Eyebrow><h2>{copy.title}</h2></Reveal>
        <div className="narrative-list"><Reveal><span>01</span><small>{copy.labels[0]}</small><p>{narrative.problem}</p></Reveal><Reveal><span>02</span><small>{copy.labels[1]}</small><p>{narrative.solution}</p></Reveal><Reveal><span>03</span><small>{copy.labels[2]}</small><p>{narrative.next}</p></Reveal></div>
      </section>

      <section className="project-progress"><div className="shell"><Reveal><Eyebrow>{copy.focus}</Eyebrow><h2>{copy.focusTitle}</h2><p>{copy.focusText}</p><div className="progress-checks">{copy.checks.map((item) => <span key={item}><CircleCheck /> {item}</span>)}</div><a className="button primary dark-button" href={contactHref}>{copy.contact} <ArrowUpRight /></a></Reveal><Rocket className="progress-rocket" /></div></section>

      <section className="section shell related-projects"><Reveal className="section-head split-head"><div><Eyebrow>{copy.related}</Eyebrow><h2>{copy.explore}</h2></div><Link className="text-link" href="/startups">{copy.portfolio} <ArrowUpRight /></Link></Reveal><div className="related-project-grid">{related.map((item) => <Reveal className="related-project" key={item.id}><div style={{ background: item.accent }}><span>{item.glyph}</span></div><small>{item.tags.join(" · ")}</small><h3>{item.name}</h3><p>{item.text}</p><Link href={`/startups/${item.id}`}>{copy.open} <ArrowUpRight /></Link></Reveal>)}</div></section>
    </SiteLayout>
  );
}
