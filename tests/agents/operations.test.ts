import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  getOperationalPaths,
  readOperationalClaims,
  registerOperationalClaim,
  transitionOperationalClaim,
} from "../../automation/agents/operations.mjs";

const temporaryDirectories: string[] = [];
const origin = "https://github.com/git5285/obraxen.git";
const claimPath = ".coordination/claims/candidate-closure.md";
const threadId = "candidate-closure";
const operationsCli = fileURLToPath(
  new URL("../../automation/agents/operations.mjs", import.meta.url),
);

function repository() {
  const directory = mkdtempSync(join(tmpdir(), "obraxen-agent-operations-"));
  temporaryDirectories.push(directory);
  execFileSync("git", ["init", "-q", directory]);
  execFileSync("git", ["-C", directory, "remote", "add", "origin", origin]);
  mkdirSync(join(directory, ".coordination", "claims"), { recursive: true });
  writeFileSync(join(directory, claimPath), `# Candidate closure
- thread_id: ${threadId}
- estado: en_curso
- archivos:
  - src/example.ts
  - tests/example.test.ts
`);
  return directory;
}

function stateHome() {
  const directory = mkdtempSync(join(tmpdir(), "obraxen-agent-state-"));
  temporaryDirectories.push(directory);
  return directory;
}

function pullRequestEvidence() {
  return [{
    kind: "pull_request" as const,
    number: 31,
    url: "https://github.com/git5285/obraxen/pull/31",
    state: "MERGED" as const,
    headSha: "a".repeat(40),
    mergeCommitSha: "b".repeat(40),
    observedAt: "2026-07-18T12:02:00Z",
  }];
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("append-only operational claim state", () => {
  it("requires work to start before review and releases the unchanged registered marker", () => {
    const repo = repository();
    const state = stateHome();
    const marker = readFileSync(join(repo, claimPath), "utf8").replace("estado: en_curso", "estado: reservado");
    writeFileSync(join(repo, claimPath), marker);
    registerOperationalClaim({ repo, stateHome: state, claimPath,
      eventId: "lifecycle-register", occurredAt: "2026-07-18T12:00:00Z" });
    expect(readOperationalClaims(repo, state)[0].state).toBe("reservado");
    expect(() => transitionOperationalClaim({ repo, stateHome: state, threadId,
      eventId: "invalid-review", occurredAt: "2026-07-18T12:00:01Z",
      state: "esperando_revision", reason: "candidate_ready" })).toThrow(/transition/);
    expect(readdirSync(getOperationalPaths(repo, state).events)).toHaveLength(1);
    transitionOperationalClaim({ repo, stateHome: state, threadId,
      eventId: "lifecycle-start", occurredAt: "2026-07-18T12:01:00Z",
      state: "en_curso", reason: "work_started" });
    transitionOperationalClaim({ repo, stateHome: state, threadId,
      eventId: "lifecycle-review", occurredAt: "2026-07-18T12:02:00Z",
      state: "esperando_revision", reason: "candidate_ready" });
    expect(() => transitionOperationalClaim({ repo, stateHome: state, threadId,
      eventId: "invalid-release", occurredAt: "2026-07-18T12:03:00Z",
      state: "liberado", reason: "done" })).toThrow();
    transitionOperationalClaim({ repo, stateHome: state, threadId,
      eventId: "lifecycle-release", occurredAt: "2026-07-18T12:03:00Z",
      state: "liberado", reason: "pull_request_merged", evidence: pullRequestEvidence() });
    expect(readOperationalClaims(repo, state)[0]).toMatchObject({ state: "liberado", eventCount: 4 });
    expect(readFileSync(join(repo, claimPath), "utf8")).toBe(marker);
  });

  it("forbids per-run state-home overrides in the operations CLI", () => {
    expect(() => execFileSync(process.execPath, [
      operationsCli,
      "status",
      "--state-home",
      stateHome(),
    ], { stdio: "pipe" })).toThrow();
  });

  it("registers, advances and releases one immutable claim with PR evidence", () => {
    const repo = repository();
    const state = stateHome();
    registerOperationalClaim({
      repo,
      stateHome: state,
      claimPath,
      eventId: "event-register-001",
      occurredAt: "2026-07-18T12:00:00Z",
      now: new Date("2026-07-18T12:00:01Z"),
    });
    transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-review-001",
      occurredAt: "2026-07-18T12:01:00Z",
      state: "esperando_revision",
      reason: "candidate_ready",
      now: new Date("2026-07-18T12:01:01Z"),
    });
    const released = transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-release-001",
      occurredAt: "2026-07-18T12:02:00Z",
      state: "liberado",
      reason: "pull_request_merged",
      evidence: pullRequestEvidence(),
      now: new Date("2026-07-18T12:02:01Z"),
    });
    const duplicate = transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-release-001",
      occurredAt: "2026-07-18T12:02:00Z",
      state: "liberado",
      reason: "pull_request_merged",
      evidence: pullRequestEvidence(),
    });

    expect(released.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(readOperationalClaims(repo, state)).toEqual([
      expect.objectContaining({
        threadId,
        state: "liberado",
        latestEventId: "event-release-001",
        eventCount: 3,
      }),
    ]);
    expect(readdirSync(getOperationalPaths(repo, state).events)).toHaveLength(3);
  });

  it("shares the same event stream across independent clones of one origin", () => {
    const first = repository();
    const second = repository();
    const state = stateHome();
    registerOperationalClaim({
      repo: first,
      stateHome: state,
      claimPath,
      eventId: "event-register-shared",
      occurredAt: "2026-07-18T12:00:00Z",
    });
    expect(readOperationalClaims(second, state)).toEqual([
      expect.objectContaining({ threadId, state: "en_curso" }),
    ]);
  });

  it("requires typed terminal evidence and a human reference to reopen", () => {
    const repo = repository();
    const state = stateHome();
    registerOperationalClaim({
      repo,
      stateHome: state,
      claimPath,
      eventId: "event-register-guarded",
      occurredAt: "2026-07-18T12:00:00Z",
    });
    expect(() => transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-release-without-evidence",
      occurredAt: "2026-07-18T12:01:00Z",
      state: "liberado",
      reason: "pull_request_merged",
    })).toThrow("requires typed terminal evidence");
    expect(() => transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-release-closed-only",
      occurredAt: "2026-07-18T12:01:30Z",
      state: "liberado",
      reason: "pull_request_closed",
      evidence: [{
        ...pullRequestEvidence()[0],
        state: "CLOSED",
        mergeCommitSha: null,
      }],
    })).toThrow("requires typed terminal evidence");
    expect(() => transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-release-blocked-only",
      occurredAt: "2026-07-18T12:01:45Z",
      state: "liberado",
      reason: "run_blocked",
      evidence: [{
        kind: "run_report",
        runId: "run-blocked-001",
        reportDigest: "c".repeat(64),
        status: "blocked",
      }],
    })).toThrow("requires typed terminal evidence");

    transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-release-guarded",
      occurredAt: "2026-07-18T12:02:00Z",
      state: "liberado",
      reason: "pull_request_merged",
      evidence: pullRequestEvidence(),
    });
    expect(() => transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-reopen-without-human",
      occurredAt: "2026-07-18T12:03:00Z",
      state: "en_curso",
      reason: "correction_required",
    })).toThrow("requires a human decision reference");
    expect(transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-reopen-human",
      occurredAt: "2026-07-18T12:04:00Z",
      state: "en_curso",
      reason: "correction_required",
      evidence: [{ kind: "human_decision", decisionId: "turn-019f-example" }],
    }).duplicate).toBe(false);
    expect(readOperationalClaims(repo, state)[0].state).toBe("en_curso");
  });

  it("fails closed when the versioned marker changes after registration", () => {
    const repo = repository();
    const state = stateHome();
    registerOperationalClaim({
      repo,
      stateHome: state,
      claimPath,
      eventId: "event-register-drift",
      occurredAt: "2026-07-18T12:00:00Z",
    });
    writeFileSync(
      join(repo, claimPath),
      `${readFileSync(join(repo, claimPath), "utf8")}- siguiente_paso: changed\n`,
    );
    expect(() => transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-blocked-drift",
      occurredAt: "2026-07-18T12:01:00Z",
      state: "bloqueado",
      reason: "marker_changed",
    })).toThrow("marker changed after evidence was collected");
  });

  it("rejects conflicting event id reuse", () => {
    const repo = repository();
    const state = stateHome();
    registerOperationalClaim({
      repo,
      stateHome: state,
      claimPath,
      eventId: "event-register-conflict",
      occurredAt: "2026-07-18T12:00:00Z",
    });
    transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-transition-conflict",
      occurredAt: "2026-07-18T12:01:00Z",
      state: "bloqueado",
      reason: "external_blocker",
    });
    expect(() => transitionOperationalClaim({
      repo,
      stateHome: state,
      threadId,
      eventId: "event-transition-conflict",
      occurredAt: "2026-07-18T12:01:00Z",
      state: "esperando_revision",
      reason: "candidate_ready",
    })).toThrow("different transition content");
  });
});
