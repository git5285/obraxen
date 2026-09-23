import type { Metadata } from "next";
import { headers } from "next/headers";
import { NotFoundContent } from "@/components/not-found-content";
import { defaultLocale, getDictionary, getPath, isLocale } from "@/lib/i18n";
import "./globals.css";

async function getNotFoundLocale() {
  const localeHeader = (await headers()).get("x-obraxen-locale");
  return localeHeader && isLocale(localeHeader) ? localeHeader : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getNotFoundLocale();
  const copy = getDictionary(locale).notFound;
  return { title: copy.code, description: copy.body };
}

export default async function GlobalNotFound() {
  const locale = await getNotFoundLocale();
  const copy = getDictionary(locale).notFound;

  return (
    <html lang={locale}>
      <body>
        <NotFoundContent copy={copy} href={getPath(locale, "home")} />
      </body>
    </html>
  );
}
