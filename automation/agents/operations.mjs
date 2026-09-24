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
import {
  ACTIVE_CLAIM_STATES,
  canonicalClaimState,
  isClaimPath,
  parseClaim,
} from "./claims.mjs";
import {
  getCoordinationPaths,
  registerClone,
} from "./lease.mjs";
import { loadPolicy } from "./policy.mjs";
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

const TRANSITIONS = new Map([
  ["reservado", new Set(["en_curso", "bloqueado", "liberado"])],
  ["en_curso", new Set(["bloqueado", "esperando_revision", "liberado"])],
  ["bloqueado", new Set(["en_curso", "liberado"])],
  ["esperando_revision", new Set(["en_curso", "liberado"])],
  ["liberado", new Set(["en_curso"])],
]);
const RELEASE_EVIDENCE = new Set([
  "handoff",
  "human_decision",
  "reconciliation",
]);
const EVENT_BODY_KEYS = [
  "claim",
  "eventId",
  "evidence",
  "occurredAt",
  "previousEventId",
  "reason",
  "schemaVersion",
  "state",
  "threadId",
];

function claimSource(value) {
  if (
    typeof value !== "string"
    || !/^\.coordination\/claims\/[A-Za-z0-9][A-Za-z0-9._-]{2,180}\.md$/.test(value)
  ) {
    throw new Error("event.claim.source must be one canonical claim Markdown path");
  }
  return value;
}

function validateEvidence(raw, index) {
  const evidence = object(raw, `event.evidence[${index}]`);
  const label = `event.evidence[${index}]`;
  if (evidence.kind === "reconciliation") {
    exactKeys(evidence, label, ["evidenceDigest", "kind", "outcome", "reconciliationId"]);
    safeIdentifier(evidence.reconciliationId, `${label}.reconciliationId`);
    sha256(evidence.evidenceDigest, `${label}.evidenceDigest`);
    if (!new Set(["merged", "rejected", "superseded"]).has(evidence.outcome)) {
      throw new Error(`${label}.outcome is not terminal`);
    }
  } else if (evidence.kind === "pull_request") {
    exactKeys(evidence, label, [
      "headSha",
      "kind",
      "mergeCommitSha",
      "number",
      "observedAt",
      "state",
      "url",
    ]);
    if (!Number.isInteger(evidence.number) || evidence.number < 1) {
      throw new Error(`${label}.number must be a positive integer`);
    }
    const url = new URL(evidence.url);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.search
      || url.hash
      || !url.pathname.endsWith(`/pull/${evidence.number}`)
    ) {
      throw new Error(`${label}.url must identify its pull request over https`);
    }
    if (!new Set(["CLOSED", "MERGED"]).has(evidence.state)) {
      throw new Error(`${label}.state must be CLOSED or MERGED`);
    }
    sha(evidence.headSha, `${label}.headSha`);
    if (evidence.state === "MERGED") sha(evidence.mergeCommitSha, `${label}.mergeCommitSha`);
    else if (evidence.mergeCommitSha !== null) {
      throw new Error(`${label}.mergeCommitSha must be null for a closed unmerged PR`);
    }
    timestamp(evidence.observedAt, `${label}.observedAt`);
  } else if (evidence.kind === "run_report") {
    exactKeys(evidence, label, ["kind", "reportDigest", "runId", "status"]);
    safeIdentifier(evidence.runId, `${label}.runId`);
    sha256(evidence.reportDigest, `${label}.reportDigest`);
    if (!new Set(["blocked", "no_op"]).has(evidence.status)) {
      throw new Error(`${label}.status must be blocked or no_op`);
    }
  } else if (evidence.kind === "handoff") {
    exactKeys(evidence, label, ["contentDigest", "kind", "path"]);
    if (
      typeof evidence.path !== "string"
      || !/^\.coordination\/handoffs\/[A-Za-z0-9][A-Za-z0-9._-]{2,180}\.md$/.test(evidence.path)
    ) {
      throw new Error(`${label}.path must identify a coordination handoff`);
    }
    sha256(evidence.contentDigest, `${label}.contentDigest`);
  } else if (evidence.kind === "human_decision") {
    exactKeys(evidence, label, ["decisionId", "kind"]);
    safeIdentifier(evidence.decisionId, `${label}.decisionId`);
  } else {
    throw new Error(`${label}.kind is unsupported`);
  }
  return evidence;
}

