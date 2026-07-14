import type { Metadata } from "next";
import { brand } from "./brand";
import { getProjectImage } from "./homepage";
import { projects } from "./projects";
import type { Project } from "./schemas";

export const projectsTitle = `Proyectos ejecutados — ${brand.claim}`;
export const projectsDescription =
  "Archivo de obras ejecutadas con fotografías, alcance, magnitudes confirmadas y cierre documentado de cada intervención.";

const continuityLabels: Record<
  NonNullable<Project["cierre"]["continuidadOperativa"]>,
  string
> = {
  total: "La actividad continuó en paralelo",
  parcial: "La actividad continuó parcialmente",
  detenida: "La actividad no continuó durante la intervención",
  sin_actividad: "Instalación sin actividad concurrente",
};

function siteOrigin(): string | null {
  return brand.dominio ? `https://${brand.dominio}` : null;
}

function absolutePath(path: string): string {
  const origin = siteOrigin();
  return origin ? new URL(path, origin).toString() : path;
}

function shorten(value: string, max = 158): string {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

function metadataImage(project: Project) {
  const origin = siteOrigin();
  if (!origin) return [];
  const image = getProjectImage(project.imagenes[0].src);
  return [
    {
      url: new URL(image.src, origin).toString(),
      width: image.width,
      height: image.height,
      alt: project.imagenes[0].alt,
    },
  ];
}

export const projectsMetadata: Metadata = {
  title: projectsTitle,
  description: projectsDescription,
  alternates: brand.dominio ? { canonical: "/proyectos/" } : undefined,
  openGraph: {
    title: projectsTitle,
    description: projectsDescription,
    type: "website",
    locale: "es_ES",
    siteName: brand.nombre ?? brand.claim,
    url: brand.dominio ? "/proyectos/" : undefined,
    images: projects.length ? metadataImage(projects[0]) : [],
  },
  twitter: {
    card: "summary_large_image",
    title: projectsTitle,
    description: projectsDescription,
    images: projects.length ? metadataImage(projects[0]).map(({ url }) => url) : [],
  },
};

export function getProjectMetadata(project: Project): Metadata {
  const translation = project.traducciones.es;
  const title = `${translation.titulo} — Caso ejecutado`;
  const description = shorten(`${translation.problema} ${translation.solucion}`);
  const path = `/proyectos/${project.slug}/`;
  const images = metadataImage(project);

  return {
    title,
    description,
    alternates: brand.dominio ? { canonical: path } : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      locale: "es_ES",
      siteName: brand.nombre ?? brand.claim,
      url: brand.dominio ? path : undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map(({ url }) => url),
    },
  };
}

export function getProjectLocation(project: Project): string {
  return `${project.ubicacion.ciudad}, ${project.ubicacion.pais}`;
}

export function getProjectNeighbors(project: Project) {
  const index = projects.findIndex(({ slug }) => slug === project.slug);
  return {
    previous: index > 0 ? projects[index - 1] : null,
    next: index >= 0 && index < projects.length - 1 ? projects[index + 1] : null,
  };
}

export function getExecutionFacts(project: Project) {
  const publicExecutionDate =
    project.cierre.fechaEjecucion &&
    !/pendiente de confirmar/i.test(project.cierre.fechaEjecucion)
      ? project.cierre.fechaEjecucion
      : null;

  return [
    publicExecutionDate ? ["Ejecución", publicExecutionDate] : null,
    project.cierre.duracionReal
      ? ["Duración real", project.cierre.duracionReal]
      : null,
    project.superficieInstalacionM2
      ? [
          "Instalación aprox.",
          `${project.superficieInstalacionM2.toLocaleString("es-ES")} m²`,
        ]
      : null,
    project.equipoOperarios
      ? ["Equipo", `${project.equipoOperarios} operarios`]
      : null,
    project.cierre.continuidadOperativa
      ? [
          "Operativa",
          continuityLabels[project.cierre.continuidadOperativa],
        ]
      : null,
  ].filter((fact): fact is [string, string] => fact !== null);
}

export function naturalList(items: readonly string[]): string {
  if (items.length < 2) return items[0] ?? "";
  const last = items.at(-1) ?? "";
  const conjunction = /^(?:i|hi(?!e))/i.test(last) ? "e" : "y";
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${last}`;
}

export const projectsJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "Proyectos ejecutados",
      description: projectsDescription,
      ...(brand.dominio ? { url: absolutePath("/proyectos/") } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absolutePath("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "Proyectos",
          item: absolutePath("/proyectos/"),
        },
      ],
    },
    {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: project.traducciones.es.titulo,
        url: absolutePath(`/proyectos/${project.slug}/`),
      })),
    },
  ],
}).replace(/</g, "\\u003c");

export function getProjectJsonLd(project: Project): string | null {
  if (!brand.dominio) return null;
  const path = `/proyectos/${project.slug}/`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: absolutePath("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Proyectos",
        item: absolutePath("/proyectos/"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.cliente,
        item: absolutePath(path),
      },
    ],
  }).replace(/</g, "\\u003c");
}
