import { describe, expect, it } from "vitest";
import brandSource from "../data/brand.json";
import projectsSource from "../data/proyectos.json";
import { brandSchema, projectSchema } from "@/lib/schemas";

const locales = ["en", "de", "es", "fr"] as const;
const dates = [
  ["2026-02-28", true],
  ["2024-02-29", true],
  ["2000-02-29", true],
  ["2400-02-29", true],
  ["2026-04-30", true],
  ["2026-02-29", false],
  ["1900-02-29", false],
  ["2100-02-29", false],
  ["2026-04-31", false],
  ["2026-13-01", false],
  ["2026-00-10", false],
  ["2026-01-00", false],
  ["2026-01-32", false],
  ["2026-2-03", false],
  ["2026-02-28T00:00:00Z", false],
  [" 2026-02-28 ", false],
  ["", false],
] as const;

describe.each(locales)("editorial calendar dates: %s", (locale) => {
  it.each(dates)("validates %s with expected acceptance %s", (date, accepted) => {
    const brand = brandSchema.parse(structuredClone(brandSource));
    brand.revisionTraducciones[locale] = {
      estado: "aprobada", revisor: "Test reviewer", fecha: date,
    };
    expect(brandSchema.safeParse(brand).success).toBe(accepted);
  });

  it("allows an unknown pending date but not an undated approval", () => {
    const brand = brandSchema.parse(structuredClone(brandSource));
    const review = { estado: "pendiente", revisor: null, fecha: null };
    const pending = { ...brand, revisionTraducciones: { ...brand.revisionTraducciones, [locale]: review } };
    expect(brandSchema.safeParse(pending).success).toBe(true);
    review.estado = "aprobada";
    expect(brandSchema.safeParse(pending).success).toBe(false);
    expect(brandSchema.safeParse({ ...pending, revisionTraducciones: {
      ...pending.revisionTraducciones, [locale]: { ...review, revisor: "Test reviewer" },
    } }).success).toBe(false);
  });

  it("does not allow impossible dates even while review is pending", () => {
    const brand = brandSchema.parse(structuredClone(brandSource));
    brand.revisionTraducciones[locale] = {
      estado: "pendiente", revisor: "Test reviewer", fecha: "2026-02-29",
    };
    expect(brandSchema.safeParse(brand).success).toBe(false);
  });
});

describe("execution dates are descriptive, not evidence dates", () => {
  it.each([null, "2026-02", "Between February and April 2026"])("preserves %s", (date) => {
    const project = projectSchema.parse(structuredClone(projectsSource[0]));
    project.cierre.fechaEjecucion = date;
    for (const locale of locales) project.traducciones[locale].fechaEjecucion = date;
    const result = projectSchema.parse(project);
    expect(result.cierre.fechaEjecucion).toBe(date);
    for (const locale of locales) expect(result.traducciones[locale].fechaEjecucion).toBe(date);
  });
});
