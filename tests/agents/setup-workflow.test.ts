import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { finishLocalTask, startLocalTask } from "../../scripts/local-task.mjs";
import { readOperationalClaims } from "../../automation/agents/operations.mjs";

const fixtures: string[] = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "obraxen-setup-test-")));
  fixtures.push(root);
  const repo = join(root, "repo");
  const stateHome = join(root, "state");
  mkdirSync(repo);
  const git = (...args: string[]) => execFileSync("git", ["-c", "maintenance.auto=false", "-c", "gc.auto=0", ...args], { cwd: repo, encoding: "utf8" });
  git("init", "-q");
  git("remote", "add", "origin", "https://example.invalid/obraxen/setup-test.git");
  mkdirSync(join(repo, "automation/agents"), { recursive: true });
  writeFileSync(join(repo, "automation/agents/lease.mjs"), "export const COORDINATION_PROTOCOL_VERSION = 3;\n");
  writeFileSync(join(repo, "README.md"), "original\n");
  git("add", "README.md", "automation/agents/lease.mjs");
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture");
  return { repo, stateHome, git };
}

function removeOwnedFixture(path: string) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) removeOwnedFixture(child);
    else {
      try { unlinkSync(child); } // Never follows symlinks.
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
  }
  rmdirSync(path);
}
afterEach(() => { for (const path of fixtures.splice(0)) removeOwnedFixture(path); });

const spec = { threadId: "local-example", objective: "Fix local copy", nextStep: "Edit and verify copy", files: ["README.md"] };
const report = { threadId: spec.threadId, result: "Copy fixed", changedPaths: ["README.md"],
  checks: [{ command: "fixture copy assertion", status: "passed", evidence: "README equals revised copy" }],
  decisions: ["Preserve unrelated files"], pending: [] };

function snapshot(repo: string, stateHome: string) {
  const moduleUrl = pathToFileURL(join(process.cwd(), "scripts/checkout-context.mjs")).href;
  // JavaScript passed directly as an argv element; no shell interpolation.
  return JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e",
    `import { checkoutContext } from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(checkoutContext(${JSON.stringify(repo)}, ${JSON.stringify({ compact: true, task: spec.threadId, stateHome })})));`,
  ], { encoding: "utf8" }));
}

