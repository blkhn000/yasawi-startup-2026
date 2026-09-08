"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, CircleCheck } from "lucide-react";
import { LocaleLink as Link } from "@/components/locale-link";
import { Eyebrow } from "./site-shell-primitives";
import { useLocale } from "@/i18n/locale-provider";
import { LEGAL_DOCUMENT_VERSION } from "@/i18n/legal-documents";

export function ApplyPageContent({ responseDays = 5 }: { responseDays?: number }) {
  const { locale, messages } = useLocale();
  const copy = messages.apply;
  const fallbackProgramOptions = [{ value: "incubation", label: messages.nav.incubation }, { value: "acceleration", label: messages.nav.acceleration }, { value: "it-education", label: messages.nav.education }];
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [program, setProgram] = useState("incubation");
  const [programOptions, setProgramOptions] = useState(fallbackProgramOptions);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("program");
    if (fallbackProgramOptions.some((item) => item.value === requested)) setProgram(requested!);
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/public/programs?locale=${locale}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Array<{ slug: string; title: string; status: string }>> : Promise.reject())
      .then((items) => {
        const available = items.filter((item) => item.status !== "closed" && item.status !== "completed").map((item) => ({ value: item.slug, label: item.title }));
        if (available.length) { setProgramOptions(available); if (!available.some((item) => item.value === (requested ?? program))) setProgram(available[0].value); }
      }).catch(() => undefined);
    return () => controller.abort();
  }, [locale]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("loading");
    const payload = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), locale, authorityConfirmed: true, consentVersion: LEGAL_DOCUMENT_VERSION };
    try { const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/applications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error(); setStatus("success"); }
    catch { setStatus("error"); }
  }

  const responseNote = {
    ru: `Обычно отвечаем в течение ${responseDays} рабочих дней.`,
    kk: `Әдетте ${responseDays} жұмыс күні ішінде жауап береміз.`,
    en: `We usually respond within ${responseDays} business days.`,
    tr: `Genellikle ${responseDays} iş günü içinde yanıt veririz.`,
  }[locale];

  return <section className="apply-page"><div className="apply-grid" /><div className="shell apply-layout"><div className="apply-copy"><Eyebrow>{copy.eye}</Eyebrow><h1>{copy.title}<br /><span>{copy.outline}</span></h1><p>{copy.description}</p><div className="apply-points">{copy.points.map((point) => <span key={point}><CircleCheck /> {point}</span>)}</div><p className="application-response-note">{responseNote}</p></div><div className="apply-form-card">{status === "success" ? <div className="form-success"><CircleCheck size={56} /><h2>{copy.success}</h2><p>{copy.thanks}</p><Link className="button primary" href="/">{copy.home}</Link></div> : <form onSubmit={submit}><label>{copy.select}<select name="program" value={program} onChange={(event) => setProgram(event.target.value)} required>{programOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label>{copy.name}<input name="name" placeholder={copy.namePlaceholder} minLength={3} autoComplete="name" required /></label><div className="form-row"><label>Email<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label><label>{copy.phone}<input name="phone" type="tel" placeholder="+7 700 000 00 00" autoComplete="tel" required /></label></div><label>{copy.idea}<textarea name="idea" placeholder={copy.ideaPlaceholder} minLength={10} required /></label><label className="consent-field"><input name="consent" type="checkbox" value="true" required /><span>{copy.consent} <Link href="/consent" target="_blank">{copy.consentDocument}</Link>, {copy.privacyJoin} <Link href="/privacy" target="_blank">{copy.policy}</Link> {copy.termsJoin} <Link href="/terms" target="_blank">{copy.terms}</Link>.</span></label>{status === "error" && <p className="form-error">{copy.error}</p>}<button className="button primary submit" disabled={status === "loading"}>{status === "loading" ? copy.sending : copy.submit}<ArrowUpRight /></button></form>}</div></div></section>;
}
