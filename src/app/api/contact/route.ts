import { createHash } from "node:crypto";
import { readBoundedBody } from "@/lib/contact-body";
import { deliverContact } from "@/lib/contact-delivery";
import {
  contactSubmissionSchema,
} from "@/lib/contact";
import { resolveRuntimeConfig } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

const bodyLimit = 15_000;
const rateWindowMs = 15 * 60 * 1_000;
const rateLimit = 5;
const maxRateLimitKeys = 10_000;
const rateLimitRetryAfterSeconds = Math.ceil(rateWindowMs / 1_000);
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/;
const attempts = new Map<string, number[]>();
let lastRateLimitSweep = 0;

function response(body: object, status: number, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...extraHeaders,
    },
  });
}

function requestKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(address).digest("hex");
}

function idempotencyKey(request: Request, submission: unknown): string {
  const supplied = request.headers.get("idempotency-key")?.trim();
  const value = supplied && idempotencyKeyPattern.test(supplied)
    ? supplied
    : createHash("sha256").update(JSON.stringify(submission)).digest("hex");
  return `contact/${value}`;
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


function isJsonContentType(value: string | null): boolean {
  return value?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

export async function POST(request: Request): Promise<Response> {
  const config = resolveRuntimeConfig().contact;
  if (!config.enabled || !config.apiKey || !config.toEmail || !config.fromEmail) {
    return response({ ok: false, code: "not_configured" }, 503);
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
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
    return response({ ok: false, code: "rate_limited" }, 429, {
      "Retry-After": String(rateLimitRetryAfterSeconds),
    });
  }

  const body = await readBoundedBody(request, bodyLimit);
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

  const delivered = await deliverContact(config, parsed.data, idempotencyKey(request, parsed.data));
  if (!delivered) return response({ ok: false, code: "delivery_failed" }, 502);
  return response({ ok: true }, 202);
}

export function GET(): Response {
  return response({ ok: false, code: "method_not_allowed" }, 405);
}
