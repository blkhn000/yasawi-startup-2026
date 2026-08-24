"use client";

import { ArrowUpRight, CalendarDays, Check, Code2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LocaleLink } from "@/components/locale-link";
import type { ItCourse } from "@/lib/public-api";
import { useLocale } from "@/i18n/locale-provider";

export function ItCourseGrid({ courses }: { courses: ItCourse[] }) {
  const { locale, messages } = useLocale();
  const copy = {
    ru: { close: "Закрыть", date: "Дата будет объявлена", includes: "Что входит", enroll: "Записаться на курс" },
    kk: { close: "Жабу", date: "Күні кейін хабарланады", includes: "Бағдарламаға кіреді", enroll: "Курсқа жазылу" },
    en: { close: "Close", date: "Date to be announced", includes: "What is included", enroll: "Enroll in the course" },
    tr: { close: "Kapat", date: "Tarih daha sonra açıklanacak", includes: "Neler dâhil", enroll: "Kursa kaydol" },
  }[locale];
  const [selected, setSelected] = useState<ItCourse | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [selected]);

  return <>
    <div className="it-tracks">{courses.map((course, index) => <button className="it-track-card course-card" type="button" key={course.id || course.slug} onClick={() => setSelected(course)} aria-haspopup="dialog"><span>{String(index + 1).padStart(2, "0")}</span><Code2 /><h3>{course.title}</h3><p>{course.shortDescription}</p><b>{messages.common.more} <ArrowUpRight /></b></button>)}</div>
    {selected && <div className="course-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
        <button className="course-modal-close" type="button" onClick={() => setSelected(null)} aria-label={copy.close}><X /></button>
        <span className="course-modal-kicker">{messages.nav.education.toUpperCase()} · {selected.format}</span>
        <h2 id="course-modal-title">{selected.title}</h2>
        <div className="course-modal-meta"><span><CalendarDays />{selected.dateLabel || copy.date}</span>{selected.duration && <span>{selected.duration}</span>}</div>
        <p>{selected.description || selected.shortDescription}</p>
        {selected.includes.length > 0 && <div className="course-modal-includes"><h3>{copy.includes}</h3>{selected.includes.map((item) => <div key={item}><Check /><span>{item}</span></div>)}</div>}
        <LocaleLink className="button primary" href="/apply?program=it-education">{copy.enroll} <ArrowUpRight /></LocaleLink>
      </section>
    </div>}
  </>;
}
