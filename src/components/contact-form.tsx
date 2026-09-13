"use client";

import { useRef, useState, type FormEvent, type InvalidEvent } from "react";
import type { Dictionary } from "@/lib/dictionaries/types";
import type { Locale } from "@/lib/i18n";

function track(name: string, parameters: Record<string, string> = {}) {
  window.dispatchEvent(new CustomEvent("site:analytics", { detail: { name, parameters } }));
}

export function ContactForm({
  locale,
  copy,
  privacyUrl,
}: {
  locale: Locale;
  copy: Dictionary["contact"];
  privacyUrl: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error" | "validation-error">("idle");
  const [invalidFields, setInvalidFields] = useState<Set<string>>(() => new Set());
  const startedAt = useRef<number | null>(null);
  const started = useRef(false);

  function collectInvalidFields(form: HTMLFormElement) {
    const invalid = new Set<string>();
    for (const element of Array.from(form.elements)) {
      if (
        (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
        element.name &&
        !element.checkValidity()
      ) {
        invalid.add(element.name);
      }
    }
    return invalid;
  }

  function handleInvalid(event: InvalidEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) || !target.name) return;
    setInvalidFields((current) => new Set(current).add(target.name));
  }

  function handleInput(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) || !target.name) return;
    if (target.checkValidity()) {
      setInvalidFields((current) => {
        if (!current.has(target.name)) return current;
        const next = new Set(current);
        next.delete(target.name);
        return next;
      });
    }
  }

  function markStarted() {
    if (started.current) return;
    started.current = true;
    startedAt.current = Date.now();
    track("form_start", { form: "technical_assessment", locale });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) {
      setInvalidFields(collectInvalidFields(form));
      setStatus("validation-error");
      track("form_error", { reason: "client_validation", locale });
      return;
    }
    const values = new FormData(form);
    const params = new URLSearchParams(window.location.search);
    setInvalidFields(new Set());
    setStatus("sending");

    const response = await fetch("/api/contact/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        name: values.get("name"),
        email: values.get("email"),
        company: values.get("company"),
        country: values.get("country"),
        phone: values.get("phone"),
        message: values.get("message"),
        consent: values.get("consent") === "on",
        website: values.get("website"),
        startedAt: startedAt.current ?? Date.now(),
        source: window.location.pathname,
        utm: {
          source: params.get("utm_source") || undefined,
          medium: params.get("utm_medium") || undefined,
          campaign: params.get("utm_campaign") || undefined,
        },
      }),
    }).catch(() => null);

    if (response?.ok) {
      form.reset();
      setStatus("success");
      track("form_submit", { form: "technical_assessment", locale });
    } else {
      setStatus("error");
      track("form_error", { reason: response ? `http_${response.status}` : "network", locale });
    }
  }

  return (
    <form
      className="form contact-form"
      onSubmit={submit}
      onFocus={markStarted}
      onInvalid={handleInvalid}
      onInput={handleInput}
      noValidate
      data-clarity-mask="true"
      aria-describedby="contact-help contact-status"
    >
      <label htmlFor="contact-name">{copy.name}</label>
      <input id="contact-name" name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required aria-invalid={invalidFields.has("name")} aria-describedby={invalidFields.has("name") ? "contact-name-error" : undefined} aria-errormessage={invalidFields.has("name") ? "contact-name-error" : undefined} />
      <span id="contact-name-error" className="form-field-error" hidden={!invalidFields.has("name")}>{copy.validationError}</span>
      <label htmlFor="contact-email">{copy.email}</label>
      <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required aria-invalid={invalidFields.has("email")} aria-describedby={invalidFields.has("email") ? "contact-email-error" : undefined} aria-errormessage={invalidFields.has("email") ? "contact-email-error" : undefined} />
      <span id="contact-email-error" className="form-field-error" hidden={!invalidFields.has("email")}>{copy.validationError}</span>
      <label htmlFor="contact-company">{copy.company}</label>
      <input id="contact-company" name="company" type="text" autoComplete="organization" minLength={2} maxLength={160} required aria-invalid={invalidFields.has("company")} aria-describedby={invalidFields.has("company") ? "contact-company-error" : undefined} aria-errormessage={invalidFields.has("company") ? "contact-company-error" : undefined} />
      <span id="contact-company-error" className="form-field-error" hidden={!invalidFields.has("company")}>{copy.validationError}</span>
      <label htmlFor="contact-country">{copy.country}</label>
      <input id="contact-country" name="country" type="text" autoComplete="country-name" minLength={2} maxLength={100} required aria-invalid={invalidFields.has("country")} aria-describedby={invalidFields.has("country") ? "contact-country-error" : undefined} aria-errormessage={invalidFields.has("country") ? "contact-country-error" : undefined} />
      <span id="contact-country-error" className="form-field-error" hidden={!invalidFields.has("country")}>{copy.validationError}</span>
      <label htmlFor="contact-phone">{copy.phone}</label>
      <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} aria-invalid={invalidFields.has("phone")} aria-describedby={invalidFields.has("phone") ? "contact-phone-error" : undefined} aria-errormessage={invalidFields.has("phone") ? "contact-phone-error" : undefined} />
      <span id="contact-phone-error" className="form-field-error" hidden={!invalidFields.has("phone")}>{copy.validationError}</span>
      <label htmlFor="contact-message">{copy.message}</label>
      <textarea id="contact-message" name="message" minLength={20} maxLength={4_000} required aria-invalid={invalidFields.has("message")} aria-describedby={invalidFields.has("message") ? "contact-message-error" : undefined} aria-errormessage={invalidFields.has("message") ? "contact-message-error" : undefined} />
      <span id="contact-message-error" className="form-field-error" hidden={!invalidFields.has("message")}>{copy.validationError}</span>
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">{copy.honeypot}</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="contact-consent" htmlFor="contact-consent">
        <input id="contact-consent" name="consent" type="checkbox" required aria-invalid={invalidFields.has("consent")} aria-describedby={invalidFields.has("consent") ? "contact-consent-error" : undefined} aria-errormessage={invalidFields.has("consent") ? "contact-consent-error" : undefined} />
        <span>{copy.privacyConsent} <a href={privacyUrl}>{copy.privacyLink}</a>.</span>
      </label>
      <span id="contact-consent-error" className="form-field-error" hidden={!invalidFields.has("consent")}>{copy.validationError}</span>
      <button className="btn btn-acento" type="submit" disabled={status === "sending"}>
        {status === "sending" ? copy.sending : copy.submit}
      </button>
      <small id="contact-help">{copy.intro}</small>
      <div id="contact-status" className="contact-status" role="status" aria-live="polite">
        {status === "success" ? <><strong>{copy.successTitle}</strong> {copy.successBody}</> : null}
        {status === "validation-error" ? copy.validationError : null}
        {status === "error" ? copy.error : null}
      </div>
    </form>
  );
}
