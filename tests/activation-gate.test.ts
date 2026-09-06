import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPublicationIssues } from "@/lib/publication";
import { brandSchema, projectsSchema } from "@/lib/schemas";

describe("phase 6.7 executable activation gate", () => {
  it("reports the same blockers as the publication source of truth", () => {
    const brand = brandSchema.parse(JSON.parse(readFileSync("data/brand.json", "utf8")));
    const projects = projectsSchema.parse(JSON.parse(readFileSync("data/proyectos.json", "utf8")));
    const expectedIssues = getPublicationIssues(brand, projects);
    const result = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "scripts/check-activation.mjs", "--json"],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.stderr).toBe("");
    expect(result.status).toBe(expectedIssues.length === 0 ? 0 : 1);

    const report = JSON.parse(result.stdout) as {
      schemaVersion: number;
      decision: string;
      candidateAuditRequired: boolean;
      publicationAuthorized: boolean;
      blockerCount: number;
      blockers: string[];
    };

    expect(report).toMatchObject({
      schemaVersion: 1,
      decision: expectedIssues.length === 0 ? "READY_FOR_PROTECTED_CANDIDATE" : "NO-GO",
      candidateAuditRequired: true,
      publicationAuthorized: false,
      blockerCount: expectedIssues.length,
      blockers: expectedIssues,
    });
  });

  it("blocks only on legal, Resend and professional locale reviews", () => {
    const brand = brandSchema.parse(JSON.parse(readFileSync("data/brand.json", "utf8")));
    const projects = projectsSchema.parse(JSON.parse(readFileSync("data/proyectos.json", "utf8")));
    const issues = getPublicationIssues(brand, projects);

    expect(issues).toEqual([
      "la revisión legal debe estar aprobada antes de publicar",
      "el proveedor de captación y su tratamiento deben estar aprobados antes de publicar",
      "la traducción en necesita revisión profesional aprobada",
      "la traducción de necesita revisión profesional aprobada",
      "la traducción es necesita revisión profesional aprobada",
      "la traducción fr necesita revisión profesional aprobada",
    ]);
  });
});
