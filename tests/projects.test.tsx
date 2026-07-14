import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProjectsPage, { metadata as projectsMetadata } from "@/app/proyectos/page";
import ProjectPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/proyectos/[slug]/page";
import { brand } from "@/lib/brand";
import { projects } from "@/lib/projects";
import { publicableOffers } from "@/lib/solutions";

describe("project routes", () => {
  it("renders the complete evidence hub from validated project data", () => {
    const html = renderToStaticMarkup(<ProjectsPage />);
    expect(html.match(/<article class="project-dossier"/g)).toHaveLength(projects.length);
    expect(html.match(/<img /g)).toHaveLength(projects.length * 3);
    expect(html).toContain("Obras ejecutadas, explicadas desde la evidencia.");
    expect(html).not.toContain("style=");
    if (brand.nombreTemporalNoPublicable) {
      expect(html).not.toContain(brand.nombreTemporalNoPublicable);
    }
  });

  it("prerenders exactly the six approved slugs", () => {
    expect(generateStaticParams()).toEqual(
      projects.map(({ slug }) => ({ slug })),
    );
  });

  it.each(projects)("renders $slug with its evidence and navigation", async (project) => {
    const page = await ProjectPage({ params: Promise.resolve({ slug: project.slug }) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain(project.traducciones.es.titulo);
    expect(html).toContain(project.referencia);
    expect(html.match(/<img /g)).toHaveLength(project.imagenes.length);
    expect(html).not.toContain("style=");
  });

  it("provides unique route metadata without inventing a domain", async () => {
    expect(projectsMetadata.openGraph).toMatchObject({ type: "website", locale: "es_ES" });
    expect(projectsMetadata.alternates).toBeUndefined();

    const titles = await Promise.all(projects.map(async ({ slug }) => {
      const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
      expect(metadata.openGraph).toMatchObject({ type: "article", locale: "es_ES" });
      expect(metadata.alternates).toBeUndefined();
      return metadata.title;
    }));
    expect(new Set(titles).size).toBe(projects.length);
  });
});

describe("solutions publication gate", () => {
  it("keeps the solutions route absent while every offer is internal", () => {
    expect(publicableOffers).toHaveLength(0);
    expect(existsSync(resolve("src/app/soluciones/page.tsx"))).toBe(false);
  });
});
