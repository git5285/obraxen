import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isClaimPath } from "./claims.mjs";
import { getCoordinationPaths, registerClone } from "./lease.mjs";
import { loadPolicy } from "./policy.mjs";
import { validateAuditorOutput } from "./contracts.mjs";

export const GROUPED_AUTHORIZATION_ACTIONS = [
  "commit_candidate",
  "push_branch",
  "create_draft_pull_request",
];

export const REQUIRED_ACTION_CHECKS = Object.freeze({
  commit_candidate: ["local_quality", "activation_unchanged"],
  push_branch: ["committed_diff_policy", "local_quality", "activation_unchanged"],
  create_draft_pull_request: ["remote_branch_matches_commit"],
});

const BUNDLE_KEYS = [
  "authorizationId",
  "candidate",
  "expiresAt",
  "humanDecision",
  "issuedAt",
  "repositoryIdentity",
  "schemaVersion",
  "steps",
];
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
const NEXT_DYNAMIC_SEGMENT = /^(?:\[[A-Za-z_][A-Za-z0-9_]*\]|\[\.\.\.[A-Za-z_][A-Za-z0-9_]*\]|\[\[\.\.\.[A-Za-z_][A-Za-z0-9_]*\]\])(?:\.[A-Za-z0-9._-]+)?$/;

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function exactKeys(value, label, allowed) {
  const present = Object.keys(value);
  const unexpected = present.filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !Object.hasOwn(value, key));
  if (unexpected.length > 0) throw new Error(`${label} has unexpected keys: ${unexpected.join(", ")}`);
  if (missing.length > 0) throw new Error(`${label} is missing keys: ${missing.join(", ")}`);
}

function safeIdentifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(value)) {
    throw new Error(`${label} contains unsafe characters`);
  }
  return value;
}

function timestamp(value, label) {
  if (
    typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
    || Number.isNaN(Date.parse(value))
  ) {
    throw new Error(`${label} must be a UTC ISO timestamp`);
  }
  return value;
}

function sha(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{40}$/.test(value)) {
    throw new Error(`${label} must be a 40 character git SHA`);
  }
  return value;
}

