import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import {
  buildContactEmail,
  contactSubmissionSchema,
  resolveContactConfig,
} from "@/lib/contact";
import type { Brand } from "@/lib/schemas";

const publicIdentity: Brand = {
  ...brand,
  nombre: "Validated brand",
  nombreRevisionAprobada: true,
  nombreLegal: "Validated company, S.L.",
  cif: "B00000000",
  empresaConstituida: true,
  dominio: "example.com",
  direccion: "Validated address",
  email: "contact@example.com",
  emailPrivacidad: "privacy@example.com",
  telefono: "+34 900 000 000",
  legalRevisionAprobada: true,
  formularioRevisionAprobada: true,
};

const environment = {
  CONTACT_FORM_ENABLED: "true",
  CONTACT_RATE_LIMIT_MODE: "vercel-waf",
  RESEND_API_KEY: `re_${"1".repeat(30)}`,
  CONTACT_TO_EMAIL: "contact@example.com",
  CONTACT_FROM_EMAIL: "web@example.com",
};

describe("contact capture gate", () => {
  it("stays closed for the current incomplete identity", () => {
    expect(resolveContactConfig(environment).enabled).toBe(false);
  });

  it("accepts a coherent provider configuration only after legal and abuse-control readiness", () => {
    expect(resolveContactConfig(environment, publicIdentity)).toEqual({
      enabled: true,
      apiKey: environment.RESEND_API_KEY,
      toEmail: environment.CONTACT_TO_EMAIL,
      fromEmail: environment.CONTACT_FROM_EMAIL,
      rateLimitMode: "vercel-waf",
      issues: [],
    });
  });

  it("stays closed until external rate limiting is explicitly accredited", () => {
    const config = resolveContactConfig({
      ...environment,
      CONTACT_RATE_LIMIT_MODE: undefined,
    }, publicIdentity);
    expect(config.enabled).toBe(false);
    expect(config.rateLimitMode).toBeNull();
    expect(config.issues).toContain("CONTACT_RATE_LIMIT_MODE debe acreditar vercel-waf");
  });

  it("stays closed until the commercial name has professional clearance", () => {
    const config = resolveContactConfig(environment, {
      ...publicIdentity,
      nombreRevisionAprobada: false,
    });
    expect(config.enabled).toBe(false);
    expect(config.issues).toContain("falta la revisión registral y marcaria del nombre");
  });

  it("stays closed when the delivery recipient differs from the public contact", () => {
    const config = resolveContactConfig({
      ...environment,
      CONTACT_TO_EMAIL: "other@example.com",
    }, publicIdentity);

    expect(config.enabled).toBe(false);
    expect(config.issues).toContain("CONTACT_TO_EMAIL no coincide con brand.email");
  });

  it("stays closed when the verified domain or provider identity is incomplete", () => {
    const missingDomain = resolveContactConfig(environment, {
      ...publicIdentity,
      dominio: null,
    });
    expect(missingDomain.enabled).toBe(false);
    expect(missingDomain.issues).toContain("falta el dominio definitivo");

    const wrongProvider = resolveContactConfig(environment, {
      ...publicIdentity,
      formularioProveedor: "Other provider",
    });
    expect(wrongProvider.enabled).toBe(false);
    expect(wrongProvider.issues).toContain("el proveedor de formulario no coincide con Resend");
  });

  it("validates bounded lead data and omits field content from attribution", () => {
    const submission = contactSubmissionSchema.parse({
      locale: "de",
      name: "Erika Muster",
      email: "erika@example.org",
      company: "Muster GmbH",
      country: "Deutschland",
      phone: "",
      message: "Beschädigte Fugen in einer betriebenen Logistikhalle.",
      consent: true,
      website: "",
      startedAt: Date.now() - 5_000,
      source: "/de/kontakt/",
      utm: { source: "industry-newsletter" },
    });
    const email = buildContactEmail(submission);
    expect(email).toContain("Muster GmbH");
    expect(email).toContain("industry-newsletter");
    const noAttribution = contactSubmissionSchema.parse({ ...submission, utm: undefined });
    expect(buildContactEmail(noAttribution)).toContain("sin atribución UTM");
    expect(contactSubmissionSchema.safeParse({ ...submission, website: "spam" }).success).toBe(false);
  });

  it("rejects critical form validation bypasses", () => {
    const valid = {
      locale: "en" as const,
      name: "Alex Example",
      email: "alex@example.org",
      company: "Example GmbH",
      country: "Germany",
      phone: "",
      message: "Damaged joints in an operating logistics facility.",
      consent: true as const,
      website: "",
      startedAt: 1_750_000_000_000,
      source: "/en/contact/",
      utm: { source: "quality-test" },
    };

    const candidates = [
      { ...valid, locale: "pt" },
      { ...valid, consent: false },
      { ...valid, message: "too short" },
      { ...valid, unexpected: "field" },
      { ...valid, utm: { unexpected: "field" } },
    ];

    for (const candidate of candidates) {
      expect(contactSubmissionSchema.safeParse(candidate).success).toBe(false);
    }
  });
});
