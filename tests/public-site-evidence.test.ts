import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertInventory, inventory, sha256, sourceFile, verifyRecovery, verifyServedInventory } from "../scripts/public-site-evidence.mjs";

const fixtures: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "obraxen-evidence-"));
  fixtures.push(root);
  mkdirSync(join(root, "assets"));
  writeFileSync(join(root, "assets", "old.js"), "original");
  return root;
}
afterEach(() => { for (const path of fixtures.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe("independent recovery and current-candidate evidence", () => {
  it("permits deliberate updates and includes new assets in destination parity", async () => {
    const root = fixture();
    const original = {deploymentId: "historical-only", files: inventory(root)};
    expect(verifyRecovery(root, original).result).toBe("passed");
    writeFileSync(join(root, "assets", "old.js"), "maintained");
    writeFileSync(join(root, "assets", "new.js"), "new");
    const current = inventory(root);
    expect(() => verifyRecovery(root, original)).toThrow("recovery");
    const request = async (input: string | URL | Request) => new Response(
      readFileSync(join(root, new URL(String(input)).pathname)),
    );
    expect(await verifyServedInventory("http://127.0.0.1:1234", current, request)).toHaveLength(2);
    expect(original.files).toHaveLength(1);
    expect(original.files[0].sha256).toBe(sha256("original"));
  });
  it("rejects a modified or missing current asset even when historical files match", async () => {
    const files = [{path: "assets/new.js", bytes: 3, sha256: sha256("new")}];
    await expect(verifyServedInventory("http://localhost", files, async () => new Response("old"))).rejects.toThrow("candidate asset differs");
    await expect(verifyServedInventory("http://localhost", files, async () => new Response("", { status: 404 }))).rejects.toThrow("asset status");
  });
  it("detects added, removed and altered inventory entries", () => {
    const files = inventory(fixture());
    expect(() => assertInventory(files, [...files])).not.toThrow();
    expect(() => assertInventory(files, [])).toThrow();
    expect(() => assertInventory(files, [...files, {...files[0], path: "new"}])).toThrow();
    expect(() => assertInventory(files, [{...files[0], sha256: sha256("changed")}])).toThrow();
  });
  it("rejects traversal, symlinks and unresolved LFS pointers", () => {
    const root = fixture();
    expect(() => sourceFile(root, "../outside")).toThrow("unsafe");
    symlinkSync(join(root, "assets/old.js"), join(root, "link.js"));
    expect(() => inventory(root)).toThrow("symbolic");
    const pointerRoot = fixture();
    writeFileSync(join(pointerRoot, "assets/old.js"), "version https://git-lfs.github.com/spec/v1\noid sha256:abc\n");
    expect(() => inventory(pointerRoot)).toThrow("unresolved LFS");
  });
  it("checks SHA-1 provenance independently and rejects duplicate history entries", () => {
    const root = fixture();
    const files = inventory(root);
    expect(() => verifyRecovery(root, {deploymentId: "original", files: [{...files[0], uid: "0".repeat(40)}]})).toThrow("recovery UID");
    expect(() => verifyRecovery(root, {deploymentId: "original", files: [...files, ...files]})).toThrow("duplicate");
  });
});
