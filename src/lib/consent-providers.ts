export type ClarityFunction = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    clarity?: ClarityFunction;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    siteConsentDefaultsSet?: boolean;
  }
}

const providerSelector = "script[data-consent-provider]";
const analyticsCookiePattern = /^(?:_ga(?:_.+)?|_gid|_gat(?:_.+)?|_clck|_clsk)$/;
export function ensureGoogleConsentDefaults() {
  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => window.dataLayer?.push(args);
  if (window.siteConsentDefaultsSet) return;
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  });
  window.siteConsentDefaultsSet = true;
}

export function updateGoogleConsent(analytics: "granted" | "denied") {
  ensureGoogleConsentDefaults();
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: analytics
  });
}

function ensureClarityQueue(): ClarityFunction {
  if (window.clarity) return window.clarity;
  const clarity: ClarityFunction = (...args) => {
    (clarity.q ??= []).push(args);
  };
  window.clarity = clarity;
  return clarity;
}

export function updateClarityConsent(analytics: "granted" | "denied") {
  if (analytics === "granted" || window.clarity) ensureClarityQueue()("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: analytics
  });
  if (analytics === "denied") window.clarity?.("consent", false);
}

export function appendProviderScript(id: string, src: string, provider: string, onLoad?: () => void) {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === "true") onLoad?.();
    return;
  }
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  script.dataset.consentProvider = provider;
  script.addEventListener("load", () => {
    script.dataset.loaded = "true";
    onLoad?.();
  }, { once: true });
  document.head.append(script);
}

export function clearAnalyticsCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=", 1)[0]?.trim();
    if (name && analyticsCookiePattern.test(name)) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}

export function removeProviderScripts(): boolean {
  const scripts = [...document.querySelectorAll<HTMLScriptElement>(providerSelector)];
  for (const script of scripts) script.remove();
  return scripts.length > 0;
}
