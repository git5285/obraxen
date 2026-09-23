// This module is also imported by Node's type-stripping runner.
// @ts-expect-error Node requires the explicit TypeScript extension.
import { hasProjectPublicationAuthorization } from "../src/lib/project-publication-authorization.ts";
import type { PublicProjectImageMap } from "../src/lib/public-project-assets";
import type { Project } from "../src/lib/schemas";

export function isLighthouseProject(project: Project, images: PublicProjectImageMap): boolean {
  // Preserve the runner's historical every([]) behavior. Changing it is a
  // separate functional fix; the public application requires nonempty images.
  return hasProjectPublicationAuthorization(project)
    && project.imagenes.every((image) => Boolean(images[image.src]));
}
