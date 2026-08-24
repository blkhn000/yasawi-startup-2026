"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { localeCookie, localeNames, locales, localizedPath, stripLocalePath, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/locale-provider";

export function LanguageSwitcher({ onChange }: { onChange?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, messages } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function select(nextLocale: Locale) {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }
    document.cookie = `${localeCookie}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
    setOpen(false);
    onChange?.();
    const suffix = `${window.location.search}${window.location.hash}`;
    router.push(`${localizedPath(nextLocale, stripLocalePath(pathname))}${suffix}`);
  }

  return (
    <div className={`language-switcher ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        className="language-switcher-trigger"
        type="button"
        aria-label={`${messages.nav.language}: ${localeNames[locale]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="language-switcher-icon"><Globe2 aria-hidden="true" /></span>
        <span className="language-switcher-current">
          <strong>{locale.toUpperCase()}</strong>
          <small>{localeNames[locale]}</small>
        </span>
        <ChevronDown className="language-switcher-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="language-switcher-menu" role="listbox" aria-label={messages.nav.language}>
          <div className="language-switcher-heading">
            <span>{messages.nav.language}</span>
            <small>04</small>
          </div>
          {locales.map((item, index) => (
            <button
              className={item === locale ? "active" : ""}
              type="button"
              role="option"
              aria-selected={item === locale}
              onClick={() => select(item)}
              key={item}
            >
              <span className="language-switcher-number">0{index + 1}</span>
              <span className="language-switcher-code">{item.toUpperCase()}</span>
              <strong>{localeNames[item]}</strong>
              {item === locale && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
