export const LOCAL_CHECKS: string[];
export const FRESH_CHECKS: string[];
export function treeDigest(root: string, excluded?: string[]): string;
export function qualityFingerprint(repo: string): string;
export function generatedInputsDigest(repo: string): string;
export function candidateDigest(repo: string): string;
export function environmentDigest(environment: Record<string, string>): string;
export function reusableReceipt(receipt: unknown, fingerprint: string, now?: number): boolean;
export function runQuality(options: {
  repo: string;
  receiptPath: string;
  reuse?: boolean;
  head?: string | null;
  snapshot?: () => string;
  contentSnapshot?: () => string;
  generatedSnapshot?: () => string;
  run?: (script: string) => void;
  now?: () => number;
}): { reused: boolean; localChecks: string[]; freshChecks: string[] };
