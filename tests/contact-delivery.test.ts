import { afterEach, expect, it, vi } from "vitest";
import { deliverContact } from "@/lib/contact-delivery";
import type { ContactSubmission } from "@/lib/contact";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const config = { apiKey: "test-key", fromEmail: "web@example.com", toEmail: "contact@example.com" };
const submission: ContactSubmission = {
  locale: "en", name: "Test user", email: "user@example.com", company: "Example",
  country: "Spain", phone: "", message: "Test message for delivery", consent: true,
  website: "", startedAt: 1, source: "/en/contact/",
};

it("preserves timeout, idempotency and the provider payload", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
  vi.stubGlobal("fetch", fetch);
  const timeout = vi.spyOn(AbortSignal, "timeout");
  expect(await deliverContact(config, submission, "contact/test-idempotency-key")).toBe(true);
  expect(timeout).toHaveBeenCalledWith(8_000);
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  expect(options).toMatchObject({ method: "POST", cache: "no-store", headers: {
    Authorization: "Bearer test-key", "Content-Type": "application/json",
    "Idempotency-Key": "contact/test-idempotency-key",
  } });
  expect(JSON.parse(options.body)).toMatchObject({
    from: config.fromEmail, to: [config.toEmail], reply_to: submission.email,
    subject: "Solicitud técnica · EN", tags: [{ name: "source", value: "website-contact" }],
  });
});

it.each(["http", "network", "timeout"])("fails closed on %s failure", async (failure) => {
  const fetch = vi.fn();
  if (failure === "http") fetch.mockResolvedValue(new Response(null, { status: 500 }));
  else fetch.mockRejectedValue(new Error(failure));
  vi.stubGlobal("fetch", fetch);
  expect(await deliverContact(config, submission, "contact/test-idempotency-key")).toBe(false);
});
