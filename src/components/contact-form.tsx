"use client";

import { useRef, useState, type FormEvent } from "react";
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
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const startedAt = useRef<number | null>(null);
  const started = useRef(false);

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
      setStatus("error");
      track("form_error", { reason: "client_validation", locale });
      return;
    }
    const values = new FormData(form);
    const params = new URLSearchParams(window.location.search);
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
      data-clarity-mask="true"
      aria-describedby="contact-help contact-status"
    >
      <label htmlFor="contact-name">{copy.name}</label>
      <input id="contact-name" name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required />
      <label htmlFor="contact-email">{copy.email}</label>
      <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <label htmlFor="contact-company">{copy.company}</label>
      <input id="contact-company" name="company" type="text" autoComplete="organization" minLength={2} maxLength={160} required />
      <label htmlFor="contact-country">{copy.country}</label>
      <input id="contact-country" name="country" type="text" autoComplete="country-name" minLength={2} maxLength={100} required />
      <label htmlFor="contact-phone">{copy.phone}</label>
      <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
      <label htmlFor="contact-message">{copy.message}</label>
      <textarea id="contact-message" name="message" minLength={20} maxLength={4_000} required />
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">{copy.honeypot}</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="contact-consent">
        <input name="consent" type="checkbox" required />
        <span>{copy.privacyConsent} <a href={privacyUrl}>{copy.privacyLink}</a>.</span>
      </label>
      <button className="btn btn-acento" type="submit" disabled={status === "sending"}>
        {status === "sending" ? copy.sending : copy.submit}
      </button>
      <small id="contact-help">{copy.intro}</small>
      <div id="contact-status" className="contact-status" role="status" aria-live="polite">
        {status === "success" ? <><strong>{copy.successTitle}</strong> {copy.successBody}</> : null}
        {status === "error" ? copy.error : null}
      </div>
    </form>
  );
}
