import { headers } from "next/headers";
import { NotFoundContent } from "@/components/not-found-content";
import type { Metadata } from "next";
import { defaultLocale, getDictionary, getPath, isLocale } from "@/lib/i18n";

async function getNotFoundLocale() {
  const localeHeader = (await headers()).get("x-obraxen-locale");
  return localeHeader && isLocale(localeHeader) ? localeHeader : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getNotFoundLocale();
  const copy = getDictionary(locale).notFound;

  return { title: copy.code, description: copy.body };
}

export default async function LocaleNotFound() {
  const locale = await getNotFoundLocale();
  const copy = getDictionary(locale).notFound;

  return (
    <>
      <title>{copy.code}</title>
      <NotFoundContent copy={copy} href={getPath(locale, "home")} />
    </>
  );
}
