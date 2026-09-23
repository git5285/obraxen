import { expectedScheduledAttentionClass } from "./attention.mjs";
import { stableDigest, normalized } from "./memory-values.mjs";

function findingKeys(finding) {
  const candidatePaths = [...finding.candidatePaths].map(normalized).sort();
  const scopeKey = stableDigest({ domain: finding.domain, candidatePaths });
  const fingerprint = stableDigest({
    domain: finding.domain,
    candidatePaths,
    summary: normalized(finding.summary),
  });
  return { scopeKey, fingerprint };
}

const PHASE_ORDER = new Map([
  ["discovery", 0],
  ["implementation", 1],
  ["review", 2],
  ["delivery", 3],
  ["closure", 4],
]);

export function validateCandidateLink(state, report) {
  if (!report.selectedFinding) return;
  const existing = state.candidates.find((candidate) => candidate.candidateId === report.candidateId);
  if (!existing) {
    if (report.parentRunId !== null) {
      throw new Error("a new candidate requires parentRunId null");
    }
    return;
  }
  if (report.parentRunId !== existing.lastRunId) {
    throw new Error(`candidate ${report.candidateId} requires parentRunId ${existing.lastRunId}`);
  }
  const { scopeKey } = findingKeys(report.selectedFinding);
  if (scopeKey !== existing.scopeKey) {
    throw new Error(`candidate ${report.candidateId} cannot change finding scope`);
  }
  if (
    existing.lastAttentionClass !== null
    && existing.lastAttentionClass !== report.attentionClass
  ) {
    throw new Error(`candidate ${report.candidateId} cannot change attention class`);
  }
  if (PHASE_ORDER.get(report.phase) < PHASE_ORDER.get(existing.currentPhase)) {
    throw new Error(`candidate ${report.candidateId} cannot move backwards from ${existing.currentPhase}`);
  }
  if (
    existing.pullRequest
    && report.pullRequest
    && (
      existing.pullRequest.number !== report.pullRequest.number
      || existing.pullRequest.url !== report.pullRequest.url
    )
  ) {
    throw new Error(`candidate ${report.candidateId} cannot change pullRequest identity`);
  }
}

function updateCandidate(state, report, recordedAt, policy) {
  if (!report.selectedFinding) return;
  const { scopeKey } = findingKeys(report.selectedFinding);
  let candidate = state.candidates.find((item) => item.candidateId === report.candidateId);
  if (!candidate) {
    candidate = {
      candidateId: report.candidateId,
      scopeKey,
      domain: report.selectedFinding.domain,
      summary: report.selectedFinding.summary,
      candidatePaths: [...report.selectedFinding.candidatePaths],
      verification: [...report.selectedFinding.verification],
      firstRunId: report.runId,
      lastRunId: report.runId,
      firstRunOrigin: report.runOrigin,
      lastRunOrigin: report.runOrigin,
      firstAttentionClass: report.attentionClass,
      lastAttentionClass: report.attentionClass,
      firstRuntimeFingerprint: report.runtimeFingerprint,
      lastRuntimeFingerprint: report.runtimeFingerprint,
      firstSeenAt: recordedAt,
      lastSeenAt: recordedAt,
      currentPhase: report.phase,
      finalCommit: null,
      pullRequest: null,
      reviewDecision: null,
      reconciliation: null,
      phases: [],
    };
    state.candidates.push(candidate);
    state.candidateMetrics.lifetimeCount += 1;
    state.candidateMetrics.byInitialOrigin[report.runOrigin] += 1;
  }
  candidate.summary = report.selectedFinding.summary;
  candidate.candidatePaths = [...report.selectedFinding.candidatePaths];
  candidate.verification = [...report.selectedFinding.verification];
  candidate.lastRunId = report.runId;
  candidate.lastRunOrigin = report.runOrigin;
  candidate.firstAttentionClass ??= report.attentionClass;
  candidate.lastAttentionClass = report.attentionClass;
  candidate.lastRuntimeFingerprint = report.runtimeFingerprint;
  candidate.lastSeenAt = recordedAt;
  candidate.currentPhase = report.phase;
  candidate.finalCommit = report.finalCommit ?? candidate.finalCommit;
  candidate.pullRequest = report.pullRequest ?? candidate.pullRequest;
  candidate.reviewDecision = report.reviewDecision ?? candidate.reviewDecision;
  candidate.phases.push({
    runId: report.runId,
    parentRunId: report.parentRunId,
    runOrigin: report.runOrigin,
    attentionClass: report.attentionClass,
    trigger: report.trigger,
    phase: report.phase,
    status: report.status,
    baseSha: report.baseSha,
    runtimeFingerprint: report.runtimeFingerprint,
    recordedAt,
    finalCommit: report.finalCommit,
    pullRequest: report.pullRequest,
    reviewDecision: report.reviewDecision,
  });
  candidate.phases = candidate.phases.slice(-policy.memory.maxEpisodicRuns);
  state.candidates.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  state.candidates = state.candidates.slice(0, policy.memory.maxEpisodicRuns);
}

