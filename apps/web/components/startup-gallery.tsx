"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Sparkles } from "lucide-react";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { PublicProject } from "@/lib/public-api";
import { projects as fallbackProjects } from "./data";
import { useLocale } from "@/i18n/locale-provider";

type GalleryProject = Omit<PublicProject, "slug" | "summary" | "description" | "trlLevel" | "websiteUrl" | "media"> & {
  slug?: string;
  summary?: string;
  description?: string;
  trlLevel?: number | null;
  websiteUrl?: string | null;
  media?: Array<{ url: string; kind: string; alt: string }>;
};

const galleryCopy = {
  ru: { all: "Все", projects: "проектов", filter: "Фильтр проектов", previous: "Предыдущий проект", next: "Следующий проект", play: "Включить автоматическое переключение", pause: "Остановить автоматическое переключение", continue: "Продолжить", autoplay: "Автопросмотр", stage: "СТАДИЯ", participation: "УЧАСТИЕ", website: "Перейти на сайт", about: "О проекте", hint: "Выберите тег, листайте стрелками или нажмите на карточку, чтобы открыть проект", open: "Открыть проект", go: "Перейти к" },
  kk: { all: "Барлығы", projects: "жоба", filter: "Жобаларды сүзу", previous: "Алдыңғы жоба", next: "Келесі жоба", play: "Автоматты ауыстыруды қосу", pause: "Автоматты ауыстыруды тоқтату", continue: "Жалғастыру", autoplay: "Автокөру", stage: "КЕЗЕҢ", participation: "ҚАТЫСУ", website: "Сайтқа өту", about: "Жоба туралы", hint: "Тегті таңдаңыз, көрсеткімен ауыстырыңыз немесе жобаны ашу үшін карточканы басыңыз", open: "Жобаны ашу", go: "Өту:" },
  en: { all: "All", projects: "projects", filter: "Filter projects", previous: "Previous project", next: "Next project", play: "Enable autoplay", pause: "Pause autoplay", continue: "Continue", autoplay: "Autoplay", stage: "STAGE", participation: "PROGRAM", website: "Visit website", about: "About project", hint: "Choose a tag, use the arrows or click a card to open the project", open: "Open project", go: "Go to" },
  tr: { all: "Tümü", projects: "proje", filter: "Projeleri filtrele", previous: "Önceki proje", next: "Sonraki proje", play: "Otomatik geçişi başlat", pause: "Otomatik geçişi durdur", continue: "Devam et", autoplay: "Otomatik gösterim", stage: "AŞAMA", participation: "PROGRAM", website: "Web sitesine git", about: "Proje hakkında", hint: "Etiket seçin, oklarla gezinin veya projeyi açmak için karta tıklayın", open: "Projeyi aç", go: "Git:" },
} as const;

function circularDistance(index: number, active: number, length: number) {
  let distance = index - active;
  if (distance > length / 2) distance -= length;
  if (distance < -length / 2) distance += length;
  return distance;
}

export function StartupGallery({ initialProjects }: { initialProjects?: PublicProject[] | null }) {
  const { locale } = useLocale();
  const copy = galleryCopy[locale];
  const filters = [copy.all, "AI", "Social", "EdTech", "Eco", "Science", "Culture"];
  const projects: GalleryProject[] = initialProjects === null || initialProjects === undefined ? fallbackProjects : initialProjects;
  const [filter, setFilter] = useState<string>(copy.all);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const filtered = useMemo(() => filter === copy.all ? projects : projects.filter((project) => project.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))), [filter, projects, copy.all]);
  const activeProject = filtered[active] ?? filtered[0];

  useEffect(() => setActive(0), [filter]);
  useEffect(() => {
    if (paused || filtered.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % filtered.length), 5500);
    return () => window.clearInterval(timer);
  }, [paused, filtered.length]);

  function move(direction: number) {
    setActive((current) => (current + direction + filtered.length) % filtered.length);
  }

  if (!activeProject) return null;

  return (
    <div className="startup-gallery" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onKeyDown={(event) => { if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); }} tabIndex={0}>
      <div className="gallery-toolbar">
        <div className="gallery-filters" aria-label={copy.filter}>{filters.map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
        <div className="gallery-count"><strong>{String(filtered.length).padStart(2, "0")}</strong><span>{copy.projects}</span></div>
      </div>

      <div className="gallery-stage" aria-live="polite">
        <div className="gallery-stage-grid" />
        {filtered.map((project, index) => {
          const distance = circularDistance(index, active, filtered.length);
          if (Math.abs(distance) > 2) return null;
          const position = distance + 2;
          const cardStyle = { "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties;
          return (
            <Link className={`gallery-card gallery-pos-${position} ${distance === 0 ? "is-active" : ""}`} style={cardStyle} href={project.websiteUrl || `/startups/${project.slug || project.id}`} target={project.websiteUrl ? "_blank" : undefined} rel={project.websiteUrl ? "noreferrer" : undefined} key={project.id} aria-label={`${copy.open} ${project.name}`}>
              <div className={`generative-visual visual-${project.visual}`}>{project.media?.[0] ? <Image src={project.media[0].url} alt={project.media[0].alt || project.name} fill sizes="(max-width: 700px) 290px, 390px" priority={distance === 0} /> : <><div className="visual-mesh" /><i /><i /><i /><i /><i /><span>{project.glyph}</span></>}</div>
              <div className="gallery-card-copy"><div><small>{project.cohort}</small><b>{project.stage}</b></div><h3>{project.name}</h3><div className="card-tags">{project.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            </Link>
          );
        })}
        <button className="gallery-arrow arrow-previous" onClick={() => move(-1)} aria-label={copy.previous}><ArrowLeft /></button>
        <button className="gallery-arrow arrow-next" onClick={() => move(1)} aria-label={copy.next}><ArrowRight /></button>
      </div>

      <div className="gallery-progress">
        <div>{filtered.map((project, index) => <button className={index === active ? "active" : ""} onClick={() => setActive(index)} key={project.id} aria-label={`${copy.go} ${project.name}`} />)}</div>
        <button className="gallery-pause" onClick={() => setPaused(!paused)} aria-label={paused ? copy.play : copy.pause}>{paused ? <Play /> : <Pause />}{paused ? copy.continue : copy.autoplay}</button>
      </div>

      <div className="active-project-panel" id={activeProject.id} style={{ "--project-accent": activeProject.accent } as CSSProperties}>
        <div className="active-project-number">{String(active + 1).padStart(2, "0")}<span>/ {String(filtered.length).padStart(2, "0")}</span></div>
        <div className="active-project-main"><div className="active-tags">{activeProject.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h2>{activeProject.name}</h2><p>{activeProject.text}</p></div>
        <div className="active-project-meta"><div><small>{copy.stage}</small><strong>{activeProject.stage}</strong></div><div><small>{activeProject.trlLevel ? "TRL" : copy.participation}</small><strong>{activeProject.trlLevel ? `TRL ${activeProject.trlLevel}` : activeProject.cohort}</strong></div>{activeProject.websiteUrl ? <a href={activeProject.websiteUrl} target="_blank" rel="noreferrer">{copy.website} <ArrowUpRight /></a> : <Link href={`/startups/${activeProject.slug || activeProject.id}`}>{copy.about} <ArrowUpRight /></Link>}</div>
      </div>

        <div className="gallery-hint"><Sparkles /><span>{copy.hint}</span></div>
    </div>
  );
}
