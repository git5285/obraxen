import projectsSource from "../../data/proyectos.json";
import { projectsSchema } from "./schemas";

export const projects = projectsSchema.parse(projectsSource);

const projectSlugs = projects.map((project) => project.slug);

if (new Set(projectSlugs).size !== projectSlugs.length) {
  throw new Error("data/proyectos.json contiene slugs duplicados");
}

export const projectsBySlug = new Map(
  projects.map((project) => [project.slug, project]),
);
