import { describe, expect, it } from "vitest";
import { offers } from "@/lib/offers";
import { projects, projectsBySlug } from "@/lib/projects";

describe("structured data", () => {
  it("keeps project and offer slugs unique", () => {
    expect(new Set(projects.map(({ slug }) => slug)).size).toBe(projects.length);
    expect(new Set(offers.map(({ slug }) => slug)).size).toBe(offers.length);
  });

  it("references only validated public projects from offers", () => {
    for (const offer of offers) {
      for (const evidence of offer.evidencia) {
        expect(projectsBySlug.has(evidence.proyecto)).toBe(true);
      }
    }
  });

  it("does not publish internal offer drafts", () => {
    expect(offers.every(({ estadoPublicacion }) => estadoPublicacion !== "publicable"))
      .toBe(true);
  });
});
