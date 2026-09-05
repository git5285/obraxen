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
});
