import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { RunReport } from "../../automation/agents/contracts.mjs";
import {
  readMemoryState,
  recordRun,
  writeMemoryReconciliation,
} from "../../automation/agents/memory.mjs";
import type { MemoryCandidate } from "../../automation/agents/memory.mjs";
import {
  buildReconciliation,
  validatePullRequestChecks,
  validatePullRequestView,
} from "../../automation/agents/reconcile.mjs";
import type {
  GitEvidence,
  PullRequestCheckEvidence,
  PullRequestViewEvidence,
} from "../../automation/agents/reconcile.mjs";
import { loadPolicy } from "../../automation/agents/policy.mjs";

const roots: string[] = [];
const FINAL_SHA = "a".repeat(40);
const MERGE_SHA = "b".repeat(40);
const MAIN_SHA = "c".repeat(40);
const PR_URL = "https://github.com/example/obraxen/pull/25";

function root() {
  const path = mkdtempSync(join(tmpdir(), "obraxen-reconcile-"));
  roots.push(path);
  return path;
}

afterEach(() => {
  for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true });
});

function selectedFinding() {
  return {
    id: "homepage-cta",
    domain: "ux",
    summary: "Align the homepage CTA with contact availability",
    evidence: [{
      kind: "repository_fact",
      source: "src/lib/homepage.ts:1",
      fact: "CTA state differs",
    }],
    impact: "medium",
    confidence: "high",
    risk: "low",
    candidatePaths: ["src/lib/homepage.ts"],
    verification: ["npm run test -- --run tests/homepage.test.ts"],
    conflicts: [],
  };
}

function report(runId = "run-delivery"): RunReport {
  return {
    schemaVersion: 6,
    status: "draft_pr",
    mode: "active",
    runOrigin: "delivery",
    attentionClass: "product",
    runId,
    baseSha: "d".repeat(40),
    runtimeFingerprint: "e".repeat(64),
    candidateId: "candidate-cta",
    parentRunId: null,
    trigger: "delivery_event",
    phase: "delivery",
    finalCommit: FINAL_SHA,
    pullRequest: { number: 25, url: PR_URL },
    reviewDecision: null,
    selectedFinding: selectedFinding(),
    activeConflicts: [],
    policyBlockers: [],
    changedPaths: ["src/lib/homepage.ts"],
    checks: [{ command: "npm run check", status: "passed", summary: "passed" }],
    auditorVerdict: "pass",
    externalAction: "draft_pr",
    learned_rules: [],
    usage: {
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      costUsd: null,
      durationMs: null,
    },
    traceId: null,
    reason: "Delivered for human review",
  };
}

describe("reconciliation text validation", () => {
  it.each(["", " \t\n", null, undefined, 42, {}, []])("rejects an invalid base branch with the exact error: %j", (baseRefName) => {
    expect(() => validatePullRequestView(mergedPullRequest({ baseRefName })))
      .toThrow(new Error("pull request view.baseRefName must be a non-empty string"));
  });

  it("preserves accepted branch text and object identity", () => {
    const view = mergedPullRequest({ baseRefName: " main " });
    expect(validatePullRequestView(view)).toBe(view);
    expect(view.baseRefName).toBe(" main ");
  });
});

function candidate(overrides: Partial<MemoryCandidate> = {}): MemoryCandidate {
  return {
    candidateId: "candidate-cta",
    scopeKey: "scope-cta",
    domain: "ux",
    summary: "Align the homepage CTA with contact availability",
    candidatePaths: ["src/lib/homepage.ts"],
    verification: ["npm run test -- --run tests/homepage.test.ts"],
    firstRunId: "run-delivery",
    lastRunId: "run-delivery",
    firstRunOrigin: "delivery",
    lastRunOrigin: "delivery",
    firstAttentionClass: "product",
    lastAttentionClass: "product",
    firstRuntimeFingerprint: "e".repeat(64),
    lastRuntimeFingerprint: "e".repeat(64),
    firstSeenAt: "2026-07-17T16:00:00Z",
    lastSeenAt: "2026-07-17T16:00:00Z",
    currentPhase: "delivery",
    finalCommit: FINAL_SHA,
    pullRequest: { number: 25, url: PR_URL },
    reviewDecision: null,
    reconciliation: null,
    phases: [{
      runId: "run-delivery",
      parentRunId: null,
      runOrigin: "delivery",
      attentionClass: "product",
      trigger: "delivery_event",
      phase: "delivery",
      status: "draft_pr",
      baseSha: "d".repeat(40),
      runtimeFingerprint: "e".repeat(64),
      recordedAt: "2026-07-17T16:00:00Z",
      finalCommit: FINAL_SHA,
      pullRequest: { number: 25, url: PR_URL },
      reviewDecision: null,
    }],
    ...overrides,
  };
}

