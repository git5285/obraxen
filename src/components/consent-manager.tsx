"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { parseAnalyticsConfig } from "@/lib/analytics-config";
import type { Dictionary } from "@/lib/dictionaries/types";
import {
  CONSENT_STORAGE_KEY,
  createConsentRecord,
  parseConsentRecord,
  serializeConsentRecord,
  type ConsentRecord,
} from "@/lib/consent";

type ClarityFunction = ((...args: unknown[]) => void) & { q?: unknown[][] };

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

function ensureGoogleConsentDefaults() {
  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => window.dataLayer?.push(args);
  if (window.siteConsentDefaultsSet) return;

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  window.siteConsentDefaultsSet = true;
}

function updateGoogleConsent(analytics: "granted" | "denied") {
  ensureGoogleConsentDefaults();
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: analytics,
  });
}

function ensureClarityQueue(): ClarityFunction {
  if (window.clarity) return window.clarity;
  const clarity: ClarityFunction = (...args: unknown[]) => {
    (clarity.q ??= []).push(args);
  };
  window.clarity = clarity;
  return clarity;
}

function updateClarityConsent(analytics: "granted" | "denied") {
  if (analytics === "granted" || window.clarity) {
    ensureClarityQueue()("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: analytics,
    });
  }
  if (analytics === "denied") window.clarity?.("consent", false);
}

function appendProviderScript(id: string, src: string, provider: string, onLoad?: () => void) {
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

function clearAnalyticsCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=", 1)[0]?.trim();
    if (!name || !analyticsCookiePattern.test(name)) continue;
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}

function removeProviderScripts(): boolean {
  const scripts = [...document.querySelectorAll<HTMLScriptElement>(providerSelector)];
  for (const script of scripts) script.remove();
  return scripts.length > 0;
}

function readStoredConsent(): ConsentRecord | null {
  try {
    const rawValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    const record = parseConsentRecord(rawValue);
    if (!record && rawValue) window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    return record;
  } catch {
    return null;
  }
}

function storeConsent(record: ConsentRecord) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsentRecord(record));
  } catch {
    // La preferencia se mantiene en memoria para esta visita si el navegador bloquea localStorage.
  }
}

type ConsentManagerProps = {
  analyticsAvailable: boolean;
  copy: Dictionary["consent"];
  cookieUrl: string;
  privacyUrl: string;
};

export function ConsentManager(props: ConsentManagerProps) {
  if (!props.analyticsAvailable) return null;
  return <ActiveConsentManager {...props} />;
}

