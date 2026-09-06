import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { publicProjects } from "@/lib/projects";
import { publicActivation } from "@/lib/public-activation";
import { getPublicPublicationState } from "@/lib/publication";
import { getLocalizedPaths, getPath, locales, type RouteKey } from "@/lib/i18n";
import { isRouteReadyForIndexing } from "@/lib/seo-indexability";

export default function sitemap(): MetadataRoute.Sitemap {
  const publication = getPublicPublicationState(brand, publicActivation);
  if (!publication.isPublic || !brand.dominio) return [];

  const origin = `https://${brand.dominio}`;
  const absolute = (path: string) => new URL(path, origin).toString();
  const entry = (locale: (typeof locales)[number], route: RouteKey, priority: number, slug?: string) => ({
    url: absolute(getPath(locale, route, slug)),
    priority,
    alternates: {
      languages: Object.fromEntries(
        Object.entries(getLocalizedPaths(route, slug)).map(([language, path]) => [language, absolute(path)]),
      ),
    },
  });

  return locales.flatMap((locale) => [
    entry(locale, "home", 1),
    ...(isRouteReadyForIndexing("projects") ? [entry(locale, "projects", 0.9)] : []),
    ...publicProjects.map(({ slug }) => entry(locale, "projects", 0.8, slug)),
    ...(isRouteReadyForIndexing("contact") ? [entry(locale, "contact", 0.8)] : []),
    entry(locale, "legalNotice", 0.2),
    entry(locale, "privacy", 0.2),
    entry(locale, "cookies", 0.2),
  ]);
}