function updateFinding(state, report, recordedAt, policy) {
  if (!report.selectedFinding) return;
  const finding = report.selectedFinding;
  const { scopeKey, fingerprint } = findingKeys(finding);
  const evidenceSources = [...new Set(finding.evidence.map((item) => item.source))].slice(0, 12);
  const existing = state.findings.find((item) => item.scopeKey === scopeKey);
  const actionState = report.status === "draft_pr"
    ? "pending_pr"
    : report.status === "local_diff"
      ? "addressed_local"
      : "observed";
  if (existing) {
    existing.fingerprint = fingerprint;
    existing.summary = finding.summary;
    existing.attentionClass = report.attentionClass;
    existing.candidatePaths = [...finding.candidatePaths];
    existing.evidenceSources = evidenceSources;
    existing.lastSeenAt = recordedAt;
    existing.lastBaseSha = report.baseSha;
    if (!existing.candidateIds.includes(report.candidateId)) {
      existing.candidateIds.push(report.candidateId);
      existing.candidateIds = existing.candidateIds.slice(-policy.memory.maxEpisodicRuns);
      existing.occurrences += 1;
    }
    existing.lastCandidateId = report.candidateId;
    existing.lastOutcome = actionState;
    existing.lastRunId = report.runId;
  } else {
    state.findings.push({
      scopeKey,
      fingerprint,
      domain: finding.domain,
      attentionClass: report.attentionClass,
      summary: finding.summary,
      candidatePaths: [...finding.candidatePaths],
      evidenceSources,
      firstSeenAt: recordedAt,
      lastSeenAt: recordedAt,
      lastBaseSha: report.baseSha,
      occurrences: 1,
      candidateIds: [report.candidateId],
      lastCandidateId: report.candidateId,
      status: "open",
      lastOutcome: actionState,
      lastRunId: report.runId,
      lastReconciledAt: null,
      lastReconciliationId: null,
    });
  }
  state.findings.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  state.findings = state.findings.slice(0, policy.memory.maxOpenFindings);
}

function updateRuleProposals(state, report, recordedAt, policy) {
  for (const proposal of report.learned_rules) {
    const fingerprint = stableDigest({ rule: normalized(proposal.rule), source: normalized(proposal.source) });
    const existing = state.proposedRules.find((item) => item.fingerprint === fingerprint);
    if (existing) {
      existing.lastSeenAt = recordedAt;
      existing.lastRunId = report.runId;
      existing.occurrences += 1;
      continue;
    }
    state.proposedRules.push({
      fingerprint,
      rule: proposal.rule,
      source: proposal.source,
      reason: proposal.reason,
      status: "quarantined_proposal",
      firstSeenAt: recordedAt,
      lastSeenAt: recordedAt,
      lastRunId: report.runId,
      occurrences: 1,
    });
  }
  state.proposedRules.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  state.proposedRules = state.proposedRules.slice(0, policy.memory.maxProposedRules);
}

