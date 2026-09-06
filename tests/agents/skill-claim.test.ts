import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkClaim } from "../../.agents/skills/obraxen-continuous-improvement/scripts/check-claim.mjs";
import { registerOperationalClaim } from "../../automation/agents/operations.mjs";

const roots: string[] = [];
const source = ".coordination/claims/fixture-owner.md";
const expected = { threadId: "fixture-owner", files: ["fixture.txt", "notes/example.md"] };
const marker = "# Fixture\n- thread_id: fixture-owner\n- estado: reservado\n- archivos:\n  - fixture.txt\n  - notes/example.md\n";
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

describe("skill claim precheck", () => {
  it("uses the real parser and accepts the repository template without writing", () => {
    expect(checkClaim(marker, source, expected)).toMatchObject({ valid: true, ...expected });
    expect(checkClaim(marker.replaceAll("\n", "\r\n"), source, expected).valid).toBe(true);
  });
  it("detects the observed missing metadata bullets before registration", () => {
    expect(() => checkClaim(marker.replace("- thread_id:", "thread_id:"), source, expected)).toThrow("thread_id");
    expect(() => checkClaim(marker.replace("- estado:", "estado:"), source, expected)).toThrow("estado");
  });
  it("detects truncated file lists, different scope and duplicates", () => {
    expect(() => checkClaim(marker.replace("  - notes/", "- notes/"), source, expected)).toThrow("scope");
    expect(() => checkClaim(marker, source, { ...expected, files: ["fixture.txt"] })).toThrow("scope");
    expect(() => checkClaim(`${marker}  - fixture.txt\n`, source, expected)).toThrow("Duplicate");
  });
  it("rejects unsafe paths, malformed expectations and changed identity", () => {
    for (const files of [["../outside.txt"], ["src/**"], ["fixture.txt", "fixture.txt"], [], [42]]) {
      expect(() => checkClaim(marker, source, { ...expected, files })).toThrow();
    }
    expect(() => checkClaim(marker, "../claim.md", expected)).toThrow("source");
    expect(() => checkClaim(marker, source, { ...expected, threadId: "different-owner" })).toThrow("thread_id");
    expect(() => checkClaim(marker, source, null)).toThrow("threadId");
  });
  it("rejects duplicate metadata and non-initial state rather than repairing it", () => {
    expect(() => checkClaim(`${marker}- estado: reservado\n`, source, expected)).toThrow("estado");
    expect(() => checkClaim(marker.replace("reservado", "liberado"), source, expected)).toThrow("never rewrite");
  });
  it("produces a digest accepted by actual registration in an isolated state", () => {
    const root = mkdtempSync(join(tmpdir(), "obraxen-claim-check-"));
    roots.push(root);
    const repo = join(root, "repo");
    mkdirSync(join(repo, ".coordination/claims"), { recursive: true });
    execFileSync("git", ["-C", repo, "init", "-q"]);
    execFileSync("git", ["-C", repo, "remote", "add", "origin", "https://example.invalid/claim-test.git"]);
    writeFileSync(join(repo, source), marker);
    const result = checkClaim(marker, source, expected);
    const registration = registerOperationalClaim({ repo, stateHome: join(root, "state"), claimPath: source,
      eventId: "fixture-register", occurredAt: new Date().toISOString() });
    expect(registration.event.claim.contentDigest).toBe(result.contentDigest);
    expect(readFileSync(join(repo, source), "utf8")).toBe(marker);
  });
  it("CLI rejects a malformed draft without modifying it or registering anything", () => {
    const root = mkdtempSync(join(tmpdir(), "obraxen-claim-cli-"));
    roots.push(root);
    mkdirSync(join(root, ".coordination/claims"), { recursive: true });
    const malformed = marker.replace("- thread_id:", "thread_id:");
    writeFileSync(join(root, source), malformed);
    writeFileSync(join(root, "scope.json"), JSON.stringify(expected));
    const cli = resolve(".agents/skills/obraxen-continuous-improvement/scripts/check-claim.mjs");
    const result = spawnSync(process.execPath, [cli, source, "scope.json"], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("thread_id");
    expect(readFileSync(join(root, source), "utf8")).toBe(malformed);
  });
});
