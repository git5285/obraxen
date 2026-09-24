import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readArgumentValue as argument } from "./cli-arguments.mjs";
import { getCoordinationPaths, registerClone } from "./lease.mjs";
import { loadPolicy } from "./policy.mjs";
import { validateAuditorOutput } from "./contracts.mjs";
import {
  BUNDLE_KEYS,
  GROUPED_AUTHORIZATION_ACTIONS,
  nonEmptyText,
  validateDecision,
  validateAuthorizationBundle as validateAuthorizationBundleSchema,
} from "./authorization-schema.mjs";

export { GROUPED_AUTHORIZATION_ACTIONS, REQUIRED_ACTION_CHECKS } from "./authorization-schema.mjs";
import { ensurePrivateDirectory, writeJsonAtomically } from "./storage.mjs";
import {
  digest,
  exactKeys,
  object,
  safeIdentifier,
  sha,
  sha256,
  timestamp,
} from "./validation.mjs";

const EVENT_COMMON_KEYS = [
  "action",
  "authorizationId",
  "eventId",
  "occurredAt",
  "previousEventId",
  "schemaVersion",
  "stepId",
  "type",
];

function sameArray(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function validateAuthorizationBundle(raw, policy = loadPolicy()) {
  return validateAuthorizationBundleSchema(raw, policy);
}

export function getAuthorizationPaths(repo = process.cwd(), stateHome = null) {
  const coordination = getCoordinationPaths(repo, stateHome);
  return {
    root: coordination.root,
    repositoryIdentity: coordination.repositoryIdentity,
    bundles: join(coordination.root, "authorization-bundles"),
    events: join(coordination.root, "authorization-events"),
    locks: join(coordination.root, "authorization-locks"),
  };
}

function withAuthorizationLock(paths, authorizationId, operation) {
  ensurePrivateDirectory(paths.locks);
  const lock = join(paths.locks, authorizationId);
  try {
    mkdirSync(lock, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error("authorization mutation is already in progress");
    throw error;
  }
  try {
    return operation();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

function validateStoredBundle(raw, fileName, policy, repositoryIdentity) {
  const stored = object(raw, `stored authorization ${fileName}`);
  exactKeys(stored, `stored authorization ${fileName}`, [...BUNDLE_KEYS, "bundleDigest", "recordedAt"]);
  timestamp(stored.recordedAt, "stored authorization.recordedAt");
  sha256(stored.bundleDigest, "stored authorization.bundleDigest");
  const bundle = validateAuthorizationBundle(
    Object.fromEntries(BUNDLE_KEYS.map((key) => [key, stored[key]])),
    policy,
  );
  if (stored.bundleDigest !== digest(bundle)) throw new Error(`stored authorization ${fileName} is corrupt`);
  if (bundle.repositoryIdentity !== repositoryIdentity) {
    throw new Error("stored authorization belongs to a different repository");
  }
  if (fileName !== `${bundle.authorizationId}.json`) {
    throw new Error("stored authorization filename does not match authorizationId");
  }
  return { ...bundle, bundleDigest: stored.bundleDigest, recordedAt: stored.recordedAt };
}

export function readAuthorizationBundles(repo = process.cwd(), stateHome = null, policy = loadPolicy()) {
  const paths = getAuthorizationPaths(repo, stateHome);
  if (!existsSync(paths.bundles)) return [];
  return readdirSync(paths.bundles)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => validateStoredBundle(
      JSON.parse(readFileSync(join(paths.bundles, name), "utf8")),
      name,
      policy,
      paths.repositoryIdentity,
    ));
}

function storedBundleBody(stored) {
  return Object.fromEntries(BUNDLE_KEYS.map((key) => [key, stored[key]]));
}

export function registerAuthorizationBundle(raw, {
  repo = process.cwd(),
  stateHome = null,
  policy = loadPolicy(),
  now = new Date(),
} = {}) {
  const bundle = validateAuthorizationBundle(structuredClone(raw), policy);
  if (Date.parse(bundle.issuedAt) > now.getTime()) throw new Error("authorization is not active yet");
  if (Date.parse(bundle.expiresAt) <= now.getTime()) throw new Error("authorization has expired");
  registerClone(repo, { stateHome, now });
  const paths = getAuthorizationPaths(repo, stateHome);
  if (bundle.repositoryIdentity !== paths.repositoryIdentity) {
    throw new Error("authorization belongs to a different repository");
  }
  ensurePrivateDirectory(paths.bundles);
  const target = join(paths.bundles, `${bundle.authorizationId}.json`);
  return withAuthorizationLock(paths, bundle.authorizationId, () => {
    if (existsSync(target)) {
      const existing = validateStoredBundle(
        JSON.parse(readFileSync(target, "utf8")),
        `${bundle.authorizationId}.json`,
        policy,
        paths.repositoryIdentity,
      );
      if (existing.bundleDigest !== digest(bundle)) {
        throw new Error("authorizationId already exists with different content");
      }
      return { duplicate: true, authorization: existing };
    }
    const stored = {
      ...bundle,
      recordedAt: now.toISOString(),
      bundleDigest: digest(bundle),
    };
    writeJsonAtomically(target, stored);
    return { duplicate: false, authorization: stored };
  });
}

function validateResult(action, raw, label = "event.result") {
  const result = object(raw, label);
  if (action === "commit_candidate") {
    exactKeys(result, label, ["commitSha"]);
    sha(result.commitSha, `${label}.commitSha`);
  } else if (action === "push_branch") {
    exactKeys(result, label, ["branch", "commitSha", "remote"]);
    sha(result.commitSha, `${label}.commitSha`);
    if (result.remote !== "origin") throw new Error(`${label}.remote must be origin`);
    nonEmptyText(result.branch, `${label}.branch`, 128);
  } else if (action === "create_draft_pull_request") {
    exactKeys(result, label, ["headSha", "number", "url"]);
    sha(result.headSha, `${label}.headSha`);
    if (!Number.isInteger(result.number) || result.number < 1) {
      throw new Error(`${label}.number must be a positive integer`);
    }
    const url = new URL(result.url);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.search
      || url.hash
      || !url.pathname.endsWith(`/pull/${result.number}`)
    ) {
      throw new Error(`${label}.url must identify its pull request over https`);
    }
  } else {
    throw new Error(`${label} belongs to an unsupported action`);
  }
  return result;
}

function validatePullRequestRepository(result, repositoryIdentity) {
  const url = new URL(result.url);
  const expected = `https://${repositoryIdentity}/pull/${result.number}`;
  if (`${url.origin}${url.pathname}` !== expected) {
    throw new Error("draft pull request belongs to a different repository");
  }
}

export function validateAuthorizationEvent(raw) {
  const event = object(raw, "authorization event");
  if (event.type === "reserved") {
    exactKeys(event, "authorization event", [
      ...EVENT_COMMON_KEYS,
      "context",
      "contextDigest",
      "expiresAt",
      "reservationTokenDigest",
    ]);
    sha256(event.contextDigest, "event.contextDigest");
    object(event.context, "event.context");
    if (event.contextDigest !== digest(event.context)) {
      throw new Error("event.contextDigest does not match its context");
    }
    timestamp(event.expiresAt, "event.expiresAt");
    sha256(event.reservationTokenDigest, "event.reservationTokenDigest");
  } else if (event.type === "completed") {
    exactKeys(event, "authorization event", [
      ...EVENT_COMMON_KEYS,
      "reservationEventId",
      "result",
    ]);
    safeIdentifier(event.reservationEventId, "event.reservationEventId");
    validateResult(event.action, event.result);
  } else if (event.type === "revoked") {
    exactKeys(event, "authorization event", [...EVENT_COMMON_KEYS, "humanDecision"]);
    validateDecision(event.humanDecision, "event.humanDecision");
    if (event.action !== null || event.stepId !== null) {
      throw new Error("a revocation cannot identify a delivery step");
    }
  } else {
    throw new Error("authorization event type is unsupported");
  }
  if (event.schemaVersion !== 1) throw new Error("authorization event schemaVersion must be 1");
  safeIdentifier(event.eventId, "event.eventId");
  safeIdentifier(event.authorizationId, "event.authorizationId");
  timestamp(event.occurredAt, "event.occurredAt");
  if (event.previousEventId !== null) safeIdentifier(event.previousEventId, "event.previousEventId");
  if (event.type !== "revoked") {
    safeIdentifier(event.stepId, "event.stepId");
    if (!GROUPED_AUTHORIZATION_ACTIONS.includes(event.action)) {
      throw new Error("authorization event action is unsupported");
    }
  }
  return structuredClone(event);
}

function validateStoredEvent(raw, fileName) {
  const stored = object(raw, `stored authorization event ${fileName}`);
  const body = Object.fromEntries(
    Object.keys(stored)
      .filter((key) => key !== "eventDigest" && key !== "recordedAt")
      .map((key) => [key, stored[key]]),
  );
  const event = validateAuthorizationEvent(body);
  exactKeys(stored, `stored authorization event ${fileName}`, [
    ...Object.keys(event),
    "eventDigest",
    "recordedAt",
  ]);
  timestamp(stored.recordedAt, "stored authorization event.recordedAt");
  sha256(stored.eventDigest, "stored authorization event.eventDigest");
  if (stored.eventDigest !== digest(event)) throw new Error(`stored authorization event ${fileName} is corrupt`);
  if (fileName !== `${event.eventId}.json`) throw new Error("authorization event filename does not match eventId");
  return { ...event, eventDigest: stored.eventDigest, recordedAt: stored.recordedAt };
}

export function readAuthorizationEvents(
  authorizationId,
  repo = process.cwd(),
  stateHome = null,
) {
  safeIdentifier(authorizationId, "authorizationId");
  const directory = join(getAuthorizationPaths(repo, stateHome).events, authorizationId);
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => validateStoredEvent(
      JSON.parse(readFileSync(join(directory, name), "utf8")),
      name,
    ));
}

function buildAuthorizationChain(bundle, events) {
  const byId = new Map(events.map((event) => [event.eventId, event]));
  if (byId.size !== events.length) throw new Error("authorization event ids are duplicated");
  const roots = events.filter((event) => event.previousEventId === null);
  if (events.length > 0 && roots.length !== 1) {
    throw new Error("authorization events must have exactly one root");
  }
  const children = new Map();
  for (const event of events) {
    if (event.authorizationId !== bundle.authorizationId) {
      throw new Error("authorization event belongs to a different authorization");
    }
    if (event.previousEventId === null) continue;
    if (!byId.has(event.previousEventId)) throw new Error("authorization event references a missing predecessor");
    if (children.has(event.previousEventId)) throw new Error("authorization event chain forks");
    children.set(event.previousEventId, event);
  }

  return { root: roots[0] ?? null, children };
}

function resolveAuthorizationStatus({ revoked, complete, reservation, expiresAt }, now) {
  const expired = Date.parse(expiresAt) <= now.getTime();
  const reservationExpired = reservation ? Date.parse(reservation.expiresAt) <= now.getTime() : false;
  return revoked
    ? "revoked"
    : complete
      ? "completed"
      : reservationExpired
        ? "reservation_expired"
        : reservation
          ? "reserved"
          : expired
            ? "expired"
            : "pending";
}

function deriveAuthorizationState(bundle, events, now = new Date()) {
  const { root, children } = buildAuthorizationChain(bundle, events);
  let current = root;
  let visited = 0;
  let nextStepIndex = 0;
  let commitSha = bundle.candidate.commitSha;
  let candidateDigest = null;
  let reservation = null;
  let revoked = false;
  let lastOccurredAt = bundle.issuedAt;
  const walk = [];
  while (current) {
    walk.push(current);
    visited += 1;
    if (Date.parse(current.occurredAt) < Date.parse(lastOccurredAt)) {
      throw new Error("authorization events must be chronological");
    }
    lastOccurredAt = current.occurredAt;
    if (revoked) throw new Error("a revoked authorization cannot have later events");
    if (current.type === "revoked") {
      revoked = true;
      reservation = null;
    } else {
      const step = bundle.steps[nextStepIndex];
      if (!step || current.stepId !== step.stepId || current.action !== step.action) {
        throw new Error("authorization event does not match the next exact step");
      }
      if (current.type === "reserved") {
        if (reservation) throw new Error("an authorization step can only be reserved once");
        validateContext(current.context, bundle, { nextStep: step, commitSha, candidateDigest }, {
          allowLegacy: true, observedAt: new Date(current.occurredAt),
        });
        candidateDigest ??= current.context.candidateDigest ?? null;
        reservation = current;
      } else {
        if (!reservation || current.previousEventId !== reservation.eventId) {
          throw new Error("a completed step must immediately consume its reservation");
        }
        if (current.reservationEventId !== reservation.eventId) {
          throw new Error("completed step references the wrong reservation");
        }
        if (current.action === "commit_candidate") {
          if (current.result.commitSha === bundle.candidate.baseSha) {
            throw new Error("candidate commit must differ from its base SHA");
          }
          commitSha = current.result.commitSha;
        } else if (current.action === "push_branch") {
          if (current.result.commitSha !== commitSha || current.result.branch !== bundle.candidate.branch) {
            throw new Error("push result drifted from the authorized candidate");
          }
        } else if (current.result.headSha !== commitSha) {
          throw new Error("draft pull request head drifted from the authorized candidate");
        } else {
          validatePullRequestRepository(current.result, bundle.repositoryIdentity);
        }
        reservation = null;
        nextStepIndex += 1;
      }
    }
    current = children.get(current.eventId) ?? null;
  }
  if (visited !== events.length) throw new Error("authorization event chain is disconnected");
  const complete = nextStepIndex === bundle.steps.length;
  return {
    authorizationId: bundle.authorizationId,
    status: resolveAuthorizationStatus({ revoked, complete, reservation, expiresAt: bundle.expiresAt }, now),
    nextStep: complete || revoked ? null : bundle.steps[nextStepIndex],
    nextStepIndex,
    commitSha,
    candidateDigest,
    reservation,
    latestEventId: walk.at(-1)?.eventId ?? null,
    latestOccurredAt: walk.at(-1)?.occurredAt ?? bundle.issuedAt,
    eventCount: events.length,
  };
}

function findBundle(authorizationId, repo, stateHome, policy) {
  safeIdentifier(authorizationId, "authorizationId");
  const bundle = readAuthorizationBundles(repo, stateHome, policy)
    .find((candidate) => candidate.authorizationId === authorizationId);
  if (!bundle) throw new Error(`authorization ${authorizationId} is not registered`);
  return bundle;
}

export function readAuthorizationStatus(authorizationId, {
  repo = process.cwd(),
  stateHome = null,
  policy = loadPolicy(),
  now = new Date(),
} = {}) {
  const stored = findBundle(authorizationId, repo, stateHome, policy);
  const bundle = storedBundleBody(stored);
  const events = readAuthorizationEvents(authorizationId, repo, stateHome);
  return { bundle, ...deriveAuthorizationState(bundle, events, now) };
}

function validateContext(raw, bundle, state, { allowLegacy = false, observedAt = new Date() } = {}) {
  const context = object(raw, "authorization context");
  const legacy = context.schemaVersion === 1;
  if (context.schemaVersion !== 2 && !(allowLegacy && legacy)) {
    throw new Error("new delivery requires authorization context schemaVersion 2 with independent audit evidence");
  }
  exactKeys(context, "authorization context", [
    "activationDigest",
    "baseSha",
    "branch",
    "candidateId",
    "changedPaths",
    "checks",
    "headSha",
    "schemaVersion",
    ...(!legacy ? ["candidateDigest", "runtimeFingerprint", "audit"] : []),
  ]);
  if (
    context.candidateId !== bundle.candidate.candidateId
    || context.baseSha !== bundle.candidate.baseSha
    || context.branch !== bundle.candidate.branch
    || context.activationDigest !== bundle.candidate.activationDigest
  ) {
    throw new Error("authorization context drifted from the exact candidate");
  }
  sha(context.headSha, "authorization context.headSha");
  const expectedHead = state.nextStep.action === "commit_candidate"
    ? bundle.candidate.baseSha
    : state.commitSha;
  if (context.headSha !== expectedHead) throw new Error("authorization context has a stale or unexpected head");
  if (!Array.isArray(context.changedPaths) || !sameArray(context.changedPaths, bundle.candidate.allowedPaths)) {
    throw new Error("authorization context changedPaths drifted from allowedPaths");
  }
  if (!Array.isArray(context.checks)) throw new Error("authorization context.checks must be an array");
  const expectedChecks = state.nextStep.requiredChecks;
  if (!sameArray(context.checks.map((check) => check?.checkId), expectedChecks)) {
    throw new Error("authorization context checks do not match the exact step requirements");
  }
  context.checks.forEach((rawCheck, index) => {
    const check = object(rawCheck, `authorization context.checks[${index}]`);
    exactKeys(check, `authorization context.checks[${index}]`, ["checkId", "evidenceDigest", "status"]);
    if (check.status !== "passed") throw new Error(`authorization check ${check.checkId} did not pass`);
    sha256(check.evidenceDigest, `authorization context.checks[${index}].evidenceDigest`);
  });
  if (!legacy) {
    sha256(context.candidateDigest, "authorization context.candidateDigest");
    sha256(context.runtimeFingerprint, "authorization context.runtimeFingerprint");
    if (state.candidateDigest && state.candidateDigest !== context.candidateDigest) {
      throw new Error("authorization candidate content drifted between delivery steps");
    }
    const audit = object(context.audit, "independent audit");
    exactKeys(audit, "independent audit", ["builderId", "reviewerId", "completedAt", "candidateDigest", "output"]);
    safeIdentifier(audit.builderId, "independent audit.builderId");
    safeIdentifier(audit.reviewerId, "independent audit.reviewerId");
    if (audit.builderId === audit.reviewerId) throw new Error("independent audit reviewer must differ from builder");
    timestamp(audit.completedAt, "independent audit.completedAt");
    if (Date.parse(audit.completedAt) > observedAt.getTime()) throw new Error("independent audit must precede delivery reservation");
    const output = validateAuditorOutput(audit.output);
    if (output.verdict !== "pass") throw new Error("independent audit did not pass");
    if (audit.candidateDigest !== context.candidateDigest
      || output.candidateId !== context.candidateId || output.baseSha !== context.baseSha
      || output.runtimeFingerprint !== context.runtimeFingerprint) {
      throw new Error("independent audit does not match the exact candidate");
    }
  }
  return context;
}

export function inspectAuthorizationStep(authorizationId, context, options = {}) {
  const status = readAuthorizationStatus(authorizationId, options);
  if (status.status !== "pending" || !status.nextStep) {
    throw new Error(`authorization cannot reserve a step while status is ${status.status}`);
  }
  validateContext(context, status.bundle, status, { observedAt: options.now ?? new Date() });
  return {
    authorizationId,
    action: status.nextStep.action,
    stepId: status.nextStep.stepId,
    contextDigest: digest(context),
    canReserve: true,
  };
}

function appendAuthorizationEvent(event, paths, now) {
  const directory = join(paths.events, event.authorizationId);
  ensurePrivateDirectory(directory);
  const path = join(directory, `${event.eventId}.json`);
  if (existsSync(path)) throw new Error("authorization eventId already exists");
  writeJsonAtomically(path, {
    ...event,
    recordedAt: now.toISOString(),
    eventDigest: digest(event),
  });
}

export function reserveAuthorizationStep({
  authorizationId,
  context,
  eventId,
  occurredAt,
  repo = process.cwd(),
  stateHome = null,
  policy = loadPolicy(),
  now = new Date(),
}) {
  safeIdentifier(eventId, "eventId");
  timestamp(occurredAt, "occurredAt");
  if (Math.abs(Date.parse(occurredAt) - now.getTime()) > 300_000) {
    throw new Error("reservation occurredAt must be current");
  }
  registerClone(repo, { stateHome, now });
  const paths = getAuthorizationPaths(repo, stateHome);
  return withAuthorizationLock(paths, authorizationId, () => {
    const status = readAuthorizationStatus(authorizationId, { repo, stateHome, policy, now });
    if (status.status !== "pending" || !status.nextStep) {
      throw new Error(`authorization cannot reserve a step while status is ${status.status}`);
    }
    if (Date.parse(occurredAt) < Date.parse(status.latestOccurredAt)) {
      throw new Error("authorization event must be chronological");
    }
    validateContext(context, status.bundle, status, {
      observedAt: new Date(Math.min(now.getTime(), Date.parse(occurredAt))),
    });
    const token = randomBytes(32).toString("base64url");
    const reservationExpiresAt = new Date(Math.min(
      now.getTime() + policy.groupedAuthorizations.reservationTtlSeconds * 1000,
      Date.parse(status.bundle.expiresAt),
    )).toISOString();
    const event = validateAuthorizationEvent({
      schemaVersion: 1,
      eventId,
      authorizationId,
      occurredAt,
      previousEventId: status.latestEventId,
      type: "reserved",
      stepId: status.nextStep.stepId,
      action: status.nextStep.action,
      context: structuredClone(context),
      contextDigest: digest(context),
      reservationTokenDigest: digest(token),
      expiresAt: reservationExpiresAt,
    });
    appendAuthorizationEvent(event, paths, now);
    return { reservationToken: token, event };
  });
}

export function completeAuthorizationStep({
  authorizationId,
  reservationToken,
  result,
  eventId,
  occurredAt,
  repo = process.cwd(),
  stateHome = null,
  policy = loadPolicy(),
  now = new Date(),
}) {
  safeIdentifier(eventId, "eventId");
  timestamp(occurredAt, "occurredAt");
  if (Math.abs(Date.parse(occurredAt) - now.getTime()) > 300_000) {
    throw new Error("completion occurredAt must be current");
  }
  if (typeof reservationToken !== "string" || reservationToken.length < 32) {
    throw new Error("reservation token is invalid");
  }
  const paths = getAuthorizationPaths(repo, stateHome);
  return withAuthorizationLock(paths, authorizationId, () => {
    const status = readAuthorizationStatus(authorizationId, { repo, stateHome, policy, now });
    if (status.status !== "reserved" || !status.reservation) {
      throw new Error(`authorization cannot complete a step while status is ${status.status}`);
    }
    // Historical v1 chains remain readable, but cannot acquire new delivery
    // authority through completion of a legacy, unaudited reservation.
    validateContext(status.reservation.context, status.bundle, status, {
      observedAt: new Date(status.reservation.occurredAt),
    });
    if (digest(reservationToken) !== status.reservation.reservationTokenDigest) {
      throw new Error("reservation token does not match");
    }
    if (Date.parse(occurredAt) < Date.parse(status.latestOccurredAt)) {
      throw new Error("authorization event must be chronological");
    }
    if (Date.parse(status.bundle.expiresAt) <= now.getTime()) throw new Error("authorization has expired");
    const validatedResult = validateResult(status.reservation.action, result);
    if (
      status.reservation.action === "commit_candidate"
      && validatedResult.commitSha === status.bundle.candidate.baseSha
    ) {
      throw new Error("candidate commit must differ from its base SHA");
    }
    if (
      status.reservation.action === "push_branch"
      && (
        validatedResult.commitSha !== status.commitSha
        || validatedResult.branch !== status.bundle.candidate.branch
      )
    ) {
      throw new Error("push result drifted from the authorized candidate");
    }
    if (
      status.reservation.action === "create_draft_pull_request"
      && validatedResult.headSha !== status.commitSha
    ) {
      throw new Error("draft pull request head drifted from the authorized candidate");
    }
    if (status.reservation.action === "create_draft_pull_request") {
      validatePullRequestRepository(validatedResult, status.bundle.repositoryIdentity);
    }
    const event = validateAuthorizationEvent({
      schemaVersion: 1,
      eventId,
      authorizationId,
      occurredAt,
      previousEventId: status.reservation.eventId,
      type: "completed",
      stepId: status.reservation.stepId,
      action: status.reservation.action,
      reservationEventId: status.reservation.eventId,
      result: structuredClone(validatedResult),
    });
    appendAuthorizationEvent(event, paths, now);
    readAuthorizationStatus(authorizationId, { repo, stateHome, policy, now });
    return { event };
  });
}

export function revokeAuthorizationBundle({
  authorizationId,
  humanDecision,
  eventId,
  occurredAt,
  repo = process.cwd(),
  stateHome = null,
  policy = loadPolicy(),
  now = new Date(),
}) {
  safeIdentifier(eventId, "eventId");
  timestamp(occurredAt, "occurredAt");
  if (Math.abs(Date.parse(occurredAt) - now.getTime()) > 300_000) {
    throw new Error("revocation occurredAt must be current");
  }
  const decision = validateDecision(humanDecision, "humanDecision");
  const paths = getAuthorizationPaths(repo, stateHome);
  return withAuthorizationLock(paths, authorizationId, () => {
    const status = readAuthorizationStatus(authorizationId, { repo, stateHome, policy, now });
    if (new Set(["revoked", "completed"]).has(status.status)) {
      throw new Error(`authorization cannot be revoked while status is ${status.status}`);
    }
    if (Date.parse(occurredAt) < Date.parse(status.latestOccurredAt)) {
      throw new Error("authorization event must be chronological");
    }
    const event = validateAuthorizationEvent({
      schemaVersion: 1,
      eventId,
      authorizationId,
      occurredAt,
      previousEventId: status.latestEventId,
      type: "revoked",
      stepId: null,
      action: null,
      humanDecision: structuredClone(decision),
    });
    appendAuthorizationEvent(event, paths, now);
    return { event };
  });
}

function requiredArgument(name) {
  const value = argument(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function main() {
  if (process.argv.includes("--state-home")) {
    throw new Error("per-run state-home overrides are forbidden; use the governed policy");
  }
  const [operation] = process.argv.slice(2);
  const repo = resolve(argument("--repo") ?? process.cwd());
  const policy = loadPolicy();
  const stateHome = policy.coordination.stateHome;
  const authorizationId = argument("--authorization-id");
  let result;
  if (operation === "status") {
    result = authorizationId
      ? readAuthorizationStatus(authorizationId, { repo, stateHome, policy })
      : readAuthorizationBundles(repo, stateHome, policy).map((bundle) => (
        readAuthorizationStatus(bundle.authorizationId, { repo, stateHome, policy })
      ));
  } else if (operation === "register") {
    result = registerAuthorizationBundle(readJson(requiredArgument("--file")), {
      repo,
      stateHome,
      policy,
    });
  } else if (operation === "inspect") {
    result = inspectAuthorizationStep(requiredArgument("--authorization-id"), readJson(
      requiredArgument("--context-file"),
    ), { repo, stateHome, policy });
  } else if (operation === "reserve") {
    result = reserveAuthorizationStep({
      authorizationId: requiredArgument("--authorization-id"),
      context: readJson(requiredArgument("--context-file")),
      eventId: requiredArgument("--event-id"),
      occurredAt: requiredArgument("--occurred-at"),
      repo,
      stateHome,
      policy,
    });
  } else if (operation === "complete") {
    result = completeAuthorizationStep({
      authorizationId: requiredArgument("--authorization-id"),
      reservationToken: readFileSync(resolve(requiredArgument("--reservation-token-file")), "utf8").trim(),
      result: readJson(requiredArgument("--result-file")),
      eventId: requiredArgument("--event-id"),
      occurredAt: requiredArgument("--occurred-at"),
      repo,
      stateHome,
      policy,
    });
  } else if (operation === "revoke") {
    result = revokeAuthorizationBundle({
      authorizationId: requiredArgument("--authorization-id"),
      humanDecision: readJson(requiredArgument("--decision-file")),
      eventId: requiredArgument("--event-id"),
      occurredAt: requiredArgument("--occurred-at"),
      repo,
      stateHome,
      policy,
    });
  } else {
    throw new Error("usage: authorizations.mjs status|register|inspect|reserve|complete|revoke [options]");
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
