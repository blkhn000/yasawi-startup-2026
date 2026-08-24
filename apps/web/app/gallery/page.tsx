import type { Metadata } from "next";
import { GalleryGrid, type GalleryCopy } from "@/components/gallery-grid";
import { Eyebrow, PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import { getLocale } from "@/i18n/server";
import { managedPageMetadata } from "@/lib/seo";
import { getPublicNews } from "@/lib/public-api";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return managedPageMetadata(await getLocale(), "gallery"); }

const copy = {
  ru: { hero: ["Медиаархив YASAWI", "Люди, события", "и моменты движения.", "Фотографии, встречи и истории из жизни программ YASAWI STARTUP и инновационной экосистемы AYU."], intro: ["Галерея и истории", "Не просто отчёты —", "живой след программы.", "Нажмите на карточку, чтобы рассмотреть фотографию и прочитать подробности."], all: "Все", yasawi: "YASAWI", ayu: "AYU", items: "материалов", open: "Смотреть историю", close: "Закрыть", source: "Открыть публикацию", empty: "В этой категории пока нет опубликованных материалов." },
  kk: { hero: ["YASAWI медиамұрағаты", "Адамдар, оқиғалар", "және қозғалыс сәттері.", "YASAWI STARTUP бағдарламалары мен AYU инновациялық экожүйесінің фотолары, кездесулері және оқиғалары."], intro: ["Галерея және оқиғалар", "Жай есеп емес —", "бағдарламаның тірі ізі.", "Фотосуретті үлкейтіп, толық ақпаратты оқу үшін карточканы басыңыз."], all: "Барлығы", yasawi: "YASAWI", ayu: "AYU", items: "материал", open: "Оқиғаны көру", close: "Жабу", source: "Жарияланымды ашу", empty: "Бұл санатта әзірге жарияланған материал жоқ." },
  en: { hero: ["YASAWI media archive", "People, events", "and moments in motion.", "Photos, gatherings and stories from YASAWI STARTUP programs and the AYU innovation ecosystem."], intro: ["Gallery and stories", "More than reports —", "a living record.", "Open a card to view the photograph and read the full context."], all: "All", yasawi: "YASAWI", ayu: "AYU", items: "stories", open: "View story", close: "Close", source: "Open publication", empty: "There are no published stories in this category yet." },
  tr: { hero: ["YASAWI medya arşivi", "İnsanlar, etkinlikler", "ve hareket hâlindeki anlar.", "YASAWI STARTUP programları ve AYU inovasyon ekosisteminden fotoğraflar, buluşmalar ve hikâyeler."], intro: ["Galeri ve hikâyeler", "Yalnızca rapor değil —", "programın canlı izi.", "Fotoğrafı büyütmek ve ayrıntıları okumak için karta tıklayın."], all: "Tümü", yasawi: "YASAWI", ayu: "AYU", items: "içerik", open: "Hikâyeyi görüntüle", close: "Kapat", source: "Yayını aç", empty: "Bu kategoride henüz yayımlanmış içerik yok." },
} satisfies Record<string, { hero: [string, string, string, string]; intro: [string, string, string, string]; all: string; yasawi: string; ayu: string; items: string; open: string; close: string; source: string; empty: string }>;

export default async function GalleryPage() {
  const locale = await getLocale();
  const pageCopy = copy[locale];
  const items = await getPublicNews(locale, 30) ?? [];
  const gridCopy: GalleryCopy = { all: pageCopy.all, yasawi: pageCopy.yasawi, ayu: pageCopy.ayu, items: pageCopy.items, open: pageCopy.open, close: pageCopy.close, source: pageCopy.source, empty: pageCopy.empty };
  return <SiteLayout><PageHero eyebrow={pageCopy.hero[0]} title={pageCopy.hero[1]} outline={pageCopy.hero[2]} description={pageCopy.hero[3]} /><section className="section shell stories-section"><Reveal className="section-head split-head"><div><Eyebrow>{pageCopy.intro[0]}</Eyebrow><h2>{pageCopy.intro[1]}<br /><span>{pageCopy.intro[2]}</span></h2></div><p>{pageCopy.intro[3]}</p></Reveal><GalleryGrid items={items} copy={gridCopy} /></section></SiteLayout>;
}
