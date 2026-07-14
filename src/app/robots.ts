import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { buildRobotsPolicy } from "@/lib/publication";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsPolicy(brand);
}
