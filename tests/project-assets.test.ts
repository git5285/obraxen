import type { StaticImageData } from "next/image";
import { describe, expect, it } from "vitest";
import {
  getPublicProjectImage,
  hasPublicProjectAssets,
  type PublicProjectImageMap,
} from "@/lib/public-project-assets";
import { projects } from "@/lib/projects";

const approvedImage = {
  src: "/approved-project-image.webp",
  width: 1200,
  height: 800,
  blurDataURL: "data:image/webp;base64,AA==",
} as StaticImageData;

describe("public project assets", () => {
  it("requires an explicitly approved asset for every public project image", () => {
    const project = projects[0];
    const imageMap: PublicProjectImageMap = Object.fromEntries(
      project.imagenes.map(({ src }) => [src, approvedImage]),
    );

    expect(hasPublicProjectAssets(project, imageMap)).toBe(true);
    expect(getPublicProjectImage(project.imagenes[0].src, imageMap)).toBe(approvedImage);

    const incompleteMap = { ...imageMap };
    delete incompleteMap[project.imagenes[0].src];
    expect(hasPublicProjectAssets(project, incompleteMap)).toBe(false);
    expect(() => getPublicProjectImage(project.imagenes[0].src, incompleteMap))
      .toThrow("No existe un import de imagen publico aprobado");
  });
});
