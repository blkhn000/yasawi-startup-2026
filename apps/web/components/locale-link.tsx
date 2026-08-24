"use client";

import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { localizedPath } from "@/i18n/config";
import { useLocale } from "@/i18n/locale-provider";

type LocaleLinkProps = LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const { locale } = useLocale();
  const localizedHref = typeof href === "string" ? localizedPath(locale, href) : href;
  return <NextLink href={localizedHref} {...props} />;
}
