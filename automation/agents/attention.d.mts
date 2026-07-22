import type { AgentPolicy } from "./policy.mjs";

export type AttentionClass = "product" | "reliability" | "agent_maintenance";

export interface AttentionState {
  scheduledCycles: number;
  scheduledByClass: Record<AttentionClass, number>;
  operationalByClass: Record<AttentionClass | "unknown", number>;
  recentScheduled: Array<{
    runId: string;
    attentionClass: AttentionClass;
    status: string;
    recordedAt: string;
  }>;
}

export interface AttentionBudgetSnapshot {
  schemaVersion: 1;
  sequence: AttentionClass[];
  windowSize: number;
  targetCounts: Record<AttentionClass, number>;
  targetPercentages: Record<AttentionClass, number>;
  scheduledCycles: number;
  completedWindows: number;
  cursor: number;
  nextScheduledClass: AttentionClass;
  scheduledByClass: Record<AttentionClass, number>;
  operationalByClass: Record<AttentionClass | "unknown", number>;
  recentScheduled: AttentionState["recentScheduled"];
}

export const ATTENTION_CLASSES: readonly AttentionClass[];
export function classifyFindingAttention(
  finding: { domain?: string; candidatePaths?: string[] },
  policy?: AgentPolicy,
): AttentionClass;
export function countAttentionSequence(policy?: AgentPolicy): Record<AttentionClass, number>;
export function expectedScheduledAttentionClass(
  scheduledCycles: number,
  policy?: AgentPolicy,
): AttentionClass;
export function buildAttentionBudgetSnapshot(
  attention: AttentionState,
  policy?: AgentPolicy,
): AttentionBudgetSnapshot;
