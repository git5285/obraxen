import type { PublicProjectImageMap } from "./public-project-assets";
import { hasPublicProjectAssets } from "./public-project-assets";
import { hasProjectPublicationAuthorization } from "./publication";
import type { Project } from "./schemas";

export const hasPublicProjectAuthorization = hasProjectPublicationAuthorization;

export function isPublicProject(project: Project, imageMap: PublicProjectImageMap): boolean {
  return hasPublicProjectAuthorization(project) && hasPublicProjectAssets(project, imageMap);
}
