export const ALIASES: Readonly<Record<string, string>>;
export function runAlias(alias: string, options?: string[], run?: (command: string, args: string[], options: object) => {status?: number | null; error?: Error}, log?: (message: string) => void): number;
