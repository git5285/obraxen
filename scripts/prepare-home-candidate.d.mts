import type { FileEvidence } from "./public-site-evidence.mjs";
export function candidateInputs(repo: string): FileEvidence[];
export function assertBuiltHome(root: string): { routes: string[]; htmlSha256: string; result: string };
export function prepareHomeCandidate(options: { repo: string; destination: string; allowWorktree?: boolean; build?: boolean }): {
  schemaVersion: number; kind: string; source: { baseCommit: string; exactCommit: string | null; dirty: boolean; localStatus: string[]; inputsSha256: string };
  inputs: FileEvidence[]; result: string; exclusions: string[]; publicationAuthorized: boolean;
  build: {command: string; output: string; result: string}; runtimeFingerprint: string | null;
};
