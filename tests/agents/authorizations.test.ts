import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  completeAuthorizationStep,
  getAuthorizationPaths,
  inspectAuthorizationStep,
  readAuthorizationStatus,
  registerAuthorizationBundle,
  reserveAuthorizationStep,
  revokeAuthorizationBundle,
  validateAuthorizationBundle,
} from "../../automation/agents/authorizations.mjs";
import type {
  AuthorizationCheckId,
  AuthorizationContext,
} from "../../automation/agents/authorizations.mjs";
import { loadPolicy } from "../../automation/agents/policy.mjs";

const temporaryDirectories: string[] = [];
const origin = "https://github.com/git5285/obraxen.git";
const baseSha = "a".repeat(40);
const commitSha = "b".repeat(40);
const activationDigest = "c".repeat(64);
const evidenceDigest = "d".repeat(64);
const authorizationCli = fileURLToPath(
  new URL("../../automation/agents/authorizations.mjs", import.meta.url),
);

function repository() {
  const directory = mkdtempSync(join(tmpdir(), "obraxen-agent-authorization-"));
  temporaryDirectories.push(directory);
  execFileSync("git", ["init", "-q", directory]);
  execFileSync("git", ["-C", directory, "remote", "add", "origin", origin]);
  return directory;
}

function stateHome() {
  const directory = mkdtempSync(join(tmpdir(), "obraxen-agent-state-"));
  temporaryDirectories.push(directory);
  return directory;
}

function bundle() {
  return {
    schemaVersion: 1 as const,
    authorizationId: "authorization-candidate-001",
    repositoryIdentity: "github.com/git5285/obraxen",
    humanDecision: {
      decisionId: "decision-turn-001",
      source: "Codex task 019f-example",
      statement: "Authorize the exact candidate delivery sequence described here.",
    },
    issuedAt: "2026-07-18T12:00:00Z",
    expiresAt: "2026-07-18T13:00:00Z",
    candidate: {
      candidateId: "candidate-001",
      baseSha,
      branch: "codex/candidate-001",
      commitSha: null,
      allowedPaths: ["src/example.ts", "tests/example.test.ts"],
      activationDigest,
    },
    steps: [
      {
        stepId: "step-commit-001",
        action: "commit_candidate" as const,
        requiredChecks: ["local_quality", "activation_unchanged"] as const,
      },
      {
        stepId: "step-push-001",
        action: "push_branch" as const,
        requiredChecks: [
          "committed_diff_policy",
          "local_quality",
          "activation_unchanged",
        ] as const,
      },
      {
        stepId: "step-pr-001",
        action: "create_draft_pull_request" as const,
        requiredChecks: ["remote_branch_matches_commit"] as const,
      },
    ],
  };
}

function context(action: "commit" | "push" | "pr"): AuthorizationContext {
  const checks: AuthorizationCheckId[] = action === "commit"
    ? ["local_quality", "activation_unchanged"]
    : action === "push"
      ? ["committed_diff_policy", "local_quality", "activation_unchanged"]
      : ["remote_branch_matches_commit"];
  return {
    schemaVersion: 2 as const,
    candidateId: "candidate-001",
    baseSha,
    branch: "codex/candidate-001",
    headSha: action === "commit" ? baseSha : commitSha,
    changedPaths: ["src/example.ts", "tests/example.test.ts"],
    activationDigest,
    checks: checks.map((checkId) => ({ checkId, status: "passed" as const, evidenceDigest })),
    candidateDigest: "e".repeat(64),
    runtimeFingerprint: "f".repeat(64),
    audit: {
      builderId: "fixture-builder-001", reviewerId: "fixture-auditor-002",
      completedAt: "2026-07-18T12:01:00Z", candidateDigest: "e".repeat(64),
      output: {schemaVersion: 4, verdict: "pass", attentionClass: "product",
        runId: "fixture-review-001", candidateId: "candidate-001", baseSha,
        runtimeFingerprint: "f".repeat(64), findings: [], verifiedChecks: ["fixture local check"],
        reason: "Independent deterministic fixture evidence; not a model review"},
    },
  };
}

