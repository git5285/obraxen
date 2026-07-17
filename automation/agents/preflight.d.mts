export interface ParsedClaim {
  source: string;
  worktree: string;
  threadId: string;
  state: string;
  files: string[];
  invalidFileEntries: string[];
  metadataErrors: string[];
}

export interface GatingInput {
  policy: {
    mode: string;
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
export function deriveGating(input: GatingInput): Gating;
export function buildPreflight(
  repo?: string,
  policy?: GatingInput["policy"],
  options?: { stateHome?: string | null; now?: Date },
): Record<string, unknown>;
