"use client";

import { ArrowUpRight, CalendarDays, ExternalLink, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicNewsItem } from "@/lib/public-api";
import { ResilientImage } from "./resilient-image";

export type GalleryCopy = {
  all: string;
  yasawi: string;
  ayu: string;
  items: string;
  open: string;
  close: string;
  source: string;
  empty: string;
};

export function GalleryGrid({ items, copy }: { items: PublicNewsItem[]; copy: GalleryCopy }) {
  const [filter, setFilter] = useState<"ALL" | "YASAWI" | "AYU">("ALL");
  const [selected, setSelected] = useState<PublicNewsItem | null>(null);
  const visibleItems = useMemo(() => filter === "ALL" ? items : items.filter((item) => item.source === filter), [filter, items]);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", close); };
  }, [selected]);

  return <>
    <div className="stories-toolbar">
      <div role="group" aria-label={copy.items}>{(["ALL", "YASAWI", "AYU"] as const).map((value) => <button type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>{value === "ALL" ? copy.all : value === "YASAWI" ? copy.yasawi : copy.ayu}</button>)}</div>
      <span><strong>{String(visibleItems.length).padStart(2, "0")}</strong> {copy.items}</span>
    </div>

    {visibleItems.length === 0 ? <div className="stories-empty"><Sparkles /><p>{copy.empty}</p></div> : <div className="stories-grid">{visibleItems.map((item, index) => <button className={`story-card story-shape-${index % 4}`} type="button" onClick={() => setSelected(item)} key={item.id} aria-label={`${copy.open}: ${item.title}`}>
      <span className="story-image">{item.imageUrl ? <ResilientImage src={item.imageUrl} alt={item.title} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" /> : <span className="story-image-fallback"><Sparkles /></span>}<i>{item.source}</i></span>
      <span className="story-copy"><small>{item.date}{item.location ? ` · ${item.location}` : ""}</small><strong>{item.title}</strong>{item.summary && <p>{item.summary}</p>}<b>{copy.open} <ArrowUpRight /></b></span>
    </button>)}</div>}

    {selected && <div className="story-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <article className="story-modal" role="dialog" aria-modal="true" aria-labelledby="story-modal-title">
        <button className="story-modal-close" type="button" onClick={() => setSelected(null)} aria-label={copy.close}><X /></button>
        <div className="story-modal-image">{selected.imageUrl ? <ResilientImage src={selected.imageUrl} alt={selected.title} fill sizes="(max-width: 850px) 100vw, 55vw" priority /> : <span className="story-image-fallback"><Sparkles /></span>}</div>
        <div className="story-modal-copy"><span className="story-modal-source">{selected.source}</span><small><CalendarDays /> {selected.date}{selected.location ? ` · ${selected.location}` : ""}</small><h2 id="story-modal-title">{selected.title}</h2>{selected.summary && <p>{selected.summary}</p>}<a className="button primary" href={selected.url} target="_blank" rel="noreferrer">{copy.source} <ExternalLink /></a></div>
      </article>
    </div>}
  </>;
}
