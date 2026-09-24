export function preparePlatform(options: {root: string; expectedInputsSha256: string; projectId: string; orgId: string; target: string}): Record<string, unknown>;
export function auditPlatform(options: {root: string; expectedInputsSha256: string; dryRun: unknown}): Record<string, unknown>;
