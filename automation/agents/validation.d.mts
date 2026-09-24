export function nonEmptyString(value: unknown, label: string): string;
export function object(value: unknown, label: string): Record<string, unknown>;
export function exactKeys(value: object, label: string, allowed: readonly string[]): void;
export function safeIdentifier(value: unknown, label: string): string;
export function timestamp(value: unknown, label: string): string;
export function sha(value: unknown, label: string): string;
export function sha256(value: unknown, label: string): string;
export function canonicalJson(value: unknown): unknown;
export function digest(value: unknown): string;