function register(repo: string, state: string) {
  return registerAuthorizationBundle(bundle(), {
    repo,
    stateHome: state,
    now: new Date("2026-07-18T12:01:00Z"),
  });
}

function reserve(
  repo: string,
  state: string,
  action: "commit" | "push" | "pr",
  minute: number,
) {
  return reserveAuthorizationStep({
    authorizationId: bundle().authorizationId,
    context: context(action),
    eventId: `reserve-${action}-001`,
    occurredAt: `2026-07-18T12:${String(minute).padStart(2, "0")}:00Z`,
    repo,
    stateHome: state,
    now: new Date(`2026-07-18T12:${String(minute).padStart(2, "0")}:00Z`),
  });
}

// Build legacy fixture bytes without asking the new API to grant legacy authority.
function legacyReservation(repo: string, state: string, action: "commit" | "push" | "pr") {
  const file = join(getAuthorizationPaths(repo, state).events, bundle().authorizationId, `reserve-${action}-001.json`);
  const event = JSON.parse(readFileSync(file, "utf8"));
  event.context.schemaVersion = 1;
  for (const key of ["audit", "candidateDigest", "runtimeFingerprint"]) delete event.context[key];
  const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical)
    : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canonical(x)])) : v;
  const hash = (v: unknown) => createHash("sha256").update(JSON.stringify(canonical(v))).digest("hex");
  event.contextDigest = hash(event.context);
  event.eventDigest = hash(Object.fromEntries(Object.entries(event).filter(([k]) => !["recordedAt", "eventDigest"].includes(k))));
  writeFileSync(file, JSON.stringify(event));
  return file;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("grouped human authorizations", () => {
  it.each(["commit", "push", "pr"] as const)("creates zero %s reservations without a prior matching independent pass", (action) => {
    const repo = repository(), state = stateHome();
    const original = bundle(), index = {commit: 0, push: 1, pr: 2}[action];
    const selected = {...original, candidate: {...original.candidate, commitSha: action === "commit" ? null : commitSha},
      steps: original.steps.slice(index)};
    const options = {repo, stateHome: state, now: new Date("2026-07-18T12:02:00Z")};
    registerAuthorizationBundle(selected, options);
    const valid = context(action);
    const invalid: unknown[] = [
      {...valid, schemaVersion: 1},
      {...valid, audit: undefined},
      {...valid, audit: {...valid.audit, reviewerId: valid.audit.builderId}},
      {...valid, audit: {...valid.audit, completedAt: "2026-07-18T12:03:00Z"}},
      {...valid, audit: {...valid.audit, candidateDigest: "0".repeat(64)}},
      ...["veto", "needs_human"].map(verdict => ({...valid, audit: {...valid.audit,
        output: {...valid.audit.output, verdict, findings: [{severity: "high", source: "fixture:1", finding: "not approved"}]}}})),
      ...[{candidateId: "another-candidate"}, {baseSha: "0".repeat(40)}, {runtimeFingerprint: "0".repeat(64)}, {verifiedChecks: []}]
        .map(change => ({...valid, audit: {...valid.audit, output: {...valid.audit.output, ...change}}})),
    ];
    for (const value of invalid) {
      expect(() => inspectAuthorizationStep(selected.authorizationId, value, options)).toThrow();
      expect(() => reserveAuthorizationStep({...options, authorizationId: selected.authorizationId,
        context: value, eventId: "must-not-reserve", occurredAt: "2026-07-18T12:02:00Z"})).toThrow();
      expect(readAuthorizationStatus(selected.authorizationId, options)).toMatchObject({status: "pending", eventCount: 0});
    }
    expect(inspectAuthorizationStep(selected.authorizationId, valid, options)).toMatchObject({canReserve: true});
  });

  it("rejects content drift after commit even if a different diff has a passing audit", () => {
    const repo = repository(), state = stateHome(); register(repo, state);
    const first = reserve(repo, state, "commit", 2);
    completeAuthorizationStep({authorizationId: bundle().authorizationId, reservationToken: first.reservationToken,
      result: {commitSha}, eventId: "commit-drift-fixture", occurredAt: "2026-07-18T12:03:00Z",
      repo, stateHome: state, now: new Date("2026-07-18T12:03:00Z")});
    const next = context("push"); next.candidateDigest = "0".repeat(64); next.audit.candidateDigest = next.candidateDigest;
    expect(() => reserveAuthorizationStep({authorizationId: bundle().authorizationId, context: next,
      eventId: "drift-must-not-reserve", occurredAt: "2026-07-18T12:04:00Z", repo, stateHome: state,
      now: new Date("2026-07-18T12:04:00Z")})).toThrow("content drifted");
    expect(readAuthorizationStatus(bundle().authorizationId, {repo, stateHome: state,
      now: new Date("2026-07-18T12:04:00Z")})).toMatchObject({eventCount: 2, status: "pending"});
  });

  it("reads legacy reservation history unchanged but rejects new completion without audit", () => {
    const repo = repository(), state = stateHome(); register(repo, state);
    const first = reserve(repo, state, "commit", 2);
    const file = legacyReservation(repo, state, "commit");
    const before = readFileSync(file, "utf8"), options = {repo, stateHome: state, now: new Date("2026-07-18T12:03:00Z")};
    expect(readAuthorizationStatus(bundle().authorizationId, options)).toMatchObject({status: "reserved", eventCount: 1});
    expect(() => completeAuthorizationStep({...options, authorizationId: bundle().authorizationId,
      reservationToken: first.reservationToken, result: {commitSha}, eventId: "legacy-must-not-complete",
      occurredAt: "2026-07-18T12:03:00Z"})).toThrow("independent audit evidence");
    expect(readFileSync(file, "utf8")).toBe(before);
    expect(readAuthorizationStatus(bundle().authorizationId, options)).toMatchObject({eventCount: 1});
  });

  it("preserves completed legacy chains and permits a reviewed v2 continuation of completed legacy steps", () => {
    const repo = repository(), state = stateHome(); register(repo, state);
    const retained: Array<[string, string]> = [];
    for (const [index, action] of (["commit", "push", "pr"] as const).entries()) {
      const minute = 2 + index * 2, reservation = reserve(repo, state, action, minute);
      const result = action === "commit" ? {commitSha} : action === "push"
        ? {remote: "origin" as const, branch: "codex/candidate-001", commitSha}
        : {number: 42, url: `${origin.slice(0, -4)}/pull/42`, headSha: commitSha};
      completeAuthorizationStep({authorizationId: bundle().authorizationId, reservationToken: reservation.reservationToken,
        result, eventId: `complete-${action}-legacy-fixture`, occurredAt: `2026-07-18T12:0${minute + 1}:00Z`,
        repo, stateHome: state, now: new Date(`2026-07-18T12:0${minute + 1}:00Z`)});
      for (const [file, bytes] of retained) expect(readFileSync(file, "utf8")).toBe(bytes);
      const file = legacyReservation(repo, state, action); retained.push([file, readFileSync(file, "utf8")]);
      expect(readAuthorizationStatus(bundle().authorizationId, {repo, stateHome: state,
        now: new Date(`2026-07-18T12:0${minute + 1}:00Z`)})).toMatchObject({
        status: action === "pr" ? "completed" : "pending", eventCount: (index + 1) * 2,
      });
    }
    for (const [file, bytes] of retained) expect(readFileSync(file, "utf8")).toBe(bytes);
  });

  it("bounds exact human delivery at twenty paths without widening autonomous diffs", () => {
    const policy = loadPolicy();
    expect(policy.limits.maxChangedFiles).toBe(8);
    const large = bundle();
    large.candidate.allowedPaths = Array.from({ length: 20 }, (_, i) => `src/file-${String(i).padStart(2, "0")}.ts`);
    expect(validateAuthorizationBundle(large, policy).candidate.allowedPaths).toHaveLength(20);
    large.candidate.allowedPaths.push("src/file-20.ts");
    expect(() => validateAuthorizationBundle(large, policy)).toThrow("allowedPaths");
  });

  it("keeps the legacy eight-path limit when the human limit is absent", () => {
    const policy = loadPolicy();
    delete policy.groupedAuthorizations.maxChangedFiles;
    const legacy = bundle();
    legacy.candidate.allowedPaths = Array.from({ length: 8 }, (_, i) => `src/file-${i}.ts`);
    expect(validateAuthorizationBundle(legacy, policy).candidate.allowedPaths).toHaveLength(8);
    legacy.candidate.allowedPaths.push("src/file-8.ts");
    expect(() => validateAuthorizationBundle(legacy, policy)).toThrow("allowedPaths");
  });

  it("persists a larger human scope but rejects any changed reservation scope", () => {
    const repo = repository();
    const state = stateHome();
    const large = bundle();
    large.candidate.allowedPaths = Array.from({ length: 20 }, (_, i) => `src/file-${String(i).padStart(2, "0")}.ts`);
    registerAuthorizationBundle(large, { repo, stateHome: state, now: new Date("2026-07-18T12:01:00Z") });
    const exactContext = { ...context("commit"), changedPaths: large.candidate.allowedPaths };
    const options = { repo, stateHome: state, now: new Date("2026-07-18T12:02:00Z") };
    expect(readAuthorizationStatus(large.authorizationId, options).status).toBe("pending");
    expect(() => inspectAuthorizationStep(large.authorizationId, {
      ...exactContext, changedPaths: large.candidate.allowedPaths.slice(1),
    }, options)).toThrow("changedPaths");
    const reserved = reserveAuthorizationStep({
      ...options, authorizationId: large.authorizationId, context: exactContext,
      eventId: "large-scope-reserve-001", occurredAt: "2026-07-18T12:02:00Z",
    });
    expect(reserved.reservationToken).toBeTruthy();
    expect(() => reserveAuthorizationStep({
      ...options, authorizationId: large.authorizationId, context: exactContext,
      eventId: "large-scope-reserve-002", occurredAt: "2026-07-18T12:02:00Z",
    })).toThrow("reserved");
  });

  it("completes one exact commit, push and draft PR sequence with single-use reservations", () => {
    const repo = repository();
    const state = stateHome();
    register(repo, state);

    const commitReservation = reserve(repo, state, "commit", 2);
    completeAuthorizationStep({
      authorizationId: bundle().authorizationId,
      reservationToken: commitReservation.reservationToken,
      result: { commitSha },
      eventId: "complete-commit-001",
      occurredAt: "2026-07-18T12:03:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:03:00Z"),
    });

    const pushReservation = reserve(repo, state, "push", 4);
    completeAuthorizationStep({
      authorizationId: bundle().authorizationId,
      reservationToken: pushReservation.reservationToken,
      result: { remote: "origin", branch: "codex/candidate-001", commitSha },
      eventId: "complete-push-001",
      occurredAt: "2026-07-18T12:05:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:05:00Z"),
    });

    const prReservation = reserve(repo, state, "pr", 6);
    completeAuthorizationStep({
      authorizationId: bundle().authorizationId,
      reservationToken: prReservation.reservationToken,
      result: {
        number: 41,
        url: "https://github.com/git5285/obraxen/pull/41",
        headSha: commitSha,
      },
      eventId: "complete-pr-001",
      occurredAt: "2026-07-18T12:07:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:07:00Z"),
    });

    expect(readAuthorizationStatus(bundle().authorizationId, {
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:08:00Z"),
    })).toMatchObject({ status: "completed", eventCount: 6, nextStep: null, commitSha });
    expect(() => completeAuthorizationStep({
      authorizationId: bundle().authorizationId,
      reservationToken: prReservation.reservationToken,
      result: { number: 41, url: "https://github.com/git5285/obraxen/pull/41", headSha: commitSha },
      eventId: "replay-pr-001",
      occurredAt: "2026-07-18T12:08:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:08:00Z"),
    })).toThrow("status is completed");
  });

  it("rejects merge, deployment, publication and non-contiguous escalation", () => {
    const policy = loadPolicy();
    for (const forbidden of ["merge", "deploy", "publish", "delete_branch"]) {
      const candidate = {
        ...bundle(),
        steps: [{ stepId: `step-${forbidden}`, action: forbidden, requiredChecks: [] }],
      };
      expect(() => validateAuthorizationBundle(candidate, policy)).toThrow("not policy-authorized");
    }
    const original = bundle();
    const skipped = { ...original, steps: [original.steps[0], original.steps[2]] };
    expect(() => validateAuthorizationBundle(skipped, policy)).toThrow("contiguous delivery sequence");
  });

  it("requires an exact bounded human decision and candidate", () => {
    const policy = loadPolicy();
    const expired = { ...bundle(), expiresAt: "2026-07-20T12:00:01Z" };
    expect(() => validateAuthorizationBundle(expired, policy)).toThrow("lifetime exceeds");

    const original = bundle();
    const main = { ...original, candidate: { ...original.candidate, branch: "main" } };
    expect(() => validateAuthorizationBundle(main, policy)).toThrow("safe codex/ branch");

    const vague = {
      ...original,
      humanDecision: { ...original.humanDecision, statement: "" },
    };
    expect(() => validateAuthorizationBundle(vague, policy)).toThrow("trimmed non-empty text");

    const literalRoute = {
      ...original,
      candidate: { ...original.candidate, allowedPaths: ["src/app/[lang]/page.tsx"] },
    };
    expect(validateAuthorizationBundle(literalRoute, policy).candidate.allowedPaths).toEqual([
      "src/app/[lang]/page.tsx",
    ]);

    for (const path of [
      "src/**",
      "src/file?.ts",
      "src/{one,two}.ts",
      "src/app/[0-9]/page.tsx",
      "src/app/[[]lang]/page.tsx",
      "src/app/[lang/page.tsx",
      "src/app/lang]/page.tsx",
    ]) {
      const wildcard = {
        ...original,
        candidate: { ...original.candidate, allowedPaths: [path] },
      };
      expect(() => validateAuthorizationBundle(wildcard, policy)).toThrow(
        "canonical repository paths",
      );
    }

    const wrongRepository = { ...original, repositoryIdentity: "github.com/example/other" };
    expect(() => registerAuthorizationBundle(wrongRepository, {
      repo: repository(),
      stateHome: stateHome(),
      now: new Date("2026-07-18T12:01:00Z"),
    })).toThrow("different repository");
  });

  it("fails closed on path, base, activation or check drift before reservation", () => {
    const repo = repository();
    const state = stateHome();
    register(repo, state);
    const changes = [
      { changedPaths: ["src/other.ts"] },
      { baseSha: "e".repeat(40) },
      { activationDigest: "f".repeat(64) },
      { checks: [{ checkId: "local_quality", status: "passed", evidenceDigest }] },
    ];
    for (const change of changes) {
      expect(() => inspectAuthorizationStep(bundle().authorizationId, {
        ...context("commit"),
        ...change,
      }, { repo, stateHome: state, now: new Date("2026-07-18T12:02:00Z") })).toThrow();
    }
    expect(existsSync(getAuthorizationPaths(repo, state).events)).toBe(false);
  });

  it("never retries or reclaims an expired reservation automatically", () => {
    const repo = repository();
    const state = stateHome();
    register(repo, state);
    const reservation = reserve(repo, state, "commit", 2);
    expect(readAuthorizationStatus(bundle().authorizationId, {
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:03:00Z"),
    })).toMatchObject({
      reservation: {
        context: {
          candidateId: "candidate-001",
          checks: [
            { checkId: "local_quality", status: "passed", evidenceDigest },
            { checkId: "activation_unchanged", status: "passed", evidenceDigest },
          ],
        },
      },
    });
    expect(readAuthorizationStatus(bundle().authorizationId, {
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:13:00Z"),
    }).status).toBe("reservation_expired");
    expect(() => reserveAuthorizationStep({
      authorizationId: bundle().authorizationId,
      context: context("commit"),
      eventId: "reserve-commit-retry",
      occurredAt: "2026-07-18T12:13:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:13:00Z"),
    })).toThrow("reservation_expired");
    expect(() => completeAuthorizationStep({
      authorizationId: bundle().authorizationId,
      reservationToken: reservation.reservationToken,
      result: { commitSha },
      eventId: "complete-expired-001",
      occurredAt: "2026-07-18T12:13:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:13:00Z"),
    })).toThrow("reservation_expired");
  });

  it("rejects wrong tokens and result drift without persisting completion", () => {
    const repo = repository();
    const state = stateHome();
    register(repo, state);
    const reservation = reserve(repo, state, "commit", 2);
    expect(() => completeAuthorizationStep({
      authorizationId: bundle().authorizationId,
      reservationToken: "wrong-token-that-is-long-enough-to-be-shaped",
      result: { commitSha },
      eventId: "complete-wrong-token",
      occurredAt: "2026-07-18T12:03:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:03:00Z"),
    })).toThrow("does not match");
    expect(() => completeAuthorizationStep({
      authorizationId: bundle().authorizationId,
      reservationToken: reservation.reservationToken,
      result: { commitSha: baseSha },
      eventId: "complete-wrong-sha",
      occurredAt: "2026-07-18T12:03:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:03:00Z"),
    })).toThrow("differ from its base");
    expect(readAuthorizationStatus(bundle().authorizationId, {
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:03:00Z"),
    })).toMatchObject({ status: "reserved", eventCount: 1 });
  });

  it("revokes pending or stalled authority only with a new human decision", () => {
    const repo = repository();
    const state = stateHome();
    register(repo, state);
    revokeAuthorizationBundle({
      authorizationId: bundle().authorizationId,
      humanDecision: {
        decisionId: "decision-revoke-001",
        source: "Codex task 019f-example",
        statement: "Revoke the remaining grouped delivery authority.",
      },
      eventId: "revoke-authorization-001",
      occurredAt: "2026-07-18T12:02:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:02:00Z"),
    });
    expect(readAuthorizationStatus(bundle().authorizationId, {
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:03:00Z"),
    })).toMatchObject({ status: "revoked", nextStep: null });
    expect(() => reserve(repo, state, "commit", 3)).toThrow("status is revoked");
  });

  it("rejects a draft pull request result from another repository", () => {
    const repo = repository();
    const state = stateHome();
    const original = bundle();
    const directPr = {
      ...original,
      authorizationId: "authorization-direct-pr-001",
      candidate: { ...original.candidate, commitSha },
      steps: [original.steps[2]],
    };
    registerAuthorizationBundle(directPr, {
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:01:00Z"),
    });
    const reservation = reserveAuthorizationStep({
      authorizationId: directPr.authorizationId,
      context: context("pr"),
      eventId: "reserve-direct-pr-001",
      occurredAt: "2026-07-18T12:02:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:02:00Z"),
    });
    expect(() => completeAuthorizationStep({
      authorizationId: directPr.authorizationId,
      reservationToken: reservation.reservationToken,
      result: {
        number: 41,
        url: "https://github.com/example/other/pull/41",
        headSha: commitSha,
      },
      eventId: "complete-direct-pr-001",
      occurredAt: "2026-07-18T12:03:00Z",
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:03:00Z"),
    })).toThrow("different repository");
    expect(readAuthorizationStatus(directPr.authorizationId, {
      repo,
      stateHome: state,
      now: new Date("2026-07-18T12:03:00Z"),
    })).toMatchObject({ status: "reserved", eventCount: 1 });
  });

  it("shares immutable grants across clones and detects stored corruption", () => {
    const first = repository();
    const second = repository();
    const state = stateHome();
    register(first, state);
    expect(readAuthorizationStatus(bundle().authorizationId, {
      repo: second,
      stateHome: state,
      now: new Date("2026-07-18T12:02:00Z"),
    }).status).toBe("pending");
    const path = join(
      getAuthorizationPaths(first, state).bundles,
      `${bundle().authorizationId}.json`,
    );
    const stored = JSON.parse(readFileSync(path, "utf8"));
    stored.candidate.branch = "codex/tampered";
    writeFileSync(path, `${JSON.stringify(stored)}\n`);
    expect(() => readAuthorizationStatus(bundle().authorizationId, {
      repo: first,
      stateHome: state,
    })).toThrow("is corrupt");
  });

  it("forbids per-run state-home overrides in the authorization CLI", () => {
    expect(() => execFileSync(process.execPath, [
      authorizationCli,
      "status",
      "--state-home",
      stateHome(),
    ], { stdio: "pipe" })).toThrow();
  });
});
