export interface EvaluationSummary {
  cases: number;
  passed: number;
  failed: number;
  verifiedUsefulChanges: number;
  expectedBlocks: number;
  avoidableBlocks: number;
  unclassifiedFailures: number;
  repeatedPassedChecks: number;
  totalCaseDurationMs: number;
  inputTokens: null;
  outputTokens: null;
  costUsd: null;
}

export interface EvaluationObservation {
  id: string;
  status: "passed" | "failed";
  outcome: "local_fixture_change" | "expected_block" | "no_op" | "failure" | "avoidable_block";
  usefulChangeVerified: boolean | null;
  durationMs: number;
  checks: Array<{ id: string; inputDigest: string; status: "passed" | "failed" }>;
  error?: string;
}

export function summarizeObservations(observations: unknown[]): EvaluationSummary;
export function runIntegrationSuite(): {
  schemaVersion: number;
  kind: "deterministic_integration";
  root: string;
  sourceRuntimeFingerprint: string;
  limitations: string[];
  observations: EvaluationObservation[];
  summary: EvaluationSummary;
  durationMs: number;
};
