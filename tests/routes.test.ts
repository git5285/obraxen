import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const requiredRouteFiles = [
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/(legal)/aviso-legal/page.tsx",
  "src/app/(legal)/privacidad/page.tsx",
  "src/components/site-navigation.tsx",
  "src/components/projects-section.tsx",
  "src/components/site-footer.tsx",
  "src/app/proyectos/page.tsx",
  "src/app/proyectos/[slug]/page.tsx",
  "src/components/project-card.tsx",
  "src/components/project-case.tsx",
];

describe("foundation routes", () => {
  it.each(requiredRouteFiles)("defines %s", (path) => {
    expect(existsSync(resolve(path))).toBe(true);
  });

  it("serves a closed robots policy before publication", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
    expect(sitemap()).toEqual([]);
  });
});
