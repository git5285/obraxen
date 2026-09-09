import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../../css/architecture.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Obraxen | Arquitectura, preview privada",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ArchitecturePreview({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams?: Promise<{ review?: string }> }) {
  const { lang } = await params;
  if (lang !== "es" || process.env.NODE_ENV !== "development"
    || process.env.OBRAXEN_ARCHITECTURE_PREVIEW !== "local-only" || process.env.VERCEL) notFound();
  // Internal records are loaded only after the local-development gate, never into public homepages.
  const [{ ArchitectureHome }, { internalProjects }] = await Promise.all([
    import("@/components/architecture-home"), import("@/lib/internal-projects"),
  ]);
  const projects = ["delticom-hannover", "hologram-paris"].map((slug) => {
    const project = internalProjects.find((item) => item.slug === slug);
    if (!project) throw new Error(`Falta el registro interno ${slug}`);
    const images = ["Estado inicial", "Resultado documentado"].map((stage) => {
      const image = project.imagenes.find(item => item.etapa === stage);
      if (!image) throw new Error(`Falta la fotografía ${stage} de ${slug}`);
      // Each media request repeats the private-development gate; no public asset registration.
      return { src: `/es/architecture-preview/media/${slug}/${stage === "Estado inicial" ? "initial" : "result"}/`, alt: image.alt, stage,
        width: 1400, height: slug === "delticom-hannover" ? 646 : 1050 };
    });
    return { name: project.cliente, city: project.ubicacion.ciudad,
      country: project.traducciones.es.pais, sector: project.traducciones.es.sector,
      area: project.superficieM2, description: project.traducciones.es.solucion,
      problem: project.traducciones.es.problema, result: project.traducciones.es.resultado,
      duration: project.traducciones.es.duracionReal, materials: project.traducciones.es.materiales, images };
  });
  const review = (await searchParams)?.review === "editorial";
  return <ArchitectureHome projects={projects} showEditorialPreview={review} />;
}
