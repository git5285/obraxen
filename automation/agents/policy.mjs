import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

export const defaultPolicyUrl = new URL("./policy.json", import.meta.url);

const ATTENTION_CLASSES = ["product", "reliability", "agent_maintenance"];
const FINDING_DOMAINS = [
  "evidence", "ux", "accessibility", "seo", "localization", "performance",
  "security", "testing", "reliability", "maintainability",
];

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
  if (policy.project !== "obraxen") throw new Error("policy.project must be obraxen");
  const stateHome = policy.coordination?.stateHome;
  if (typeof stateHome !== "string" || !stateHome) {
    throw new Error("policy.coordination.stateHome must be a non-empty string");
  }
  if (stateHome !== stateHome.trim()) {
    throw new Error("policy.coordination.stateHome must not contain surrounding whitespace");
  }
  if (!(isAbsolute(stateHome) || stateHome === "~" || stateHome.startsWith("~/"))) {
    throw new Error("policy.coordination.stateHome must be absolute or home-relative");
  }

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
    throw new Error("Obraxen permits exactly one autonomous writer");
  }
  if (policy.limits.maxPendingLocalDiffs !== 1) {
    throw new Error("Obraxen permits exactly one pending autonomous local diff");
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

  if (policy.attentionBudget?.schemaVersion !== 1) {
    throw new Error("policy.attentionBudget.schemaVersion must be 1");
  }
  const sequence = policy.attentionBudget.sequence;
  if (
    !Array.isArray(sequence)
    || sequence.length !== 10
    || sequence.some((attentionClass) => !ATTENTION_CLASSES.includes(attentionClass))
  ) {
    throw new Error("policy.attentionBudget.sequence must contain ten supported classes");
  }
  const attentionCounts = Object.fromEntries(
    ATTENTION_CLASSES.map((attentionClass) => [
      attentionClass,
      sequence.filter((item) => item === attentionClass).length,
    ]),
  );
  if (
    attentionCounts.product !== 7
    || attentionCounts.reliability !== 2
    || attentionCounts.agent_maintenance !== 1
  ) {
    throw new Error("policy.attentionBudget.sequence must enforce the 70/20/10 allocation");
  }
  const productDomains = policy.attentionBudget.productDomains;
  const reliabilityDomains = policy.attentionBudget.reliabilityDomains;
  if (
    !Array.isArray(productDomains)
    || productDomains.length === 0
    || !Array.isArray(reliabilityDomains)
    || reliabilityDomains.length === 0
  ) {
    throw new Error("policy.attentionBudget domain groups must be non-empty arrays");
  }
  const classifiedDomains = [...productDomains, ...reliabilityDomains];
  if (
    classifiedDomains.some((domain) => !FINDING_DOMAINS.includes(domain))
    || new Set(classifiedDomains).size !== classifiedDomains.length
    || classifiedDomains.length !== FINDING_DOMAINS.length
    || FINDING_DOMAINS.some((domain) => !classifiedDomains.includes(domain))
  ) {
    throw new Error("policy.attentionBudget must classify every finding domain exactly once");
  }
  const agentPathPatterns = policy.attentionBudget.agentPathPatterns;
  if (
    !Array.isArray(agentPathPatterns)
    || agentPathPatterns.length === 0
    || agentPathPatterns.some((pattern) => (
      typeof pattern !== "string"
      || !pattern
      || pattern !== pattern.trim()
      || pattern.startsWith("/")
      || pattern.includes("\\")
      || pattern.includes("..")
    ))
    || new Set(agentPathPatterns).size !== agentPathPatterns.length
  ) {
    throw new Error("policy.attentionBudget.agentPathPatterns must contain unique safe patterns");
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/.test(policy.reconciliation?.defaultBranch ?? "")) {
    throw new Error("policy.reconciliation.defaultBranch must be a safe branch name");
  }
  if (
    !Array.isArray(policy.reconciliation?.requiredPullRequestChecks)
    || policy.reconciliation.requiredPullRequestChecks.length === 0
    || policy.reconciliation.requiredPullRequestChecks.some(
      (name) => typeof name !== "string" || !name.trim() || name !== name.trim(),
    )
  ) {
    throw new Error("policy.reconciliation.requiredPullRequestChecks must contain exact check names");
  }
  if (
    new Set(policy.reconciliation.requiredPullRequestChecks).size
    !== policy.reconciliation.requiredPullRequestChecks.length
  ) {
    throw new Error("policy.reconciliation.requiredPullRequestChecks must be unique");
  }

  requireBoolean(policy.groupedAuthorizations, "enabled");
  for (const key of ["maxSteps", "maxLifetimeSeconds", "reservationTtlSeconds"]) {
    requirePositiveInteger(policy.groupedAuthorizations, key);
  }
  const groupedActions = [
    "commit_candidate",
    "push_branch",
    "create_draft_pull_request",
  ];
  if (
    !Array.isArray(policy.groupedAuthorizations.allowedActions)
    || policy.groupedAuthorizations.allowedActions.length === 0
    || policy.groupedAuthorizations.allowedActions.some((action) => !groupedActions.includes(action))
    || new Set(policy.groupedAuthorizations.allowedActions).size
      !== policy.groupedAuthorizations.allowedActions.length
  ) {
    throw new Error("policy.groupedAuthorizations.allowedActions contains unsupported or duplicate actions");
  }
  if (policy.groupedAuthorizations.maxSteps > groupedActions.length) {
    throw new Error("policy.groupedAuthorizations.maxSteps exceeds the safe delivery sequence");
  }
  if (policy.groupedAuthorizations.reservationTtlSeconds > 900) {
    throw new Error("policy.groupedAuthorizations.reservationTtlSeconds exceeds 15 minutes");
  }
  if (policy.groupedAuthorizations.maxLifetimeSeconds > 86400) {
    throw new Error("policy.groupedAuthorizations.maxLifetimeSeconds exceeds 24 hours");
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
  if (policy.mode !== "active" && policy.groupedAuthorizations.enabled) {
    throw new Error("grouped authorizations require active policy mode");
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
