import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stableDigest } from "./memory-values.mjs";
import { applyRunToState, validateCandidateLink, validateAttentionSlot } from "./memory-transitions.mjs";
import { createContextPack } from "./memory-context.mjs";
import { initialMemoryState } from "./memory-state.mjs";
import { migrateMemoryState } from "./memory-migrations.mjs";
import { validateRunReport } from "./contracts.mjs";
import { loadPolicy } from "./policy.mjs";
import { writeJsonAtomically } from "./storage.mjs";

function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}
export function getMemoryPaths(repo = process.cwd(), rootOverride = null) {
  let root;
  if (rootOverride) {
    root = resolve(rootOverride);
  } else {
    const commonDirRaw = git(repo, ["rev-parse", "--git-common-dir"]);
    const commonDir = isAbsolute(commonDirRaw) ? commonDirRaw : resolve(repo, commonDirRaw);
    root = join(commonDir, "codex-agent-state", "obraxen", "memory-v1");
  }
  return {
    root,
    runs: join(root, "runs"),
    reconciliations: join(root, "reconciliations"),
    state: join(root, "state.json"),
    lock: join(root, "write-lock"),
  };
}

function ensureDirectories(paths) {
  mkdirSync(paths.root, { recursive: true, mode: 0o700 });
  mkdirSync(paths.runs, { recursive: true, mode: 0o700 });
  mkdirSync(paths.reconciliations, { recursive: true, mode: 0o700 });
}

export function readMemoryState({ repo = process.cwd(), root = null } = {}) {
  const paths = getMemoryPaths(repo, root);
  if (!existsSync(paths.state)) return initialMemoryState();
  const state = JSON.parse(readFileSync(paths.state, "utf8"));
  return migrateMemoryState(state);
}

