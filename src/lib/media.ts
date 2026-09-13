import type { StaticImageData } from "next/image";
import { getPublicProjectImage } from "./public-project-assets";

export const getProjectImage = getPublicProjectImage;

export function getImageDimensions(
  image: StaticImageData | string,
  fallback: { width: number; height: number },
) {
  return typeof image === "string"
    ? fallback
    : { width: image.width, height: image.height };
}
