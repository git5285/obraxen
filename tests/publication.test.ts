import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import { internalProjects } from "@/lib/internal-projects";
import {
  PublicationConfigurationError,
  buildRobotsPolicy,
  getPublicationState,
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

  it("allows publication only with complete validated identity", () => {
    expect(getPublicationState(publicBrand, publishableProjects)).toMatchObject({
      mode: "public",
      isPublic: true,
      issues: [],
    });
  });

  it("fails closed if publicar is enabled with missing business data", () => {
    expect(() => getPublicationState({ ...brand, publicar: true }, internalProjects)).toThrow(
      PublicationConfigurationError,
    );
  });

  it("does not promote a responsible declaration into a document or legal review", () => {
    expect(() => getPublicationState(publicBrand, internalProjects)).toThrow(
      PublicationConfigurationError,
    );
    const issues = getPublicationState({ ...publicBrand, publicar: false }, internalProjects).issues;
    expect(issues).toHaveLength(internalProjects.length * 2);
    expect(issues).toContain(
      `${internalProjects[0].slug}: falta un documento de autorización que cubra nombre y fotografías`,
    );
    expect(issues).toContain(
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

  it("blocks publication until the commercial name has professional clearance", () => {
    expect(() => getPublicationState({
      ...publicBrand,
      nombreRevisionAprobada: false,
    }, publishableProjects)).toThrow(PublicationConfigurationError);
  });

  it("requires a dedicated privacy address before publication", () => {
    expect(() => getPublicationState({
      ...publicBrand,
      emailPrivacidad: null,
    }, publishableProjects)).toThrow(PublicationConfigurationError);
  });
});
