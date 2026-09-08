export const REPOSITORY_EXECUTION_ENABLED: false;
export const REPOSITORY_ORIGIN: string;
export function repositoryPath(root: string,path: string,missing?: boolean): string;
export function validateRepositoryManifest(manifest: Record<string, unknown>,policy?: unknown): unknown;
export function assertRepositorySnapshot(manifest: unknown,snapshot: unknown,now?: number): true;
export function assertRepositoryOwnership(manifest: unknown): unknown;
export function inspectRepositoryPatch(patch: string,manifest: {worktree:string;allowedPaths:string[]}): string[];
export function evaluateRepositoryTool(input: unknown,role: string,manifest: unknown,verify?: (manifest: unknown)=>unknown): true;
