export function parseQaPort(value?: string | number | null): number | null;
export function reserveQaPort(): Promise<number>;
export function resolveQaPort(value?: string | number | null): Promise<number>;
