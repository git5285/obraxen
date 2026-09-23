import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import fixture from "../fixtures/refactor-protocol.json";
import { getAuthorizationPaths, readAuthorizationStatus, registerAuthorizationBundle } from "../../automation/agents/authorizations.mjs";
import { digest } from "../../automation/agents/validation.mjs";

const roots: string[] = [];
const bundle = fixture.bundle;
const time = (minute: string) => `2026-09-01T10:${minute}:00Z`;
const base = {
  schemaVersion: 1, authorizationId: bundle.authorizationId,
  stepId: bundle.steps[0].stepId, action: "commit_candidate",
};
const context = {
  schemaVersion: 1, candidateId: bundle.candidate.candidateId,
  baseSha: bundle.candidate.baseSha, headSha: bundle.candidate.baseSha,
  branch: bundle.candidate.branch, changedPaths: bundle.candidate.allowedPaths,
  activationDigest: bundle.candidate.activationDigest,
  checks: bundle.steps[0].requiredChecks.map(checkId => ({
    checkId, status: "passed", evidenceDigest: "d".repeat(64),
  })),
};
const reservation = {
  ...base, type: "reserved", eventId: "reserve", previousEventId: null,
  occurredAt: time("01"), expiresAt: time("11"), context,
  contextDigest: digest(context), reservationTokenDigest: "e".repeat(64),
};
const completion = {
  ...base, type: "completed", eventId: "complete", previousEventId: "reserve",
  occurredAt: time("02"), reservationEventId: "reserve", result: { commitSha: "b".repeat(40) },
};
const revocation = {
  ...base, type: "revoked", eventId: "revoke", previousEventId: null,
  occurredAt: time("03"), action: null, stepId: null, humanDecision: bundle.humanDecision,
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

// Synthetic persisted legacy events exercise the public read API, never grant authority.
function replay(events: object[], now = time("04")) {
  const root = mkdtempSync(join(tmpdir(), "obraxen-chain-parity-"));
  roots.push(root);
  const repo = join(root, "repo");
  execFileSync("git", ["init", "-q", repo]);
  execFileSync("git", ["-C", repo, "remote", "add", "origin", "https://github.com/git5285/obraxen.git"]);
  const options = { repo, stateHome: join(root, "state"), now: new Date(bundle.issuedAt) };
  registerAuthorizationBundle(bundle, options);
  const directory = join(getAuthorizationPaths(repo, options.stateHome).events, bundle.authorizationId);
  mkdirSync(directory, { recursive: true });
  for (const event of events) {
    const body = event as { eventId: string };
    writeFileSync(join(directory, `${body.eventId}.json`), JSON.stringify({
      ...body, recordedAt: time("03"), eventDigest: digest(body),
    }));
  }
  const bytes = () => readdirSync(directory).sort().map(name => readFileSync(join(directory, name), "utf8"));
  const before = bytes();
  try {
    return readAuthorizationStatus(bundle.authorizationId, { ...options, now: new Date(now) });
  } finally {
    expect(bytes()).toEqual(before);
  }
}

it.each([
  { events: [], now: time("04"), status: "pending", nextStepIndex: 0 },
  { events: [], now: bundle.expiresAt, status: "expired", nextStepIndex: 0 },
  { events: [reservation], now: time("04"), status: "reserved", nextStepIndex: 0 },
  { events: [reservation], now: time("11"), status: "reservation_expired", nextStepIndex: 0 },
  { events: [reservation, completion], now: bundle.expiresAt, status: "completed", nextStepIndex: 1 },
  { events: [revocation], now: bundle.expiresAt, status: "revoked", nextStepIndex: 0 },
])("preserves $status and its precedence", ({ events, now, status, nextStepIndex }) => {
  expect(replay(events, now)).toMatchObject({
    bundle, status, nextStepIndex, eventCount: events.length,
    candidateDigest: null,
    commitSha: status === "completed" ? "b".repeat(40) : null,
    nextStep: ["completed", "revoked"].includes(status) ? null : bundle.steps[0],
  });
});

it("accepts file ordering different from chronological event ordering", () => {
  expect(replay([completion, reservation])).toMatchObject({
    status: "completed", latestEventId: "complete", latestOccurredAt: time("02"),
  });
});

it.each([
  { events: [reservation, revocation], error: "authorization events must have exactly one root" },
  { events: [reservation, { ...completion, previousEventId: "missing" }], error: "authorization event references a missing predecessor" },
  { events: [reservation, completion, { ...revocation, previousEventId: "reserve" }], error: "authorization event chain forks" },
  { events: [reservation, { ...revocation, eventId: "cycle", previousEventId: "cycle" }], error: "authorization event chain is disconnected" },
  { events: [{ ...reservation, authorizationId: "other" }], error: "authorization event belongs to a different authorization" },
  { events: [reservation, { ...completion, occurredAt: time("00") }], error: "authorization events must be chronological" },
  { events: [revocation, { ...revocation, eventId: "later", previousEventId: "revoke", occurredAt: time("04") }], error: "a revoked authorization cannot have later events" },
  { events: [reservation, { ...completion, reservationEventId: "other" }], error: "completed step references the wrong reservation" },
  { events: [reservation, { ...completion, result: { commitSha: bundle.candidate.baseSha } }], error: "candidate commit must differ from its base SHA" },
])("preserves error: $error", ({ events, error }) => {
  expect(() => replay(events)).toThrow(error);
});
