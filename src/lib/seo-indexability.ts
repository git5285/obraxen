import { resolveContactConfig } from "./contact";
import { getLocalizedAlternates } from "./metadata";
import { publicProjects } from "./projects";
import type { Locale, RouteKey } from "./i18n";
import { brand } from "./brand";
import { publicActivation } from "./public-activation";
import { getPublicPublicationState } from "./publication";

// Publication is a separate gate: this only checks whether a route is useful.
export function isRouteReadyForIndexing(route: RouteKey): boolean {
  if (route === "projects") return publicProjects.length > 0;
  if (route === "contact") return resolveContactConfig(process.env).enabled;
  return true;
}

export function getRouteSeo(domain: string | null, locale: Locale, route: RouteKey) {
  const alternates = getLocalizedAlternates(domain, locale, route);
  if (isRouteReadyForIndexing(route)) return { alternates };
  const publication = getPublicPublicationState(brand, publicActivation);
  return {
    robots: publication.isPublic
      ? { index: false, follow: true }
      : { index: false, follow: false, nocache: true },
    alternates: alternates ? { canonical: alternates.canonical } : undefined,
  };
}

export const emptyProjectsDescription: Record<Locale, string> = {
  en: "There are currently no project case studies available for public consultation.",
  de: "Derzeit stehen keine Projektberichte zur öffentlichen Einsicht zur Verfügung.",
  es: "Actualmente no hay fichas de proyectos disponibles para consulta pública.",
  fr: "Aucune fiche de projet n'est actuellement disponible pour consultation publique.",
};
