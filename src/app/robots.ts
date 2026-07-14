import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { projects } from "@/lib/projects";
import { buildRobotsPolicy } from "@/lib/publication";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsPolicy(brand, projects);
}
