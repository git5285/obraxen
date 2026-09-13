import { brand } from "./brand";
import { getDictionary, getPath, type Locale } from "./i18n";
import { getProjectImage } from "./media";
import { publicProjects, publicProjectsBySlug } from "./projects";
import type { Project } from "./schemas";
import { emptyProjectsDescription } from "./seo-indexability";

function absolutePath(path: string): string {
  const origin = brand.dominio ? `https://${brand.dominio}` : null;
  return origin ? new URL(path, origin).toString() : path;
}

export function getProjectsJsonLd(locale: Locale): string {
  const dictionary = getDictionary(locale);
  const projectsPath = getPath(locale, "projects");
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: publicProjects.length ? dictionary.meta.projectsTitle : dictionary.common.projects, description: publicProjects.length ? dictionary.meta.projectsDescription : emptyProjectsDescription[locale], inLanguage: locale, ...(brand.dominio ? { url: absolutePath(projectsPath) } : {}) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: dictionary.common.home, item: absolutePath(getPath(locale, "home")) }, { "@type": "ListItem", position: 2, name: dictionary.common.projects, item: absolutePath(projectsPath) }] },
    { "@type": "ItemList", numberOfItems: publicProjects.length, itemListElement: publicProjects.map((project, index) => ({ "@type": "ListItem", position: index + 1, name: project.traducciones[locale].titulo, url: absolutePath(getPath(locale, "projects", project.slug)) })) },
  ] }).replace(/</g, "\\u003c");
}

export function getProjectJsonLd(project: Project, locale: Locale): string | null {
  if (!brand.dominio || !publicProjectsBySlug.has(project.slug)) return null;
  const dictionary = getDictionary(locale);
  const translation = project.traducciones[locale];
  const path = getPath(locale, "projects", project.slug);
  const url = absolutePath(path);
  const images = project.imagenes.map(({ src }) => absolutePath(getProjectImage(src).src));
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#case-study`,
        name: translation.titulo,
        headline: translation.titulo,
        description: `${translation.problema} ${translation.solucion}`,
        inLanguage: locale,
        url,
        image: images,
        ...(brand.nombre ? { publisher: { "@id": absolutePath("/#organization") } } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: dictionary.common.home, item: absolutePath(getPath(locale, "home")) },
          { "@type": "ListItem", position: 2, name: dictionary.common.projects, item: absolutePath(getPath(locale, "projects")) },
          { "@type": "ListItem", position: 3, name: project.cliente, item: url },
        ],
      },
    ],
  }).replace(/</g, "\\u003c");
}
