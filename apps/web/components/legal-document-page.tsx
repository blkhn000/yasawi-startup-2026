import { PageHero, Reveal, SiteLayout } from "@/components/site-shell";
import type { Locale } from "@/i18n/config";
import { OPERATOR_BIN, operatorNames, type LegalDocument } from "@/i18n/legal-documents";

type Contacts = { email: string; phone: string; address: string };

const fallbackAddresses: Record<Locale, string> = {
  ru: "проспект Бекзата Саттарханова, 29, Туркестан, Казахстан",
  kk: "Бекзат Саттарханов даңғылы, 29, Түркістан, Қазақстан",
  en: "29 Bekzat Sattarkhanov Avenue, Turkistan, Kazakhstan",
  tr: "Bekzat Sattarkhanov Caddesi 29, Türkistan, Kazakistan",
};

export function legalContacts(locale: Locale, settings?: Partial<Contacts> | null): Contacts {
  return {
    email: settings?.email || "yassawi_commerc@ayu.edu.kz",
    phone: settings?.phone || "+7 (72533) 6-36-36",
    address: settings?.address || fallbackAddresses[locale],
  };
}

function fill(text: string, locale: Locale, contacts: Contacts) {
  return text
    .replaceAll("{operator}", operatorNames[locale])
    .replaceAll("{bin}", OPERATOR_BIN)
    .replaceAll("{email}", contacts.email)
    .replaceAll("{phone}", contacts.phone)
    .replaceAll("{address}", contacts.address);
}

export function LegalDocumentPage({ document, locale, contacts }: { document: LegalDocument; locale: Locale; contacts: Contacts }) {
  return <SiteLayout>
    <PageHero eyebrow={document.eyebrow} title={document.title} outline={document.outline} description={document.description} />
    <section className="section shell privacy-content legal-content">
      <Reveal>
        <div className="legal-version"><span>{document.updated}</span><strong>{document.versionLabel}</strong></div>
        <div className="privacy-notice"><p>{document.notice}</p></div>
        {document.sections.map((section) => <section key={section.title} className="legal-section">
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{renderContact(fill(paragraph, locale, contacts), contacts.email)}</p>)}
          {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{fill(bullet, locale, contacts)}</li>)}</ul>}
        </section>)}
        {document.references && <nav className="legal-references" aria-label={document.sections.at(-1)?.title}>
          {document.references.map((reference) => <a key={reference.href} href={reference.href} target="_blank" rel="noreferrer">{reference.label}</a>)}
        </nav>}
      </Reveal>
    </section>
  </SiteLayout>;
}

function renderContact(text: string, email: string) {
  const parts = text.split(email);
  if (parts.length === 1) return text;
  return parts.flatMap((part, index) => index === 0 ? [part] : [<a href={`mailto:${email}`} key={`${email}-${index}`}>{email}</a>, part]);
}
