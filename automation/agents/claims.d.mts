export type CanonicalClaimState =
  | "reservado"
  | "en_curso"
  | "bloqueado"
  | "esperando_revision"
  | "liberado";

export interface ParsedClaim {
  source: string;
  worktree: string;
  threadId: string;
  state: string;
  files: string[];
  invalidFileEntries: string[];
  metadataErrors: string[];
  contentDigest: string;
  operationalEventId?: string;
  operationalOnly?: boolean;
}

export const ACTIVE_CLAIM_STATES: Set<CanonicalClaimState>;
export function canonicalClaimState(value: unknown): CanonicalClaimState | null;
export function claimContentDigest(text: string): string;
export function isClaimPath(value: string): boolean;
export function parseClaim(text: string, source: string, worktree: string): ParsedClaim;
export function readClaims(worktree: string): ParsedClaim[];
