import type { StaticImageData } from "next/image";
import { describe, expect, it } from "vitest";
import { getImageDimensions } from "@/lib/media";

const approvedImage = {
  src: "/approved-project-image.webp",
  width: 1200,
  height: 800,
  blurDataURL: "data:image/webp;base64,AA==",
} as StaticImageData;

describe("media helpers", () => {
  it("keeps intrinsic dimensions for static imports and the supplied fallback for paths", () => {
    expect(getImageDimensions(approvedImage, { width: 1, height: 1 })).toEqual({ width: 1200, height: 800 });
    expect(getImageDimensions("/approved-project-image.webp", { width: 1400, height: 900 }))
      .toEqual({ width: 1400, height: 900 });
  });
});
