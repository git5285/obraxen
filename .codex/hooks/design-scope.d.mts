import type { SpawnSyncOptionsWithStringEncoding, SpawnSyncReturns } from "node:child_process";
export type DesignRunner = (command: string, args: string[], options: SpawnSyncOptionsWithStringEncoding) => SpawnSyncReturns<string>;
export function designPaths(input: unknown, root?: string): string[];
export function runDesignHook(input: unknown, options?: {root?: string; home?: string; run?: DesignRunner}): string;