function acquireWriteLock(paths, owner, now) {
  ensureDirectories(paths);
  try {
    mkdirSync(paths.lock, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error("memory write lock already exists; inspect it before recovery");
    throw error;
  }
  try {
    writeJsonAtomically(join(paths.lock, "owner.json"), {
      schemaVersion: 2,
      operation: owner.operation,
      id: owner.id,
      pid: process.pid,
      acquiredAt: now.toISOString(),
    });
  } catch (error) {
    rmSync(paths.lock, { recursive: true, force: true });
    throw error;
  }
}

function releaseWriteLock(paths) {
  rmSync(paths.lock, { recursive: true, force: true });
}

function retainedRunFiles(paths) {
  if (!existsSync(paths.runs)) return [];
  return readdirSync(paths.runs).filter((name) => name.endsWith(".json")).sort();
}

function enforceRunRetention(paths, maximum) {
  const files = retainedRunFiles(paths);
  for (const name of files.slice(0, Math.max(0, files.length - maximum))) {
    rmSync(join(paths.runs, name));
  }
  return retainedRunFiles(paths).length;
}

export function recordRun(rawReport, {
  repo = process.cwd(),
  root = null,
  now = new Date(),
  policy = loadPolicy(),
} = {}) {
  const report = validateRunReport(structuredClone(rawReport), policy);
  const paths = getMemoryPaths(repo, root);
  const digest = stableDigest(report);
  acquireWriteLock(paths, { operation: "record_run", id: report.runId }, now);
  try {
    const state = readMemoryState({ repo, root });
    const previous = state.runIndex.find((item) => item.runId === report.runId);
    if (previous) {
      if (previous.digest !== digest) throw new Error("runId already exists with different content");
      return { duplicate: true, recordPath: previous.recordPath, state };
    }
    validateCandidateLink(state, report);
    validateAttentionSlot(state, report, policy);

    const recordedAt = now.toISOString();
    const safeTimestamp = recordedAt.replace(/[:.]/g, "-");
    const recordName = `${safeTimestamp}-${report.runId}.json`;
    const recordPath = join(paths.runs, recordName);
    const record = { ...report, recordedAt, reportDigest: digest };
    writeJsonAtomically(recordPath, record);

    applyRunToState(state, report, recordedAt, digest, recordName, policy);
    state.runs.retainedCount = enforceRunRetention(paths, policy.memory.maxEpisodicRuns);
    writeJsonAtomically(paths.state, state);
    return { duplicate: false, recordPath: recordName, state };
  } finally {
    releaseWriteLock(paths);
  }
}

const RECONCILIATION_OUTCOMES = new Set([
  "unreconciled",
  "local_diff",
  "committed_local",
  "needs_remote",
  "pr_draft",
  "checks_pending",
  "checks_failed",
  "review_pending",
  "changes_requested",
  "ready_for_human_merge",
  "merged",
  "rejected",
  "superseded",
  "regressed",
  "needs_human",
  "evidence_mismatch",
  "local_state_stale",
]);

function validateMemoryReconciliation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("reconciliation must be an object");
  }
  const allowed = [
    "schemaVersion",
    "reconciliationId",
    "candidateId",
    "expectedCandidateLastRunId",
    "observedAt",
    "outcome",
    "terminal",
    "reasonCodes",
    "evidence",
    "evidenceDigest",
  ];
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !Object.hasOwn(value, key));
  if (unexpected.length > 0) throw new Error(`reconciliation has unexpected keys: ${unexpected.join(", ")}`);
  if (missing.length > 0) throw new Error(`reconciliation is missing keys: ${missing.join(", ")}`);
  if (value.schemaVersion !== 1) throw new Error("reconciliation.schemaVersion must be 1");
  for (const [key, item] of [
    ["reconciliationId", value.reconciliationId],
    ["candidateId", value.candidateId],
    ["expectedCandidateLastRunId", value.expectedCandidateLastRunId],
  ]) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(item ?? "")) {
      throw new Error(`reconciliation.${key} contains unsafe characters`);
    }
  }
  if (
    typeof value.observedAt !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value.observedAt)
    || Number.isNaN(Date.parse(value.observedAt))
  ) {
    throw new Error("reconciliation.observedAt must be a UTC ISO timestamp");
  }
  if (!RECONCILIATION_OUTCOMES.has(value.outcome)) {
    throw new Error("reconciliation.outcome is unsupported");
  }
  const expectedTerminal = new Set(["merged", "rejected", "superseded"]).has(value.outcome);
  if (value.terminal !== expectedTerminal) {
    throw new Error("reconciliation.terminal is inconsistent with outcome");
  }
  if (
    !Array.isArray(value.reasonCodes)
    || value.reasonCodes.length === 0
    || value.reasonCodes.some((code) => typeof code !== "string" || !code)
  ) {
    throw new Error("reconciliation.reasonCodes must be a non-empty string array");
  }
  if (!value.evidence || typeof value.evidence !== "object" || Array.isArray(value.evidence)) {
    throw new Error("reconciliation.evidence must be an object");
  }
  if (!/^[0-9a-f]{64}$/.test(value.evidenceDigest ?? "")) {
    throw new Error("reconciliation.evidenceDigest must be a SHA-256 digest");
  }
  if (stableDigest(value.evidence) !== value.evidenceDigest) {
    throw new Error("reconciliation.evidenceDigest does not match evidence");
  }
  return value;
}

function retainedReconciliationFiles(paths) {
  if (!existsSync(paths.reconciliations)) return [];
  return readdirSync(paths.reconciliations).filter((name) => name.endsWith(".json")).sort();
}

function enforceReconciliationRetention(paths, maximum) {
  const files = retainedReconciliationFiles(paths);
  for (const name of files.slice(0, Math.max(0, files.length - maximum))) {
    rmSync(join(paths.reconciliations, name));
  }
}

