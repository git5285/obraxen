import type { Project } from "./schemas";

// Add a project here only after its public-safe record and all approved assets exist.
export const publicProjects: readonly Project[] = [];

export const publicProjectsBySlug = new Map(
  publicProjects.map((project) => [project.slug, project]),
);
