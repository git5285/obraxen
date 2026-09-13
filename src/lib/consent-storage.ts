import {
  CONSENT_STORAGE_KEY,
  parseConsentRecord,
  serializeConsentRecord,
  type ConsentRecord,
} from "./consent";

export function readStoredConsent(): ConsentRecord | null {
  try {
    const rawValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    const record = parseConsentRecord(rawValue);
    if (!record && rawValue) window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    return record;
  } catch {
    return null;
  }
}

export function storeConsent(record: ConsentRecord) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsentRecord(record));
  } catch {
    // The preference remains in memory when localStorage is unavailable.
  }
}
