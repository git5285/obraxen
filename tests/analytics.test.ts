import { describe, expect, it } from "vitest";
import {
  parseAnalyticsConfig,
  resolveAnalyticsConfig,
} from "@/lib/analytics-config";
import {
  CONSENT_MAX_AGE_MS,
  CONSENT_STORAGE_KEY,
  createConsentRecord,
  parseConsentRecord,
  serializeConsentRecord,
} from "@/lib/consent";

describe("analytics configuration", () => {
  it("accepts valid environment-scoped IDs and normalizes their case", () => {
    expect(resolveAnalyticsConfig({
      GA_MEASUREMENT_ID: "g-test123456",
      CLARITY_PROJECT_ID: "TESTCLARITY1",
    })).toEqual({
      gaMeasurementId: "G-TEST123456",
      clarityProjectId: "testclarity1",
    });
  });

  it("fails closed for missing or malformed IDs", () => {
    expect(resolveAnalyticsConfig({
      GA_MEASUREMENT_ID: "UA-123",
      CLARITY_PROJECT_ID: "<script>",
    })).toEqual({ gaMeasurementId: null, clarityProjectId: null });
    expect(parseAnalyticsConfig({ gaMeasurementId: 42 })).toEqual({
      gaMeasurementId: null,
      clarityProjectId: null,
    });
  });
});

describe("consent record", () => {
  const now = Date.UTC(2026, 6, 14, 12);

  it("uses a neutral storage key and a bounded lifetime", () => {
    const record = createConsentRecord(true, now);
    expect(CONSENT_STORAGE_KEY).toBe("site_privacy_preferences");
    expect(Date.parse(record.expiresAt) - Date.parse(record.decidedAt))
      .toBe(CONSENT_MAX_AGE_MS);
    expect(parseConsentRecord(serializeConsentRecord(record), now)).toEqual(record);
  });

  it("rejects expired, future, malformed and obsolete records", () => {
    const record = createConsentRecord(false, now);
    expect(parseConsentRecord(serializeConsentRecord(record), now + CONSENT_MAX_AGE_MS))
      .toBeNull();
    expect(parseConsentRecord(serializeConsentRecord(record), now - 1)).toBeNull();
    expect(parseConsentRecord("not-json", now)).toBeNull();
    expect(parseConsentRecord(JSON.stringify({ ...record, version: 2 }), now)).toBeNull();
  });
});
