import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_CLAIM_STATES,
  canonicalClaimState,
  parseClaim,
  readClaims,
} from "./claims.mjs";
import {
  COORDINATION_PROTOCOL_VERSION,
  getCoordinationPaths,
  readCoordinationProtocolVersion,
  readLegacyLease,
  readLease,
  readRegisteredClones,
  registerClone,
  verifyRegisteredClone,
} from "./lease.mjs";
import { readOperationalClaims } from "./operations.mjs";
import { loadPolicy } from "./policy.mjs";
import { inspectRuntime } from "./runtime.mjs";

export { parseClaim, readClaims };

function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function parseWorktrees(output) {
  return output
    .split(/\n\s*\n/)
    .map((block) => Object.fromEntries(block.split("\n").filter(Boolean).map((line) => {
      const separator = line.indexOf(" ");
      return separator === -1 ? [line, true] : [line.slice(0, separator), line.slice(separator + 1)];
    })))
    .filter((entry) => typeof entry.worktree === "string");
}

function sameClaimSnapshot(claim, operational) {
  return claim.source === operational.claim.source
    && claim.contentDigest === operational.claim.contentDigest
    && JSON.stringify(claim.files) === JSON.stringify(operational.claim.files);
}

export function applyOperationalClaimStates(claims, operationalClaims) {
  const failures = [];
  const effective = claims.map((claim) => ({ ...claim }));
  for (const operational of operationalClaims) {
    const matches = effective.filter((claim) => claim.threadId === operational.threadId);
    if (matches.length === 0) {
      if (operational.state !== "liberado") {
        effective.push({
          source: operational.claim.source,
          worktree: "shared-operational-state",
          threadId: operational.threadId,
          state: operational.state,
          files: operational.claim.files,
          invalidFileEntries: [],
          metadataErrors: [],
          contentDigest: operational.claim.contentDigest,
          operationalEventId: operational.latestEventId,
          operationalOnly: true,
        });
      }
      continue;
    }
    for (const claim of matches) {
      if (!sameClaimSnapshot(claim, operational)) {
        failures.push({
          path: claim.worktree,
          reason: `claim ${claim.threadId} marker does not match shared operational state`,
        });
        continue;
      }
      claim.state = operational.state;
      claim.operationalEventId = operational.latestEventId;
    }
  }
  return { claims: effective, failures };
}

