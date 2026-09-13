import { describe, expect, it } from "vitest";
import { isLocalQaRequest } from "@/lib/qa-access";

describe("local QA harness access", () => {
  const environment = {
    QA_CONTACT_HARNESS: "local-playwright",
    QA_CONTACT_HARNESS_TOKEN: "ephemeral-test-token",
  };

  it("accepts only loopback requests carrying the per-run token", () => {
    expect(isLocalQaRequest(environment, {
      host: "127.0.0.1:4311",
      token: "ephemeral-test-token",
    })).toBe(true);
    expect(isLocalQaRequest(environment, {
      host: "localhost:4311",
      token: "ephemeral-test-token",
    })).toBe(true);
    expect(isLocalQaRequest(environment, {
      host: "[::1]:4311",
      token: "ephemeral-test-token",
    })).toBe(true);
  });

  it("fails closed for missing, wrong or public access context", () => {
    expect(isLocalQaRequest(environment, { host: "127.0.0.1:4311", token: null })).toBe(false);
    expect(isLocalQaRequest(environment, { host: "127.0.0.1:4311", token: "wrong-token" })).toBe(false);
    expect(isLocalQaRequest(environment, { host: null, token: "ephemeral-test-token" })).toBe(false);
    expect(isLocalQaRequest(environment, { host: "obraxen.com", token: "ephemeral-test-token" })).toBe(false);
    expect(isLocalQaRequest(environment, { host: "%", token: "ephemeral-test-token" })).toBe(false);
    expect(isLocalQaRequest({ ...environment, VERCEL: "1" }, {
      host: "127.0.0.1:4311",
      token: "ephemeral-test-token",
    })).toBe(false);
  });
});