function mergedPullRequest(overrides = {}): PullRequestViewEvidence {
  return {
    baseRefName: "main",
    closedAt: "2026-07-17T17:14:18Z",
    headRefOid: FINAL_SHA,
    isDraft: false,
    mergeCommit: { oid: MERGE_SHA },
    mergedAt: "2026-07-17T17:14:18Z",
    number: 25,
    reviewDecision: "",
    state: "MERGED",
    url: PR_URL,
    ...overrides,
  };
}

function qualityChecks(bucket = "pass"): PullRequestCheckEvidence[] {
  return [{
    bucket: bucket as PullRequestCheckEvidence["bucket"],
    link: "https://github.com/example/obraxen/actions/runs/1/job/2",
    name: "Quality gate",
    state: bucket === "pass" ? "SUCCESS" : "FAILURE",
    workflow: "Quality",
  }];
}

function gitEvidence(overrides = {}): GitEvidence {
  return {
    repo: "/repo",
    headSha: MAIN_SHA,
    branch: "main",
    defaultBranch: "main",
    defaultBranchSha: MAIN_SHA,
    finalCommit: {
      declaredSha: FINAL_SHA,
      exists: true,
      isAncestorOfDefaultBranch: false,
    },
    mergeCommit: {
      declaredSha: MERGE_SHA,
      exists: true,
      isAncestorOfDefaultBranch: true,
    },
    ...overrides,
  };
}

function reconcile(options = {}) {
  return buildReconciliation({
    candidate: candidate(),
    reconciliationId: "reconcile-cta-001",
    observedAt: "2026-07-18T10:00:00Z",
    gitEvidence: gitEvidence(),
    pullRequest: mergedPullRequest(),
    checks: qualityChecks(),
    policy: loadPolicy(),
    ...options,
  });
}

