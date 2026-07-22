import type { ParsedClaim } from "./claims.mjs";
import type { OperationalClaimState } from "./operations.mjs";
import type { RuntimeInspection } from "./runtime.mjs";

export type { ParsedClaim } from "./claims.mjs";

export interface GatingInput {
  policy: {
    project?: string;
    mode: string;
    coordination?: { stateHome: string };
    limits?: {
      maxConcurrentWriters?: number;
      maxPendingLocalDiffs?: number;
    };
    authority: { allowScout: boolean; allowLocalDiff: boolean };
  };
  lease: unknown;
  worktrees: Array<{ path: string; status?: string[] }>;
  activeClaims?: ParsedClaim[];
  claimFailures?: Array<{ path: string; reason: string }>;
  coordinationFailures?: Array<{ path: string; reason: string }>;
  cloneFailures?: Array<{ path: string; reason: string }>;
  legacyLeases?: Array<{ clone: string; owner: unknown }>;
  runtime?: RuntimeInspection | { ok: boolean };
}

export interface Gating {
  unreadableWorktrees: string[];
  pendingLocalDiffs: ParsedClaim[];
  activeWriterClaims: ParsedClaim[];
  unknownStateClaims: ParsedClaim[];
  unscopedActiveClaims: ParsedClaim[];
  eligibility: { scout: boolean; writer: boolean };
  blockers: string[];
}

export function parseWorktrees(output: string): Array<Record<string, string | true>>;
export function parseClaim(text: string, source: string, worktree: string): ParsedClaim;
export function readClaims(worktree: string): ParsedClaim[];
export function applyOperationalClaimStates(
  claims: ParsedClaim[],
  operationalClaims: OperationalClaimState[],
): { claims: ParsedClaim[]; failures: Array<{ path: string; reason: string }> };
export function deriveGating(input: GatingInput): Gating;
export function buildPreflight(
  repo?: string,
  policy?: GatingInput["policy"],
  options?: { stateHome?: string | null; now?: Date; runtime?: RuntimeInspection },
): Record<string, unknown>;
