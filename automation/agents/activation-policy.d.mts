import type { AgentPolicy } from "./policy.mjs";

export interface ActivationReport {
  schemaVersion: number;
  decision: "NO-GO" | "READY_FOR_PROTECTED_CANDIDATE";
  candidateAuditRequired: boolean;
  publicationAuthorized: boolean;
  publishSwitch: boolean;
  blockerCount: number;
  blockers: string[];
}

export function validateActivationReport(report: ActivationReport, policy?: AgentPolicy): ActivationReport;
export function parseActivationCommand(
  result: { status: number | null; stdout: string; stderr?: string },
  policy?: AgentPolicy,
): ActivationReport;
export function assertActivationUnchanged(
  before: ActivationReport,
  after: ActivationReport,
  policy?: AgentPolicy,
): true;
