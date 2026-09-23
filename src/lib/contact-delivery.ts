import { buildContactEmail, type ContactConfig, type ContactSubmission } from "./contact";

type DeliveryConfig = Pick<ContactConfig, "apiKey" | "toEmail" | "fromEmail">;

export async function deliverContact(config: DeliveryConfig, submission: ContactSubmission, key: string): Promise<boolean> {
  const providerResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [config.toEmail],
      reply_to: submission.email,
      subject: `Solicitud técnica · ${submission.locale.toUpperCase()}`,
      text: buildContactEmail(submission),
      tags: [{ name: "source", value: "website-contact" }],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);

  return Boolean(providerResponse?.ok);
}
