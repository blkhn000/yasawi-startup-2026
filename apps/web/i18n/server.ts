import "server-only";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { localeCookie, normalizeLocale } from "./config";

export async function getLocale() {
  const requestLocale = (await headers()).get("x-yasawi-locale");
  if (requestLocale) return normalizeLocale(requestLocale);
  return normalizeLocale((await cookies()).get(localeCookie)?.value);
}