export function validateOperationalEvent(raw) {
  const event = object(raw, "event");
  exactKeys(event, "event", [
    "claim",
    "eventId",
    "evidence",
    "occurredAt",
    "previousEventId",
    "reason",
    "schemaVersion",
    "state",
    "threadId",
  ]);
  if (event.schemaVersion !== 1) throw new Error("event.schemaVersion must be 1");
  safeIdentifier(event.eventId, "event.eventId");
  safeIdentifier(event.threadId, "event.threadId");
  timestamp(event.occurredAt, "event.occurredAt");
  if (event.previousEventId !== null) {
    safeIdentifier(event.previousEventId, "event.previousEventId");
  }
  const state = canonicalClaimState(event.state);
  if (!state || state !== event.state) throw new Error("event.state must be canonical");
  if (typeof event.reason !== "string" || !/^[a-z][a-z0-9_]{2,63}$/.test(event.reason)) {
    throw new Error("event.reason must be a safe reason code");
  }
  const claim = object(event.claim, "event.claim");
  exactKeys(claim, "event.claim", ["contentDigest", "files", "source"]);
  claimSource(claim.source);
  sha256(claim.contentDigest, "event.claim.contentDigest");
  if (
    !Array.isArray(claim.files)
    || claim.files.length === 0
    || claim.files.some((path) => !isClaimPath(path))
    || new Set(claim.files).size !== claim.files.length
  ) {
    throw new Error("event.claim.files must contain unique canonical repository paths");
  }
  if (!Array.isArray(event.evidence)) throw new Error("event.evidence must be an array");
  const evidence = event.evidence.map(validateEvidence);
  const hasTerminalEvidence = evidence.some((item) => (
    RELEASE_EVIDENCE.has(item.kind)
    || (item.kind === "pull_request" && item.state === "MERGED")
    || (item.kind === "run_report" && item.status === "no_op")
  ));
  if (
    event.state === "liberado"
    && !hasTerminalEvidence
  ) {
    throw new Error("a released claim requires typed terminal evidence");
  }
  return { ...event, state, claim: { ...claim, files: [...claim.files] }, evidence };
}

function validateStoredEvent(raw, fileName) {
  const stored = object(raw, `stored event ${fileName}`);
  exactKeys(stored, `stored event ${fileName}`, [...EVENT_BODY_KEYS, "eventDigest", "recordedAt"]);
  const body = validateOperationalEvent(
    Object.fromEntries(EVENT_BODY_KEYS.map((key) => [key, stored[key]])),
  );
  timestamp(stored.recordedAt, `stored event ${fileName}.recordedAt`);
  sha256(stored.eventDigest, `stored event ${fileName}.eventDigest`);
  if (stored.eventDigest !== digest(body)) throw new Error(`stored event ${fileName} digest mismatch`);
  if (fileName !== `${body.eventId}.json`) throw new Error(`stored event ${fileName} has an invalid filename`);
  return { ...body, recordedAt: stored.recordedAt, eventDigest: stored.eventDigest };
}

export function getOperationalPaths(repo = process.cwd(), stateHome = null) {
  const coordination = getCoordinationPaths(repo, stateHome);
  return {
    root: coordination.root,
    events: join(coordination.root, "operational-events"),
    locks: join(coordination.root, "operational-event-locks"),
  };
}

export function readOperationalEvents(repo = process.cwd(), stateHome = null) {
  const paths = getOperationalPaths(repo, stateHome);
  if (!existsSync(paths.events)) return [];
  return readdirSync(paths.events)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => validateStoredEvent(
      JSON.parse(readFileSync(join(paths.events, name), "utf8")),
      name,
    ));
}

function sameClaim(left, right) {
  return left.source === right.source
    && left.contentDigest === right.contentDigest
    && JSON.stringify(left.files) === JSON.stringify(right.files);
}

function assertTransition(previous, event) {
  if (!sameClaim(previous.claim, event.claim)) {
    throw new Error(`claim ${event.threadId} changed after operational registration`);
  }
  if (!TRANSITIONS.get(previous.state)?.has(event.state)) {
    throw new Error(`claim transition ${previous.state} -> ${event.state} is not allowed`);
  }
  if (Date.parse(event.occurredAt) < Date.parse(previous.occurredAt)) {
    throw new Error("claim events must be chronological");
  }
  if (
    previous.state === "liberado"
    && !event.evidence.some((item) => item.kind === "human_decision")
  ) {
    throw new Error("reopening a released claim requires a human decision reference");
  }
}

