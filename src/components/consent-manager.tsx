"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Dictionary } from "@/lib/dictionaries/types";
import { useConsentController } from "@/lib/use-consent-controller";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { draftAnalytics, record, saveChoice, setDraftAnalytics } = useConsentController(pathname);
  const settingsRef = useRef<HTMLElement>(null);
  const bannerConfigButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reopenButtonRef = useRef<HTMLButtonElement>(null);
  const focusReopenAfterSaveRef = useRef(false);


  useEffect(() => {
    if (settingsOpen) closeButtonRef.current?.focus({ preventScroll: true });
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsOpen && focusReopenAfterSaveRef.current && record) {
      focusReopenAfterSaveRef.current = false;
      // The mobile trigger is in document flow and may need to scroll into view.
      reopenButtonRef.current?.focus();
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
      trigger?.focus();
    });
  }

  function saveAndClose(analytics: boolean) { saveChoice(analytics); setSettingsOpen(false); focusReopenAfterSaveRef.current = true; }

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
            <button type="button" className="consent-button consent-choice" onClick={() => saveAndClose(false)}>
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
            <button type="button" className="consent-button consent-choice" onClick={() => saveAndClose(true)}>
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
              <button type="button" className="consent-button consent-choice" onClick={() => saveAndClose(draftAnalytics)}>
                {copy.save}
              </button>
              <button type="button" className="consent-button consent-choice" onClick={() => saveAndClose(false)}>
                {copy.reject}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
