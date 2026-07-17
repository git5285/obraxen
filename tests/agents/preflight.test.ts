import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildPreflight,
  deriveGating,
  parseClaim,
  parseWorktrees,
} from "../../automation/agents/preflight.mjs";

const temporaryDirectories: string[] = [];
const origin = "https://github.com/git5285/obraxen.git";

function repository() {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "obraxen-agent-preflight-")));
  temporaryDirectories.push(directory);
  execFileSync("git", ["init", "-q", directory]);
  execFileSync("git", ["-C", directory, "remote", "add", "origin", origin]);
  writeFileSync(join(directory, "README.md"), "# Fixture\n");
  mkdirSync(join(directory, "automation", "agents"), { recursive: true });
  writeFileSync(
    join(directory, "automation", "agents", "lease.mjs"),
    "export const COORDINATION_PROTOCOL_VERSION = 2;\n",
  );
  execFileSync("git", [
    "-C",
    directory,
    "add",
    "README.md",
    "automation/agents/lease.mjs",
  ]);
  execFileSync("git", [
    "-C",
    directory,
    "-c",
    "user.name=Obraxen Test",
    "-c",
    "user.email=test@example.invalid",
    "commit",
    "-qm",
    "fixture",
  ]);
  mkdirSync(join(directory, ".coordination", "claims"), { recursive: true });
  return directory;
}

