"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/dictionaries/types";
import type { Locale } from "@/lib/i18n";

const ContactForm = dynamic(() => import("./contact-form").then((module) => module.ContactForm));

type ContactRuntimeGateProps = {
  initialEnabled: boolean;
  locale: Locale;
  copy: Dictionary["contact"];
  privacyUrl: string;
  unavailable: ReactNode;
};

export function ContactRuntimeGate({
  initialEnabled,
  locale,
  copy,
  privacyUrl,
  unavailable,
}: ContactRuntimeGateProps) {
  const [runtimeEnabled, setRuntimeEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/contact-config/", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((value: unknown) => {
        if (controller.signal.aborted) return;
        setRuntimeEnabled(
          Boolean(value && typeof value === "object" && !Array.isArray(value) && (value as { enabled?: unknown }).enabled === true),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setRuntimeEnabled(false);
      });
    return () => controller.abort();
  }, []);

  const enabled = runtimeEnabled ?? initialEnabled;
  return enabled
    ? <ContactForm locale={locale} copy={copy} privacyUrl={privacyUrl} />
    : unavailable;
}
