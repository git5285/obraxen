import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import { internalProjects } from "@/lib/internal-projects";
import {
  PublicationConfigurationError,
  buildRobotsPolicy,
  getPublicationIssues,
  getPublicationState,
  getPublicationWarnings,
} from "@/lib/publication";
import type { Brand, Project } from "@/lib/schemas";

const publicBrand: Brand = {
  ...brand,
  nombre: "Marca validada",
  nombreRevisionAprobada: true,
  nombreLegal: "Sociedad validada, S.L.",
  cif: "B00000000",
  empresaConstituida: true,
  dominio: "example.com",
  direccion: "Domicilio validado",
  email: "contacto@example.com",
  emailPrivacidad: "privacidad@example.com",
  telefono: "+34 900 000 000",
  legalRevisionAprobada: true,
  formularioRevisionAprobada: true,
  revisionTraducciones: {
    en: { estado: "aprobada", revisor: "EN reviewer", fecha: "2026-07-15" },
    de: { estado: "aprobada", revisor: "DE reviewer", fecha: "2026-07-15" },
    es: { estado: "aprobada", revisor: "ES reviewer", fecha: "2026-07-15" },
    fr: { estado: "aprobada", revisor: "FR reviewer", fecha: "2026-07-15" },
  },
  publicar: true,
};

const publishableProjects: readonly Project[] = internalProjects.map((project) => {
  const documentReference = `AUTH-DOC-TEST-${project.referencia}`;

  return {
    ...project,
    autorizacionPublicacion: {
      evidencias: [
        ...project.autorizacionPublicacion.evidencias,
        {
          tipo: "documento_referenciado",
          alcance: ["nombre_cliente", "fotografias_web"],
          entidadAutorizante: "Entidad autorizante de prueba",
          emitidoEl: "2026-07-17",
          referenciaDocumento: documentReference,
        },
        {
          tipo: "revision_legal_verificada",
          documentoRevisado: documentReference,
          revisor: "Revisor legal de prueba",
          revisadoEl: "2026-07-17",
          referenciaRevision: `LEGAL-REVIEW-TEST-${project.referencia}`,
          resultado: "aprobada",
        },
      ],
    },
  };
});

describe("publication gate", () => {
  it("keeps the current project in closed preview", () => {
    const state = getPublicationState(brand, internalProjects);
    expect(state.mode).toBe("preview");
    expect(state.robots).toBe("noindex,nofollow");
    expect(buildRobotsPolicy(brand, internalProjects)).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("allows publication when legal, Resend and every locale are approved", () => {
    expect(getPublicationState(publicBrand, internalProjects)).toMatchObject({
      mode: "public",
      isPublic: true,
      issues: [],
      warnings: expect.arrayContaining([
        `${internalProjects[0].slug}: falta un documento de autorización que cubra nombre y fotografías`,
      ]),
    });
  });

  it("uses the same approved project evidence criterion for publication warnings", () => {
    expect(getPublicationWarnings(publicBrand, publishableProjects)).not.toContain(
      `${publishableProjects[0].slug}: falta una revisión legal verificada del documento de autorización`,
    );
  });

  it("keeps business-readiness gaps visible without blocking activation", () => {
    expect(getPublicationIssues(publicBrand, internalProjects)).toEqual([]);
    const warnings = getPublicationWarnings({
      ...publicBrand,
      nombreRevisionAprobada: false,
      nombreLegal: null,
    }, internalProjects);
    expect(warnings).toContain("brand.nombreLegal no está informado");
    expect(warnings).toContain(
      "el nombre comercial no tiene revisión registral y marcaria acreditada",
    );
    expect(warnings).toContain(
      `${internalProjects[0].slug}: falta un documento de autorización que cubra nombre y fotografías`,
    );
    expect(warnings).toContain(
      `${internalProjects[0].slug}: falta una revisión legal verificada del documento de autorización`,
    );
  });

  it("blocks publication until every locale and the capture provider are approved", () => {
    expect(() => getPublicationState({
      ...publicBrand,
      revisionTraducciones: brand.revisionTraducciones,
    }, publishableProjects)).toThrow(PublicationConfigurationError);
    expect(() => getPublicationState({
      ...publicBrand,
      formularioRevisionAprobada: false,
    }, publishableProjects)).toThrow(PublicationConfigurationError);
  });

  it("does not make naming clearance an activation blocker", () => {
    expect(getPublicationState({
      ...publicBrand,
      nombreRevisionAprobada: false,
    }, publishableProjects)).toMatchObject({ mode: "public", issues: [] });
  });

  it("reports missing public identity fields as warnings", () => {
    expect(getPublicationState({
      ...publicBrand,
      emailPrivacidad: null,
    }, publishableProjects)).toMatchObject({ mode: "public", issues: [] });
    expect(getPublicationWarnings({
      ...publicBrand,
      emailPrivacidad: null,
    }, publishableProjects)).toContain("brand.emailPrivacidad no está informado");
  });
});
