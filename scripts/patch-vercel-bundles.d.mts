export const EXTENSION_STUB: string;
export const PATCHES: readonly { file: string; before: string; after: string; transform: (source: string) => string }[];
export function patchBundles(root: string, mode?: "apply" | "check"): { version: string; mode: string; changed: number; scope: string };
