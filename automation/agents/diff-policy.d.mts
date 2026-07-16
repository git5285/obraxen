import type { AgentPolicy } from "./policy.mjs";

export interface DiffInput {
  changedPaths: string[];
  allowedPaths: string[];
  addedLines: number;
  deletedLines: number;
}

export interface DiffResult {
  ok: boolean;
  violations: string[];
  changedPaths: string[];
}

export function validateDiff(input: DiffInput, policy?: AgentPolicy): DiffResult;
