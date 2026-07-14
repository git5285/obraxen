import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { projects } from "@/lib/projects";
import { getPublicationState } from "@/lib/publication";

export default function sitemap(): MetadataRoute.Sitemap {
  const publication = getPublicationState(brand, projects);
  if (!publication.isPublic || !brand.dominio) return [];

  const origin = `https://${brand.dominio}`;
  return [
    { url: `${origin}/`, priority: 1 },
    { url: `${origin}/proyectos/`, priority: 0.9 },
    ...projects.map(({ slug }) => ({
      url: `${origin}/proyectos/${slug}/`,
      priority: 0.8,
    })),
    { url: `${origin}/aviso-legal/`, priority: 0.2 },
    { url: `${origin}/privacidad/`, priority: 0.2 },
    { url: `${origin}/cookies/`, priority: 0.2 },
  ];
}
