export interface RuntimeContract {
  schemaVersion: 1;
  nodeVersion: string;
  npmVersion: string;
  packageManager: string;
  lockfileSha256: string;
}

export interface RuntimeInspection {
  schemaVersion: 1;
  ok: boolean;
  fingerprint: string | null;
  blockers: string[];
  expected?: RuntimeContract;
  actual?: Record<string, unknown>;
  checks?: Record<string, unknown>;
  errors?: string[];
  error?: string;
}

export function readRuntimeContract(repo?: string): RuntimeContract;
export function canonicalDependencyTree(value: unknown): Record<string, unknown>;
export function inspectDependencyTree(result: { status: number | null; stdout: string; stderr: string }): {
  valid: boolean;
  digest: string | null;
  problems: string[];
  error: string | null;
};
export function createRuntimeFingerprint(value: {
  nodeVersion: string;
  npmVersion: string;
  platform: string;
  arch: string;
  lockfileSha256: string;
  dependencyTreeSha256: string;
}): string;
export function inspectRuntime(repo?: string, options?: Record<string, unknown>): RuntimeInspection;
export function findRuntimeBinary(repo?: string): string;
