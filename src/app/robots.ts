import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { publicActivation } from "@/lib/public-activation";
import { buildPublicRobotsPolicy } from "@/lib/publication";

export default function robots(): MetadataRoute.Robots {
  return buildPublicRobotsPolicy(brand, publicActivation);
}
