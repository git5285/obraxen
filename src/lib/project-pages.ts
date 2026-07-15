import type { Metadata } from "next";
import { brand, getBrandTranslation } from "./brand";
import { getProjectImage, naturalList } from "./homepage";
import {
  getDictionary,
  getPath,
  openGraphLocales,
  type Locale,
} from "./i18n";
import { absoluteSiteUrl, getLocalizedAlternates } from "./metadata";
import { projects } from "./projects";
import type { Project } from "./schemas";

function siteOrigin(): string | null {
  return brand.dominio ? `https://${brand.dominio}` : null;
}

function absolutePath(path: string): string {
  const origin = siteOrigin();
  return origin ? new URL(path, origin).toString() : path;
}

function shorten(value: string, max = 158): string {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
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
  const title = `${dictionary.meta.projectsTitle} — ${claim}`;
  const description = dictionary.meta.projectsDescription;
  const images = projects.length ? metadataImage(projects[0], locale, domain) : [];

  return {
    title,
    description,
    alternates: getLocalizedAlternates(domain, locale, "projects"),
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

export function getProjectMetadata(
  project: Project,
  locale: Locale,
  domain = brand.dominio,
): Metadata {
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

export function getProjectLocation(project: Project, locale: Locale): string {
  return `${project.ubicacion.ciudad}, ${project.traducciones[locale].pais}`;
}

export function getProjectNeighbors(project: Project) {
  const index = projects.findIndex(({ slug }) => slug === project.slug);
  return {
    previous: index > 0 ? projects[index - 1] : null,
    next: index >= 0 && index < projects.length - 1 ? projects[index + 1] : null,
  };
}

export function getExecutionFacts(project: Project, locale: Locale) {
  const dictionary = getDictionary(locale).projectCase;
  const translation = project.traducciones[locale];

  return [
    translation.fechaEjecucion ? [dictionary.execution, translation.fechaEjecucion] : null,
    translation.duracionReal ? [dictionary.duration, translation.duracionReal] : null,
    project.superficieInstalacionM2
      ? [dictionary.facilityArea, `${project.superficieInstalacionM2.toLocaleString(locale)} m²`]
      : null,
    project.equipoOperarios
      ? [dictionary.team, `${project.equipoOperarios} ${dictionary.workers}`]
      : null,
    project.cierre.continuidadOperativa
      ? [dictionary.operation, dictionary.continuity[project.cierre.continuidadOperativa]]
      : null,
  ].filter((fact): fact is [string, string] => fact !== null);
}

export function getProjectsJsonLd(locale: Locale): string {
  const dictionary = getDictionary(locale);
  const projectsPath = getPath(locale, "projects");
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: dictionary.meta.projectsTitle,
        description: dictionary.meta.projectsDescription,
        inLanguage: locale,
        ...(brand.dominio ? { url: absolutePath(projectsPath) } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: dictionary.common.home, item: absolutePath(getPath(locale, "home")) },
          { "@type": "ListItem", position: 2, name: dictionary.common.projects, item: absolutePath(projectsPath) },
        ],
      },
      {
        "@type": "ItemList",
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: project.traducciones[locale].titulo,
          url: absolutePath(getPath(locale, "projects", project.slug)),
        })),
      },
    ],
  }).replace(/</g, "\\u003c");
}

export function getProjectJsonLd(project: Project, locale: Locale): string | null {
  if (!brand.dominio) return null;
  const dictionary = getDictionary(locale);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dictionary.common.home, item: absolutePath(getPath(locale, "home")) },
      { "@type": "ListItem", position: 2, name: dictionary.common.projects, item: absolutePath(getPath(locale, "projects")) },
      { "@type": "ListItem", position: 3, name: project.cliente, item: absolutePath(getPath(locale, "projects", project.slug)) },
    ],
  }).replace(/</g, "\\u003c");
}

export function projectResources(project: Project, locale: Locale): string[] {
  const copy = getDictionary(locale).projectCase;
  const translation = project.traducciones[locale];
  return [
    translation.maquinaria.length
      ? `${copy.machinery}: ${naturalList(translation.maquinaria, locale)}.`
      : null,
    translation.materiales.length
      ? `${copy.materials}: ${naturalList(translation.materiales, locale)}.`
      : null,
  ].filter((value): value is string => value !== null);
}
