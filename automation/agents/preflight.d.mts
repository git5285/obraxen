export interface ParsedClaim {
  source: string;
  worktree: string;
  threadId: string;
  state: string;
  files: string[];
}

export function parseWorktrees(output: string): Array<Record<string, string | true>>;
export function parseClaim(text: string, source: string, worktree: string): ParsedClaim;
export function readClaims(worktree: string): ParsedClaim[];
export function buildPreflight(repo?: string): Record<string, unknown>;
