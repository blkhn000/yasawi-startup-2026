import "server-only";
import { headers } from "next/headers";
import { normalizeLocale } from "./config";

export async function getLocale() {
  const requestLocale = (await headers()).get("x-yasawi-locale");
  return normalizeLocale(requestLocale);
}
