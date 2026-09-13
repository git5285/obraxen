export type AnalyticsConfig = {
  gaMeasurementId: string | null;
  clarityProjectId: string | null;
};

export function getAnalyticsPageLocation(href: string): string {
  const url = new URL(href);
  return `${url.origin}${url.pathname}`;
}

const gaMeasurementIdPattern = /^G-[A-Z0-9]{6,20}$/;
const clarityProjectIdPattern = /^[a-z0-9]{6,24}$/;

function validValue(value: unknown, pattern: RegExp): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return pattern.test(normalized) ? normalized : null;
}

export function resolveAnalyticsConfig(
  environment: Record<string, string | undefined>,
): AnalyticsConfig {
  return {
    gaMeasurementId: validValue(
      environment.GA_MEASUREMENT_ID?.toUpperCase(),
      gaMeasurementIdPattern,
    ),
    clarityProjectId: validValue(
      environment.CLARITY_PROJECT_ID?.toLowerCase(),
      clarityProjectIdPattern,
    ),
  };
}
export function parseAnalyticsConfig(value: unknown): AnalyticsConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { gaMeasurementId: null, clarityProjectId: null };
  }

  const candidate = value as Record<string, unknown>;
  return {
    gaMeasurementId: validValue(candidate.gaMeasurementId, gaMeasurementIdPattern),
    clarityProjectId: validValue(candidate.clarityProjectId, clarityProjectIdPattern),
  };
}
