import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { ensurePrivateDirectory } from "../../automation/agents/storage.mjs";

const roots: string[] = [];
function directory() {
  const root = mkdtempSync(join(tmpdir(), "obraxen-private-directory-"));
  roots.push(root);
  return join(root, "nested", "private");
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

it("creates nested private directories with owner-only permissions", () => {
  const path = directory();
  ensurePrivateDirectory(path);
  expect(statSync(path).isDirectory()).toBe(true);
  expect(statSync(path).mode & 0o777).toBe(0o700);
});

it("tightens an existing directory, even when mkdir does nothing", () => {
  const path = directory();
  mkdirSync(path, { recursive: true });
  chmodSync(path, 0o755);
  ensurePrivateDirectory(path);
  expect(statSync(path).mode & 0o777).toBe(0o700);
  ensurePrivateDirectory(path);
  expect(statSync(path).mode & 0o777).toBe(0o700);
});

it("propagates the filesystem error when the target is a file", () => {
  const root = mkdtempSync(join(tmpdir(), "obraxen-private-file-"));
  roots.push(root);
  const path = join(root, "file");
  writeFileSync(path, "unchanged");
  expect(() => ensurePrivateDirectory(path)).toThrow(expect.objectContaining({ code: "EEXIST" }));
  expect(statSync(path).isFile()).toBe(true);
});
