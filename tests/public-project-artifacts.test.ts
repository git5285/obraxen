import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const publicModules = [
  "src/app/[lang]/layout.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/lib/homepage.ts",
  "src/lib/project-pages.ts",
  "src/lib/projects.ts",
];

describe("public project artifact boundary", () => {
  it("keeps the internal project dataset out of modules used by public routes", () => {
    for (const path of publicModules) {
      const source = readFileSync(path, "utf8");
      expect(source).not.toContain("data/proyectos.json");
      expect(source).not.toContain("internal-projects");
    }
  });

  it("keeps the public registry explicit while no case has approved assets", () => {
    const source = readFileSync("src/lib/projects.ts", "utf8");
    expect(source).toContain("publicProjects: readonly Project[] = []");
  });
});
