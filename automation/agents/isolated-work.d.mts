export interface WorkManifest {
  schemaVersion: 1; scope: "fixture"; phase: "discovery" | "implementation" | "review";
  runId: string; candidateId: string; threadId: string; baseSha: string;
  attentionClass: "reliability"; controlRoot: string; worktree: string; stateHome: string;
  hookPath: string; hookDigest: string; runtimeFingerprint: string; claimPath: string;
  claimDigest: string; leaseToken: string; expiresAt: string; allowedPaths: string[];
  readPaths: string[]; activationDigest: string;
  runtimeRoot: string; integrity: Record<string, string>;
  commands: Array<{role: string; kind: string; executable: string; script: string; command: string; digest: string}>;
}
export function digest(value: string | Buffer): string;
export function matchesObservedCommand(call: { command: string; cwd: string }, command: string, cwd: string): boolean;
export function cleanGitEnvironment(environment?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export function safeFile(root: string, path: string, options?: { missing?: boolean }): string;
export function validateWorkManifest(manifest: WorkManifest, policy?: unknown): WorkManifest;
export function assertWorkOwnership(manifest: WorkManifest, options?: { now?: number; policy?: unknown }): true;
export function inspectPatch(patch: string, manifest: WorkManifest): string[];
export function evaluateWorkTool(input: unknown, role: string, manifest: WorkManifest, verify?: (manifest: WorkManifest) => unknown): true;
