import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { candidateDigest, environmentDigest, FRESH_CHECKS, LOCAL_CHECKS, reusableReceipt, runQuality, treeDigest } from "../../scripts/quality-gate.mjs";

const roots: string[] = [];
function fixture() {
  const repo = mkdtempSync(join(tmpdir(), "obraxen-quality-"));
  roots.push(repo);
  return { repo, receiptPath: join(repo, "receipt.json"), contentSnapshot: () => "fixture-inputs" };
}
afterEach(() => roots.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));

describe("local quality evidence reuse", () => {
  it("runs unit tests once with coverage and keeps browsers fresh", () => {
    const options = { ...fixture(), snapshot: () => "same-inputs", now: () => 1000 };
    const calls: string[] = [];
    const run = (check: string) => { calls.push(check); };
    expect(runQuality({ ...options, run }).reused).toBe(false);
    expect(calls).toEqual([...LOCAL_CHECKS, ...FRESH_CHECKS]);
    expect(calls.filter((check) => check === "test:coverage")).toHaveLength(1);
    expect(calls).not.toContain("test");
    calls.length = 0;
    expect(runQuality({ ...options, reuse: true, run, now: () => 2000 }).reused).toBe(true);
    expect(calls).toEqual(FRESH_CHECKS);
    expect(JSON.parse(readFileSync(options.receiptPath, "utf8")).checkedAt).toBe(1000);
  });

  it.each(["changed-content", "changed-runtime", "changed-dependencies", "changed-environment"])("rejects %s evidence", (snapshot) => {
    const options = { ...fixture(), now: () => 1000, run: () => {} };
    runQuality({ ...options, snapshot: () => "original" });
    expect(runQuality({ ...options, reuse: true, snapshot: () => snapshot }).reused).toBe(false);
  });

  it("rejects expired, future, partial, failed and corrupt receipts", () => {
    const receipt = { schemaVersion: 1, fingerprint: "input", result: "passed", checks: LOCAL_CHECKS, checkedAt: 1000 };
    expect(reusableReceipt(receipt, "input", 2000)).toBe(true);
    expect(reusableReceipt(receipt, "input", 3601001)).toBe(false);
    expect(reusableReceipt(receipt, "input", 999)).toBe(false);
    expect(reusableReceipt({ ...receipt, checks: ["lint"] }, "input", 2000)).toBe(false);
    expect(reusableReceipt({ ...receipt, result: "failed" }, "input", 2000)).toBe(false);
    expect(reusableReceipt(null, "input", 2000)).toBe(false);
    const options = fixture();
    writeFileSync(options.receiptPath, "broken JSON");
    expect(runQuality({ ...options, reuse: true, snapshot: () => "input", run: () => {} }).reused).toBe(false);
  });

  it.each([...LOCAL_CHECKS, ...FRESH_CHECKS])("never issues evidence after %s fails", (failed) => {
    const options = fixture();
    expect(() => runQuality({ ...options, snapshot: () => "same", run: (check: string) => {
      if (check === failed) throw new Error("fixture failure");
    } })).toThrow("fixture failure");
    expect(existsSync(options.receiptPath)).toBe(false);
  });

  it("does not cache input drift or missing fingerprint prerequisites", () => {
    const options = fixture();
    let counter = 0;
    expect(() => runQuality({ ...options, snapshot: () => String(counter++), run: () => {} })).toThrow("inputs changed");
    expect(existsSync(options.receiptPath)).toBe(false);
    const calls: string[] = [];
    runQuality({ ...options, reuse: true, snapshot: () => { throw new Error("unknown inputs"); }, run: (check: string) => { calls.push(check); } });
    expect(calls).toContain("test:coverage");
    expect(existsSync(options.receiptPath)).toBe(false);
  });

  it("binds actual tracked, untracked and ignored environment contents", () => {
    const { repo } = fixture();
    execFileSync("git", ["init", "-q", repo]);
    writeFileSync(join(repo, ".gitignore"), ".env.local\n");
    writeFileSync(join(repo, "source.txt"), "first");
    execFileSync("git", ["-C", repo, "add", "source.txt", ".gitignore"]);
    const baseline = candidateDigest(repo);
    writeFileSync(join(repo, "source.txt"), "second");
    expect(candidateDigest(repo)).not.toBe(baseline);
    const changed = candidateDigest(repo);
    writeFileSync(join(repo, "untracked.txt"), "new");
    expect(candidateDigest(repo)).not.toBe(changed);
    const untracked = candidateDigest(repo);
    writeFileSync(join(repo, ".env.local"), "FIXTURE=value");
    expect(candidateDigest(repo)).not.toBe(untracked);
    const environment = candidateDigest(repo);
    writeFileSync(join(repo, ".git/info/exclude"), "hidden.test.ts\n");
    writeFileSync(join(repo, "hidden.test.ts"), "ignored test input");
    expect(candidateDigest(repo)).not.toBe(environment);
  });

  it("ignores invocation bookkeeping but binds meaningful environment inputs", () => {
    expect(environmentDigest({ FEATURE: "one", npm_lifecycle_event: "check" }))
      .toBe(environmentDigest({ FEATURE: "one", npm_lifecycle_event: "push" }));
    expect(environmentDigest({ FEATURE: "one" })).not.toBe(environmentDigest({ FEATURE: "two" }));
  });

  it("binds recovered-site sources but excludes its generated build outputs", () => {
    const { repo } = fixture();
    execFileSync("git", ["init", "-q", repo]);
    writeFileSync(join(repo, ".gitignore"), "apps/public-site/.next/\napps/public-site/app/generated-home-html.js\n");
    for (const path of ["apps/public-site/.next", "apps/public-site/app", "apps/public-site/public/assets"]) {
      mkdirSync(join(repo, path), { recursive: true });
    }
    writeFileSync(join(repo, "apps/public-site/public/index.html"), "canonical HTML");
    writeFileSync(join(repo, "apps/public-site/public/assets/hero.mp4"), "original video");
    const original = candidateDigest(repo);
    writeFileSync(join(repo, "apps/public-site/.next/BUILD_ID"), "generated build");
    writeFileSync(join(repo, "apps/public-site/app/generated-home-html.js"), "generated module");
    expect(candidateDigest(repo)).toBe(original);
    writeFileSync(join(repo, "apps/public-site/public/index.html"), "changed HTML");
    const changedHtml = candidateDigest(repo);
    expect(changedHtml).not.toBe(original);
    writeFileSync(join(repo, "apps/public-site/public/assets/hero.mp4"), "changed video");
    expect(candidateDigest(repo)).not.toBe(changedHtml);
  });

  it("detects installed dependency content changes with identical package versions", () => {
    const { repo } = fixture();
    writeFileSync(join(repo, "package.json"), JSON.stringify({ version: "1.0.0" }));
    writeFileSync(join(repo, "index.js"), "original");
    const initial = treeDigest(repo);
    writeFileSync(join(repo, "index.js"), "modified");
    expect(treeDigest(repo)).not.toBe(initial);
  });

  it("refuses evidence for a different pushed commit before running any check", () => {
    const options = fixture();
    execFileSync("git", ["init", "-q", options.repo]);
    const calls: string[] = [];
    expect(() => runQuality({ ...options, head: "not-a-sha", run: (check: string) => { calls.push(check); } })).toThrow("checked-out commit");
    expect(calls).toEqual([]);
  });

  it("invalidates old success when a new check fails", () => {
    const options = { ...fixture(), snapshot: () => "same", now: () => 1000 };
    runQuality({ ...options, run: () => {} });
    expect(() => runQuality({ ...options, run: (check: string) => {
      if (check === "test:coverage") throw new Error("new failure");
    } })).toThrow("new failure");
    const calls: string[] = [];
    expect(runQuality({ ...options, reuse: true, run: (check: string) => { calls.push(check); } }).reused).toBe(false);
    expect(calls).toContain("test:coverage");
  });

  it("rejects concurrent content edits even when cache prerequisites are missing", () => {
    const options = fixture();
    let content = "before";
    expect(() => runQuality({ ...options, contentSnapshot: () => content,
      snapshot: () => { throw new Error("cache unavailable"); },
      run: () => { content = "after"; } })).toThrow("inputs changed");
  });

  it("binds generated compiler inputs after build and invalidates subsequent changes", () => {
    const options = { ...fixture(), snapshot: () => "same", now: () => 1000 };
    let generated = "old types";
    runQuality({ ...options, generatedSnapshot: () => generated,
      run: (check: string) => { if (check === "build") generated = "new types"; } });
    expect(runQuality({ ...options, generatedSnapshot: () => generated, reuse: true, run: () => {} }).reused).toBe(true);
    generated = "modified types";
    expect(runQuality({ ...options, generatedSnapshot: () => generated, reuse: true, run: () => {} }).reused).toBe(false);
  });

  it("uses the local check start time rather than the end of slow browser checks", () => {
    const options = fixture();
    let time = 1000;
    runQuality({ ...options, snapshot: () => "same", now: () => time, run: () => { time += 600000; } });
    const receipt = JSON.parse(readFileSync(options.receiptPath, "utf8"));
    expect(receipt.checkedAt).toBe(1000);
    expect(reusableReceipt(receipt, "same", time)).toBe(false);
  });

  it("revalidates the pushed checkout after checks finish", () => {
    const options = fixture();
    const git = (args: string[]) => execFileSync("git", ["-C", options.repo, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
    git(["init", "-q"]);
    writeFileSync(join(options.repo, "input.txt"), "committed input");
    git(["add", "input.txt"]);
    git(["-c", "user.name=Quality fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture"]);
    const head = git(["rev-parse", "HEAD"]);
    expect(() => runQuality({ ...options, head, snapshot: () => "same", run: (check: string) => {
      if (check === "build") writeFileSync(join(options.repo, "input.txt"), "concurrent edit");
    } })).toThrow();
    expect(existsSync(options.receiptPath)).toBe(false);
  });

  it.each([false, true])("checks generated inputs changed by Lighthouse (reuse=%s)", (reuse) => {
    const options = { ...fixture(), snapshot: () => "same", now: () => 1000 };
    let generated = "verified";
    if (reuse) runQuality({ ...options, generatedSnapshot: () => generated, run: () => {} });
    const calls: string[] = [];
    runQuality({ ...options, reuse, generatedSnapshot: () => generated, run: (check: string) => {
      calls.push(check);
      if (check === "lighthouse:ci") generated = "new inputs";
    } });
    expect(calls.at(-1)).toBe("typecheck");
  });

  it("rejects invalid generated inputs discovered after browser rebuilds", () => {
    const options = { ...fixture(), snapshot: () => "same", now: () => 1000 };
    let generated = "verified";
    runQuality({ ...options, generatedSnapshot: () => generated, run: () => {} });
    expect(() => runQuality({ ...options, reuse: true, generatedSnapshot: () => generated, run: (check: string) => {
      if (check === "lighthouse:ci") generated = "invalid";
      if (check === "typecheck") throw new Error("invalid generated input");
    } })).toThrow("invalid generated input");
    expect(JSON.parse(readFileSync(options.receiptPath, "utf8")).result).toBe("invalid");
  });

  it("rechecks generated inputs changed during fingerprinting on a reused run", () => {
    const options = { ...fixture(), now: () => 1000 };
    let generated = "verified";
    runQuality({ ...options, snapshot: () => "same", generatedSnapshot: () => generated, run: () => {} });
    const calls: string[] = [];
    runQuality({ ...options, reuse: true, generatedSnapshot: () => generated,
      snapshot: () => { generated = "changed during fingerprint"; return "same"; },
      run: (check: string) => { calls.push(check); } });
    expect(calls).toEqual([...FRESH_CHECKS, "typecheck"]);
  });
});
