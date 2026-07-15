import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import { projects } from "@/lib/projects";
import {
  PublicationConfigurationError,
  buildRobotsPolicy,
  getPublicationState,
} from "@/lib/publication";
import type { Brand, Project } from "@/lib/schemas";

const publicBrand: Brand = {
  ...brand,
  nombre: "Marca validada",
  nombreLegal: "Sociedad validada, S.L.",
  cif: "B00000000",
  empresaConstituida: true,
  dominio: "example.com",
  direccion: "Domicilio validado",
  email: "contacto@example.com",
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

const documentedProjects: readonly Project[] = projects.map((project) => ({
  ...project,
  autorizacionPublicacion: {
    estado: "documentada",
    alcanceDeclarado: ["nombre_cliente", "fotografias_web"],
    fuente: "Autorización de prueba",
    confirmadoEl: "2026-07-14",
    referenciaDocumento: `AUTH-${project.referencia}`,
    revisionLegal: "aprobada",
  },
}));

describe("publication gate", () => {
  it("keeps the current project in closed preview", () => {
    const state = getPublicationState(brand, projects);
    expect(state.mode).toBe("preview");
    expect(state.robots).toBe("noindex,nofollow");
    expect(buildRobotsPolicy(brand, projects)).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("allows publication only with complete validated identity", () => {
    expect(getPublicationState(publicBrand, documentedProjects)).toMatchObject({
      mode: "public",
      isPublic: true,
      issues: [],
    });
  });

  it("fails closed if publicar is enabled with missing business data", () => {
    expect(() => getPublicationState({ ...brand, publicar: true }, projects)).toThrow(
      PublicationConfigurationError,
    );
  });

  it("blocks publication while client names and photographs lack documentary support", () => {
    expect(() => getPublicationState(publicBrand, projects)).toThrow(
      PublicationConfigurationError,
    );
  });

  it("blocks publication until every locale and the capture provider are approved", () => {
    expect(() => getPublicationState({
      ...publicBrand,
      revisionTraducciones: brand.revisionTraducciones,
    }, documentedProjects)).toThrow(PublicationConfigurationError);
    expect(() => getPublicationState({
      ...publicBrand,
      formularioRevisionAprobada: false,
    }, documentedProjects)).toThrow(PublicationConfigurationError);
  });
});
