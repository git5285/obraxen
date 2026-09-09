import { describe, expect, it } from "vitest";
import { architectureCompany, architectureContactSchema, architectureQuickContactSchema, validateArchitecturePhotos } from "@/lib/architecture-content";

const valid = { name: "Consulta de prueba", email: "test@example.com", phone: "", city: "Málaga", country: "España", need: "Revisar una junta", company: "", area: "", deadline: "" };
describe("local architecture contact", () => {
  it.each(["test@example.com", "+34 600 123 456", "600123456"])("accepts a three-field first contact via %s", contact => {
    expect(architectureQuickContactSchema.safeParse({ name: "Prueba", contact, need: "Revisar una junta" }).success).toBe(true);
  });
  it.each(["", " ", "correo-invalido", "123", "+", "600<script>123456", "1234567890123456"])("rejects invalid combined contact %s", contact => {
    expect(architectureQuickContactSchema.safeParse({ name: "Prueba", contact, need: "Revisar una junta" }).success).toBe(false);
  });
  it("validates required short-form fields and text limits without inventing location data", () => {
    const quick = { name: "Prueba", contact: "test@example.com", need: "Revisar una junta" };
    expect(architectureQuickContactSchema.parse(quick)).toEqual(quick);
    for (const field of ["name", "need"]) expect(architectureQuickContactSchema.safeParse({ ...quick, [field]: " " }).success).toBe(false);
    expect(architectureQuickContactSchema.safeParse({ ...quick, need: "x".repeat(2001) }).success).toBe(false);
    expect(architectureQuickContactSchema.safeParse({ ...quick, contact: "x".repeat(255) }).success).toBe(false);
  });
  it("accepts either email or phone, never requires both", () => {
    expect(architectureContactSchema.safeParse(valid).success).toBe(true);
    expect(architectureContactSchema.safeParse({ ...valid, email: "", phone: "+34 600 123 456" }).success).toBe(true);
    expect(architectureContactSchema.safeParse({ ...valid, email: "", phone: "" }).success).toBe(false);
  });
  it.each(["name", "city", "country", "need"])("rejects whitespace in %s", field => {
    expect(architectureContactSchema.safeParse({ ...valid, [field]: "  " }).success).toBe(false);
  });
  it.each(["abc", "+", "123", "1234567890123456", "600<script>123456"])("rejects invalid phone %s", phone => {
    expect(architectureContactSchema.safeParse({ ...valid, email: "", phone }).success).toBe(false);
  });
  it("rejects malformed email and overlong input", () => {
    expect(architectureContactSchema.safeParse({ ...valid, email: "invalid" }).success).toBe(false);
    expect(architectureContactSchema.safeParse({ ...valid, need: "x".repeat(2001) }).success).toBe(false);
  });
  it("keeps optional metadata optional and validates selected photos without reading them", () => {
    expect(validateArchitecturePhotos([])).toBe("");
    expect(validateArchitecturePhotos([{ type: "image/webp", size: 1024 }])).toBe("");
    expect(validateArchitecturePhotos(Array(6).fill({ type: "image/png", size: 100 }))).not.toBe("");
    expect(validateArchitecturePhotos([{ type: "image/png", size: 11 * 1024 * 1024 }])).not.toBe("");
    expect(validateArchitecturePhotos([{ type: "image/svg+xml", size: 100 }])).not.toBe("");
  });
  it("keeps confirmed declarations distinct from readiness to publish", () => {
    expect(architectureCompany.response).toContain("24 horas laborables");
    expect(architectureCompany.phoneTemporary).toBe(true);
    expect(architectureCompany.postalCode).toBeNull();
    expect(architectureCompany.whatsappHref).toBe("https://wa.me/34653916970");
    expect(architectureCompany.experience).toContain("Algunas personas");
  });
  it.each([
    ["name", 100], ["city", 100], ["country", 100], ["need", 2000],
    ["company", 150], ["area", 100], ["deadline", 150], ["email", 254], ["phone", 30],
  ] as const)("gives a Spanish length limit for %s beyond %s", (field, max) => {
    const result = architectureContactSchema.safeParse({ ...valid, [field]: "x".repeat(max + 1) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual([field]);
      expect(result.error.issues[0].message).toContain(`${max} caracteres`);
    }
  });
  it("preserves Unicode names and descriptions at the exact limits", () => {
    const quick = { name: "Áمرحبا界🙂".repeat(5), contact: "demo@example.invalid", need: "界".repeat(2000) };
    expect(architectureQuickContactSchema.parse(quick)).toEqual(quick);
    const result = architectureQuickContactSchema.safeParse({ ...quick, need: `${quick.need}x` });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toContain("2000 caracteres");
    expect(validateArchitecturePhotos([{ type: "image/jpeg", size: 0 }])).not.toBe("");
    expect(validateArchitecturePhotos([{ type: "image/jpeg", size: 10 * 1024 * 1024 }])).toBe("");
  });
});
