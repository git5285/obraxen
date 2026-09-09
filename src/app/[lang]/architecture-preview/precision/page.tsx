import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../../../css/architecture-precision.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Obraxen | Precisión industrial, alternativa local",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PrecisionPreview({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "es" || process.env.NODE_ENV !== "development"
    || process.env.OBRAXEN_ARCHITECTURE_PREVIEW !== "local-only" || process.env.VERCEL) notFound();

  // Keep private records and filesystem reads behind the same gate as the incumbent preview.
  const [{ ArchitecturePrecision }, { internalProjects }, { readFile }, { join }] = await Promise.all([
    import("@/components/architecture-precision"), import("@/lib/internal-projects"),
    import("node:fs/promises"), import("node:path"),
  ]);
  const projects = await Promise.all(["delticom-hannover", "hologram-paris"].map(async slug => {
    const project = internalProjects.find(item => item.slug === slug);
    if (!project) throw new Error(`Falta el registro interno ${slug}`);
    const images = await Promise.all(["Estado inicial", "Resultado documentado"].map(async stage => {
      const image = project.imagenes.find(item => item.etapa === stage);
      if (!image) throw new Error(`Falta la fotografía ${stage} de ${slug}`);
      const bytes = await readFile(join(process.cwd(), "img/proyectos", image.src.slice("img/proyectos/".length)));
      return { src: `data:image/webp;base64,${bytes.toString("base64")}`, alt: image.alt, stage,
        width: 1400, height: slug === "delticom-hannover" ? 646 : 1050 };
    }));
    return { name: project.cliente, city: project.ubicacion.ciudad, country: project.traducciones.es.pais,
      sector: project.traducciones.es.sector, area: project.superficieM2,
      description: project.traducciones.es.solucion, problem: project.traducciones.es.problema,
      result: project.traducciones.es.resultado, duration: project.traducciones.es.duracionReal,
      materials: project.traducciones.es.materiales, images };
  }));
  return <ArchitecturePrecision projects={projects} />;
}
