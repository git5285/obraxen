export interface ParsedClaim {
  source: string;
  worktree: string;
  threadId: string;
  state: string;
  files: string[];
}

export interface GatingInput {
  policy: {
    mode: string;
    limits?: { maxPendingLocalDiffs: number };
    authority: { allowScout: boolean; allowLocalDiff: boolean };
  };
  lease: unknown;
  worktrees: Array<{ path: string; status?: string[] }>;
  activeClaims?: ParsedClaim[];
  claimFailures?: Array<{ path: string; reason: string }>;
}

export interface Gating {
  unreadableWorktrees: string[];
  pendingLocalDiffs: ParsedClaim[];
  eligibility: { scout: boolean; writer: boolean };
  blockers: string[];
}

export function parseWorktrees(output: string): Array<Record<string, string | true>>;
export function parseClaim(text: string, source: string, worktree: string): ParsedClaim;
export function readClaims(worktree: string): ParsedClaim[];
export function deriveGating(input: GatingInput): Gating;
export function buildPreflight(repo?: string): Record<string, unknown>;