function ActiveConsentManager({ copy, cookieUrl, privacyUrl }: ConsentManagerProps) {
  const pathname = usePathname();
  const headingId = useId();
  const descriptionId = useId();
  const [record, setRecord] = useState<ConsentRecord | null | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [gaReady, setGaReady] = useState(false);
  const settingsRef = useRef<HTMLElement>(null);
  const bannerConfigButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reopenButtonRef = useRef<HTMLButtonElement>(null);
  const focusReopenAfterSaveRef = useRef(false);

  useEffect(() => {
    ensureGoogleConsentDefaults();
    updateClarityConsent("denied");
    const timer = window.setTimeout(() => {
      const stored = readStoredConsent();
      setRecord(stored);
      setDraftAnalytics(stored?.analytics ?? false);
      updateGoogleConsent(stored?.analytics ? "granted" : "denied");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!record?.analytics) return;

    const controller = new AbortController();
    fetch("/api/analytics-config/", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((value: unknown) => {
        if (controller.signal.aborted) return;
        const config = parseAnalyticsConfig(value);

        updateGoogleConsent("granted");
        if (config.gaMeasurementId) {
          appendProviderScript(
            "ga4-consent-script",
            `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.gaMeasurementId)}`,
            "ga4",
            () => {
              window.gtag?.("js", new Date());
              window.gtag?.("config", config.gaMeasurementId, {
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                send_page_view: false,
              });
              window.gtag?.("event", "consent_update", { analytics_state: "granted" });
              setGaReady(true);
            },
          );
        }

        if (config.clarityProjectId) {
          updateClarityConsent("granted");
          appendProviderScript(
            "clarity-consent-script",
            `https://www.clarity.ms/tag/${encodeURIComponent(config.clarityProjectId)}`,
            "clarity",
            () => window.clarity?.("event", "consent_update_granted"),
          );
        }
      })
      .catch(() => {
        // Fallo cerrado: si no puede obtenerse la configuración no se carga ningún proveedor.
      });

    return () => controller.abort();
  }, [record]);

  useEffect(() => {
    if (!gaReady) return;
    window.gtag?.("event", "page_view", {
      page_location: window.location.href,
      page_path: pathname,
      page_title: document.title,
    });
  }, [gaReady, pathname]);

  useEffect(() => {
    if (!record?.analytics) return;

    function emit(name: string, parameters: Record<string, string> = {}) {
      window.gtag?.("event", name, parameters);
      window.clarity?.("event", name);
    }

    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-analytics-event]");
      const name = target?.dataset.analyticsEvent;
      if (!target || !name) return;
      emit(name, {
        ...(target.dataset.analyticsLocation ? { location: target.dataset.analyticsLocation } : {}),
        ...(target.dataset.analyticsDestination ? { destination: target.dataset.analyticsDestination } : {}),
        ...(target.dataset.analyticsProject ? { project_slug: target.dataset.analyticsProject } : {}),
        ...(target.dataset.analyticsChannel ? { channel: target.dataset.analyticsChannel } : {}),
      });
    }

    function handleCustom(event: Event) {
      if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== "object") return;
      const detail = event.detail as { name?: unknown; parameters?: unknown };
      if (typeof detail.name !== "string") return;
      const parameters = detail.parameters && typeof detail.parameters === "object"
        ? detail.parameters as Record<string, string>
        : {};
      emit(detail.name, parameters);
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("site:analytics", handleCustom);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("site:analytics", handleCustom);
    };
  }, [record]);

  useEffect(() => {
    if (settingsOpen) closeButtonRef.current?.focus({ preventScroll: true });
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsOpen && focusReopenAfterSaveRef.current && record) {
      focusReopenAfterSaveRef.current = false;
      reopenButtonRef.current?.focus({ preventScroll: true });
    }
  }, [record, settingsOpen]);

  function openSettings() {
    setDraftAnalytics(record?.analytics ?? false);
    setSettingsOpen(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
    window.requestAnimationFrame(() => {
      const trigger = record ? reopenButtonRef.current : bannerConfigButtonRef.current;
      trigger?.focus({ preventScroll: true });
    });
  }

  function saveChoice(analytics: boolean) {
    const nextRecord = createConsentRecord(analytics);
    const providersWereLoaded = !analytics && removeProviderScripts();

    storeConsent(nextRecord);
    setRecord(nextRecord);
    setDraftAnalytics(analytics);
    setSettingsOpen(false);
    focusReopenAfterSaveRef.current = true;

    updateGoogleConsent(analytics ? "granted" : "denied");
    updateClarityConsent(analytics ? "granted" : "denied");
    if (!analytics) {
      setGaReady(false);
      clearAnalyticsCookies();
      if (providersWereLoaded) window.requestAnimationFrame(() => window.location.reload());
    }
  }

  function handleSettingsKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSettings();
      return;
    }
    if (event.key !== "Tab" || !settingsRef.current) return;

    const focusable = [...settingsRef.current.querySelectorAll<HTMLElement>(
      "a[href],button:not([disabled]),input:not([disabled])",
    )];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (record === undefined) return null;

  return (
    <>
      {!record && !settingsOpen ? (
        <section
          className="consent-banner"
          aria-labelledby={headingId}
          aria-describedby={descriptionId}
          data-consent-banner
        >
          <div className="consent-copy">
            <p className="consent-kicker">{copy.privacy}</p>
            <h2 id={headingId}>{copy.bannerTitle}</h2>
            <p id={descriptionId}>{copy.bannerBody}</p>
            <a href={cookieUrl}>{copy.cookieInfo}</a>
          </div>
          <div className="consent-actions">
            <button type="button" className="consent-button consent-choice" onClick={() => saveChoice(false)}>
              {copy.reject}
            </button>
            <button
              ref={bannerConfigButtonRef}
              type="button"
              className="consent-button consent-secondary"
              onClick={openSettings}
            >
              {copy.configure}
            </button>
            <button type="button" className="consent-button consent-choice" onClick={() => saveChoice(true)}>
              {copy.accept}
            </button>
          </div>
        </section>
      ) : null}

      {record && !settingsOpen ? (
        <button
          ref={reopenButtonRef}
          type="button"
          className="consent-reopen"
          aria-haspopup="dialog"
          onClick={openSettings}
        >
          {copy.reopen}
        </button>
      ) : null}

      {settingsOpen ? (
        <div className="consent-overlay">
          <section
            ref={settingsRef}
            className="consent-settings"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={descriptionId}
            onKeyDown={handleSettingsKeyDown}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="consent-close"
              aria-label={copy.closeAria}
              onClick={closeSettings}
            >
              ×
            </button>
            <p className="consent-kicker">{copy.settingsKicker}</p>
            <h2 id={headingId}>{copy.settingsTitle}</h2>
            <p id={descriptionId}>{copy.settingsBody}</p>

            <div className="consent-category">
              <div>
                <strong>{copy.essentialTitle}</strong>
                <p>{copy.essentialBody}</p>
              </div>
              <span>{copy.alwaysActive}</span>
            </div>

            <label className="consent-category consent-toggle">
              <span>
                <strong>{copy.analyticsTitle}</strong>
                <small>{copy.analyticsBody}</small>
              </span>
              <input
                type="checkbox"
                checked={draftAnalytics}
                onChange={(event) => setDraftAnalytics(event.currentTarget.checked)}
              />
            </label>

            <p className="consent-links">
              <a href={cookieUrl}>{copy.cookieInfo}</a>
              <span aria-hidden="true">·</span>
              <a href={privacyUrl}>{copy.privacy}</a>
            </p>
            <div className="consent-settings-actions">
              <button type="button" className="consent-button consent-choice" onClick={() => saveChoice(draftAnalytics)}>
                {copy.save}
              </button>
              <button type="button" className="consent-button consent-choice" onClick={() => saveChoice(false)}>
                {copy.reject}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
