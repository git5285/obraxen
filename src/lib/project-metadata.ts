import type { Metadata } from "next";
import { brand, getBrandTranslation } from "./brand";
import { getDictionary, getPath, openGraphLocales, type Locale } from "./i18n";
import { absoluteSiteUrl, getLocalizedAlternates } from "./metadata";
import { getProjectImage } from "./media";
import { publicProjects, publicProjectsBySlug } from "./projects";
import type { Project } from "./schemas";
import { emptyProjectsDescription, getRouteSeo } from "./seo-indexability";

function shorten(value: string, max = 158) {
  const text = value.trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

function metadataImage(project: Project, locale: Locale, domain: string | null) {
  if (!domain) return [];
  const image = getProjectImage(project.imagenes[0].src);
  return [{
    url: absoluteSiteUrl(domain, image.src),
    width: image.width,
    height: image.height,
    alt: project.traducciones[locale].imagenes[0]?.alt ?? project.cliente,
  }];
}

export function getProjectsMetadata(locale: Locale, domain = brand.dominio): Metadata {
  const dictionary = getDictionary(locale);
  const claim = getBrandTranslation(locale).claim;
  const title = `${publicProjects.length ? dictionary.meta.projectsTitle : dictionary.common.projects} — ${claim}`;
  const description = publicProjects.length ? dictionary.meta.projectsDescription : emptyProjectsDescription[locale];
  const images = publicProjects.length ? metadataImage(publicProjects[0], locale, domain) : [];
  return {
    title,
    description,
    ...getRouteSeo(domain, locale, "projects"),
    openGraph: {
      title,
      description,
      type: "website",
      locale: openGraphLocales[locale],
      siteName: brand.nombre ?? claim,
      url: domain ? absoluteSiteUrl(domain, getPath(locale, "projects")) : undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map(({ url }) => url),
    },
  };
}

export function getProjectMetadata(project: Project, locale: Locale, domain = brand.dominio): Metadata {
  if (!publicProjectsBySlug.has(project.slug)) return {};
  const dictionary = getDictionary(locale);
  const translation = project.traducciones[locale];
  const title = `${translation.titulo} — ${dictionary.meta.projectTitleSuffix}`;
  const description = shorten(`${translation.problema} ${translation.solucion}`);
  const path = getPath(locale, "projects", project.slug);
  const images = metadataImage(project, locale, domain);
  return {
    title,
    description,
    alternates: getLocalizedAlternates(domain, locale, "projects", project.slug),
    openGraph: {
      title,
      description,
      type: "article",
      locale: openGraphLocales[locale],
      siteName: brand.nombre ?? getBrandTranslation(locale).claim,
      url: domain ? absoluteSiteUrl(domain, path) : undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map(({ url }) => url),
    },
  };
}
