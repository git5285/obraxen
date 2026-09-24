import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

describe("ESLint generated Next output isolation", () => {
  it("ignores generated .next output at the root and in candidates", async () => {
    await expect(eslint.isPathIgnored(".next/server/app/page.js")).resolves.toBe(true);
    await expect(eslint.isPathIgnored(
      ".vercel/candidates/example/.next/server/app/page.js",
    )).resolves.toBe(true);
  }, 10_000);

  it("keeps canonical and candidate source files in lint scope", async () => {
    await expect(eslint.isPathIgnored("src/lib/dictionaries/en.ts")).resolves.toBe(false);
    await expect(eslint.isPathIgnored(
      ".vercel/candidates/example/src/lib/dictionaries/en.ts",
    )).resolves.toBe(false);
  });

  it.each([
    ".vercel/output/static/_next/static/chunks/generated.js",
    ".vercel/output/functions/index.func/___next_launcher.cjs",
    ".vercel/home-prod-example/.vercel/output/functions/de.rsc.func/apps/public-site/___next_launcher.cjs",
    ".vercel/candidates/example/.vercel/output/static/generated.js",
  ])("ignores Vercel build output: %s", async (path) => {
    await expect(eslint.isPathIgnored(path)).resolves.toBe(true);
  });

  it.each([
    "scripts/verify-public-site.mjs",
    "apps/public-site/app/route.js",
    ".vercel/candidates/example/apps/public-site/app/route.js",
    ".vercel/home-prod-example/apps/public-site/app/route.js",
  ])("continues checking source code alongside generated output: %s", async (path) => {
    await expect(eslint.isPathIgnored(path)).resolves.toBe(false);
  });
});
