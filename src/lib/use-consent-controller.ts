"use client";

import { useEffect, useState } from "react";
import { getAnalyticsPageLocation, parseAnalyticsConfig } from "./analytics-config";
import { createConsentRecord, type ConsentRecord } from "./consent";
import {
  appendProviderScript,
  clearAnalyticsCookies,
  ensureGoogleConsentDefaults,
  removeProviderScripts,
  updateClarityConsent,
  updateGoogleConsent,
} from "./consent-providers";
import { readStoredConsent, storeConsent } from "./consent-storage";

export function useConsentController(pathname: string) {
  const [record, setRecord] = useState<ConsentRecord | null | undefined>(undefined);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [gaReady, setGaReady] = useState(false);

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
      .catch(() => {});
    return () => controller.abort();
  }, [record]);
  useEffect(() => {
    if (!gaReady) return;
    window.gtag?.("event", "page_view", {
      page_location: getAnalyticsPageLocation(window.location.href),
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
  function saveChoice(analytics: boolean) {
    const nextRecord = createConsentRecord(analytics);
    const providersWereLoaded = !analytics && removeProviderScripts();
    storeConsent(nextRecord);
    setRecord(nextRecord);
    setDraftAnalytics(analytics);
    updateGoogleConsent(analytics ? "granted" : "denied");
    updateClarityConsent(analytics ? "granted" : "denied");
    if (!analytics) {
      setGaReady(false);
      clearAnalyticsCookies();
      if (providersWereLoaded) window.requestAnimationFrame(() => window.location.reload());
    }
  }
  return { record, draftAnalytics, setDraftAnalytics, saveChoice };
}
