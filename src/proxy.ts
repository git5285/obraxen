import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { locales } from "./lib/locales";
const localeSet = new Set<string>(locales);

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://*.googletagmanager.com https://*.clarity.ms`,
    `style-src 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    "font-src 'self'",
    "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-obraxen-locale");
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const locale = request.nextUrl.pathname.split("/").filter(Boolean)[0];
  if (locale && localeSet.has(locale)) {
    requestHeaders.set("x-obraxen-locale", locale);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
