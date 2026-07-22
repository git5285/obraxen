import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  canonicalDependencyTree,
  createRuntimeFingerprint,
  inspectRuntime,
  readRuntimeContract,
} from "../../automation/agents/runtime.mjs";

const roots: string[] = [];
const dependencyDigest = "d".repeat(64);

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "obraxen-runtime-"));
  roots.push(root);
  writeFileSync(join(root, ".nvmrc"), "24.18.0\n");
  writeFileSync(join(root, "package.json"), JSON.stringify({
    engines: { node: "24.18.0" },
    packageManager: "npm@11.16.0",
  }));
  writeFileSync(join(root, "package-lock.json"), "{}\n");
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("pinned agent runtime", () => {
  it("requires exact matching Node and npm pins", () => {
    const root = fixture();
    expect(readRuntimeContract(root)).toMatchObject({
      nodeVersion: "24.18.0",
      npmVersion: "11.16.0",
    });

    writeFileSync(join(root, ".nvmrc"), "24\n");
    expect(() => readRuntimeContract(root)).toThrow("exact Node.js version");
  });

  it("canonicalizes dependency order before computing a stable fingerprint", () => {
    const left = canonicalDependencyTree({
      dependencies: { zeta: { version: "2.0.0" }, alpha: { version: "1.0.0" } },
    });
    const right = canonicalDependencyTree({
      dependencies: { alpha: { version: "1.0.0" }, zeta: { version: "2.0.0" } },
    });
    expect(left).toEqual(right);
    expect(createRuntimeFingerprint({
      nodeVersion: "24.18.0",
      npmVersion: "11.16.0",
      platform: "darwin",
      arch: "arm64",
      lockfileSha256: "a".repeat(64),
      dependencyTreeSha256: "b".repeat(64),
    })).toMatch(/^[0-9a-f]{64}$/);
  });

  it("fails closed when either runtime version differs", () => {
    const options = {
      dependencies: { valid: true, problems: [], digest: dependencyDigest, error: null },
      native: { valid: true, error: null },
      platform: "darwin",
      arch: "arm64",
    };
    const valid = inspectRuntime(fixture(), {
      ...options,
      nodeVersion: "24.18.0",
      npmVersion: "11.16.0",
    });
    expect(valid.ok).toBe(true);
    expect(valid.fingerprint).toMatch(/^[0-9a-f]{64}$/);

    const drift = inspectRuntime(fixture(), {
      ...options,
      nodeVersion: "26.5.0",
      npmVersion: "12.0.0",
    });
    expect(drift).toMatchObject({
      ok: false,
      fingerprint: null,
      blockers: ["node_version_mismatch", "npm_version_mismatch"],
    });
  });
});
