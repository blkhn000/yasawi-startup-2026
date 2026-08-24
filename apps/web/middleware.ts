import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { localeCookie, localeFromPath, normalizeLocale, stripLocalePath } from "@/i18n/config";

const PUBLIC_FILE = /\.[^/]+$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/opengraph-image" ||
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathLocale = localeFromPath(pathname);
  if (!pathLocale) {
    const locale = normalizeLocale(request.cookies.get(localeCookie)?.value);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = stripLocalePath(pathname);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-yasawi-locale", pathLocale);

  const response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  response.cookies.set(localeCookie, pathLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
