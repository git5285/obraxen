import { afterEach, describe, expect, it, vi } from "vitest";

const contactMock = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/lib/contact", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/contact")>();
  return {
    ...actual,
    resolveContactConfig: () => contactMock.enabled
      ? {
          enabled: true,
          apiKey: `re_${"1".repeat(30)}`,
          toEmail: "contact@example.com",
          fromEmail: "web@example.com",
          rateLimitMode: "vercel-waf",
          issues: [],
        }
      : {
          enabled: false,
          apiKey: null,
          toEmail: null,
          fromEmail: null,
          rateLimitMode: null,
          issues: ["disabled"],
        },
  };
});

import { POST } from "@/app/api/contact/route";

const validSubmission = () => ({
  locale: "en",
  name: "Alex Example",
  email: "alex@example.org",
  company: "Example GmbH",
  country: "Germany",
  phone: "",
  message: "Damaged joints in an operating logistics facility.",
  consent: true,
  website: "",
  startedAt: Date.now() - 5_000,
  source: "/en/contact/",
  utm: {},
});

function contactRequest({
  payload = validSubmission(),
  rawBody,
  contentType = "application/json",
  origin = "https://example.com",
  ip = crypto.randomUUID(),
  contentLength,
}: {
  payload?: unknown;
  rawBody?: string;
  contentType?: string | null;
  origin?: string | null;
  ip?: string;
  contentLength?: string;
} = {}) {
  const headers = new Headers({ "x-forwarded-for": ip });
  if (contentType) headers.set("content-type", contentType);
  if (origin) headers.set("origin", origin);
  if (contentLength) headers.set("content-length", contentLength);
  return new Request("https://example.com/api/contact/", {
    method: "POST",
    headers,
    body: rawBody ?? JSON.stringify(payload),
  });
}

function stubProvider(status = 200) {
  const provider = vi.fn(async (
    _input: string | URL | Request,
    _options?: RequestInit,
  ) => {
    void _input;
    void _options;
    return new Response("{}", { status });
  });
  vi.stubGlobal("fetch", provider);
  return provider;
}

afterEach(() => {
  contactMock.enabled = true;
  vi.unstubAllGlobals();
});

describe("contact route", () => {
  it("fails closed with 503 before inspecting the request", async () => {
    contactMock.enabled = false;
    const response = await POST(contactRequest({ contentType: null, origin: null }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, code: "not_configured" });
  });

  it("rejects non-JSON media with 415", async () => {
    const response = await POST(contactRequest({ contentType: "text/plain" }));
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ ok: false, code: "unsupported_media_type" });
  });

  it("rejects declared and streamed oversized payloads with 413", async () => {
    const declared = await POST(contactRequest({ contentLength: "15001" }));
    expect(declared.status).toBe(413);
    expect(await declared.json()).toEqual({ ok: false, code: "payload_too_large" });

    const encoder = new TextEncoder();
    const streamedBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({
          ...validSubmission(),
          message: "x".repeat(15_001),
        })));
        controller.close();
      },
    });
    const streamed = await POST(new Request("https://example.com/api/contact/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://example.com",
        "x-forwarded-for": crypto.randomUUID(),
      },
      body: streamedBody,
      // Node requires duplex for a streamed Request body.
      duplex: "half",
    } as RequestInit));
    expect(streamed.status).toBe(413);
    expect(await streamed.json()).toEqual({ ok: false, code: "payload_too_large" });
  });

  it.each([null, "https://attacker.example"])(
    "rejects origin %s with 403",
    async (origin) => {
      const response = await POST(contactRequest({ origin }));
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ ok: false, code: "invalid_origin" });
    },
  );

  it("distinguishes invalid JSON, invalid schema and invalid timing with 400", async () => {
    const invalidJson = await POST(contactRequest({ rawBody: "{" }));
    expect(invalidJson.status).toBe(400);
    expect(await invalidJson.json()).toEqual({ ok: false, code: "invalid_json" });

    const invalidSchema = await POST(contactRequest({ payload: { locale: "en" } }));
    expect(invalidSchema.status).toBe(400);
    expect(await invalidSchema.json()).toEqual({ ok: false, code: "invalid_submission" });

    const invalidTiming = await POST(contactRequest({
      payload: { ...validSubmission(), startedAt: Date.now() },
    }));
    expect(invalidTiming.status).toBe(400);
    expect(await invalidTiming.json()).toEqual({ ok: false, code: "invalid_timing" });
  });

  it("limits the sixth request for one source within the window with 429", async () => {
    const provider = stubProvider();
    const ip = "203.0.113.42";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await POST(contactRequest({ ip }))).status).toBe(202);
    }
    const response = await POST(contactRequest({ ip }));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ ok: false, code: "rate_limited" });
    expect(provider).toHaveBeenCalledTimes(5);
  });

  it("maps provider rejection and network failure to 502", async () => {
    stubProvider(500);
    const rejected = await POST(contactRequest());
    expect(rejected.status).toBe(502);
    expect(await rejected.json()).toEqual({ ok: false, code: "delivery_failed" });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const failed = await POST(contactRequest());
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({ ok: false, code: "delivery_failed" });
  });

  it("sends the bounded email payload and returns 202 without cache or indexing", async () => {
    const provider = stubProvider();
    const response = await POST(contactRequest());
    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(await response.json()).toEqual({ ok: true });

    expect(provider).toHaveBeenCalledOnce();
    const [url, options] = provider.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options).toMatchObject({ method: "POST", cache: "no-store" });
    const headers = new Headers(options?.headers);
    expect(headers.get("authorization")).toMatch(/^Bearer re_/);
    expect(headers.get("idempotency-key")).toMatch(/^contact\/[0-9a-f-]+$/);
    expect(JSON.parse(String(options?.body))).toMatchObject({
      from: "web@example.com",
      to: ["contact@example.com"],
      reply_to: "alex@example.org",
      tags: [{ name: "source", value: "website-contact" }],
    });
  });
});