function sha256(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a SHA-256 digest`);
  }
  return value;
}

function nonEmptyText(value, label, maximum) {
  if (typeof value !== "string" || !value.trim() || value !== value.trim() || value.length > maximum) {
    throw new Error(`${label} must be trimmed non-empty text of at most ${maximum} characters`);
  }
  return value;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])]),
    );
  }
  return value;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonicalJson(value))).digest("hex");
}

function sameArray(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function isExactAuthorizationPath(path) {
  if (!isClaimPath(path) || /[*?{}]/.test(path)) return false;
  return path.split("/").every((segment) => {
    if (!/[\[\]]/.test(segment)) return true;
    return NEXT_DYNAMIC_SEGMENT.test(segment);
  });
}

function validateDecision(raw, label = "humanDecision") {
  const decision = object(raw, label);
  exactKeys(decision, label, ["decisionId", "source", "statement"]);
  safeIdentifier(decision.decisionId, `${label}.decisionId`);
  nonEmptyText(decision.source, `${label}.source`, 512);
  nonEmptyText(decision.statement, `${label}.statement`, 2000);
  return decision;
}

function validatePolicyCapability(policy) {
  const config = object(policy?.groupedAuthorizations, "policy.groupedAuthorizations");
  if (config.enabled !== true) throw new Error("grouped authorizations are disabled by policy");
  if (policy.mode !== "active") throw new Error("grouped authorizations require active policy mode");
  return config;
}

function validateBranch(value, policy) {
  if (
    typeof value !== "string"
    || !/^codex\/[A-Za-z0-9][A-Za-z0-9._/-]{0,120}$/.test(value)
    || value.includes("..")
    || value.endsWith("/")
  ) {
    throw new Error("candidate.branch must be one safe codex/ branch");
  }
  if (value === policy.reconciliation.defaultBranch) {
    throw new Error("candidate.branch cannot be the default branch");
  }
  return value;
}

export function validateAuthorizationBundle(raw, policy = loadPolicy()) {
  const config = validatePolicyCapability(policy);
  const bundle = object(raw, "authorization");
  exactKeys(bundle, "authorization", BUNDLE_KEYS);
  if (bundle.schemaVersion !== 1) throw new Error("authorization.schemaVersion must be 1");
  safeIdentifier(bundle.authorizationId, "authorization.authorizationId");
  nonEmptyText(bundle.repositoryIdentity, "authorization.repositoryIdentity", 512);
  validateDecision(bundle.humanDecision);
  timestamp(bundle.issuedAt, "authorization.issuedAt");
  timestamp(bundle.expiresAt, "authorization.expiresAt");
  const lifetime = Date.parse(bundle.expiresAt) - Date.parse(bundle.issuedAt);
  if (lifetime <= 0 || lifetime > config.maxLifetimeSeconds * 1000) {
    throw new Error("authorization lifetime exceeds the governed limit");
  }

  const candidate = object(bundle.candidate, "authorization.candidate");
  exactKeys(candidate, "authorization.candidate", [
    "activationDigest",
    "allowedPaths",
    "baseSha",
    "branch",
    "candidateId",
    "commitSha",
  ]);
  safeIdentifier(candidate.candidateId, "candidate.candidateId");
  sha(candidate.baseSha, "candidate.baseSha");
  validateBranch(candidate.branch, policy);
  if (candidate.commitSha !== null) sha(candidate.commitSha, "candidate.commitSha");
  sha256(candidate.activationDigest, "candidate.activationDigest");
  if (
    !Array.isArray(candidate.allowedPaths)
    || candidate.allowedPaths.length === 0
    || candidate.allowedPaths.length > (config.maxChangedFiles ?? policy.limits.maxChangedFiles)
    || candidate.allowedPaths.some((path) => !isExactAuthorizationPath(path))
    || new Set(candidate.allowedPaths).size !== candidate.allowedPaths.length
  ) {
    throw new Error("candidate.allowedPaths must contain unique canonical repository paths");
  }
  if (!sameArray(candidate.allowedPaths, [...candidate.allowedPaths].sort())) {
    throw new Error("candidate.allowedPaths must be sorted");
  }

  if (
    !Array.isArray(bundle.steps)
    || bundle.steps.length === 0
    || bundle.steps.length > config.maxSteps
  ) {
    throw new Error("authorization.steps exceeds the governed sequence length");
  }
  const allowed = config.allowedActions;
  const actions = bundle.steps.map((rawStep, index) => {
    const step = object(rawStep, `authorization.steps[${index}]`);
    exactKeys(step, `authorization.steps[${index}]`, ["action", "requiredChecks", "stepId"]);
    safeIdentifier(step.stepId, `authorization.steps[${index}].stepId`);
    if (!allowed.includes(step.action)) {
      throw new Error(`authorization.steps[${index}].action is not policy-authorized`);
    }
    const required = REQUIRED_ACTION_CHECKS[step.action];
    if (!Array.isArray(step.requiredChecks) || !sameArray(step.requiredChecks, required)) {
      throw new Error(`authorization.steps[${index}].requiredChecks must be exact for ${step.action}`);
    }
    return step.action;
  });
  if (new Set(bundle.steps.map((step) => step.stepId)).size !== bundle.steps.length) {
    throw new Error("authorization stepIds must be unique");
  }
  const firstActionIndex = GROUPED_AUTHORIZATION_ACTIONS.indexOf(actions[0]);
  const expected = GROUPED_AUTHORIZATION_ACTIONS.slice(
    firstActionIndex,
    firstActionIndex + actions.length,
  );
  if (firstActionIndex < 0 || !sameArray(actions, expected)) {
    throw new Error("authorization steps must be one contiguous delivery sequence");
  }
  if (candidate.commitSha === null && actions[0] !== "commit_candidate") {
    throw new Error("a candidate without commitSha must begin with commit_candidate");
  }
  if (candidate.commitSha !== null && actions.includes("commit_candidate")) {
    throw new Error("an already committed candidate cannot authorize another commit");
  }
  return structuredClone(bundle);
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

function ensurePrivateDirectory(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
}

function atomicJson(path, value) {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    renameSync(temporary, path);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
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
    atomicJson(target, stored);
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

function deriveAuthorizationState(bundle, events, now = new Date()) {
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

  let current = roots[0] ?? null;
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
  const expired = Date.parse(bundle.expiresAt) <= now.getTime();
  const reservationExpired = reservation ? Date.parse(reservation.expiresAt) <= now.getTime() : false;
  return {
    authorizationId: bundle.authorizationId,
    status: revoked
      ? "revoked"
      : complete
        ? "completed"
        : reservationExpired
          ? "reservation_expired"
          : reservation
            ? "reserved"
            : expired
              ? "expired"
              : "pending",
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
  atomicJson(path, {
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

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
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