function stateHome() {
  const directory = mkdtempSync(join(tmpdir(), "obraxen-agent-state-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("cross-worktree preflight parsers", () => {
  it("parses branches, detached worktrees and HEADs", () => {
    expect(parseWorktrees(`worktree /repo/main
HEAD ${"a".repeat(40)}
branch refs/heads/main

worktree /repo/agent
HEAD ${"b".repeat(40)}
detached
`)).toEqual([
      { worktree: "/repo/main", HEAD: "a".repeat(40), branch: "refs/heads/main" },
      { worktree: "/repo/agent", HEAD: "b".repeat(40), detached: true },
    ]);
  });

  it("extracts active claim state and exact reserved paths", () => {
    const claim = parseClaim(`# Work
- thread_id: abc
- estado: en_curso
- archivos:
  - src/a.ts
  - tests/a.test.ts
- siguiente_paso: continue
`, ".coordination/claims/abc.md", "/repo/agent");
    expect(claim).toMatchObject({
      threadId: "abc",
      state: "en_curso",
      files: ["src/a.ts", "tests/a.test.ts"],
      worktree: "/repo/agent",
    });
  });

  it("normalizes inline-code fields and parses a reserved-files heading", () => {
    const claim = parseClaim(`# Work
- thread_id: \`abc\`
- estado: \`liberado\`

## Archivos reservados

- \`src/a.ts\`
- tests/a.test.ts

## Notes
`, ".coordination/claims/abc.md", "/repo/agent");
    expect(claim).toMatchObject({
      threadId: "abc",
      state: "liberado",
      files: ["src/a.ts", "tests/a.test.ts"],
      invalidFileEntries: [],
    });
  });

  it("retains invalid file-list entries so gating can fail closed", () => {
    const claim = parseClaim(`# Work
- thread_id: abc
- estado: bloqueado

## Archivos reservados

- src/a.ts
- sin rutas exactas todavía
`, ".coordination/claims/abc.md", "/repo/agent");
    expect(claim).toMatchObject({
      files: ["src/a.ts"],
      invalidFileEntries: ["sin rutas exactas todavía"],
    });
  });

  it("marks duplicate ownership metadata as unknown", () => {
    const claim = parseClaim(`# Ambiguous
- thread_id: abc
- estado: liberado
- estado: en_curso
- archivos:
  - src/a.ts
`, ".coordination/claims/abc.md", "/repo/agent");
    expect(claim).toMatchObject({
      threadId: "unknown",
      state: "unknown",
      metadataErrors: ["estado must appear exactly once"],
    });
  });

  it.each(["  - estado: en_curso", "- Estado: en_curso"])(
    "rejects a duplicate state written as %s",
    (duplicate) => {
      const claim = parseClaim(`# Ambiguous
- thread_id: abc
- estado: liberado
${duplicate}
- archivos:
  - src/a.ts
`, ".coordination/claims/abc.md", "/repo/agent");
      expect(claim).toMatchObject({
        threadId: "unknown",
        state: "unknown",
        metadataErrors: ["estado must appear exactly once"],
      });
    },
  );
});

describe("fail-closed gating (DISCOVERED-20260716-01)", () => {
  const shadowPolicy = { mode: "shadow", authority: { allowScout: true, allowLocalDiff: false } };
  const activePolicy = { mode: "active", authority: { allowScout: true, allowLocalDiff: true } };
  const readable = [
    { path: "/repo/main", status: [] },
    { path: "/repo/agent", status: ["?? notes.md"] },
  ];

  it("keeps scout eligible when every registered worktree is readable", () => {
    const gating = deriveGating({ policy: shadowPolicy, lease: null, worktrees: readable });
    expect(gating).toMatchObject({
      unreadableWorktrees: [],
      eligibility: { scout: true, writer: false },
      blockers: ["policy_mode_shadow"],
    });
  });

  it("fails closed on the reproduced eval-10 fixture: unreadable worktree disables scout", () => {
    const fixture = JSON.parse(readFileSync(fileURLToPath(new URL(
      "../../.agents/skills/obraxen-continuous-improvement/evals/intake-20260716/fixtures/preflight-unreadable.json",
      import.meta.url,
    )), "utf8"));
    const gating = deriveGating({
      policy: shadowPolicy,
      lease: fixture.lease,
      worktrees: fixture.worktrees,
    });
    expect(gating.unreadableWorktrees).toEqual(["/repo/main"]);
    expect(gating.eligibility).toEqual({ scout: false, writer: false });
    expect(gating.blockers).toContain("unreadable_worktrees");
  });

  it("fails closed when a worktree's claims cannot be read even if git status succeeded", () => {
    const gating = deriveGating({
      policy: shadowPolicy,
      lease: null,
      worktrees: readable,
      claimFailures: [{ path: "/repo/main", reason: "EACCES: permission denied" }],
    });
    expect(gating.unreadableWorktrees).toEqual(["/repo/main"]);
    expect(gating.eligibility.scout).toBe(false);
    expect(gating.blockers).toContain("unreadable_worktrees");
  });

  it("denies the writer in active mode while any worktree is unreadable", () => {
    const gating = deriveGating({
      policy: activePolicy,
      lease: null,
      worktrees: [
        { path: "/repo/main", status: ["unreadable: fatal: this operation must be run in a work tree"] },
        { path: "/repo/agent", status: [] },
      ],
    });
    expect(gating.eligibility).toEqual({ scout: false, writer: false });
    expect(gating.blockers).toEqual(["unreadable_worktrees"]);
  });

  it("denies the writer while any registered clone retains a legacy lease", () => {
    const gating = deriveGating({
      policy: activePolicy,
      lease: null,
      worktrees: readable,
      legacyLeases: [{ clone: "/repo/legacy", owner: { token: "legacy" } }],
    });
    expect(gating.eligibility).toEqual({ scout: true, writer: false });
    expect(gating.blockers).toContain("legacy_writer_lease_exists");
  });

  it("allows at most one pending autonomous local diff", () => {
    const pendingClaim = parseClaim(`# Pending candidate
- thread_id: pending-1
- estado: esperando_revision
- archivos:
  - src/components/project-card.tsx
`, ".coordination/claims/pending-1.md", "/repo/candidate");
    const gating = deriveGating({
      policy: activePolicy,
      lease: null,
      worktrees: readable,
      activeClaims: [pendingClaim],
    });
    expect(gating.pendingLocalDiffs).toEqual([pendingClaim]);
    expect(gating.eligibility).toEqual({ scout: true, writer: false });
    expect(gating.blockers).toContain("pending_local_diff_limit");
  });

  it.each([
    "reservado",
    "reserved",
    "en_curso",
    "in_progress",
    "bloqueado",
    "blocked",
    "esperando_revision",
    "awaiting_review",
  ])(
    "denies a second writer while a non-released claim is %s",
    (state) => {
      const writerClaim = parseClaim(`# Writer
- thread_id: writer-1
- estado: ${state}
- archivos:
  - src/a.ts
`, ".coordination/claims/writer-1.md", "/repo/writer");
      const gating = deriveGating({
        policy: activePolicy,
        lease: null,
        worktrees: readable,
        activeClaims: [writerClaim],
      });
      expect(gating.activeWriterClaims).toEqual([writerClaim]);
      expect(gating.eligibility.writer).toBe(false);
      expect(gating.blockers).toContain("active_writer_claim_limit");
    },
  );

  it("fails closed when an active claim has no extractable paths", () => {
    const unscopedClaim = parseClaim(`# Writer
- thread_id: writer-1
- estado: bloqueado

## Archivos reservados
- sin rutas exactas todavía
`, ".coordination/claims/writer-1.md", "/repo/writer");
    const gating = deriveGating({
      policy: activePolicy,
      lease: null,
      worktrees: readable,
      activeClaims: [unscopedClaim],
    });
    expect(unscopedClaim.files).toEqual([]);
    expect(unscopedClaim.invalidFileEntries).toEqual(["sin rutas exactas todavía"]);
    expect(gating.unscopedActiveClaims).toEqual([unscopedClaim]);
    expect(gating.eligibility.writer).toBe(false);
    expect(gating.blockers).toContain("active_claim_paths_unknown");
  });

  it("fails closed when an active claim has an unknown state", () => {
    const unknownClaim = parseClaim(`# Writer
- thread_id: writer-1
- estado: maybe
- archivos:
  - src/a.ts
`, ".coordination/claims/writer-1.md", "/repo/writer");
    const gating = deriveGating({
      policy: activePolicy,
      lease: null,
      worktrees: readable,
      activeClaims: [unknownClaim],
    });
    expect(gating.unknownStateClaims).toEqual([unknownClaim]);
    expect(gating.eligibility.writer).toBe(false);
    expect(gating.blockers).toContain("active_claim_state_unknown");
  });

  it("fails closed when a released claim also declares a second state", () => {
    const duplicateStateClaim = parseClaim(`# Ambiguous
- thread_id: writer-1
- estado: liberado
- estado: en_curso
- archivos:
  - src/a.ts
`, ".coordination/claims/writer-1.md", "/repo/writer");
    const gating = deriveGating({
      policy: activePolicy,
      lease: null,
      worktrees: readable,
      activeClaims: [duplicateStateClaim],
    });
    expect(duplicateStateClaim.state).toBe("unknown");
    expect(gating.eligibility.writer).toBe(false);
    expect(gating.blockers).toContain("active_claim_state_unknown");
  });

  it("discovers a blocked claim in an independent clone of the same origin", () => {
    const first = repository();
    const second = repository();
    const state = stateHome();

    const initial = buildPreflight(first, activePolicy, { stateHome: state });
    expect(initial).toMatchObject({ eligibility: { scout: true, writer: true } });

    writeFileSync(join(first, ".coordination", "claims", "blocked.md"), `# Blocked writer
- thread_id: blocked-writer
- estado: bloqueado
- archivos:
  - src/a.ts
`);

    const report = buildPreflight(second, activePolicy, { stateHome: state });
    expect(report).toMatchObject({
      eligibility: { scout: true, writer: false },
      activeWriterClaims: [expect.objectContaining({
        threadId: "blocked-writer",
        state: "bloqueado",
        worktree: first,
      })],
    });
    expect(report.blockers).toContain("active_writer_claim_limit");
    expect(report.registeredClones).toHaveLength(2);
    expect(report.worktrees).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: first }),
      expect.objectContaining({ path: second }),
    ]));
  });

  it("fails closed when a registered independent clone disappears", () => {
    const first = repository();
    const second = repository();
    const state = stateHome();
    buildPreflight(first, activePolicy, { stateHome: state });
    buildPreflight(second, activePolicy, { stateHome: state });
    rmSync(first, { recursive: true, force: true });

    const report = buildPreflight(second, activePolicy, { stateHome: state });
    expect(report).toMatchObject({ eligibility: { scout: false, writer: false } });
    expect(report.blockers).toContain("unreadable_worktrees");
    expect(report.cloneFailures).toEqual([
      expect.objectContaining({ path: first }),
    ]);
  });

  it("fails closed when a registered clone changes its origin", () => {
    const first = repository();
    const second = repository();
    const state = stateHome();
    buildPreflight(first, activePolicy, { stateHome: state });
    buildPreflight(second, activePolicy, { stateHome: state });
    execFileSync("git", [
      "-C",
      first,
      "remote",
      "set-url",
      "origin",
      "https://github.com/git5285/different-repository.git",
    ]);

    const changedCloneReport = buildPreflight(first, activePolicy, { stateHome: state });
    expect(changedCloneReport).toMatchObject({ eligibility: { scout: false, writer: false } });
    expect(changedCloneReport.coordinationFailures).toEqual([
      expect.objectContaining({ path: first, reason: "registered clone origin has changed" }),
    ]);

    const report = buildPreflight(second, activePolicy, { stateHome: state });
    expect(report).toMatchObject({ eligibility: { scout: false, writer: false } });
    expect(report.cloneFailures).toEqual([
      expect.objectContaining({ path: first, reason: "registered clone origin has changed" }),
    ]);
  });
});
