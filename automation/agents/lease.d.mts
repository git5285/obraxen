export interface LeaseOwner {
  runId: string;
  token: string;
  host: string;
  pid: number;
  worktree: string;
  baseSha: string;
  claimPath: string;
  paths: string[];
  schemaVersion?: number;
  acquiredAt?: string;
  heartbeatAt?: string;
  repositoryIdentity?: string;
}

export interface CloneRecord {
  schemaVersion: 1;
  repositoryIdentity: string;
  root: string;
  commonDir: string;
  registeredAt: string;
  lastSeenAt: string;
}

export interface CloneRegistrationOptions {
  now?: Date;
  stateHome?: string | null;
}

export interface CoordinationPaths {
  repositoryIdentity: string;
  repositoryKey: string;
  namespaceRoot: string;
  cloneIndex: string;
  root: string;
  clones: string;
  leaseDirectory: string;
  leaseOperations: string;
  leaseTokens: string;
}

export const COORDINATION_PROTOCOL_VERSION: 3;
export function readCoordinationProtocolVersion(repo: string): number | null;
export function normalizeRepositoryIdentity(remote: string, repo?: string): string;
export function getRepositoryIdentity(repo: string): string;
export function resolveCoordinationStateHome(stateHome?: string | null): string;
export function getCoordinationPaths(repo: string, stateHome?: string | null): CoordinationPaths;
export function getLeasePaths(repo: string, stateHome?: string | null): { directory: string; owner: string };
export function registerClone(repo: string, options?: CloneRegistrationOptions): CloneRecord;
export function readRegisteredClones(repo: string, stateHome?: string | null): CloneRecord[];
export function verifyRegisteredClone(record: CloneRecord): true;
export function getLegacyLeasePaths(repo: string): { directory: string; owner: string };
export function readLegacyLease(repo: string): LeaseOwner | null;
export function readLease(repo: string, stateHome?: string | null): LeaseOwner | null;
export function acquireLease(
  repo: string,
  owner: LeaseOwner,
  now?: Date,
  stateHome?: string | null,
): { acquired: true; owner: LeaseOwner } | { acquired: false; reason: "lease_exists"; owner: LeaseOwner | null };
export function heartbeatLease(repo: string, token: string, now?: Date, stateHome?: string | null): LeaseOwner;
export function releaseLease(repo: string, token: string, stateHome?: string | null): { released: true; runId: string };
