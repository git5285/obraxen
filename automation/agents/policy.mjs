import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const defaultPolicyUrl = new URL("./policy.json", import.meta.url);

function requireBoolean(object, key) {
  if (typeof object?.[key] !== "boolean") throw new Error(`policy.${key} must be boolean`);
}

function requirePositiveInteger(object, key) {
  if (!Number.isInteger(object?.[key]) || object[key] < 1) {
    throw new Error(`policy.${key} must be a positive integer`);
  }
}

export function validatePolicy(policy) {
  if (policy?.schemaVersion !== 1) throw new Error("policy.schemaVersion must be 1");
  if (!new Set(["shadow", "active", "disabled"]).has(policy.mode)) {
    throw new Error("policy.mode must be shadow, active, or disabled");
  }
  if (policy.project !== "remainon") throw new Error("policy.project must be remainon");

  for (const key of [
    "maxConcurrentWriters",
    "maxPendingLocalDiffs",
    "maxActiveSystemPullRequests",
    "maxFindingsPerRun",
    "maxChangedFiles",
    "maxDiffLines",
    "maxCorrectionIterations",
    "maxRunSeconds",
    "leaseTtlSeconds",
  ]) requirePositiveInteger(policy.limits, key);

  if (policy.limits.maxConcurrentWriters !== 1) {
    throw new Error("RemainOn permits exactly one autonomous writer");
  }
  if (policy.limits.maxPendingLocalDiffs !== 1) {
    throw new Error("RemainOn permits exactly one pending autonomous local diff");
  }

  if (policy.memory?.schemaVersion !== 1) {
    throw new Error("policy.memory.schemaVersion must be 1");
  }
  for (const key of [
    "maxEpisodicRuns",
    "maxOpenFindings",
    "maxProposedRules",
    "contextRecentRuns",
    "contextOpenFindings",
    "maxContextBytes",
  ]) requirePositiveInteger(policy.memory, key);
  if (policy.memory.contextRecentRuns > policy.memory.maxEpisodicRuns) {
    throw new Error("policy.memory.contextRecentRuns exceeds retained episodic runs");
  }
  if (policy.memory.contextOpenFindings > policy.memory.maxOpenFindings) {
    throw new Error("policy.memory.contextOpenFindings exceeds retained findings");
  }
  if (policy.memory.maxContextBytes < 4096) {
    throw new Error("policy.memory.maxContextBytes must be at least 4096");
  }

  for (const key of [
    "allowScout",
    "allowMemoryPersistence",
    "allowLocalDiff",
    "allowCommit",
    "allowPush",
    "allowDraftPullRequest",
    "allowMerge",
    "allowDeploy",
    "allowPublish",
    "allowNetwork",
    "allowDependencyChanges",
  ]) requireBoolean(policy.authority, key);

  if (!Array.isArray(policy.protectedPaths) || policy.protectedPaths.length === 0) {
    throw new Error("policy.protectedPaths must be a non-empty array");
  }
  if (!Array.isArray(policy.requiredChecks) || policy.requiredChecks.length === 0) {
    throw new Error("policy.requiredChecks must be a non-empty array");
  }

  if (policy.authority.allowMerge || policy.authority.allowDeploy || policy.authority.allowPublish) {
    throw new Error("merge, deploy, and publish are permanently human-gated");
  }
  const mutationFlags = [
    "allowLocalDiff",
    "allowCommit",
    "allowPush",
    "allowDraftPullRequest",
    "allowDependencyChanges",
  ];
  if (policy.mode !== "active" && mutationFlags.some((key) => policy.authority[key])) {
    throw new Error("only active mode can authorize repository mutation");
  }
  if (policy.authority.allowCommit && !policy.authority.allowLocalDiff) {
    throw new Error("commit authority requires local diff authority");
  }
  if (policy.authority.allowPush && !policy.authority.allowCommit) {
    throw new Error("push authority requires commit authority");
  }
  if (policy.authority.allowDraftPullRequest && !policy.authority.allowPush) {
    throw new Error("draft pull request authority requires push authority");
  }
  return policy;
}

export function loadPolicy(url = defaultPolicyUrl) {
  return validatePolicy(JSON.parse(readFileSync(url, "utf8")));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(`${JSON.stringify(loadPolicy(), null, 2)}\n`);
}
