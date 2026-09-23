import type { OperationalClaimState } from "./operations.mjs";

export interface WorktreeChange {
  status: string;
  path: string;
  originalPath: string | null;
}

export interface ControlWorktree {
  path: string;
  head: string | null;
  branch: string | null;
  detached: boolean;
  changes: WorktreeChange[];
  changedPaths: string[];
  rootRedirect: string | null;
}

export interface ReviewTarget {
  state: "ready" | "ambiguous" | "unresolved";
  reason: string;
  candidates: Array<Pick<ControlWorktree, "path" | "branch" | "head" | "changedPaths">>;
  ownerThreadId: string | null;
  worktree: string | null;
  branch: string | null;
  head: string | null;
  route: string | null;
  url: string | null;
}

export interface ActiveControlClaim {
  threadId: string;
  state: string;
  claim: { source: string; contentDigest: string; files: string[] };
  worktree?: string;
  operationalEventId?: string | null;
}

export function parsePorcelainStatus(output: string | Buffer): WorktreeChange[];
export function parseWorktreeList(output: string): Array<Pick<ControlWorktree, "path" | "head" | "branch" | "detached">>;
export function extractRootRedirect(configText: string): string | null;
export function deriveReviewRoute(input: {
  devCommand: string | null | undefined;
  legacyRedirect: string | null;
  hasPublicHome: boolean;
}): string | null;
export function pathIsCovered(path: string, reservedPath: string): boolean;
export function classifyControlChange(
  change: WorktreeChange,
  activeClaims: Array<OperationalClaimState | ActiveControlClaim>,
): WorktreeChange & {
  coordination: boolean;
  ownership: Array<{ threadId: string; state: string }>;
  classification: "active_claim" | "no_active_claim";
};
export function classifyCandidateOwnership(input: {
  controlPath: string;
  worktrees: ControlWorktree[];
  activeClaims: Array<OperationalClaimState | ActiveControlClaim>;
}): Array<{
  path: string;
  branch: string | null;
  head: string | null;
  changedPathCount: number;
  uncoveredPaths: string[];
  ownerThreadIds: string[];
  fullyCovered: boolean;
  singleOwner: boolean;
}>;
export function deriveReviewTarget(input: {
  controlPath: string;
  worktrees: ControlWorktree[];
  activeClaims: Array<OperationalClaimState | ActiveControlClaim>;
  scanFailures?: Array<{ path: string; reason: string }>;
  port?: number | null;
}): ReviewTarget;
export function deriveControllerOwner(input: {
  controlPath: string;
  worktrees: ControlWorktree[];
  activeClaims: Array<OperationalClaimState | ActiveControlClaim>;
}): string | null;
export function deriveAutomationOwnership(reviewTarget: ReviewTarget, controllerOwner?: string | null): {
  ownerThreadId: string | null;
  ownerSource: "active_candidate_claims" | "unassigned";
  schedulerState: "external_uninspected";
  activationAuthorized: false;
  triggerRequirements: string[];
  stopConditions: string[];
};
export function deriveServerStatus(pid: number | null, cwd: string | null, targetPath: string | null): {
  state: "not_checked" | "verified" | "mismatch";
  pid: number | null;
  cwd: string | null;
  requiredCwd: string | null;
};
export function buildControlSurface(repo?: string, options?: {
  now?: Date;
  pid?: number | null;
  port?: number | null;
  stateHome?: string | null;
}): unknown;
