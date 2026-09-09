import type { AgentPolicy } from "./policy.mjs";
import type { AuditorOutput } from "./contracts.mjs";

export type GroupedAuthorizationAction =
  | "commit_candidate"
  | "push_branch"
  | "create_draft_pull_request";

export type AuthorizationCheckId =
  | "local_quality"
  | "activation_unchanged"
  | "committed_diff_policy"
  | "remote_branch_matches_commit";

export interface HumanDecisionReference {
  decisionId: string;
  source: string;
  statement: string;
}

export interface GroupedAuthorizationBundle {
  schemaVersion: 1;
  authorizationId: string;
  repositoryIdentity: string;
  humanDecision: HumanDecisionReference;
  issuedAt: string;
  expiresAt: string;
  candidate: {
    candidateId: string;
    baseSha: string;
    branch: string;
    commitSha: string | null;
    allowedPaths: string[];
    activationDigest: string;
  };
  steps: Array<{
    stepId: string;
    action: GroupedAuthorizationAction;
    requiredChecks: AuthorizationCheckId[];
  }>;
}

export interface LegacyAuthorizationContext {
  schemaVersion: 1;
  candidateId: string;
  baseSha: string;
  branch: string;
  headSha: string;
  changedPaths: string[];
  activationDigest: string;
  checks: Array<{
    checkId: AuthorizationCheckId;
    status: "passed";
    evidenceDigest: string;
  }>;
}

/** Required for all new reservations. Legacy context is read-only history. */
export interface AuthorizationContext extends Omit<LegacyAuthorizationContext, "schemaVersion"> {
  schemaVersion: 2;
  candidateDigest: string;
  runtimeFingerprint: string;
  audit: {
    builderId: string;
    reviewerId: string;
    completedAt: string;
    candidateDigest: string;
    output: AuditorOutput;
  };
}

export type AuthorizationResult =
  | { commitSha: string }
  | { remote: "origin"; branch: string; commitSha: string }
  | { number: number; url: string; headSha: string };

export interface AuthorizationOptions {
  repo?: string;
  stateHome?: string | null;
  policy?: AgentPolicy;
  now?: Date;
}

export const GROUPED_AUTHORIZATION_ACTIONS: GroupedAuthorizationAction[];
export const REQUIRED_ACTION_CHECKS: Readonly<Record<GroupedAuthorizationAction, AuthorizationCheckId[]>>;
export function validateAuthorizationBundle(
  raw: unknown,
  policy?: AgentPolicy,
): GroupedAuthorizationBundle;
export function getAuthorizationPaths(repo?: string, stateHome?: string | null): {
  root: string;
  repositoryIdentity: string;
  bundles: string;
  events: string;
  locks: string;
};
export function readAuthorizationBundles(
  repo?: string,
  stateHome?: string | null,
  policy?: AgentPolicy,
): Array<GroupedAuthorizationBundle & { bundleDigest: string; recordedAt: string }>;
export function registerAuthorizationBundle(
  raw: unknown,
  options?: AuthorizationOptions,
): { duplicate: boolean; authorization: GroupedAuthorizationBundle & { bundleDigest: string; recordedAt: string } };
export function validateAuthorizationEvent(raw: unknown): Record<string, unknown>;
export function readAuthorizationEvents(
  authorizationId: string,
  repo?: string,
  stateHome?: string | null,
): Array<Record<string, unknown>>;
export function readAuthorizationStatus(
  authorizationId: string,
  options?: AuthorizationOptions,
): Record<string, unknown>;
export function inspectAuthorizationStep(
  authorizationId: string,
  context: unknown,
  options?: AuthorizationOptions,
): Record<string, unknown>;
export function reserveAuthorizationStep(options: AuthorizationOptions & {
  authorizationId: string;
  context: unknown;
  eventId: string;
  occurredAt: string;
}): { reservationToken: string; event: Record<string, unknown> };
export function completeAuthorizationStep(options: AuthorizationOptions & {
  authorizationId: string;
  reservationToken: string;
  result: AuthorizationResult;
  eventId: string;
  occurredAt: string;
}): { event: Record<string, unknown> };
export function revokeAuthorizationBundle(options: AuthorizationOptions & {
  authorizationId: string;
  humanDecision: HumanDecisionReference;
  eventId: string;
  occurredAt: string;
}): { event: Record<string, unknown> };
