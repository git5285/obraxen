import Ajv2020, { type AnySchema, type ValidateFunction } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import offersSource from "../data/ofertas.json";
import offersJsonSchema from "../data/ofertas.schema.json";
import projectsSource from "../data/proyectos.json";
import projectsJsonSchema from "../data/proyectos.schema.json";
import { offersSchema, projectsSchema } from "@/lib/schemas";

const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);

const validateProjects = ajv.compile(projectsJsonSchema as AnySchema);
const validateOffers = ajv.compile(offersJsonSchema as AnySchema);

function errorsFor(validate: ValidateFunction) {
  return JSON.stringify(validate.errors, null, 2);
}

describe("portable JSON Schema contracts", () => {
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
