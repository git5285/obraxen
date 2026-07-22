import type { AgentPolicy } from "./policy.mjs";
import type { MemoryCandidate } from "./memory.mjs";

export type ReconciliationOutcome =
  | "unreconciled"
  | "local_diff"
  | "committed_local"
  | "needs_remote"
  | "pr_draft"
  | "checks_pending"
  | "checks_failed"
  | "review_pending"
  | "changes_requested"
  | "ready_for_human_merge"
  | "merged"
  | "rejected"
  | "superseded"
  | "regressed"
  | "needs_human"
  | "evidence_mismatch"
  | "local_state_stale";

export interface PullRequestViewEvidence {
  baseRefName: string;
  closedAt: string | null;
  headRefOid: string;
  isDraft: boolean;
  mergeCommit: { oid: string } | null;
  mergedAt: string | null;
  number: number;
  reviewDecision: "" | "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;
  state: "OPEN" | "CLOSED" | "MERGED";
  url: string;
}

export interface PullRequestCheckEvidence {
  bucket: "pass" | "fail" | "pending" | "skipping" | "cancel";
  link: string;
  name: string;
  state: string;
  workflow: string;
}

export interface RegressionCheckEvidence {
  checkedSha: string;
  command: string;
  status: "passed" | "failed";
  summary: string;
}

export interface GitCommitEvidence {
  declaredSha: string | null;
  exists: boolean | null;
  isAncestorOfDefaultBranch: boolean | null;
}

export interface GitEvidence {
  repo: string;
  headSha: string;
  branch: string | null;
  defaultBranch: string;
  defaultBranchSha: string;
  finalCommit: GitCommitEvidence;
  mergeCommit: GitCommitEvidence;
}

export interface MemoryReconciliation {
  schemaVersion: 1;
  reconciliationId: string;
  candidateId: string;
  expectedCandidateLastRunId: string;
  observedAt: string;
  outcome: ReconciliationOutcome;
  terminal: boolean;
  reasonCodes: string[];
  evidence: {
    git: GitEvidence;
    pullRequest: PullRequestViewEvidence | null;
    checks: PullRequestCheckEvidence[];
    requiredChecks: Array<{ name: string; status: string; matches: PullRequestCheckEvidence[] }>;
    regressionCheck: RegressionCheckEvidence | null;
  };
  evidenceDigest: string;
}

export function validatePullRequestView(value: unknown): PullRequestViewEvidence;
export function validatePullRequestChecks(value: unknown): PullRequestCheckEvidence[];
export function validateRegressionCheck(value: unknown): RegressionCheckEvidence | null;
export function collectGitEvidence(options: {
  repo?: string;
  candidate: MemoryCandidate;
  pullRequest: PullRequestViewEvidence | null;
  defaultBranch: string;
}): GitEvidence;
export function buildReconciliation(options: {
  candidate: MemoryCandidate;
  reconciliationId: string;
  observedAt: string;
  gitEvidence: GitEvidence;
  pullRequest?: PullRequestViewEvidence | null;
  checks?: PullRequestCheckEvidence[];
  regressionCheck?: RegressionCheckEvidence | null;
  policy?: AgentPolicy;
}): MemoryReconciliation;
