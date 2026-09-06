import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import { publicActivation, validatePublicActivation } from "@/lib/public-activation";
import { buildPublicRobotsPolicy, getPublicPublicationState } from "@/lib/publication";
import type { Brand } from "@/lib/schemas";

const completeBrand: Brand = {
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

describe("public activation approval", () => {
  it("keeps the committed public activation fail-closed", () => {
    expect(publicActivation).toMatchObject({ approved: false, activationDigest: null, approvedAt: null, decisionId: null });
    expect(getPublicPublicationState(completeBrand, publicActivation)).toMatchObject({ isPublic: false, robots: "noindex,nofollow" });
    expect(buildPublicRobotsPolicy(completeBrand, publicActivation)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("requires a typed external decision before public indexing", () => {
    const approval = validatePublicActivation({
      schemaVersion: 1,
      approved: true,
      activationDigest: "a".repeat(64),
      approvedAt: "2026-09-02T08:00:00Z",
      decisionId: "activation-go-001",
    });
    expect(getPublicPublicationState(completeBrand, approval)).toMatchObject({ isPublic: true, robots: "index,follow" });
    expect(() => validatePublicActivation({ ...approval, activationDigest: null })).toThrow("requires typed evidence");
  });
});
