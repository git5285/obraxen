import type { CanonicalClaimState } from "./claims.mjs";

export type OperationalEvidence =
  | { kind: "reconciliation"; reconciliationId: string; evidenceDigest: string; outcome: "merged" | "rejected" | "superseded" }
  | { kind: "pull_request"; number: number; url: string; state: "CLOSED" | "MERGED"; headSha: string; mergeCommitSha: string | null; observedAt: string }
  | { kind: "run_report"; runId: string; reportDigest: string; status: "blocked" | "no_op" }
  | { kind: "handoff"; path: string; contentDigest: string }
  | { kind: "human_decision"; decisionId: string };

export interface OperationalClaimSnapshot {
  source: string;
  contentDigest: string;
  files: string[];
}

export interface OperationalEvent {
  schemaVersion: 1;
  eventId: string;
  threadId: string;
  occurredAt: string;
  previousEventId: string | null;
  state: CanonicalClaimState;
  claim: OperationalClaimSnapshot;
  reason: string;
  evidence: OperationalEvidence[];
  recordedAt?: string;
  eventDigest?: string;
}

export interface OperationalClaimState {
  threadId: string;
  state: CanonicalClaimState;
  claim: OperationalClaimSnapshot;
  latestEventId: string;
  latestOccurredAt: string;
  eventCount: number;
  latestEvidence: OperationalEvidence[];
}

export interface OperationalOptions {
  repo?: string;
  stateHome?: string | null;
  now?: Date;
}

export function validateOperationalEvent(raw: unknown): OperationalEvent;
export function getOperationalPaths(repo?: string, stateHome?: string | null): {
  root: string;
  events: string;
  locks: string;
};
export function readOperationalEvents(repo?: string, stateHome?: string | null): OperationalEvent[];
export function deriveOperationalClaims(events: OperationalEvent[]): OperationalClaimState[];
export function readOperationalClaims(repo?: string, stateHome?: string | null): OperationalClaimState[];
export function readOperationalStatus(repo?: string, stateHome?: string | null, options?: {activeOnly?: boolean}): {
  paths: ReturnType<typeof getOperationalPaths>;
  summary?: {total: number; active: number};
  claims: OperationalClaimState[];
};
export function appendOperationalEvent(
  event: OperationalEvent,
  options?: OperationalOptions,
): { duplicate: boolean; event: OperationalEvent };
export function registerOperationalClaim(options: OperationalOptions & {
  claimPath: string;
  eventId: string;
  occurredAt: string;
}): { duplicate: boolean; event: OperationalEvent };
export function transitionOperationalClaim(options: OperationalOptions & {
  threadId: string;
  eventId: string;
  occurredAt: string;
  state: CanonicalClaimState;
  reason: string;
  evidence?: OperationalEvidence[];
}): { duplicate: boolean; event: OperationalEvent };
