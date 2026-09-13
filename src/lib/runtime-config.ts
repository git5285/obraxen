import { resolveAnalyticsConfig } from "./analytics-config";
import { resolveContactConfig } from "./contact";

export function resolveRuntimeConfig(environment: Record<string, string | undefined> = process.env) {
  return {
    analytics: resolveAnalyticsConfig(environment),
    contact: resolveContactConfig(environment),
  } as const;
}