describe("deterministic candidate reconciliation", () => {
  it("accepts the exact gh read-only shape used by a merged squash PR", () => {
    expect(validatePullRequestView(mergedPullRequest())).toMatchObject({
      state: "MERGED",
      headRefOid: FINAL_SHA,
      mergeCommit: { oid: MERGE_SHA },
    });
    expect(validatePullRequestChecks(qualityChecks())[0]).toMatchObject({
      name: "Quality gate",
      bucket: "pass",
    });
    expect(() => reconcile({
      observedAt: "../../unsafe",
    })).toThrow("UTC ISO timestamp");
  });

  it("closes a candidate only when PR identity and local merge ancestry match", () => {
    const result = reconcile();
    expect(result).toMatchObject({
      outcome: "merged",
      terminal: true,
      reasonCodes: ["pull_request_merge_and_local_git_identity_match"],
    });
    expect(result.evidence.requiredChecks[0]).toMatchObject({
      name: "Quality gate",
      status: "passed",
    });

    expect(reconcile({
      gitEvidence: gitEvidence({
        mergeCommit: {
          declaredSha: MERGE_SHA,
          exists: false,
          isAncestorOfDefaultBranch: false,
        },
      }),
    }).outcome).toBe("local_state_stale");
    expect(reconcile({
      pullRequest: mergedPullRequest({ headRefOid: "e".repeat(40) }),
    }).outcome).toBe("evidence_mismatch");
  });

  it("does not infer rejection or supersession from a closed PR", () => {
    const closed = mergedPullRequest({
      state: "CLOSED",
      mergeCommit: null,
      mergedAt: null,
    });
    expect(reconcile({ pullRequest: closed }).outcome).toBe("needs_human");
    expect(reconcile({
      candidate: candidate({ reviewDecision: "rejected" }),
      pullRequest: closed,
    })).toMatchObject({ outcome: "rejected", terminal: true });
    expect(reconcile({
      candidate: candidate({ reviewDecision: "superseded" }),
      pullRequest: closed,
    })).toMatchObject({ outcome: "superseded", terminal: true });
  });

  it("reports open PR gates without granting merge authority", () => {
    const open = mergedPullRequest({
      state: "OPEN",
      closedAt: null,
      mergeCommit: null,
      mergedAt: null,
      reviewDecision: "APPROVED",
    });
    expect(reconcile({ pullRequest: open })).toMatchObject({
      outcome: "ready_for_human_merge",
      terminal: false,
    });
    expect(reconcile({ pullRequest: open, checks: qualityChecks("fail") }).outcome).toBe("checks_failed");
    expect(reconcile({
      pullRequest: { ...open, reviewDecision: "CHANGES_REQUESTED" },
    }).outcome).toBe("changes_requested");
  });

  it("requires a previous merge, a declared command and the current main SHA for regression", () => {
    const regressionCheck = {
      checkedSha: MAIN_SHA,
      command: "npm run test -- --run tests/homepage.test.ts",
      status: "failed" as const,
      summary: "The CTA regression reproduced",
    };
    const mergedCandidate = candidate({
      reconciliation: {
        reconciliationId: "reconcile-cta-previous",
        observedAt: "2026-07-17T18:00:00Z",
        outcome: "merged",
        terminal: true,
        reasonCodes: ["merged"],
        evidenceDigest: "f".repeat(64),
        expectedCandidateLastRunId: "run-delivery",
      },
    });
    expect(reconcile({ candidate: mergedCandidate, regressionCheck })).toMatchObject({
      outcome: "regressed",
      terminal: false,
    });
    expect(reconcile({ regressionCheck }).outcome).toBe("evidence_mismatch");
    expect(reconcile({
      candidate: mergedCandidate,
      regressionCheck: { ...regressionCheck, checkedSha: "d".repeat(40) },
    }).outcome).toBe("evidence_mismatch");
  });

  it("persists immutable reconciliation evidence and closes the derived finding", () => {
    const memoryRoot = root();
    recordRun(report(), { root: memoryRoot, now: new Date("2026-07-17T16:00:00Z") });
    const state = readMemoryState({ root: memoryRoot });
    const result = reconcile({ candidate: state.candidates[0] });
    const first = writeMemoryReconciliation(result, {
      root: memoryRoot,
      now: new Date("2026-07-18T10:01:00Z"),
    });
    const duplicate = writeMemoryReconciliation(result, {
      root: memoryRoot,
      now: new Date("2026-07-18T10:02:00Z"),
    });
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);

    const reconciled = readMemoryState({ root: memoryRoot });
    expect(reconciled.schemaVersion).toBe(6);
    expect(reconciled.candidates[0].reconciliation).toMatchObject({
      reconciliationId: "reconcile-cta-001",
      outcome: "merged",
      terminal: true,
    });
    expect(reconciled.findings[0]).toMatchObject({
      status: "merged",
      lastOutcome: "merged",
      lastReconciliationId: "reconcile-cta-001",
    });
    expect(reconciled.reconciliationIndex).toHaveLength(1);
    expect(readdirSync(join(memoryRoot, "reconciliations"))).toHaveLength(1);
  });

  it("rejects stale evidence after the candidate advances", () => {
    const memoryRoot = root();
    recordRun(report(), { root: memoryRoot, now: new Date("2026-07-17T16:00:00Z") });
    const before = readMemoryState({ root: memoryRoot });
    const result = reconcile({ candidate: before.candidates[0] });
    recordRun({
      ...report("run-closure"),
      parentRunId: "run-delivery",
      phase: "closure",
    }, { root: memoryRoot, now: new Date("2026-07-18T09:00:00Z") });
    expect(() => writeMemoryReconciliation(result, { root: memoryRoot })).toThrow(
      "advanced after evidence was collected",
    );
    expect(readdirSync(join(memoryRoot, "reconciliations"))).toHaveLength(0);
  });
});
