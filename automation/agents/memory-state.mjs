import { ATTENTION_CLASSES } from "./attention.mjs";

const RUN_ORIGINS = [
  "scheduled_autonomous",
  "human_directed",
  "control_plane_maintenance",
  "delivery",
  "unknown",
];

export function initialUsage() {
  return { measuredRuns: 0, totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0, totalCostUsd: 0, totalDurationMs: 0 };
}

export function initialOriginMetrics() {
  return Object.fromEntries(RUN_ORIGINS.map((origin) => [origin, { lifetimeRuns: 0, byStatus: {}, usage: initialUsage() }]));
}

export function initialCandidateOrigins() {
  return Object.fromEntries(RUN_ORIGINS.map((origin) => [origin, 0]));
}

export function initialAttention() {
  const counts = (includeUnknown = false) => Object.fromEntries([
    ...ATTENTION_CLASSES.map((attentionClass) => [attentionClass, 0]),
    ...(includeUnknown ? [["unknown", 0]] : []),
  ]);
  return { scheduledCycles: 0, scheduledByClass: counts(), operationalByClass: counts(true), recentScheduled: [] };
}

export function initialMemoryState() {
  return {
    schemaVersion: 6,
    updatedAt: null,
    runs: { lifetimeCount: 0, retainedCount: 0, lastRunId: null, lastRunAt: null, byStatus: {} },
    usage: initialUsage(), runOrigins: initialOriginMetrics(), attention: initialAttention(), recentRuns: [], runIndex: [],
    candidateMetrics: { lifetimeCount: 0, byInitialOrigin: initialCandidateOrigins() },
    candidates: [], findings: [], proposedRules: [], reconciliationIndex: [],
  };
}
