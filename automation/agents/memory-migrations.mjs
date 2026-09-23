import { initialAttention, initialCandidateOrigins, initialOriginMetrics, initialUsage } from "./memory-state.mjs";

function migrateV5(state) {
  const attention = initialAttention(); attention.operationalByClass.unknown = state.runs?.lifetimeCount ?? 0;
  return { ...state, schemaVersion: 6, attention, recentRuns: (state.recentRuns ?? []).map((run) => ({ ...run, attentionClass: null })), runIndex: (state.runIndex ?? []).map((run) => ({ ...run, attentionClass: null })), candidates: (state.candidates ?? []).map((candidate) => ({ ...candidate, firstAttentionClass: null, lastAttentionClass: null, phases: (candidate.phases ?? []).map((phase) => ({ ...phase, attentionClass: null })) })), findings: (state.findings ?? []).map((finding) => ({ ...finding, attentionClass: null })) };
}
function migrateV4(state) { return migrateV5({ ...state, schemaVersion: 5, recentRuns: state.recentRuns.map((run) => ({ ...run, runtimeFingerprint: null })), runIndex: state.runIndex.map((run) => ({ ...run, runtimeFingerprint: null })), candidates: state.candidates.map((candidate) => ({ ...candidate, firstRuntimeFingerprint: null, lastRuntimeFingerprint: null, phases: (candidate.phases ?? []).map((phase) => ({ ...phase, runtimeFingerprint: null })) })) }); }
function migrateV3(state) { const runOrigins = initialOriginMetrics(); runOrigins.unknown.lifetimeRuns = state.runs.lifetimeCount; runOrigins.unknown.byStatus = { ...state.runs.byStatus }; runOrigins.unknown.usage = { ...initialUsage(), ...state.usage }; const byInitialOrigin = initialCandidateOrigins(); byInitialOrigin.unknown = state.candidateMetrics.lifetimeCount; return migrateV4({ ...state, schemaVersion: 4, runOrigins, recentRuns: state.recentRuns.map((run) => ({ ...run, runOrigin: "unknown" })), runIndex: state.runIndex.map((run) => ({ ...run, runOrigin: "unknown" })), candidateMetrics: { ...state.candidateMetrics, byInitialOrigin }, candidates: state.candidates.map((candidate) => ({ ...candidate, firstRunOrigin: "unknown", lastRunOrigin: "unknown", phases: (candidate.phases ?? []).map((phase) => ({ ...phase, runOrigin: "unknown" })) })) }); }
function migrateV2(state) { return migrateV3({ ...state, schemaVersion: 3, candidates: state.candidates.map((candidate) => ({ ...candidate, verification: candidate.verification ?? [], reconciliation: candidate.reconciliation ?? null })), findings: state.findings.map((finding) => ({ ...finding, lastReconciledAt: finding.lastReconciledAt ?? null, lastReconciliationId: finding.lastReconciliationId ?? null })), reconciliationIndex: state.reconciliationIndex ?? [] }); }
function migrateV1(state) { return migrateV2({ ...state, schemaVersion: 2, recentRuns: state.recentRuns.map((run) => ({ ...run, candidateId: null, parentRunId: null, trigger: null, phase: null, finalCommit: null, pullRequest: null, reviewDecision: null })), runIndex: state.runIndex.map((run) => ({ ...run, candidateId: null, parentRunId: null, phase: null })), candidateMetrics: { lifetimeCount: 0 }, candidates: [], findings: state.findings.map((finding) => ({ ...finding, candidateIds: [], lastCandidateId: null })) }); }

export function migrateMemoryState(state) {
  if (state?.schemaVersion === 1) return migrateV1(state);
  if (state?.schemaVersion === 2) return migrateV2(state);
  if (state?.schemaVersion === 3) return migrateV3(state);
  if (state?.schemaVersion === 4) return migrateV4(state);
  if (state?.schemaVersion === 5) return migrateV5(state);
  if (state?.schemaVersion !== 6) throw new Error("memory state schemaVersion must be 1, 2, 3, 4, 5 or 6");
  return state;
}
