import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EXTENSION_STUB, PATCHES, patchBundles } from "../scripts/patch-vercel-bundles.mjs";

const temporary: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "obraxen-bundles-"));
  temporary.push(root);
  const files = ["node_modules/vercel/package.json", "node_modules/path-to-regexp/package.json",
    ...PATCHES.map(p => "node_modules/vercel/dist/chunks/" + p.file)];
  for (const file of files) { mkdirSync(dirname(join(root, file)), { recursive: true }); copyFileSync(file, join(root, file)); }
  return root;
}
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("reviewed Vercel bundle remediation", () => {
  it("verifies the installed CLI and remains idempotent", () => {
    expect(patchBundles(process.cwd()).changed).toBe(0);
    expect(patchBundles(fixture(), "apply").changed).toBe(0);
  });
  it("rejects an unknown bundle before writing any file", () => {
    const root = fixture();
    const extension = join(root, "node_modules/vercel/dist/chunks/" + PATCHES[0].file);
    writeFileSync(extension, "unexpected upstream content");
    const parser = join(root, "node_modules/vercel/dist/chunks/" + PATCHES[1].file);
    const before = readFileSync(parser);
    expect(() => patchBundles(root, "apply")).toThrow("Unreviewed bundle");
    expect(readFileSync(parser)).toEqual(before);
  });
  it("rejects changed package versions", () => {
    const root = fixture();
    writeFileSync(join(root, "node_modules/vercel/package.json"), '{"version":"60.0.0"}');
    expect(() => patchBundles(root, "apply")).toThrow("new bundle review");
  });
  it("rejects symlinked bundle targets", () => {
    const root = fixture();
    const file = join(root, "node_modules/vercel/dist/chunks/" + PATCHES[0].file);
    rmSync(file);
    symlinkSync(resolve("node_modules/vercel/dist/chunks/" + PATCHES[0].file), file);
    expect(() => patchBundles(root, "apply")).toThrow("regular file");
  });
  it("blocks extensions before invoking any external command or client", async () => {
    const blocked = await import("data:text/javascript," + encodeURIComponent(EXTENSION_STUB));
    await expect(blocked.execExtension()).rejects.toThrow("extensions are disabled");
    const installed = readFileSync("node_modules/vercel/dist/chunks/" + PATCHES[0].file, "utf8");
    expect(installed).toBe(EXTENSION_STUB);
    expect(installed).not.toContain("undici");
  });
  it("uses the corrected parser through the actual bundled routing-utils", () => {
    const result = execFileSync(process.execPath, ["--input-type=module", "-e", `
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      const {require_dist} = await import('./node_modules/vercel/dist/chunks/chunk-7RMCBXBB.js');
      const embedded = require_dist().pathToRegexp('obraxen-security-test', '/:a-:b', []);
      const fixed = require('path-to-regexp').pathToRegexp('/:a-:b');
      if (embedded.source !== fixed.source || !embedded.source.includes('(?!-)')) throw Error('Unprotected parser');
      if (!embedded.test('/alpha-beta') || embedded.test('/alpha-beta/extra')) throw Error('Route semantics changed');
      console.log('corrected-routing-contract');
    `], { encoding: "utf8", timeout: 5000 });
    expect(result.trim()).toBe("corrected-routing-contract");
  });
  it("keeps installation, gate and source-only exports aware of the correction", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8"));
    expect(manifest.scripts.postinstall).toBe("node scripts/patch-vercel-bundles.mjs apply");
    expect(manifest.scripts["check:quality"]).toContain("node scripts/patch-vercel-bundles.mjs check &&");
    expect(manifest.scripts["precheck:security"]).toBe("node scripts/patch-vercel-bundles.mjs check");
    expect(readFileSync("scripts/prepare-home-candidate.mjs", "utf8")).toContain("'scripts/patch-vercel-bundles.mjs'");
  });
});
