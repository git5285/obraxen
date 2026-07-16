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
}

export function getLeasePaths(repo: string): { directory: string; owner: string };
export function readLease(repo: string): LeaseOwner | null;
export function acquireLease(
  repo: string,
  owner: LeaseOwner,
  now?: Date,
): { acquired: true; owner: LeaseOwner } | { acquired: false; reason: "lease_exists"; owner: LeaseOwner | null };
export function heartbeatLease(repo: string, token: string, now?: Date): LeaseOwner;
export function releaseLease(repo: string, token: string): { released: true; runId: string };
