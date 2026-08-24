import { JsonLd } from "@/components/json-ld";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/config";
import { absoluteUrl } from "@/i18n/metadata";
import type { PublicProgram } from "@/lib/public-api";

export function ProgramJsonLd({ locale, path, program, fallbackName, fallbackDescription }: {
  locale: Locale;
  path: string;
  program: PublicProgram | null;
  fallbackName: string;
  fallbackDescription: string;
}) {
  const name = program?.title || fallbackName;
  const description = program?.description || program?.shortDescription || fallbackDescription;
  const url = absoluteUrl(localizedPath(locale, path));
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url,
    inLanguage: locale,
    provider: { "@type": "EducationalOrganization", "@id": `${absoluteUrl("/")}#organization`, name: "YASAWI STARTUP" },
    offers: { "@type": "Offer", category: "Education", price: program?.isFree === false ? program.price : "0", priceCurrency: "KZT", availability: program?.status === "open" ? "https://schema.org/InStock" : "https://schema.org/PreOrder", url },
    educationalCredentialAwarded: "YASAWI STARTUP program completion",
    timeRequired: program?.durationWeeks ? `P${program.durationWeeks}W` : undefined,
  }} />;
}
