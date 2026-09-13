import { naturalList } from "./formatting";
import { getDictionary, type Locale } from "./i18n";
import { publicProjects } from "./projects";
import type { Project } from "./schemas";

export function getProjectLocation(project: Project, locale: Locale): string {
  return `${project.ubicacion.ciudad}, ${project.traducciones[locale].pais}`;
}

export function getProjectNeighbors(project: Project) {
  const index = publicProjects.findIndex(({ slug }) => slug === project.slug);
  return {
    previous: index > 0 ? publicProjects[index - 1] : null,
    next: index >= 0 && index < publicProjects.length - 1 ? publicProjects[index + 1] : null,
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
    project.equipoOperarios ? [dictionary.team, `${project.equipoOperarios} ${dictionary.workers}`] : null,
    project.cierre.continuidadOperativa
      ? [dictionary.operation, dictionary.continuity[project.cierre.continuidadOperativa]]
      : null,
  ].filter((fact): fact is [string, string] => fact !== null);
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
