import type { AgentPolicy } from "./policy.mjs";
import type { AttentionClass } from "./attention.mjs";

export interface ScoutOutput {
  schemaVersion: 4;
  status: "no_op" | "proposal" | "blocked";
  attentionClass: AttentionClass;
  baseSha: string;
  runtimeFingerprint: string;
  activeClaims: unknown[];
  findings: unknown[];
  recommendedId: string | null;
  reason: string;
}

export interface BuilderOutput {
  schemaVersion: 4;
  status: "implemented" | "no_op" | "blocked";
  attentionClass: AttentionClass;
  runId: string;
  candidateId: string;
  baseSha: string;
  runtimeFingerprint: string;
  changedPaths: string[];
  checksRun: unknown[];
  residualRisks: unknown[];
  reason: string;
}

export interface AuditorOutput {
  schemaVersion: 4;
  verdict: "pass" | "veto" | "needs_human";
  attentionClass: AttentionClass;
  runId: string;
  candidateId: string;
  baseSha: string;
  runtimeFingerprint: string;
  findings: unknown[];
  verifiedChecks: unknown[];
  reason: string;
}

export type CandidateTrigger =
  | "scheduled_cycle"
  | "human_request"
  | "candidate_follow_up"
  | "delivery_event";

export type RunOrigin =
  | "scheduled_autonomous"
  | "human_directed"
  | "control_plane_maintenance"
  | "delivery";

export type CandidatePhase =
  | "discovery"
  | "implementation"
  | "review"
  | "delivery"
  | "closure";

export type ReviewDecision =
  | "approved"
  | "changes_requested"
  | "rejected"
  | "superseded";

export interface PullRequestReference {
  number: number;
  url: string;
}

export type TypedEvidence =
  | { kind: "repository_fact" | "command_result"; source: string; fact: string }
  | { kind: "human_declaration"; source: string; statement: string }
  | { kind: "document_reference"; source: string; documentId: string; fact: string }
  | {
      kind: "professional_review";
      source: string;
      reviewId: string;
      reviewer: string;
      reviewedAt: string;
      decision: "approved" | "changes_requested" | "rejected";
      fact: string;
    };

export interface RunReport {
  schemaVersion: 6;
  status: "no_op" | "shadow_finding" | "blocked" | "local_diff" | "draft_pr";
  mode: "shadow" | "active" | "disabled";
  runOrigin: RunOrigin;
  attentionClass: AttentionClass;
  runId: string;
  baseSha: string;
  runtimeFingerprint: string;
  candidateId: string | null;
  parentRunId: string | null;
  trigger: CandidateTrigger;
  phase: CandidatePhase | null;
  finalCommit: string | null;
  pullRequest: PullRequestReference | null;
  reviewDecision: ReviewDecision | null;
  selectedFinding: null | Record<string, unknown>;
  activeConflicts: string[];
  policyBlockers: string[];
  changedPaths: string[];
  checks: Array<Record<string, unknown>>;
  auditorVerdict: null | "pass" | "veto" | "needs_human";
  externalAction: "none" | "local_diff" | "draft_pr";
  learned_rules: Array<Record<string, unknown>>;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    costUsd: number | null;
    durationMs: number | null;
  };
  traceId: string | null;
  reason: string;
}

export function validateScoutOutput(value: ScoutOutput, policy?: AgentPolicy): ScoutOutput;
export function validateBuilderOutput(value: BuilderOutput): BuilderOutput;
export function validateAuditorOutput(value: AuditorOutput): AuditorOutput;
export function validateRunReport(value: unknown, policy?: AgentPolicy): RunReport;
export function parseRoleOutput(role: "scout", text: string): ScoutOutput;
export function parseRoleOutput(role: "builder", text: string): BuilderOutput;
export function parseRoleOutput(role: "auditor", text: string): AuditorOutput;
