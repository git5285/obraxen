export interface BranchDiffOptions {
  repo?: string;
  baseSha?: string | null;
  baseRef?: string | null;
  head?: string;
  includeWorktree?: boolean;
}

export interface BranchDiffResult {
  baseSha: string;
  headSha: string;
  range: string;
}

export function checkBranchDiff(options?: BranchDiffOptions): BranchDiffResult;