export function deriveGating({
  policy,
  lease,
  worktrees,
  activeClaims = [],
  claimFailures = [],
  coordinationFailures = [],
  cloneFailures = [],
  legacyLeases = [],
  runtime = { ok: true },
}) {
  const unreadableWorktrees = [...new Set([
    ...worktrees
      .filter((entry) => (entry.status ?? []).some((line) => String(line).startsWith("unreadable: ")))
      .map((entry) => entry.path),
    ...claimFailures.map((failure) => failure.path),
    ...coordinationFailures.map((failure) => failure.path),
    ...cloneFailures.map((failure) => failure.path),
  ])];
  const scanComplete = unreadableWorktrees.length === 0;
  const runtimeReady = runtime.ok === true;
  const pendingLocalDiffs = activeClaims.filter(
    (claim) => canonicalClaimState(claim.state) === "esperando_revision",
  );
  const activeWriterClaims = activeClaims;
  const unknownStateClaims = activeClaims.filter(
    (claim) => !ACTIVE_CLAIM_STATES.has(canonicalClaimState(claim.state)),
  );
  const unscopedActiveClaims = activeClaims.filter((claim) => (
    claim.files.length === 0 || (claim.invalidFileEntries ?? []).length > 0
  ));
  const writerLimit = policy.limits?.maxConcurrentWriters ?? 1;
  const writerLimitReached = activeWriterClaims.length >= writerLimit;
  const pendingLimit = policy.limits?.maxPendingLocalDiffs ?? 1;
  const pendingLimitReached = pendingLocalDiffs.length >= pendingLimit;
  const leaseExists = Boolean(lease) || legacyLeases.length > 0;

  return {
    unreadableWorktrees,
    pendingLocalDiffs,
    activeWriterClaims,
    unknownStateClaims,
    unscopedActiveClaims,
    eligibility: {
      scout: policy.mode !== "disabled" && policy.authority.allowScout && scanComplete && runtimeReady,
      writer: policy.mode === "active"
        && policy.authority.allowLocalDiff
        && !leaseExists
        && !writerLimitReached
        && unknownStateClaims.length === 0
        && unscopedActiveClaims.length === 0
        && !pendingLimitReached
        && scanComplete
        && runtimeReady,
    },
    blockers: [
      ...(scanComplete ? [] : ["unreadable_worktrees"]),
      ...(policy.mode === "shadow" ? ["policy_mode_shadow"] : []),
      ...(lease ? ["writer_lease_exists"] : []),
      ...(legacyLeases.length > 0 ? ["legacy_writer_lease_exists"] : []),
      ...(writerLimitReached ? ["active_writer_claim_limit"] : []),
      ...(unknownStateClaims.length > 0 ? ["active_claim_state_unknown"] : []),
      ...(unscopedActiveClaims.length > 0 ? ["active_claim_paths_unknown"] : []),
      ...(pendingLimitReached ? ["pending_local_diff_limit"] : []),
      ...(runtimeReady ? [] : ["runtime_contract_mismatch"]),
    ],
  };
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function recordFailure(failures, path, error) {
  const reason = errorMessage(error);
  if (!failures.some((failure) => failure.path === path && failure.reason === reason)) {
    failures.push({ path, reason });
  }
}

export function buildPreflight(repo = process.cwd(), policy = loadPolicy(), options = {}) {
  const root = git(repo, ["rev-parse", "--show-toplevel"]);
  const runtime = options.runtime ?? (
    existsSync(join(root, "package.json"))
      && existsSync(join(root, ".nvmrc"))
      && existsSync(join(root, "package-lock.json"))
      ? inspectRuntime(root)
      : { schemaVersion: 1, ok: true, fingerprint: null, blockers: [] }
  );
  const stateHome = options.stateHome ?? policy.coordination?.stateHome ?? null;
  const coordinationFailures = [];
  let registeredClones = [];
  let coordinationStateRoot = null;
  try {
    coordinationStateRoot = getCoordinationPaths(root, stateHome).root;
    registerClone(root, { now: options.now ?? new Date(), stateHome });
    registeredClones = readRegisteredClones(root, stateHome);
  } catch (error) {
    recordFailure(coordinationFailures, root, error);
  }

  const cloneCandidates = new Map([[root, { root }]]);
  for (const clone of registeredClones) cloneCandidates.set(clone.root, clone);

  const cloneFailures = [];
  const legacyLeases = [];
  const worktreeByPath = new Map();
  for (const clone of cloneCandidates.values()) {
    try {
      if (clone.commonDir) verifyRegisteredClone(clone);
      const legacyLease = readLegacyLease(clone.root);
      if (legacyLease) legacyLeases.push({ clone: clone.root, owner: legacyLease });
      for (const entry of parseWorktrees(git(clone.root, ["worktree", "list", "--porcelain"]))) {
        if (readCoordinationProtocolVersion(entry.worktree) !== COORDINATION_PROTOCOL_VERSION) {
          recordFailure(
            cloneFailures,
            entry.worktree,
            new Error("registered worktree uses an incompatible coordination protocol"),
          );
          continue;
        }
        worktreeByPath.set(entry.worktree, entry);
      }
    } catch (error) {
      cloneFailures.push({ path: clone.root, reason: errorMessage(error) });
    }
  }

  const worktrees = [...worktreeByPath.values()];
  const detailedWorktrees = worktrees.map((entry) => {
    const path = entry.worktree;
    let status = [];
    try {
      status = git(path, ["status", "--short"]).split("\n").filter(Boolean);
    } catch (error) {
      status = [`unreadable: ${errorMessage(error)}`];
    }
    return {
      path,
      head: entry.HEAD ?? null,
      branch: typeof entry.branch === "string" ? entry.branch.replace("refs/heads/", "") : null,
      detached: entry.detached === true,
      status,
    };
  });
  const claimFailures = [];
  const claims = detailedWorktrees.flatMap((worktree) => {
    try {
      return readClaims(worktree.path);
    } catch (error) {
      claimFailures.push({ path: worktree.path, reason: errorMessage(error) });
      return [];
    }
  });
  let operationalClaims = [];
  try {
    operationalClaims = readOperationalClaims(root, stateHome);
  } catch (error) {
    recordFailure(coordinationFailures, `${coordinationStateRoot}/operational-events`, error);
  }
  const effective = applyOperationalClaimStates(claims, operationalClaims);
  for (const failure of effective.failures) {
    recordFailure(coordinationFailures, failure.path, new Error(failure.reason));
  }
  const activeClaims = effective.claims.filter(
    (claim) => canonicalClaimState(claim.state) !== "liberado",
  );
  let lease = null;
  try {
    lease = readLease(root, stateHome);
  } catch (error) {
    recordFailure(coordinationFailures, root, error);
  }
  const gating = deriveGating({
    policy,
    lease,
    worktrees: detailedWorktrees,
    activeClaims,
    claimFailures,
    coordinationFailures,
    cloneFailures,
    legacyLeases,
    runtime,
  });

  return {
    schemaVersion: 2,
    project: policy.project,
    mode: policy.mode,
    repoRoot: root,
    baseSha: git(root, ["rev-parse", "HEAD"]),
    branch: git(root, ["branch", "--show-current"]) || null,
    coordinationStateRoot,
    registeredClones,
    worktrees: detailedWorktrees,
    operationalClaims,
    activeClaims,
    claimFailures,
    coordinationFailures,
    cloneFailures,
    legacyLeases,
    unreadableWorktrees: gating.unreadableWorktrees,
    pendingLocalDiffs: gating.pendingLocalDiffs,
    activeWriterClaims: gating.activeWriterClaims,
    unknownStateClaims: gating.unknownStateClaims,
    unscopedActiveClaims: gating.unscopedActiveClaims,
    lease,
    runtime,
    eligibility: gating.eligibility,
    blockers: gating.blockers,
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function main() {
  if (process.argv.includes("--state-home")) {
    throw new Error("per-run state-home overrides are forbidden; use the governed policy");
  }
  const repo = argument("--repo") ?? process.cwd();
  const report = buildPreflight(repo);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.runtime?.ok !== true) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
