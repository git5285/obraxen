import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import { internalProjects, internalProjectsBySlug } from "@/lib/internal-projects";
import { offers } from "@/lib/offers";
import { locales } from "@/lib/i18n";
import { projectSchema } from "@/lib/schemas";

describe("structured data", () => {
  it("keeps project and offer slugs unique", () => {
    expect(new Set(internalProjects.map(({ slug }) => slug)).size).toBe(internalProjects.length);
    expect(new Set(offers.map(({ slug }) => slug)).size).toBe(offers.length);
  });

  it("references only validated public projects from offers", () => {
    for (const offer of offers) {
      for (const evidence of offer.evidencia) {
        expect(internalProjectsBySlug.has(evidence.proyecto)).toBe(true);
      }
    }
  });

  it("does not publish internal offer drafts", () => {
    expect(offers.every(({ estadoPublicacion }) => estadoPublicacion !== "publicable"))
      .toBe(true);
  });

  it("requires all four locale variants for public project and offer copy", () => {
    for (const project of internalProjects) {
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

  it("keeps client publication evidence explicit and traceable", () => {
    for (const project of internalProjects) {
      expect(project.autorizacionPublicacion).toMatchObject({
        evidencias: [{
          tipo: "declaracion_responsable",
          alcance: ["nombre_cliente", "fotografias_web"],
          fuente: "Declaración expresa del responsable",
          declaracion: "Existe autorización legal total para publicar el nombre del cliente y las fotografías web.",
          declaradoEl: "2026-07-17",
          referenciaInterna: `AUTH-RESP-20260717-${project.referencia}`,
        }],
      });
      expect(project.autorizacionPublicacion.evidencias).not.toContainEqual(
        expect.objectContaining({ tipo: "documento_referenciado" }),
      );
      expect(project.autorizacionPublicacion.evidencias).not.toContainEqual(
        expect.objectContaining({ tipo: "revision_legal_verificada" }),
      );
    }
  });

  it("requires a professional review to reference a document in the same dossier", () => {
    const project = structuredClone(internalProjects[0]);
    project.autorizacionPublicacion.evidencias.push({
      tipo: "revision_legal_verificada",
      documentoRevisado: "AUTH-DOC-NOT-PRESENT",
      revisor: "Revisor legal de prueba",
      revisadoEl: "2026-07-17",
      referenciaRevision: "LEGAL-REVIEW-TEST-E240002",
      resultado: "aprobada",
    });

    expect(() => projectSchema.parse(project)).toThrow(
      "Una revisión legal debe enlazar un documento referenciado en el mismo expediente",
    );
  });

  it("represents unknown execution dates as null", () => {
    const unknownDates = internalProjects
      .filter(({ slug }) => [
        "dadada-euskirchen",
        "loreal-gauchy",
        "hologram-paris",
      ].includes(slug))
      .map(({ cierre }) => cierre.fechaEjecucion);

    expect(unknownDates).toEqual([null, null, null]);
    expect(JSON.stringify(internalProjects)).not.toContain("pendiente de confirmar");
  });

  it("does not publish an unverified initial-response SLA", () => {
    expect(brand.respuestaHoras).toBeNull();
  });

  it("integrates only the selected commercial name from the current identity intake", () => {
    expect(brand).toMatchObject({
      nombre: "Obraxen",
      nombreRevisionAprobada: false,
      nombreLegal: null,
      cif: null,
      empresaConstituida: false,
      dominio: "obraxen.com",
      email: "info@obraxen.com",
      emailPrivacidad: "privacy@obraxen.com",
      telefono: null,
      whatsapp: null,
      direccion: null,
      publicar: false,
    });
  });
});
