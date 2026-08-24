import { HomePage } from "@/components/home-page";
import { getPublicHome } from "@/lib/public-api";
import { getLocale } from "@/i18n/server";
import { messages } from "@/i18n/messages";

export default async function Page() {
  const locale = await getLocale();
  const home = await getPublicHome(locale);
  return <HomePage initialData={home} copy={messages[locale]} />;
}
