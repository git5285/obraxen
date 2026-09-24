import Ajv2020, { type AnySchema, type ValidateFunction } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import brandSource from "../data/brand.json";
import offersSource from "../data/ofertas.json";
import offersJsonSchema from "../data/ofertas.schema.json";
import projectsSource from "../data/proyectos.json";
import projectsJsonSchema from "../data/proyectos.schema.json";
import { brandSchema, offersSchema, projectsSchema } from "../domain/publication/schemas";

const ajv = new Ajv2020({ allErrors: true, strict: true });
const calendarDate = z.iso.date();
ajv.addFormat("date", (value: string) => calendarDate.safeParse(value).success);

const validateProjects = ajv.compile(projectsJsonSchema as AnySchema);
const validateOffers = ajv.compile(offersJsonSchema as AnySchema);

function errorsFor(validate: ValidateFunction) {
  return JSON.stringify(validate.errors, null, 2);
}

describe("portable JSON Schema contracts", () => {
  describe.each(["declaradoEl", "emitidoEl", "revisadoEl", "confirmadoEl"])("calendar field %s", (field) => {
    it.each([
      ["2026-02-28", true], ["2024-02-29", true], ["2000-02-29", true],
      ["2400-02-29", true], ["2026-04-30", true],
      ["2026-02-29", false], ["1900-02-29", false], ["2100-02-29", false],
      ["2026-04-31", false], ["2026-13-01", false], ["2026-00-10", false],
      ["2026-01-00", false], ["2026-01-32", false], ["2026-2-03", false],
      ["2026-02-28T00:00:00Z", false], [" 2026-02-28 ", false], ["", false], [null, false],
    ])("validates %s with expected acceptance %s", (date, accepted) => {
      const project = structuredClone(projectsSource[0]);
      const declaration = {
        tipo: "declaracion_responsable", alcance: ["fotografias_web"],
        fuente: "Test source", declaracion: "Fixture only", declaradoEl: "2026-02-28",
        referenciaInterna: "TEST-DECLARATION",
      };
      const document = {
        tipo: "documento_referenciado", alcance: ["fotografias_web"],
        entidadAutorizante: "Test entity", emitidoEl: "2026-02-28",
        referenciaDocumento: "TEST-DOCUMENT",
      };
      const review = {
        tipo: "revision_legal_verificada", documentoRevisado: "TEST-DOCUMENT",
        revisor: "Test reviewer", revisadoEl: "2026-02-28",
        referenciaRevision: "TEST-REVIEW", resultado: "aprobada",
      };
      const candidate = [{
        ...project,
        autorizacionPublicacion: { evidencias: [
          { ...declaration, ...(field === "declaradoEl" ? { declaradoEl: date } : {}) },
          { ...document, ...(field === "emitidoEl" ? { emitidoEl: date } : {}) },
          { ...review, ...(field === "revisadoEl" ? { revisadoEl: date } : {}) },
        ] },
        cierre: { ...project.cierre, ...(field === "confirmadoEl" ? { confirmadoEl: date } : {}) },
      }];
      expect(validateProjects(candidate), errorsFor(validateProjects)).toBe(accepted);
      expect(projectsSchema.safeParse(candidate).success).toBe(accepted);
    });
  });

  it("accepts the same current project and offer datasets as Zod", () => {
    expect(validateProjects(projectsSource), errorsFor(validateProjects)).toBe(true);
    expect(projectsSchema.safeParse(projectsSource).success).toBe(true);
    expect(validateOffers(offersSource), errorsFor(validateOffers)).toBe(true);
    expect(offersSchema.safeParse(offersSource).success).toBe(true);
  });

  it("rejects a project that loses a required structural field", () => {
    const invalid = structuredClone(projectsSource) as unknown as Array<Record<string, unknown>>;
    delete invalid[0].referencia;

    expect(validateProjects(invalid)).toBe(false);
    expect(projectsSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects an offer with an unsupported publication state", () => {
    const invalid = structuredClone(offersSource) as unknown as Array<Record<string, unknown>>;
    invalid[0].estadoPublicacion = "publicada_sin_revision";

    expect(validateOffers(invalid)).toBe(false);
    expect(offersSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a public name that is equal to its temporary identifier", () => {
    const invalid = {
      ...structuredClone(brandSource),
      nombre: "Obraxen",
      nombreTemporalNoPublicable: "obraxen",
    };

    const result = brandSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(({ message }) => (
        message.includes("no puede ser el identificador temporal")
      ))).toBe(true);
    }
  });

  it("rejects a project missing localized image evidence", () => {
    type Image = { src: string; alt: string; etapa: string };
    type LocalizedImage = { alt: string; etapa: string };
    type ProjectFixture = {
      imagenes: Image[];
      traducciones: Record<"en" | "de" | "es" | "fr", { imagenes: LocalizedImage[] }>;
    };
    const invalid = structuredClone(projectsSource) as unknown as ProjectFixture[];
    invalid[0].imagenes = [{ src: "img/test.webp", alt: "Test image", etapa: "Before" }];
    for (const locale of ["en", "de", "es", "fr"] as const) {
      invalid[0].traducciones[locale].imagenes = [{ alt: "Test image", etapa: "Before" }];
    }
    invalid[0].traducciones.de.imagenes = [];

    const result = projectsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(({ path, message }) => (
        path.join(".") === "0.traducciones.de.imagenes"
        && message.includes("Cada imagen necesita alt y etapa")
      ))).toBe(true);
    }
  });

  it("keeps cross-evidence linkage in the canonical Zod contract", () => {
    const invalid = structuredClone(projectsSource) as unknown as Array<{
      autorizacionPublicacion: { evidencias: Array<Record<string, unknown>> };
    }>;
    invalid[0].autorizacionPublicacion.evidencias.push({
      tipo: "revision_legal_verificada",
      documentoRevisado: "AUTH-DOC-NOT-PRESENT",
      revisor: "Revisor legal de prueba",
      revisadoEl: "2026-07-17",
      referenciaRevision: "LEGAL-REVIEW-SCHEMA-TEST",
      resultado: "aprobada",
    });

    expect(validateProjects(invalid), errorsFor(validateProjects)).toBe(true);
    const zodResult = projectsSchema.safeParse(invalid);
    expect(zodResult.success).toBe(false);
    if (!zodResult.success) {
      expect(zodResult.error.issues.some(({ message }) => (
        message.includes("debe enlazar un documento referenciado")
      ))).toBe(true);
    }
  });
});
