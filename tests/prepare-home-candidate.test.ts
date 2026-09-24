import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assertBuiltHome, candidateInputs, prepareHomeCandidate } from "../scripts/prepare-home-candidate.mjs";

vi.mock("node:child_process", async importOriginal => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return { ...actual, execFileSync: vi.fn(actual.execFileSync) };
});
const repo = fileURLToPath(new URL("../", import.meta.url));
const temporary: string[] = [];
function directory() {
  const root = mkdtempSync(join(tmpdir(), "obraxen-candidate-"));
  temporary.push(root);
  return root;
}
function fixture() {
  const root = directory();
  for (const input of candidateInputs(repo)) {
    const path = join(root, input.path);
    mkdirSync(dirname(path), {recursive: true});
    copyFileSync(join(repo, input.path), path);
  }
  return root;
}
function gitState(root: string, status = "", committedMismatch = false) {
  vi.mocked(execFileSync).mockImplementation(((_command: string, args: string[]) => {
    if (args[0] === "rev-parse") return "a".repeat(40);
    if (args[0] === "status") return status;
    if (args[0] === "show") return committedMismatch ? Buffer.from("not committed") : readFileSync(join(root, args[1].slice(41)));
    throw new Error("Unexpected subprocess: " + args.join(" "));
  }) as typeof execFileSync);
}
afterEach(() => {
  vi.mocked(execFileSync).mockReset();
  for (const path of temporary.splice(0)) rmSync(path, {recursive: true, force: true});
});

describe("Home-only preparation recipe", () => {
  it("inventories canonical inputs, excluding compiled Home, legacy and secrets", () => {
    const files = candidateInputs(repo).map(file => file.path);
    expect(files).toContain("apps/public-site/public/assets/home-contact.js");
    expect(files).toContain("scripts/home-contract.mjs");
    expect(files).toContain("scripts/scoped-command.mjs");
    expect(files.some(path => /^(src|data|\.coordination|\.github|\.vercel)\//.test(path))).toBe(false);
    expect(files.some(path => path.includes("generated-home-html") || path.includes(".next/") || path.includes(".env"))).toBe(false);
  });
  it("exports the same clean inputs reproducibly and never labels source-only as built", () => {
    const root = fixture();
    gitState(root);
    const parent = directory();
    const first = prepareHomeCandidate({repo: root, destination: join(parent, "first"), build: false});
    const second = prepareHomeCandidate({repo: root, destination: join(parent, "second"), build: false});
    expect(first.source.exactCommit).toBe("a".repeat(40));
    expect(first.source.inputsSha256).toBe(second.source.inputsSha256);
    expect(first.result).toBe("source-only");
    expect(first.build.result).toBe("not-run");
    expect(first.publicationAuthorized).toBe(false);
    expect(candidateInputs(join(parent, "first"))).toEqual(first.inputs);
    expect(existsSync(join(parent, "first", "src"))).toBe(false);
    const exported = JSON.parse(readFileSync(join(parent, "first", "package.json"), "utf8"));
    expect(exported.scripts.build).toContain("scripts/scoped-command.mjs build");
    expect(exported.scripts["build:home"]).toContain("scripts/public-site.mjs build");
    expect(readFileSync(join(parent, "first", "scripts/scoped-command.mjs"), "utf8")).toContain('"build": "build:home"');
    expect(existsSync(join(parent, "first", ".vercel/project.json"))).toBe(false);
  });
  it.each([[" M package.json", false], ["", true]])("requires explicit local-worktree mode for unconfirmed inputs", (status, mismatch) => {
    const root = fixture();
    gitState(root, status, mismatch);
    const destination = join(directory(), "export");
    expect(() => prepareHomeCandidate({repo: root, destination, build: false})).toThrow("dirty worktree");
    expect(existsSync(destination)).toBe(false);
    const result = prepareHomeCandidate({repo: root, destination, build: false, allowWorktree: true});
    expect(result.source.exactCommit).toBeNull();
    expect(result.source.dirty).toBe(true);
  });
  it("refuses existing destinations and output inside the checkout without changing files", () => {
    const root = directory();
    writeFileSync(join(root, "keep"), "unchanged");
    expect(() => prepareHomeCandidate({repo, destination: root, build: false})).toThrow("must not exist");
    expect(readFileSync(join(root, "keep"), "utf8")).toBe("unchanged");
    expect(() => prepareHomeCandidate({repo, destination: join(repo, "candidate"), build: false})).toThrow("outside");
  });
  it("checks built route scope and the actual rendered HTML, not just build exit status", () => {
    const root = directory();
    const app = join(root, "apps/public-site");
    mkdirSync(join(app, ".next/server/app"), {recursive: true});
    mkdirSync(join(app, "public"));
    writeFileSync(join(app, "public/index.html"), "canonical");
    const manifestPath = join(app, ".next/server/app-paths-manifest.json");
    writeFileSync(manifestPath, JSON.stringify({"/route": "x", "/en/route": "x", "/de/route": "x", "/_not-found/page": "x"}));
    for (const route of ["index", "en", "de"]) writeFileSync(join(app, ".next/server/app", route + ".body"), "canonical");
    expect(assertBuiltHome(root).result).toBe("passed");
    writeFileSync(join(app, ".next/server/app/en.body"), "stale");
    expect(() => assertBuiltHome(root)).toThrow("built HTML differs");
    writeFileSync(manifestPath, JSON.stringify({"/route": "x", "/api/contact/route": "x"}));
    expect(() => assertBuiltHome(root)).toThrow("unexpected routes");
  });
});
