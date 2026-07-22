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
  getOperationalPaths,
  registerOperationalClaim,
  transitionOperationalClaim,
} from "../../automation/agents/operations.mjs";
import {
  applyOperationalClaimStates,
  buildPreflight,
  deriveGating,
  parseClaim,
  parseWorktrees,
} from "../../automation/agents/preflight.mjs";

const temporaryDirectories: string[] = [];
const origin = "https://github.com/git5285/obraxen.git";
const preflightCli = fileURLToPath(
  new URL("../../automation/agents/preflight.mjs", import.meta.url),
);

function repository() {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "obraxen-agent-preflight-")));
  temporaryDirectories.push(directory);
  execFileSync("git", ["init", "-q", directory]);
  execFileSync("git", ["-C", directory, "remote", "add", "origin", origin]);
  writeFileSync(join(directory, "README.md"), "# Fixture\n");
  mkdirSync(join(directory, "automation", "agents"), { recursive: true });
  writeFileSync(
    join(directory, "automation", "agents", "lease.mjs"),
    "export const COORDINATION_PROTOCOL_VERSION = 3;\n",
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
  it("blocks every autonomous role when the runtime contract does not match", () => {
    const gating = deriveGating({
      policy: {
        mode: "active",
        authority: { allowScout: true, allowLocalDiff: true },
      },
      lease: null,
      worktrees: [{ path: "/repo", status: [] }],
      runtime: { ok: false },
    });
    expect(gating.eligibility).toEqual({ scout: false, writer: false });
    expect(gating.blockers).toContain("runtime_contract_mismatch");
  });

  it("uses the governed policy state home and reports its resolved root", () => {
    const repo = repository();
    const state = stateHome();
    const report = buildPreflight(repo, {
      project: "obraxen",
      mode: "active",
      coordination: { stateHome: state },
      authority: { allowScout: true, allowLocalDiff: true },
    });

    expect(report).toMatchObject({
      repoRoot: repo,
      coordinationStateRoot: expect.stringMatching(`${state}/obraxen/agent-coordination-v1/`),
      coordinationFailures: [],
      registeredClones: [expect.objectContaining({ root: repo })],
      eligibility: { scout: true, writer: true },
    });
  });

  it("forbids per-run state-home overrides in the preflight CLI", () => {
    expect(() => execFileSync(process.execPath, [
      preflightCli,
      "--state-home",
      stateHome(),
    ], { stdio: "pipe" })).toThrow();
  });

  it("uses a matching shared release event instead of requiring a claim-file closure", () => {
    const repo = repository();
    const state = stateHome();
    const path = ".coordination/claims/operational-release.md";
    writeFileSync(join(repo, path), `# Operational release
- thread_id: operational-release
- estado: esperando_revision
- archivos:
  - src/example.ts
`);
    registerOperationalClaim({
      repo,
      stateHome: state,
      claimPath: path,
      eventId: "event-register-preflight",
      occurredAt: "2026-07-18T12:00:00Z",
    });
    transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId: "operational-release",
      eventId: "event-release-preflight",
      occurredAt: "2026-07-18T12:01:00Z",
      state: "liberado",
      reason: "pull_request_merged",
      evidence: [{
        kind: "pull_request",
        number: 31,
        url: "https://github.com/git5285/obraxen/pull/31",
        state: "MERGED",
        headSha: "a".repeat(40),
        mergeCommitSha: "b".repeat(40),
        observedAt: "2026-07-18T12:01:00Z",
      }],
    });
    const report = buildPreflight(repo, {
      project: "obraxen",
      mode: "active",
      coordination: { stateHome: state },
      authority: { allowScout: true, allowLocalDiff: true },
    });

    expect(report).toMatchObject({
      operationalClaims: [expect.objectContaining({
        threadId: "operational-release",
        state: "liberado",
      })],
      activeClaims: [],
      coordinationFailures: [],
      eligibility: { scout: true, writer: true },
    });
    expect(parseClaim(
      readFileSync(join(repo, path), "utf8"),
      path,
      repo,
    ).state).toBe("esperando_revision");
  });

  it("keeps an active shared claim blocking when its worktree marker disappears", () => {
    const repo = repository();
    const state = stateHome();
    const path = ".coordination/claims/operational-orphan.md";
    writeFileSync(join(repo, path), `# Operational orphan
- thread_id: operational-orphan
- estado: en_curso
- archivos:
  - src/example.ts
`);
    registerOperationalClaim({
      repo,
      stateHome: state,
      claimPath: path,
      eventId: "event-register-orphan",
      occurredAt: "2026-07-18T12:00:00Z",
    });
    rmSync(join(repo, path));
    const report = buildPreflight(repo, {
      project: "obraxen",
      mode: "active",
      coordination: { stateHome: state },
      authority: { allowScout: true, allowLocalDiff: true },
    });
    expect(report).toMatchObject({
      activeClaims: [expect.objectContaining({
        threadId: "operational-orphan",
        operationalOnly: true,
      })],
      eligibility: { scout: true, writer: false },
      blockers: expect.arrayContaining(["active_writer_claim_limit"]),
    });
  });

  it("fails closed when an event stream is corrupt or its marker drifts", () => {
    const repo = repository();
    const state = stateHome();
    const path = ".coordination/claims/operational-corrupt.md";
    writeFileSync(join(repo, path), `# Operational corrupt
- thread_id: operational-corrupt
- estado: en_curso
- archivos:
  - src/example.ts
`);
    registerOperationalClaim({
      repo,
      stateHome: state,
      claimPath: path,
      eventId: "event-register-corrupt",
      occurredAt: "2026-07-18T12:00:00Z",
    });
    writeFileSync(join(repo, path), `${readFileSync(join(repo, path), "utf8")}\nChanged\n`);
    const drift = buildPreflight(repo, {
      project: "obraxen",
      mode: "active",
      coordination: { stateHome: state },
      authority: { allowScout: true, allowLocalDiff: true },
    });
    expect(drift.coordinationFailures).toEqual([
      expect.objectContaining({ reason: expect.stringContaining("marker does not match") }),
    ]);
    expect(drift.eligibility).toEqual({ scout: false, writer: false });

    writeFileSync(
      join(getOperationalPaths(repo, state).events, "event-register-corrupt.json"),
      "{}\n",
    );
    const corrupt = buildPreflight(repo, {
      project: "obraxen",
      mode: "active",
      coordination: { stateHome: state },
      authority: { allowScout: true, allowLocalDiff: true },
    });
    expect(corrupt.coordinationFailures).toEqual([
      expect.objectContaining({ reason: expect.stringContaining("missing keys") }),
    ]);
    expect(corrupt.eligibility).toEqual({ scout: false, writer: false });
  });

  it("overlays only exact claim snapshots", () => {
    const parsed = parseClaim(`# Work
- thread_id: exact-snapshot
- estado: en_curso
- archivos:
  - src/example.ts
`, ".coordination/claims/exact-snapshot.md", "/repo");
    const operational = {
      threadId: "exact-snapshot",
      state: "liberado" as const,
      claim: {
        source: parsed.source,
        contentDigest: parsed.contentDigest,
        files: parsed.files,
      },
      latestEventId: "event-exact-snapshot",
      latestOccurredAt: "2026-07-18T12:00:00Z",
      eventCount: 2,
      latestEvidence: [],
    };
    expect(applyOperationalClaimStates([parsed], [operational])).toMatchObject({
      claims: [expect.objectContaining({ state: "liberado" })],
      failures: [],
    });
    expect(applyOperationalClaimStates([parsed], [{
      ...operational,
      claim: { ...operational.claim, contentDigest: "f".repeat(64) },
    }]).failures).toHaveLength(1);
  });

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