describe("local task coordination", () => {
  it.each(["x", "../unsafe", "_task"])("rejects invalid identifiers before creating markers: %s", threadId => {
    const env = fixture();
    expect(() => startLocalTask({ ...spec, threadId }, env)).toThrow(/Invalid threadId/);
    expect(existsSync(join(env.repo, ".coordination/claims"))).toBe(false);
  });
  it("preserves foreign changes, reports selected checkout and closes through immutable evidence", () => {
    const env = fixture();
    for (let i = 0; i < 12; i++) writeFileSync(join(env.repo, `foreign-${i}.txt`), `foreign ${i}`);
    const head = env.git("rev-parse", "HEAD").trim();
    const start = startLocalTask(spec, env);
    expect(start.task).toMatchObject({ owner: spec.threadId, checkout: env.repo, state: "en_curso", nextStep: spec.nextStep });
    expect(start.head).toBe(head);
    expect(start.status).toHaveLength(8);
    expect(start.statusTruncated).toBe(true);
    const marker = join(env.repo, `.coordination/claims/${spec.threadId}.md`);
    const before = readFileSync(marker, "utf8");
    writeFileSync(join(env.repo, "README.md"), "revised copy\n");
    expect(readFileSync(join(env.repo, "README.md"), "utf8")).toBe("revised copy\n");
    const end = finishLocalTask(report, env);
    expect(end.task.state).toBe("liberado");
    expect(end.task.nextStep).toContain("cerrado");
    const claim = readOperationalClaims(env.repo, env.stateHome)[0];
    expect(claim.eventCount).toBe(4);
    expect(claim.latestEvidence[0]).toMatchObject({ kind: "handoff" });
    expect(readFileSync(marker, "utf8")).toBe(before);
    expect(env.git("rev-parse", "HEAD").trim()).toBe(head);
    for (let i = 0; i < 12; i++) expect(readFileSync(join(env.repo, `foreign-${i}.txt`), "utf8")).toBe(`foreign ${i}`);
  });

  it("rejects active overlapping claims and leaves no new marker", () => {
    const env = fixture();
    startLocalTask(spec, env);
    expect(() => startLocalTask({ ...spec, threadId: "overlap" }, env)).toThrow(/Files owned/);
    expect(existsSync(join(env.repo, ".coordination/claims/overlap.md"))).toBe(false);
    expect(() => startLocalTask(spec, env)).toThrow(/already exists/);
  });

  it("also rejects legacy ownership without operational registration", () => {
    const env = fixture();
    mkdirSync(join(env.repo, ".coordination/claims"), { recursive: true });
    writeFileSync(join(env.repo, ".coordination/claims/legacy.md"), "# Legacy\n- thread_id: legacy-owner\n- estado: bloqueado\n- archivos:\n  - README.md\n");
    expect(() => startLocalTask(spec, env)).toThrow(/Files owned/);
  });

  it.each(["../outside.md", "src/**", "/absolute.md", "file.md\n- estado: liberado"])("rejects unsafe scope %s before registration", path => {
    const env = fixture();
    expect(() => startLocalTask({ ...spec, files: [path] }, env)).toThrow(/Invalid exact path/);
    expect(readOperationalClaims(env.repo, env.stateHome)).toEqual([]);
  });

  it("retains ownership for pending, failed, missing, or out-of-scope completion evidence", () => {
    const env = fixture();
    startLocalTask(spec, env);
    expect(() => finishLocalTask({ ...report, pending: ["repair"] }, env)).toThrow(/Pending/);
    expect(() => finishLocalTask({ ...report, checks: [] }, env)).toThrow(/Verification/);
    expect(() => finishLocalTask({ ...report, checks: [{ ...report.checks[0], status: "failed" }] }, env)).toThrow(/Failed/);
    expect(() => finishLocalTask({ ...report, changedPaths: ["outside.ts"] }, env)).toThrow(/outside claim/);
    expect(readOperationalClaims(env.repo, env.stateHome)[0].state).toBe("en_curso");
    expect(existsSync(join(env.repo, `.coordination/handoffs/${spec.threadId}.md`))).toBe(false);
  });

  it("binds the claim to its worktree while storing coordination in the control checkout", () => {
    const env = fixture();
    const worktree = join(env.repo, "..", "candidate");
    env.git("worktree", "add", "--detach", worktree);
    const start = startLocalTask(spec, { repo: worktree, stateHome: env.stateHome });
    expect(start.controlRoot).toBe(env.repo);
    expect(start.task.checkout).toBe(realpathSync(worktree));
    expect(existsSync(join(env.repo, `.coordination/claims/${spec.threadId}.md`))).toBe(true);
    expect(existsSync(join(worktree, `.coordination/claims/${spec.threadId}.md`))).toBe(false);
    expect(() => finishLocalTask(report, env)).toThrow(/Wrong checkout/);
    expect(finishLocalTask(report, { repo: worktree, stateHome: env.stateHome }).task.state).toBe("liberado");
  });

  it("rejects changed claim markers without releasing ownership", () => {
    const env = fixture();
    startLocalTask(spec, env);
    const path = join(env.repo, `.coordination/claims/${spec.threadId}.md`);
    writeFileSync(path, readFileSync(path, "utf8") + "changed\n");
    expect(() => finishLocalTask(report, env)).toThrow(/marker changed/);
    expect(readOperationalClaims(env.repo, env.stateHome)[0].state).toBe("en_curso");
    const context = snapshot(env.repo, env.stateHome);
    expect(context.task.markerIntegrity).toBe("changed");
    expect(context.task.checkout).toBeNull();
    expect(context.task.initialHead).toBeNull();
    expect(context.task.nextStep).toContain("Marcador alterado");
  });

  it("does not invent a candidate when the registered marker is unavailable in this clone", () => {
    const env = fixture();
    startLocalTask(spec, env);
    unlinkSync(join(env.repo, `.coordination/claims/${spec.threadId}.md`));
    const context = snapshot(env.repo, env.stateHome);
    expect(context.task).toMatchObject({ markerIntegrity: "unavailable", checkout: null, initialHead: null, state: "en_curso" });
    expect(context.task.nextStep).toContain("no inferir");
  });

  it("rejects unsupported CLI arguments before doing any work", () => {
    expect(() => execFileSync(process.execPath, ["scripts/local-task.mjs", "start", "missing.json", "--state-home", "/tmp"], { stdio: "pipe" })).toThrow();
  });
});
