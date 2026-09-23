import { getRouteForSection, isLocale } from "./i18n";
import { publicProjectsBySlug } from "./projects";
import type { Project } from "./schemas";

export function resolveProjectRoute(
  { lang, section, slug }: { lang: string; section: string; slug: string },
  projects: ReadonlyMap<string, Project> = publicProjectsBySlug,
) {
  if (!isLocale(lang) || getRouteForSection(lang, section) !== "projects") return null;
  const project = projects.get(slug);
  return project ? { project, locale: lang } : null;
}