export function deriveOperationalClaims(events) {
  const byThread = new Map();
  for (const rawEvent of events) {
    const event = validateOperationalEvent(
      Object.fromEntries(EVENT_BODY_KEYS.map((key) => [key, rawEvent[key]])),
    );
    const group = byThread.get(event.threadId) ?? [];
    group.push(event);
    byThread.set(event.threadId, group);
  }

  const claims = [];
  for (const [threadId, group] of byThread) {
    const byId = new Map(group.map((event) => [event.eventId, event]));
    if (byId.size !== group.length) throw new Error(`claim ${threadId} has duplicate event ids`);
    const roots = group.filter((event) => event.previousEventId === null);
    if (roots.length !== 1) throw new Error(`claim ${threadId} must have exactly one root event`);
    const children = new Map();
    for (const event of group) {
      if (event.previousEventId === null) continue;
      if (!byId.has(event.previousEventId)) {
        throw new Error(`claim ${threadId} references a missing previous event`);
      }
      if (children.has(event.previousEventId)) throw new Error(`claim ${threadId} event chain forks`);
      children.set(event.previousEventId, event);
    }
    const root = roots[0];
    if (root.reason !== "claim_registered" || root.evidence.length !== 0) {
      throw new Error(`claim ${threadId} root event is invalid`);
    }
    let current = root;
    let eventCount = 1;
    const visited = new Set([current.eventId]);
    while (children.has(current.eventId)) {
      const next = children.get(current.eventId);
      assertTransition(current, next);
      current = next;
      if (visited.has(current.eventId)) throw new Error(`claim ${threadId} event chain cycles`);
      visited.add(current.eventId);
      eventCount += 1;
    }
    if (eventCount !== group.length) throw new Error(`claim ${threadId} has disconnected events`);
    claims.push({
      threadId,
      state: current.state,
      claim: current.claim,
      latestEventId: current.eventId,
      latestOccurredAt: current.occurredAt,
      eventCount,
      latestEvidence: current.evidence,
    });
  }
  return claims.sort((left, right) => left.threadId.localeCompare(right.threadId));
}

export function readOperationalClaims(repo = process.cwd(), stateHome = null) {
  return deriveOperationalClaims(readOperationalEvents(repo, stateHome));
}

function marker(repo, claim) {
  const absolute = resolve(repo, claim.source);
  const text = readFileSync(absolute, "utf8");
  const parsed = parseClaim(text, claim.source, resolve(repo));
  if (parsed.metadataErrors.length > 0 || parsed.invalidFileEntries.length > 0) {
    throw new Error("claim marker is malformed");
  }
  if (parsed.threadId === "unknown" || canonicalClaimState(parsed.state) === null) {
    throw new Error("claim marker has unsupported metadata");
  }
  const snapshot = {
    source: parsed.source,
    contentDigest: parsed.contentDigest,
    files: parsed.files,
  };
  if (!sameClaim(snapshot, claim)) throw new Error("claim marker changed after evidence was collected");
  return parsed;
}

