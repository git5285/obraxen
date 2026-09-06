import { publicProjectImages } from "./public-project-assets";
import { isPublicProject as isPublicProjectCandidate } from "./public-project-publication";
import type { Project } from "./schemas";

export { hasPublicProjectAuthorization } from "./public-project-publication";

export function isPublicProject(project: Project): boolean {
  return isPublicProjectCandidate(project, publicProjectImages);
}

// Add a project here only after its public-safe record and all approved assets exist.
export const publicProjects: readonly Project[] = [];

export const publicProjectsBySlug = new Map(
  publicProjects.map((project) => [project.slug, project]),
);