function updateUsageTotals(totals, usage) {
  if (usage.totalTokens === null && usage.costUsd === null && usage.durationMs === null) return;
  totals.measuredRuns += 1;
  totals.totalInputTokens += usage.inputTokens ?? 0;
  totals.totalOutputTokens += usage.outputTokens ?? 0;
  totals.totalTokens += usage.totalTokens ?? 0;
  totals.totalCostUsd = Number((totals.totalCostUsd + (usage.costUsd ?? 0)).toFixed(8));
  totals.totalDurationMs += usage.durationMs ?? 0;
}

function updateOriginMetrics(state, report) {
  const metrics = state.runOrigins[report.runOrigin];
  metrics.lifetimeRuns += 1;
  metrics.byStatus[report.status] = (metrics.byStatus[report.status] ?? 0) + 1;
  updateUsageTotals(metrics.usage, report.usage);
}

function updateUsage(state, usage) {
  updateUsageTotals(state.usage, usage);
}

function isScheduledCycle(report) {
  return report.runOrigin === "scheduled_autonomous" && report.trigger === "scheduled_cycle";
}

export function validateAttentionSlot(state, report, policy) {
  if (!isScheduledCycle(report)) return;
  const expected = expectedScheduledAttentionClass(state.attention.scheduledCycles, policy);
  if (report.attentionClass !== expected) {
    throw new Error(
      `scheduled attention slot requires ${expected}, received ${report.attentionClass}`,
    );
  }
}

function updateAttention(state, report, recordedAt, policy) {
  state.attention.operationalByClass[report.attentionClass] += 1;
  if (!isScheduledCycle(report)) return;
  state.attention.scheduledCycles += 1;
  state.attention.scheduledByClass[report.attentionClass] += 1;
  state.attention.recentScheduled.push({
    runId: report.runId,
    attentionClass: report.attentionClass,
    status: report.status,
    recordedAt,
  });
  state.attention.recentScheduled = state.attention.recentScheduled.slice(
    -policy.memory.maxEpisodicRuns,
  );
}

export function applyRunToState(state, report, recordedAt, digest, recordName, policy) {
  state.updatedAt = recordedAt;
  state.runs.lifetimeCount += 1;
  state.runs.lastRunId = report.runId;
  state.runs.lastRunAt = recordedAt;
  state.runs.byStatus[report.status] = (state.runs.byStatus[report.status] ?? 0) + 1;
  state.recentRuns.push({
    runId: report.runId,
    recordedAt,
    baseSha: report.baseSha,
    runtimeFingerprint: report.runtimeFingerprint,
    mode: report.mode,
    runOrigin: report.runOrigin,
    attentionClass: report.attentionClass,
    status: report.status,
    candidateId: report.candidateId,
    parentRunId: report.parentRunId,
    trigger: report.trigger,
    phase: report.phase,
    finalCommit: report.finalCommit,
    pullRequest: report.pullRequest,
    reviewDecision: report.reviewDecision,
    selectedFinding: report.selectedFinding
      ? {
          domain: report.selectedFinding.domain,
          summary: report.selectedFinding.summary,
          candidatePaths: report.selectedFinding.candidatePaths,
        }
      : null,
    changedPaths: report.changedPaths,
    externalAction: report.externalAction,
    auditorVerdict: report.auditorVerdict,
  });
  state.recentRuns = state.recentRuns.slice(-policy.memory.maxEpisodicRuns);
  state.runIndex.push({
    runId: report.runId,
    candidateId: report.candidateId,
    parentRunId: report.parentRunId,
    runOrigin: report.runOrigin,
    attentionClass: report.attentionClass,
    runtimeFingerprint: report.runtimeFingerprint,
    phase: report.phase,
    digest,
    recordPath: recordName,
    recordedAt,
  });
  state.runIndex = state.runIndex.slice(-(policy.memory.maxEpisodicRuns * 4));
  updateOriginMetrics(state, report);
  updateAttention(state, report, recordedAt, policy);
  updateCandidate(state, report, recordedAt, policy);
  updateFinding(state, report, recordedAt, policy);
  updateRuleProposals(state, report, recordedAt, policy);
  updateUsage(state, report.usage);
}
