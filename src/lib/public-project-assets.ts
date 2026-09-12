import type { StaticImageData } from "next/image";
import type { Project } from "./schemas";

export type PublicProjectImageMap = Readonly<Record<string, StaticImageData>>;

// Populate this map only when the referenced asset has been approved for public use.
export const publicProjectImages: PublicProjectImageMap = {};

export function hasPublicProjectAssets(
  project: Project,
  imageMap: PublicProjectImageMap = publicProjectImages,
): boolean {
  return project.imagenes.length > 0
    && project.imagenes.every((image) => Boolean(imageMap[image.src]));
}

export function getPublicProjectImage(
  imagePath: string,
  imageMap: PublicProjectImageMap = publicProjectImages,
): StaticImageData {
  const image = imageMap[imagePath];
  if (!image) throw new Error(`No existe un import de imagen publico aprobado para ${imagePath}`);
  return image;
}
