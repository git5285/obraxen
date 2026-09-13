import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionContactPage } from "@/components/section-contact-page";
import { SectionLegalPage } from "@/components/section-legal-page";
import { SectionProjectsPage } from "@/components/section-projects-page";
import { brand, getBrandTranslation } from "@/lib/brand";
import {
  getDictionary,
  getPath,
  getRouteForSection,
  getSectionParams,
  isLocale,
  openGraphLocales,
  type Locale,
  type RouteKey,
} from "@/lib/i18n";
import { absoluteSiteUrl } from "@/lib/metadata";
import { getRouteSeo } from "@/lib/seo-indexability";
import { getProjectsMetadata } from "@/lib/project-pages";
import "../../../../css/projects.css";

type SectionPageProps = Pick<PageProps<"/[lang]/[section]">, "params">;

export const dynamicParams = false;

export function generateStaticParams() {
  return getSectionParams();
}

export function getSectionMetadata(
  locale: Locale,
  route: RouteKey,
  domain = brand.dominio,
): Metadata {
  const dictionary = getDictionary(locale);
  const claim = getBrandTranslation(locale).claim;
  const document = route === "legalNotice"
    ? dictionary.legal.notice
    : route === "privacy"
      ? dictionary.legal.privacy
      : route === "cookies"
        ? dictionary.legal.cookies
        : null;
  const title = document?.title ?? dictionary.meta.contactTitle;
  const description = document?.description ?? dictionary.meta.contactDescription;
  return {
    title: `${title} — ${claim}`,
    description,
    ...getRouteSeo(domain, locale, route),
    openGraph: {
      title: `${title} — ${claim}`,
      description,
      type: "website",
      locale: openGraphLocales[locale],
      siteName: brand.nombre ?? claim,
      url: domain ? absoluteSiteUrl(domain, getPath(locale, route)) : undefined,
    },
  };
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { lang, section } = await params;
  if (!isLocale(lang)) return {};
  const route = getRouteForSection(lang, section);
  if (!route) return {};
  return route === "projects" ? getProjectsMetadata(lang) : getSectionMetadata(lang, route);
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { lang, section } = await params;
  if (!isLocale(lang)) notFound();
  const route = getRouteForSection(lang, section);
  if (!route || route === "home") notFound();
  if (route === "projects") {
    return <SectionProjectsPage locale={lang} />;
  }

  if (route === "legalNotice" || route === "privacy" || route === "cookies") {
    return <SectionLegalPage locale={lang} route={route} />;
  }

  if (route === "contact") {
    return <SectionContactPage locale={lang} />;
  }

  notFound();
}