export function writeMemoryReconciliation(rawReconciliation, {
  repo = process.cwd(),
  root = null,
  now = new Date(),
  policy = loadPolicy(),
} = {}) {
  if (!policy.authority.allowMemoryPersistence) {
    throw new Error("policy does not authorize memory persistence");
  }
  const reconciliation = validateMemoryReconciliation(structuredClone(rawReconciliation));
  const paths = getMemoryPaths(repo, root);
  const reconciliationDigest = stableDigest(reconciliation);
  acquireWriteLock(paths, {
    operation: "reconcile_candidate",
    id: reconciliation.reconciliationId,
  }, now);
  try {
    const state = readMemoryState({ repo, root });
    const previous = state.reconciliationIndex.find(
      (item) => item.reconciliationId === reconciliation.reconciliationId,
    );
    if (previous) {
      if (previous.digest !== reconciliationDigest) {
        throw new Error("reconciliationId already exists with different content");
      }
      return { duplicate: true, recordPath: previous.recordPath, state };
    }
    const candidate = state.candidates.find(
      (item) => item.candidateId === reconciliation.candidateId,
    );
    if (!candidate) throw new Error(`candidate ${reconciliation.candidateId} was not found`);
    if (candidate.lastRunId !== reconciliation.expectedCandidateLastRunId) {
      throw new Error(`candidate ${reconciliation.candidateId} advanced after evidence was collected`);
    }

    const recordedAt = now.toISOString();
    const safeTimestamp = reconciliation.observedAt.replace(/[:.]/g, "-");
    const recordName = `${safeTimestamp}-${reconciliation.reconciliationId}.json`;
    writeJsonAtomically(join(paths.reconciliations, recordName), {
      ...reconciliation,
      recordedAt,
      reconciliationDigest,
    });

    candidate.reconciliation = {
      reconciliationId: reconciliation.reconciliationId,
      expectedCandidateLastRunId: reconciliation.expectedCandidateLastRunId,
      observedAt: reconciliation.observedAt,
      outcome: reconciliation.outcome,
      terminal: reconciliation.terminal,
      reasonCodes: reconciliation.reasonCodes,
      evidenceDigest: reconciliation.evidenceDigest,
    };
    const finding = state.findings.find((item) => item.scopeKey === candidate.scopeKey);
    if (finding) {
      if (reconciliation.terminal || reconciliation.outcome === "regressed") {
        finding.status = reconciliation.outcome;
      }
      if (
        new Set(["open", "regressed"]).has(finding.status)
        || reconciliation.terminal
      ) {
        finding.lastOutcome = reconciliation.outcome;
      }
      finding.lastReconciledAt = reconciliation.observedAt;
      finding.lastReconciliationId = reconciliation.reconciliationId;
    }
    state.updatedAt = recordedAt;
    state.reconciliationIndex.push({
      reconciliationId: reconciliation.reconciliationId,
      candidateId: reconciliation.candidateId,
      outcome: reconciliation.outcome,
      digest: reconciliationDigest,
      recordPath: recordName,
      observedAt: reconciliation.observedAt,
      recordedAt,
    });
    state.reconciliationIndex = state.reconciliationIndex.slice(-(policy.memory.maxEpisodicRuns * 4));
    enforceReconciliationRetention(paths, policy.memory.maxEpisodicRuns * 4);
    writeJsonAtomically(paths.state, state);
    return { duplicate: false, recordPath: recordName, state };
  } finally {
    releaseWriteLock(paths);
  }
}

export function buildContextPack({
  repo = process.cwd(),
  root = null,
  baseSha = null,
  query = "",
  now = new Date(),
  policy = loadPolicy(),
} = {}) {
  const state = readMemoryState({ repo, root });
  const effectiveBaseSha = baseSha ?? git(repo, ["rev-parse", "HEAD"]);
  return createContextPack(state, { baseSha: effectiveBaseSha, query, now, policy });
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function main() {
  const [operation] = process.argv.slice(2);
  const repo = resolve(argument("--repo") ?? process.cwd());
  const rootArgument = argument("--root");
  const root = rootArgument ? resolve(rootArgument) : null;
  if (operation === "init" || operation === "status") {
    const paths = getMemoryPaths(repo, root);
    ensureDirectories(paths);
    process.stdout.write(`${JSON.stringify({ paths, state: readMemoryState({ repo, root }) }, null, 2)}\n`);
    return;
  }
  if (operation === "context") {
    process.stdout.write(`${JSON.stringify(buildContextPack({
      repo,
      root,
      baseSha: argument("--base-sha"),
      query: argument("--query") ?? "",
    }), null, 2)}\n`);
    return;
  }
  if (operation === "record") {
    const file = argument("--file");
    const text = file && file !== "-" ? readFileSync(resolve(file), "utf8") : readFileSync(0, "utf8");
    process.stdout.write(`${JSON.stringify(recordRun(JSON.parse(text), { repo, root }), null, 2)}\n`);
    return;
  }
  throw new Error("usage: memory.mjs init|status|context|record [--repo PATH] [--root PATH] [--file FILE]");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
