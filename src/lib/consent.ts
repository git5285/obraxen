export const CONSENT_STORAGE_KEY = "site_privacy_preferences";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type ConsentRecord = {
  version: typeof CONSENT_VERSION;
  analytics: boolean;
  decidedAt: string;
  expiresAt: string;
};

export function createConsentRecord(
  analytics: boolean,
  now = Date.now(),
): ConsentRecord {
  return {
    version: CONSENT_VERSION,
    analytics,
    decidedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CONSENT_MAX_AGE_MS).toISOString(),
  };
}

export function parseConsentRecord(
  rawValue: string | null,
  now = Date.now(),
): ConsentRecord | null {
  if (!rawValue) return null;

  try {
    const value = JSON.parse(rawValue) as Partial<ConsentRecord>;
    const decidedAt = typeof value.decidedAt === "string"
      ? Date.parse(value.decidedAt)
      : Number.NaN;
    const expiresAt = typeof value.expiresAt === "string"
      ? Date.parse(value.expiresAt)
      : Number.NaN;

    if (
      value.version !== CONSENT_VERSION
      || typeof value.analytics !== "boolean"
      || !Number.isFinite(decidedAt)
      || !Number.isFinite(expiresAt)
      || decidedAt > now
      || expiresAt <= now
      || expiresAt - decidedAt !== CONSENT_MAX_AGE_MS
    ) {
      return null;
    }

    return value as ConsentRecord;
  } catch {
    return null;
  }
}

export function serializeConsentRecord(record: ConsentRecord): string {
  return JSON.stringify(record);
}
