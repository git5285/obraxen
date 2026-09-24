import projectsSource from "../../data/proyectos.json";
import { projectsSchema } from "./schemas";

// Internal evidence stays available to gates and validation, never to web routes.
export const internalProjects = projectsSchema.parse(projectsSource);

const internalProjectSlugs = internalProjects.map((project) => project.slug);

if (new Set(internalProjectSlugs).size !== internalProjectSlugs.length) {
  throw new Error("data/proyectos.json contiene slugs duplicados");
}

export const internalProjectsBySlug = new Map(
  internalProjects.map((project) => [project.slug, project]),
);
