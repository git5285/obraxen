export type FileEvidence = { path: string; bytes: number; sha256: string };
export function sha256(bytes: string | Uint8Array): string;
export function sourceFile(root: string, path: string): string;
export function inventory(root: string): FileEvidence[];
export function assertInventory(expected: FileEvidence[], actual: FileEvidence[]): void;
export function verifyRecovery(root: string, provenance: { deploymentId: string; files: (FileEvidence & { uid?: string })[] }): {
  kind: string; recoverySourceDeploymentId: string; filesVerified: number; result: string;
};
export function verifyServedInventory(origin: string, files: FileEvidence[], request?: typeof fetch): Promise<FileEvidence[]>;
