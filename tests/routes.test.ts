import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

const requiredRouteFiles = [
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/robots.ts",
  "src/components/site-navigation.tsx",
  "src/components/projects-section.tsx",
  "src/components/site-footer.tsx",
];

describe("foundation routes", () => {
  it.each(requiredRouteFiles)("defines %s", (path) => {
    expect(existsSync(resolve(path))).toBe(true);
  });

  it("serves a closed robots policy before publication", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });
});
