import type { AgentPolicy } from "./policy.mjs";
import type { RunReport } from "./contracts.mjs";

export interface MemoryPaths {
  root: string;
  runs: string;
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
  summary: string;
  candidatePaths: string[];
  evidenceSources: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  lastBaseSha: string;
  occurrences: number;
  status: string;
  lastOutcome: string;
  lastRunId: string;
}

export interface MemoryState {
  schemaVersion: 1;
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
  recentRuns: Array<Record<string, unknown>>;
  runIndex: Array<Record<string, unknown>>;
  findings: MemoryFinding[];
  proposedRules: Array<Record<string, unknown>>;
}

export interface MemoryContextFinding {
  scopeKey: string;
  domain: string;
  summary: string;
  candidatePaths: string[];
  evidenceSources: string[];
  occurrences: number;
  lastSeenAt: string;
  lastOutcome: string;
  needsRevalidation: boolean;
}

export interface MemoryContextPack {
  schemaVersion: 1;
  generatedAt: string;
  baseSha: string;
  query: string | null;
  authoritativeSources: string[];
  securityNotice: string;
  recentRuns: Array<Record<string, unknown>>;
  openFindings: MemoryContextFinding[];
  quarantinedRuleProposalCount: number;
  metrics: {
    lifetimeRuns: number;
    retainedRuns: number;
    measuredRuns: number;
    totalTokens: number;
    totalCostUsd: number;
    totalDurationMs: number;
  };
  truncated: boolean;
}

export function getMemoryPaths(repo?: string, rootOverride?: string | null): MemoryPaths;
export function readMemoryState(options?: MemoryOptions): MemoryState;
export function recordRun(
  report: RunReport,
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
