"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { LocaleLink as Link } from "@/components/locale-link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./brand-logo";
import { LanguageSwitcher } from "./language-switcher";
import { useLocale } from "@/i18n/locale-provider";
import { stripLocalePath } from "@/i18n/config";

export function Header({ light = false }: { light?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = stripLocalePath(usePathname());
  const { messages } = useLocale();
  const navigation = [
    { href: "/program/incubation", label: messages.nav.incubation },
    { href: "/program/acceleration", label: messages.nav.acceleration },
    { href: "/program/it-education", label: messages.nav.education },
    { href: "/startups", label: messages.nav.startups },
    { href: "/gallery", label: messages.nav.gallery },
    { href: "/about", label: messages.nav.about },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    const closeOnDesktop = () => { if (window.innerWidth > 1000) setMenuOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [menuOpen]);

  return (
    <nav className={`nav shell ${light ? "nav-light" : ""}`} aria-label={messages.nav.navigation}>
      <Logo />
      <div className={`nav-links ${menuOpen ? "open" : ""}`} id="primary-navigation">
        {navigation.map((item) => <Link className={pathname === item.href ? "active-link" : ""} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
        <LanguageSwitcher onChange={() => setMenuOpen(false)} />
        <Link className="button nav-cta" href="/apply" onClick={() => setMenuOpen(false)}>{messages.nav.apply} <ArrowUpRight size={16} /></Link>
      </div>
      <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? messages.nav.closeMenu : messages.nav.openMenu} aria-expanded={menuOpen} aria-controls="primary-navigation">{menuOpen ? <X /> : <Menu />}</button>
    </nav>
  );
}
