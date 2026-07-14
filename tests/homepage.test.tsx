import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import { brand } from "@/lib/brand";
import { projects } from "@/lib/projects";

describe("Next.js homepage", () => {
  const html = renderToStaticMarkup(<HomePage />);

  it("renders the approved evidence-led homepage structure", () => {
    expect(html).toContain("Reparaciones planificadas para reducir el impacto operativo.");
    expect(html).toContain("Diagnosticar.");
    expect(html).toContain("Alcance real y evidencia de obra");
    expect(html).toContain("Preguntas frecuentes sobre reparación de pavimentos");
  });

  it("renders every validated project once", () => {
    expect(html.match(/<article class="proy">/g)).toHaveLength(projects.length);
    for (const project of projects) expect(html).toContain(project.traducciones.es.titulo);
  });

  it("keeps the temporary identifier and unavailable contact flows out of the page", () => {
    if (brand.nombreTemporalNoPublicable) {
      expect(html).not.toContain(brand.nombreTemporalNoPublicable);
    }
    expect(html).not.toContain("Pide una evaluación");
    expect(html).toContain("Ver proyectos");
  });

  it("does not require inline styles", () => {
    expect(html).not.toContain("style=");
  });
});
