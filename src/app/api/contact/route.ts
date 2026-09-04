import { createHash, randomUUID } from "node:crypto";
import {
  buildContactEmail,
  contactSubmissionSchema,
  resolveContactConfig,
} from "@/lib/contact";

export const dynamic = "force-dynamic";

const bodyLimit = 15_000;
const rateWindowMs = 15 * 60 * 1_000;
const rateLimit = 5;
const maxRateLimitKeys = 10_000;
const attempts = new Map<string, number[]>();
let lastRateLimitSweep = 0;

function response(body: object, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function requestKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || "unknown";
  return createHash("sha256").update(address).digest("hex");
}

function exceedsRateLimit(key: string, now = Date.now()): boolean {
  if (now - lastRateLimitSweep >= rateWindowMs || attempts.size >= maxRateLimitKeys) {
    for (const [candidate, timestamps] of attempts) {
      const active = timestamps.filter((timestamp) => now - timestamp < rateWindowMs);
      if (active.length) attempts.set(candidate, active);
      else attempts.delete(candidate);
    }
    lastRateLimitSweep = now;
  }
  if (!attempts.has(key) && attempts.size >= maxRateLimitKeys) return true;

  const active = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < rateWindowMs);
  if (active.length >= rateLimit) {
    attempts.set(key, active);
    return true;
  }
  active.push(now);
  attempts.set(key, active);
  return false;
}

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > bodyLimit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function POST(request: Request): Promise<Response> {
  const config = resolveContactConfig(process.env);
  if (!config.enabled || !config.apiKey || !config.toEmail || !config.fromEmail) {
    return response({ ok: false, code: "not_configured" }, 503);
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return response({ ok: false, code: "unsupported_media_type" }, 415);
  }
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > bodyLimit) return response({ ok: false, code: "payload_too_large" }, 413);

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin || origin !== requestUrl.origin) {
    return response({ ok: false, code: "invalid_origin" }, 403);
  }
  if (exceedsRateLimit(requestKey(request))) {
    return response({ ok: false, code: "rate_limited" }, 429);
  }

  const body = await readBoundedBody(request);
  if (body === null) return response({ ok: false, code: "payload_too_large" }, 413);

  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return response({ ok: false, code: "invalid_json" }, 400);
  }

  const parsed = contactSubmissionSchema.safeParse(raw);
  if (!parsed.success) return response({ ok: false, code: "invalid_submission" }, 400);
  const elapsed = Date.now() - parsed.data.startedAt;
  if (elapsed < 3_000 || elapsed > 24 * 60 * 60 * 1_000) {
    return response({ ok: false, code: "invalid_timing" }, 400);
  }

  const providerResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `contact/${randomUUID()}`,
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [config.toEmail],
      reply_to: parsed.data.email,
      subject: `Solicitud técnica · ${parsed.data.locale.toUpperCase()}`,
      text: buildContactEmail(parsed.data),
      tags: [{ name: "source", value: "website-contact" }],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);

  if (!providerResponse?.ok) return response({ ok: false, code: "delivery_failed" }, 502);
  return response({ ok: true }, 202);
}
