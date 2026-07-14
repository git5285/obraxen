import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import {
  PublicationConfigurationError,
  buildRobotsPolicy,
  getPublicationState,
} from "@/lib/publication";
import type { Brand } from "@/lib/schemas";

const publicBrand: Brand = {
  ...brand,
  nombre: "Marca validada",
  nombreLegal: "Sociedad validada, S.L.",
  cif: "B00000000",
  empresaConstituida: true,
  dominio: "example.com",
  email: "contacto@example.com",
  telefono: "+34 900 000 000",
  legalRevisionAprobada: true,
  publicar: true,
};

describe("publication gate", () => {
  it("keeps the current project in closed preview", () => {
    const state = getPublicationState(brand);
    expect(state.mode).toBe("preview");
    expect(state.robots).toBe("noindex,nofollow");
    expect(buildRobotsPolicy(brand)).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("allows publication only with complete validated identity", () => {
    expect(getPublicationState(publicBrand)).toMatchObject({
      mode: "public",
      isPublic: true,
      issues: [],
    });
  });

  it("fails closed if publicar is enabled with missing business data", () => {
    expect(() => getPublicationState({ ...brand, publicar: true })).toThrow(
      PublicationConfigurationError,
    );
  });
});
