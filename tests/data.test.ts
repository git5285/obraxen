import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import { offers } from "@/lib/offers";
import { projects, projectsBySlug } from "@/lib/projects";
import { locales } from "@/lib/i18n";

describe("structured data", () => {
  it("keeps project and offer slugs unique", () => {
    expect(new Set(projects.map(({ slug }) => slug)).size).toBe(projects.length);
    expect(new Set(offers.map(({ slug }) => slug)).size).toBe(offers.length);
  });

  it("references only validated public projects from offers", () => {
    for (const offer of offers) {
      for (const evidence of offer.evidencia) {
        expect(projectsBySlug.has(evidence.proyecto)).toBe(true);
      }
    }
  });

  it("does not publish internal offer drafts", () => {
    expect(offers.every(({ estadoPublicacion }) => estadoPublicacion !== "publicable"))
      .toBe(true);
  });

  it("requires all four locale variants for public project and offer copy", () => {
    for (const project of projects) {
      expect(Object.keys(project.traducciones).sort()).toEqual([...locales].sort());
      for (const locale of locales) {
        expect(project.traducciones[locale].imagenes).toHaveLength(project.imagenes.length);
        expect(project.traducciones[locale].magnitudes.length).toBeGreaterThan(0);
      }
    }
    for (const offer of offers) {
      expect(Object.keys(offer.traducciones).sort()).toEqual([...locales].sort());
    }
  });

  it("keeps client publication evidence explicit and fail-closed", () => {
    for (const project of projects) {
      expect(project.autorizacionPublicacion).toMatchObject({
        estado: "confirmada_internamente",
        alcanceDeclarado: ["nombre_cliente"],
        referenciaDocumento: null,
        revisionLegal: "pendiente",
      });
    }
  });

  it("represents unknown execution dates as null", () => {
    const unknownDates = projects
      .filter(({ slug }) => [
        "dadada-euskirchen",
        "loreal-gauchy",
        "hologram-paris",
      ].includes(slug))
      .map(({ cierre }) => cierre.fechaEjecucion);

    expect(unknownDates).toEqual([null, null, null]);
    expect(JSON.stringify(projects)).not.toContain("pendiente de confirmar");
  });

  it("does not publish an unverified initial-response SLA", () => {
    expect(brand.respuestaHoras).toBeNull();
  });
});
