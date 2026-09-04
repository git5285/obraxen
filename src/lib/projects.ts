import projectsSource from "../../data/proyectos.json";
import { publicProjectImages } from "./public-project-assets";
import {
  hasPublicProjectAuthorization,
  isPublicProject as isPublicProjectCandidate,
} from "./public-project-publication";
import { projectsSchema, type Project } from "./schemas";

export const projects = projectsSchema.parse(projectsSource);

const projectSlugs = projects.map((project) => project.slug);

if (new Set(projectSlugs).size !== projectSlugs.length) {
  throw new Error("data/proyectos.json contiene slugs duplicados");
}

export const projectsBySlug = new Map(
  projects.map((project) => [project.slug, project]),
);

export { hasPublicProjectAuthorization };

export function isPublicProject(project: Project): boolean {
  return isPublicProjectCandidate(project, publicProjectImages);
}

// A case becomes public only when its evidence and every referenced asset are approved.
export const publicProjects = projects.filter(isPublicProject);

export const publicProjectsBySlug = new Map(
  publicProjects.map((project) => [project.slug, project]),
);