function withAppendLock(paths, operation) {
  ensurePrivateDirectory(paths.locks);
  const lock = join(paths.locks, "append");
  try {
    mkdirSync(lock, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error("an operational event append is already in progress");
    throw error;
  }
  try {
    return operation();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

export function appendOperationalEvent(rawEvent, {
  repo = process.cwd(),
  stateHome = null,
  now = new Date(),
} = {}) {
  const event = validateOperationalEvent(structuredClone(rawEvent));
  const paths = getOperationalPaths(repo, stateHome);
  const recordPath = join(paths.events, `${event.eventId}.json`);
  const eventDigest = digest(event);
  if (existsSync(recordPath)) {
    const existing = validateStoredEvent(
      JSON.parse(readFileSync(recordPath, "utf8")),
      `${event.eventId}.json`,
    );
    readOperationalClaims(repo, stateHome);
    if (existing.eventDigest !== eventDigest) {
      throw new Error("eventId already exists with different content");
    }
    return { duplicate: true, event: existing };
  }

  registerClone(repo, { now, stateHome });
  ensurePrivateDirectory(paths.events);
  return withAppendLock(paths, () => {
    if (existsSync(recordPath)) {
      const existing = validateStoredEvent(
        JSON.parse(readFileSync(recordPath, "utf8")),
        `${event.eventId}.json`,
      );
      if (existing.eventDigest !== eventDigest) {
        throw new Error("eventId already exists with different content");
      }
      return { duplicate: true, event: existing };
    }
    const claims = readOperationalClaims(repo, stateHome);
    const previous = claims.find((claim) => claim.threadId === event.threadId) ?? null;
    const parsed = marker(repo, event.claim);
    if (event.threadId !== parsed.threadId) throw new Error("event threadId does not match claim marker");
    if (!previous) {
      if (event.previousEventId !== null || event.reason !== "claim_registered" || event.evidence.length !== 0) {
        throw new Error("the first claim event must register the claim marker");
      }
      if (event.state !== canonicalClaimState(parsed.state)) {
        throw new Error("root event state does not match claim marker");
      }
    } else {
      if (event.previousEventId !== previous.latestEventId) {
        throw new Error("event does not continue the latest claim state");
      }
      assertTransition({
        state: previous.state,
        claim: previous.claim,
        occurredAt: previous.latestOccurredAt,
      }, event);
    }
    const stored = {
      ...event,
      recordedAt: now.toISOString(),
      eventDigest,
    };
    writeJsonAtomically(recordPath, stored);
    return { duplicate: false, event: stored };
  });
}

function claimSnapshot(repo, source) {
  claimSource(source);
  const text = readFileSync(resolve(repo, source), "utf8");
  const parsed = parseClaim(text, source, resolve(repo));
  if (
    parsed.metadataErrors.length > 0
    || parsed.invalidFileEntries.length > 0
    || parsed.files.length === 0
    || !ACTIVE_CLAIM_STATES.has(canonicalClaimState(parsed.state))
  ) {
    throw new Error("claim marker is not eligible for operational registration");
  }
  return { parsed, claim: { source, contentDigest: parsed.contentDigest, files: parsed.files } };
}

export function registerOperationalClaim({
  repo = process.cwd(),
  stateHome = null,
  claimPath,
  eventId,
  occurredAt,
  now = new Date(),
}) {
  const { parsed, claim } = claimSnapshot(repo, claimPath);
  return appendOperationalEvent({
    schemaVersion: 1,
    eventId,
    threadId: parsed.threadId,
    occurredAt,
    previousEventId: null,
    state: canonicalClaimState(parsed.state),
    claim,
    reason: "claim_registered",
    evidence: [],
  }, { repo, stateHome, now });
}

export function transitionOperationalClaim({
  repo = process.cwd(),
  stateHome = null,
  threadId,
  eventId,
  occurredAt,
  state,
  reason,
  evidence = [],
  now = new Date(),
}) {
  const events = readOperationalEvents(repo, stateHome);
  const claims = deriveOperationalClaims(events);
  const existing = events.find((event) => event.eventId === eventId);
  if (existing) {
    const requested = {
      threadId,
      occurredAt,
      state,
      reason,
      evidence,
    };
    const recorded = {
      threadId: existing.threadId,
      occurredAt: existing.occurredAt,
      state: existing.state,
      reason: existing.reason,
      evidence: existing.evidence,
    };
    if (digest(requested) !== digest(recorded)) {
      throw new Error("eventId already exists with different transition content");
    }
    return { duplicate: true, event: existing };
  }
  const current = claims.find((claim) => claim.threadId === threadId);
  if (!current) throw new Error(`claim ${threadId} is not registered`);
  return appendOperationalEvent({
    schemaVersion: 1,
    eventId,
    threadId,
    occurredAt,
    previousEventId: current.latestEventId,
    state,
    claim: current.claim,
    reason,
    evidence,
  }, { repo, stateHome, now });
}

function readJson(path, fallback) {
  return path ? JSON.parse(readFileSync(resolve(path), "utf8")) : fallback;
}

function main() {
  if (process.argv.includes("--state-home")) {
    throw new Error("per-run state-home overrides are forbidden; use the governed policy");
  }
  const [operation] = process.argv.slice(2);
  const repo = resolve(argument("--repo") ?? process.cwd());
  const stateHome = loadPolicy().coordination.stateHome;
  let result;
  if (operation === "status") {
    result = {
      paths: getOperationalPaths(repo, stateHome),
      claims: readOperationalClaims(repo, stateHome),
    };
  } else if (operation === "register") {
    result = registerOperationalClaim({
      repo,
      stateHome,
      claimPath: argument("--claim"),
      eventId: argument("--event-id"),
      occurredAt: argument("--occurred-at"),
    });
  } else if (operation === "transition") {
    result = transitionOperationalClaim({
      repo,
      stateHome,
      threadId: argument("--thread-id"),
      eventId: argument("--event-id"),
      occurredAt: argument("--occurred-at"),
      state: argument("--state"),
      reason: argument("--reason"),
      evidence: readJson(argument("--evidence-file"), []),
    });
  } else {
    throw new Error("usage: operations.mjs status|register|transition [options]");
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
