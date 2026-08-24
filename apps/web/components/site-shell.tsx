import { Globe2 } from "lucide-react";
import { LocaleLink as Link } from "@/components/locale-link";
import { getPublicSettings } from "@/lib/public-api";
import { messages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { Logo } from "./brand-logo";
import { Header } from "./site-header";
import { Eyebrow, Reveal } from "./site-shell-primitives";
export { Eyebrow, Reveal } from "./site-shell-primitives";

export function PageHero({ eyebrow, title, outline, description, dark = false }: { eyebrow: string; title: string; outline: string; description: string; dark?: boolean }) {
  return <section className={`page-hero ${dark ? "dark-page-hero" : ""}`}><div className="page-hero-grid" /><div className="shell page-hero-content"><Reveal><Eyebrow>{eyebrow}</Eyebrow><h1>{title}<br /><span>{outline}</span></h1><p>{description}</p></Reveal></div></section>;
}

export async function Footer() {
  const locale = await getLocale();
  const copy = messages[locale];
  const settings = await getPublicSettings(locale);
  const contacts = {
    email: settings?.contactEmail ?? "yassawi_commerc@ayu.edu.kz",
    phone: settings?.contactPhone ?? "8 (72533) 6-36-36",
    address: settings?.address ?? ({ ru: "ул. Бекзата Саттарханова, 29, Туркестан, Казахстан", kk: "Бекзат Саттарханов көшесі, 29, Түркістан, Қазақстан", en: "29 Bekzat Sattarkhanov Street, Turkistan, Kazakhstan", tr: "Bekzat Sattarkhanov Caddesi 29, Türkistan, Kazakistan" }[locale]),
    instagram: settings?.instagram,
    youtube: settings?.youtube,
    telegram: settings?.telegram,
    whatsapp: settings?.whatsapp,
  };

  return (
    <footer className="footer">
      <div className="shell footer-grid"><div><Logo /><p>{copy.footer.description}</p></div><div><small>{copy.nav.navigation.toUpperCase()}</small><Link href="/program">{copy.nav.programs}</Link><Link href="/program/incubation">{copy.nav.incubation}</Link><Link href="/program/acceleration">{copy.nav.acceleration}</Link><Link href="/program/it-education">{copy.nav.education}</Link><Link href="/startups">{copy.nav.startups}</Link><Link href="/gallery">{copy.nav.gallery}</Link><Link href="/about">{copy.nav.about}</Link><Link href="/faq">{copy.nav.faq}</Link></div><div><small>{copy.nav.contacts.toUpperCase()}</small><a href={`mailto:${contacts.email}`}>{contacts.email}</a><a href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}>{contacts.phone}</a><p>{contacts.address}</p>{contacts.instagram && <a href={contacts.instagram} target="_blank" rel="noreferrer">Instagram</a>}{contacts.youtube && <a href={contacts.youtube} target="_blank" rel="noreferrer">YouTube</a>}{contacts.telegram && <a href={contacts.telegram} target="_blank" rel="noreferrer">Telegram</a>}{contacts.whatsapp && <a href={contacts.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}</div></div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} YASAWI STARTUP</span><Link href="/privacy">{copy.nav.privacy}</Link><span>{copy.footer.slogan} <Globe2 size={14} /></span></div>
    </footer>
  );
}

export function SiteLayout({ children, darkHeader = false }: { children: React.ReactNode; darkHeader?: boolean }) {
  return <main><Header light={darkHeader} />{children}<Footer /></main>;
}
