import { describe, expect, it } from "vitest";
import { internalProjects } from "@/lib/internal-projects";
import { hasProjectPublicationAuthorization, getProjectPublicationIssues } from "@/lib/publication";
import { isPublicProject } from "@/lib/public-project-publication";
import { isLighthouseProject } from "../scripts/lighthouse-projects";
import type { Project } from "@/lib/schemas";

const document = {
  tipo: "documento_referenciado", alcance: ["nombre_cliente", "fotografias_web"],
  entidadAutorizante: "Fixture", emitidoEl: "2026-09-01", referenciaDocumento: "AUTH-001",
} as const;
const review = {
  tipo: "revision_legal_verificada", documentoRevisado: "AUTH-001", revisor: "Fixture",
  revisadoEl: "2026-09-01", referenciaRevision: "LEGAL-001", resultado: "aprobada",
} as const;

describe("application and Lighthouse publication parity", () => {
  it.each([
    { name: "missing evidence", evidence: [], authorized: false },
    { name: "document only", evidence: [document], authorized: false },
    { name: "incomplete scopes", evidence: [{ ...document, alcance: ["nombre_cliente"] }, review], authorized: false },
    { name: "mismatched review", evidence: [document, { ...review, documentoRevisado: "OTHER" }], authorized: false },
    { name: "unapproved review", evidence: [document, { ...review, resultado: "pendiente" }], authorized: false },
    { name: "approved", evidence: [document, review], authorized: true },
    { name: "stale then approved", evidence: [{ ...document, referenciaDocumento: "OLD" }, document, review], authorized: true },
  ])("preserves $name for both callers", ({ evidence, authorized }) => {
    const base = structuredClone(internalProjects[0]);
    // Intentionally also exercise unapproved raw data accepted by the QA reader.
    base.autorizacionPublicacion.evidencias = evidence as unknown as Project["autorizacionPublicacion"]["evidencias"];
    expect(hasProjectPublicationAuthorization(base)).toBe(authorized);
    expect(getProjectPublicationIssues([base]).length === 0).toBe(authorized);
    for (const count of [0, 1, 2]) {
      const project = { ...base, imagenes: Array.from({ length: count }, (_, i) => ({
        src: `fixture-${i}.webp`, alt: "Fixture", etapa: "resultado" as const,
      })) };
      for (const supplied of [0, 1, 2]) {
        const images = Object.fromEntries(Array.from({ length: supplied }, (_, i) => [
          `fixture-${i}.webp`, { src: `/fixture-${i}.webp`, width: 10, height: 10 },
        ]));
        expect(isPublicProject(project, images)).toBe(authorized && count > 0 && supplied >= count);
        expect(isLighthouseProject(project, images)).toBe(authorized && supplied >= count);
      }
    }
  });
});
