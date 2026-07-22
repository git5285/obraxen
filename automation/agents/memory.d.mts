import type { AgentPolicy } from "./policy.mjs";
import type { AttentionBudgetSnapshot, AttentionClass, AttentionState } from "./attention.mjs";
import type {
  CandidatePhase,
  CandidateTrigger,
  PullRequestReference,
  ReviewDecision,
  RunReport,
  RunOrigin,
} from "./contracts.mjs";
import type { MemoryReconciliation, ReconciliationOutcome } from "./reconcile.mjs";

export interface MemoryPaths {
  root: string;
  runs: string;
  reconciliations: string;
  state: string;
  lock: string;
}

export interface MemoryOptions {
  repo?: string;
  root?: string | null;
}

export interface MemoryFinding {
  scopeKey: string;
  fingerprint: string;
  domain: string;
  attentionClass: AttentionClass | null;
  summary: string;
  candidatePaths: string[];
  evidenceSources: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  lastBaseSha: string;
  occurrences: number;
  candidateIds: string[];
  lastCandidateId: string | null;
  status: string;
  lastOutcome: string;
  lastRunId: string;
  lastReconciledAt: string | null;
  lastReconciliationId: string | null;
}

export interface MemoryState {
  schemaVersion: 6;
  updatedAt: string | null;
  runs: {
    lifetimeCount: number;
    retainedCount: number;
    lastRunId: string | null;
    lastRunAt: string | null;
    byStatus: Record<string, number>;
  };
  usage: {
    measuredRuns: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUsd: number;
    totalDurationMs: number;
  };
  runOrigins: Record<RunOrigin | "unknown", MemoryOriginMetrics>;
  attention: AttentionState;
  recentRuns: Array<Record<string, unknown>>;
  runIndex: Array<Record<string, unknown>>;
  candidateMetrics: {
    lifetimeCount: number;
    byInitialOrigin: Record<RunOrigin | "unknown", number>;
  };
  candidates: MemoryCandidate[];
  findings: MemoryFinding[];
  proposedRules: Array<Record<string, unknown>>;
  reconciliationIndex: Array<Record<string, unknown>>;
}

export interface MemoryCandidatePhase {
  runId: string;
  parentRunId: string | null;
  runOrigin: RunOrigin | "unknown";
  attentionClass: AttentionClass | null;
  trigger: CandidateTrigger;
  phase: CandidatePhase;
  status: RunReport["status"];
  baseSha: string;
  runtimeFingerprint: string | null;
  recordedAt: string;
  finalCommit: string | null;
  pullRequest: PullRequestReference | null;
  reviewDecision: ReviewDecision | null;
}

export interface MemoryCandidate {
  candidateId: string;
  scopeKey: string;
  domain: string;
  summary: string;
  candidatePaths: string[];
  verification: string[];
  firstRunId: string;
  lastRunId: string;
  firstRunOrigin: RunOrigin | "unknown";
  lastRunOrigin: RunOrigin | "unknown";
  firstAttentionClass: AttentionClass | null;
  lastAttentionClass: AttentionClass | null;
  firstRuntimeFingerprint: string | null;
  lastRuntimeFingerprint: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  currentPhase: CandidatePhase;
  finalCommit: string | null;
  pullRequest: PullRequestReference | null;
  reviewDecision: ReviewDecision | null;
  reconciliation: MemoryCandidateReconciliation | null;
  phases: MemoryCandidatePhase[];
}

export interface MemoryCandidateReconciliation {
  reconciliationId: string;
  expectedCandidateLastRunId: string;
  observedAt: string;
  outcome: ReconciliationOutcome;
  terminal: boolean;
  reasonCodes: string[];
  evidenceDigest: string;
}

export interface MemoryContextFinding {
  scopeKey: string;
  status: "open" | "regressed";
  domain: string;
  attentionClass: AttentionClass;
  summary: string;
  candidatePaths: string[];
  evidenceSources: string[];
  occurrences: number;
  knownCandidateCount: number;
  lastCandidateId: string | null;
  lastSeenAt: string;
  lastOutcome: string;
  needsRevalidation: boolean;
}

export interface MemoryContextPack {
  schemaVersion: 6;
  generatedAt: string;
  baseSha: string;
  query: string | null;
  authoritativeSources: string[];
  securityNotice: string;
  recentRuns: Array<Record<string, unknown>>;
  recentCandidates: Array<Record<string, unknown>>;
  openFindings: MemoryContextFinding[];
  attentionBudget: AttentionBudgetSnapshot;
  quarantinedRuleProposalCount: number;
  metrics: {
    operational: Record<string, number>;
    activityByOrigin: Record<RunOrigin | "unknown", MemoryOriginMetrics>;
    autonomousEffectiveness: Record<string, unknown>;
  };
  truncated: boolean;
}

export interface MemoryOriginMetrics {
  lifetimeRuns: number;
  byStatus: Record<string, number>;
  usage: {
    measuredRuns: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUsd: number;
    totalDurationMs: number;
  };
}

export function getMemoryPaths(repo?: string, rootOverride?: string | null): MemoryPaths;
export function readMemoryState(options?: MemoryOptions): MemoryState;
export function recordRun(
  report: RunReport,
  options?: MemoryOptions & { now?: Date; policy?: AgentPolicy },
): { duplicate: boolean; recordPath: string; state: MemoryState };
export function writeMemoryReconciliation(
  reconciliation: MemoryReconciliation,
  options?: MemoryOptions & { now?: Date; policy?: AgentPolicy },
): { duplicate: boolean; recordPath: string; state: MemoryState };
export function buildContextPack(
  options?: MemoryOptions & {
    baseSha?: string | null;
    query?: string;
    now?: Date;
    policy?: AgentPolicy;
  },
): MemoryContextPack;
