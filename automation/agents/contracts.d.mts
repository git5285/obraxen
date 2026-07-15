import type { AgentPolicy } from "./policy.mjs";

export interface ScoutOutput {
  schemaVersion: 1;
  status: "no_op" | "proposal" | "blocked";
  baseSha: string;
  activeClaims: unknown[];
  findings: unknown[];
  recommendedId: string | null;
  reason: string;
}

export interface BuilderOutput {
  schemaVersion: 1;
  status: "implemented" | "no_op" | "blocked";
  runId: string;
  baseSha: string;
  changedPaths: string[];
  checksRun: unknown[];
  residualRisks: unknown[];
  reason: string;
}

export interface AuditorOutput {
  schemaVersion: 1;
  verdict: "pass" | "veto" | "needs_human";
  runId: string;
  baseSha: string;
  findings: unknown[];
  verifiedChecks: unknown[];
  reason: string;
}

export function validateScoutOutput(value: ScoutOutput, policy?: AgentPolicy): ScoutOutput;
export function validateBuilderOutput(value: BuilderOutput): BuilderOutput;
export function validateAuditorOutput(value: AuditorOutput): AuditorOutput;
export function parseRoleOutput(role: "scout", text: string): ScoutOutput;
export function parseRoleOutput(role: "builder", text: string): BuilderOutput;
export function parseRoleOutput(role: "auditor", text: string): AuditorOutput;
