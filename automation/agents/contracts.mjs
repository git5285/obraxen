import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ATTENTION_CLASSES, classifyFindingAttention } from "./attention.mjs";
import { loadPolicy } from "./policy.mjs";
import {
  exactKeys,
  nonEmptyString as string,
  object,
  safeIdentifier as validateSafeIdentifier,
  sha,
  sha256,
} from "./validation.mjs";

function array(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function stringArray(value, label, { nonEmpty = false } = {}) {
  const items = array(value, label);
  if (nonEmpty && items.length === 0) throw new Error(`${label} must not be empty`);
  for (const [index, item] of items.entries()) string(item, `${label}[${index}]`);
  return items;
}

function enumeration(value, label, allowed) {
  if (!allowed.includes(value)) throw new Error(`${label} must be one of: ${allowed.join(", ")}`);
  return value;
}

const baseSha = sha;

function date(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
    throw new Error(`${label} must be an ISO calendar date`);
  }
  return value;
}

function nullableNonNegativeNumber(value, label, { integer = false } = {}) {
  if (value === null) return value;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be null or a non-negative number`);
  }
  if (integer && !Number.isInteger(value)) {
    throw new Error(`${label} must be null or a non-negative integer`);
  }
  return value;
}

function common(value, label, schemaVersion = 1) {
  const output = object(value, label);
  if (output.schemaVersion !== schemaVersion) {
    throw new Error(`${label}.schemaVersion must be ${schemaVersion}`);
  }
  return output;
}

function safeIdentifier(value, label) {
  string(value, label);
  return validateSafeIdentifier(value, label);
}

function nullablePullRequest(value, label) {
  if (value === null) return null;
  const pullRequest = object(value, label);
  exactKeys(pullRequest, label, ["number", "url"]);
  if (!Number.isInteger(pullRequest.number) || pullRequest.number < 1) {
    throw new Error(`${label}.number must be a positive integer`);
  }
  string(pullRequest.url, `${label}.url`);
  let url;
  try {
    url = new URL(pullRequest.url);
  } catch {
    throw new Error(`${label}.url must be a valid URL`);
  }
  if (url.protocol !== "https:") throw new Error(`${label}.url must use https`);
  const match = url.pathname.match(/\/pull\/(\d+)\/?$/);
  if (!match || Number(match[1]) !== pullRequest.number) {
    throw new Error(`${label}.url must identify pull request ${pullRequest.number}`);
  }
  return pullRequest;
}

function validateTypedEvidence(value, label) {
  const evidence = object(value, label);
  enumeration(evidence.kind, `${label}.kind`, [
    "repository_fact",
    "command_result",
    "human_declaration",
    "document_reference",
    "professional_review",
  ]);

  if (new Set(["repository_fact", "command_result"]).has(evidence.kind)) {
    exactKeys(evidence, label, ["kind", "source", "fact"]);
    string(evidence.source, `${label}.source`);
    string(evidence.fact, `${label}.fact`);
  } else if (evidence.kind === "human_declaration") {
    exactKeys(evidence, label, ["kind", "source", "statement"]);
    string(evidence.source, `${label}.source`);
    string(evidence.statement, `${label}.statement`);
  } else if (evidence.kind === "document_reference") {
    exactKeys(evidence, label, ["kind", "source", "documentId", "fact"]);
    string(evidence.source, `${label}.source`);
    safeIdentifier(evidence.documentId, `${label}.documentId`);
    string(evidence.fact, `${label}.fact`);
  } else {
    exactKeys(evidence, label, [
      "kind", "source", "reviewId", "reviewer", "reviewedAt", "decision", "fact",
    ]);
    string(evidence.source, `${label}.source`);
    safeIdentifier(evidence.reviewId, `${label}.reviewId`);
    string(evidence.reviewer, `${label}.reviewer`);
    date(evidence.reviewedAt, `${label}.reviewedAt`);
    enumeration(evidence.decision, `${label}.decision`, [
      "approved", "changes_requested", "rejected",
    ]);
    string(evidence.fact, `${label}.fact`);
  }

  return evidence;
}

export function validateScoutOutput(value, policy = loadPolicy()) {
  const output = common(value, "scout output", 4);
  exactKeys(output, "scout output", [
    "schemaVersion", "status", "attentionClass", "baseSha", "runtimeFingerprint", "activeClaims",
    "findings", "recommendedId", "reason",
  ]);
  enumeration(output.status, "scout output.status", ["no_op", "proposal", "blocked"]);
  enumeration(output.attentionClass, "scout output.attentionClass", ATTENTION_CLASSES);
  baseSha(output.baseSha, "scout output.baseSha");
  sha256(output.runtimeFingerprint, "scout output.runtimeFingerprint");
  for (const [index, rawClaim] of array(output.activeClaims, "scout output.activeClaims").entries()) {
    const claim = object(rawClaim, `scout output.activeClaims[${index}]`);
    string(claim.threadId, `scout output.activeClaims[${index}].threadId`);
    string(claim.worktree, `scout output.activeClaims[${index}].worktree`);
    stringArray(claim.files, `scout output.activeClaims[${index}].files`);
  }
  const findings = array(output.findings, "scout output.findings");
  if (findings.length > policy.limits.maxFindingsPerRun) throw new Error("scout returned too many findings");
  for (const [index, rawFinding] of findings.entries()) {
    const finding = object(rawFinding, `scout output.findings[${index}]`);
    for (const key of ["id", "summary"]) {
      string(finding[key], `scout output.findings[${index}].${key}`);
    }
    enumeration(finding.domain, `scout output.findings[${index}].domain`, [
      "evidence", "ux", "accessibility", "seo", "localization", "performance",
      "security", "testing", "reliability", "maintainability",
    ]);
    enumeration(finding.impact, `scout output.findings[${index}].impact`, ["low", "medium", "high"]);
    enumeration(finding.confidence, `scout output.findings[${index}].confidence`, ["low", "medium", "high"]);
    enumeration(finding.risk, `scout output.findings[${index}].risk`, ["low", "medium", "high"]);
    const evidenceItems = array(
      finding.evidence,
      `scout output.findings[${index}].evidence`,
    );
    if (evidenceItems.length === 0) {
      throw new Error(`scout output.findings[${index}].evidence must not be empty`);
    }
    for (const [evidenceIndex, rawEvidence] of evidenceItems.entries()) {
      validateTypedEvidence(
        rawEvidence,
        `scout output.findings[${index}].evidence[${evidenceIndex}]`,
      );
    }
    stringArray(finding.candidatePaths, `scout output.findings[${index}].candidatePaths`, { nonEmpty: true });
    stringArray(finding.verification, `scout output.findings[${index}].verification`, { nonEmpty: true });
    stringArray(finding.conflicts, `scout output.findings[${index}].conflicts`);
    const classified = classifyFindingAttention(finding, policy);
    if (classified !== output.attentionClass) {
      throw new Error(
        `scout output.findings[${index}] belongs to ${classified}, not ${output.attentionClass}`,
      );
    }
  }
  if (output.recommendedId !== null) string(output.recommendedId, "scout output.recommendedId");
  if (output.status === "proposal") {
    if (findings.length === 0) throw new Error("proposal scout output requires findings");
    if (!findings.some((finding) => finding.id === output.recommendedId)) {
      throw new Error("scout recommendedId must identify a returned finding");
    }
  } else if (output.recommendedId !== null) {
    throw new Error("non-proposal scout output requires recommendedId null");
  }
  string(output.reason, "scout output.reason");
  return output;
}

export function validateBuilderOutput(value) {
  const output = common(value, "builder output", 4);
  exactKeys(output, "builder output", [
    "schemaVersion", "status", "attentionClass", "runId", "candidateId", "baseSha", "runtimeFingerprint",
    "changedPaths", "checksRun", "residualRisks", "reason",
  ]);
  enumeration(output.status, "builder output.status", ["implemented", "no_op", "blocked"]);
  enumeration(output.attentionClass, "builder output.attentionClass", ATTENTION_CLASSES);
  safeIdentifier(output.runId, "builder output.runId");
  safeIdentifier(output.candidateId, "builder output.candidateId");
  baseSha(output.baseSha, "builder output.baseSha");
  sha256(output.runtimeFingerprint, "builder output.runtimeFingerprint");
  const changedPaths = stringArray(output.changedPaths, "builder output.changedPaths");
  const checksRun = array(output.checksRun, "builder output.checksRun");
  for (const [index, rawCheck] of checksRun.entries()) {
    const check = object(rawCheck, `builder output.checksRun[${index}]`);
    string(check.command, `builder output.checksRun[${index}].command`);
    enumeration(check.status, `builder output.checksRun[${index}].status`, ["passed", "failed"]);
    string(check.summary, `builder output.checksRun[${index}].summary`);
  }
  stringArray(output.residualRisks, "builder output.residualRisks");
  string(output.reason, "builder output.reason");
  if (output.status === "implemented" && changedPaths.length === 0) {
    throw new Error("implemented builder output requires changedPaths");
  }
  if (output.status === "implemented" && checksRun.length === 0) {
    throw new Error("implemented builder output requires checksRun");
  }
  if (output.status === "implemented" && checksRun.some((check) => check.status !== "passed")) {
    throw new Error("implemented builder output cannot contain failed checks");
  }
  if (output.status === "no_op" && changedPaths.length !== 0) {
    throw new Error("no_op builder output cannot claim changedPaths");
  }
  if (output.status === "blocked" && changedPaths.length !== 0 && output.residualRisks.length === 0) {
    throw new Error("blocked builder output with retained changes requires residualRisks");
  }
  return output;
}

export function validateAuditorOutput(value) {
  const output = common(value, "auditor output", 4);
  exactKeys(output, "auditor output", [
    "schemaVersion", "verdict", "attentionClass", "runId", "candidateId", "baseSha", "runtimeFingerprint",
    "findings", "verifiedChecks", "reason",
  ]);
  enumeration(output.verdict, "auditor output.verdict", ["pass", "veto", "needs_human"]);
  enumeration(output.attentionClass, "auditor output.attentionClass", ATTENTION_CLASSES);
  safeIdentifier(output.runId, "auditor output.runId");
  safeIdentifier(output.candidateId, "auditor output.candidateId");
  baseSha(output.baseSha, "auditor output.baseSha");
  sha256(output.runtimeFingerprint, "auditor output.runtimeFingerprint");
  const findings = array(output.findings, "auditor output.findings");
  for (const [index, rawFinding] of findings.entries()) {
    const finding = object(rawFinding, `auditor output.findings[${index}]`);
    enumeration(finding.severity, `auditor output.findings[${index}].severity`, [
      "blocker", "high", "medium", "low",
    ]);
    string(finding.source, `auditor output.findings[${index}].source`);
    string(finding.finding, `auditor output.findings[${index}].finding`);
  }
  const verifiedChecks = stringArray(output.verifiedChecks, "auditor output.verifiedChecks");
  if (output.verdict === "veto" && findings.length === 0) {
    throw new Error("veto auditor output requires findings");
  }
  if (output.verdict === "pass" && verifiedChecks.length === 0) {
    throw new Error("pass auditor output requires verifiedChecks");
  }
  if (
    output.verdict === "pass"
    && findings.some((finding) => new Set(["blocker", "high"]).has(finding.severity))
  ) {
    throw new Error("pass auditor output cannot contain blocker or high findings");
  }
  string(output.reason, "auditor output.reason");
  return output;
}

function validateSelectedFinding(value, label = "run report.selectedFinding") {
  if (value === null) return null;
  const finding = object(value, label);
  exactKeys(finding, label, [
    "id", "domain", "summary", "evidence", "impact", "confidence", "risk",
    "candidatePaths", "verification", "conflicts",
  ]);
  for (const key of ["id", "summary"]) string(finding[key], `${label}.${key}`);
  enumeration(finding.domain, `${label}.domain`, [
    "evidence", "ux", "accessibility", "seo", "localization", "performance",
    "security", "testing", "reliability", "maintainability",
  ]);
  enumeration(finding.impact, `${label}.impact`, ["low", "medium", "high"]);
  enumeration(finding.confidence, `${label}.confidence`, ["low", "medium", "high"]);
  enumeration(finding.risk, `${label}.risk`, ["low", "medium", "high"]);
  const evidence = array(finding.evidence, `${label}.evidence`);
  if (evidence.length === 0) throw new Error(`${label}.evidence must not be empty`);
  for (const [index, rawEvidence] of evidence.entries()) {
    validateTypedEvidence(rawEvidence, `${label}.evidence[${index}]`);
  }
  stringArray(finding.candidatePaths, `${label}.candidatePaths`, { nonEmpty: true });
  stringArray(finding.verification, `${label}.verification`, { nonEmpty: true });
  stringArray(finding.conflicts, `${label}.conflicts`);
  return finding;
}

export function validateRunReport(value, policy = loadPolicy()) {
  const output = common(value, "run report", 6);
  exactKeys(output, "run report", [
    "schemaVersion", "status", "mode", "runOrigin", "attentionClass", "runId", "baseSha", "runtimeFingerprint", "candidateId",
    "parentRunId", "trigger", "phase", "finalCommit", "pullRequest",
    "reviewDecision", "selectedFinding",
    "activeConflicts", "policyBlockers", "changedPaths", "checks",
    "auditorVerdict", "externalAction", "learned_rules", "usage", "traceId",
    "reason",
  ]);
  enumeration(output.status, "run report.status", [
    "no_op", "shadow_finding", "blocked", "local_diff", "draft_pr",
  ]);
  enumeration(output.mode, "run report.mode", ["shadow", "active", "disabled"]);
  enumeration(output.runOrigin, "run report.runOrigin", [
    "scheduled_autonomous", "human_directed", "control_plane_maintenance", "delivery",
  ]);
  enumeration(output.attentionClass, "run report.attentionClass", ATTENTION_CLASSES);
  safeIdentifier(output.runId, "run report.runId");
  baseSha(output.baseSha, "run report.baseSha");
  sha256(output.runtimeFingerprint, "run report.runtimeFingerprint");
  if (output.candidateId !== null) safeIdentifier(output.candidateId, "run report.candidateId");
  if (output.parentRunId !== null) safeIdentifier(output.parentRunId, "run report.parentRunId");
  if (output.parentRunId === output.runId) {
    throw new Error("run report.parentRunId cannot equal runId");
  }
  enumeration(output.trigger, "run report.trigger", [
    "scheduled_cycle", "human_request", "candidate_follow_up", "delivery_event",
  ]);
  const triggerOrigins = {
    scheduled_cycle: ["scheduled_autonomous"],
    human_request: ["human_directed", "control_plane_maintenance"],
    delivery_event: ["delivery"],
  };
  if (triggerOrigins[output.trigger] && !triggerOrigins[output.trigger].includes(output.runOrigin)) {
    throw new Error(`run report.trigger ${output.trigger} is incompatible with runOrigin ${output.runOrigin}`);
  }
  if (output.phase !== null) {
    enumeration(output.phase, "run report.phase", [
      "discovery", "implementation", "review", "delivery", "closure",
    ]);
  }
  if (output.finalCommit !== null) baseSha(output.finalCommit, "run report.finalCommit");
  nullablePullRequest(output.pullRequest, "run report.pullRequest");
  if (output.reviewDecision !== null) {
    enumeration(output.reviewDecision, "run report.reviewDecision", [
      "approved", "changes_requested", "rejected", "superseded",
    ]);
  }
  const finding = validateSelectedFinding(output.selectedFinding);
  if (finding) {
    const classified = classifyFindingAttention(finding, policy);
    if (classified !== output.attentionClass) {
      throw new Error(
        `run report.selectedFinding belongs to ${classified}, not ${output.attentionClass}`,
      );
    }
  }
  stringArray(output.activeConflicts, "run report.activeConflicts");
  stringArray(output.policyBlockers, "run report.policyBlockers");
  const changedPaths = stringArray(output.changedPaths, "run report.changedPaths");
  const checks = array(output.checks, "run report.checks");
  for (const [index, rawCheck] of checks.entries()) {
    const check = object(rawCheck, `run report.checks[${index}]`);
    exactKeys(check, `run report.checks[${index}]`, ["command", "status", "summary"]);
    string(check.command, `run report.checks[${index}].command`);
    enumeration(check.status, `run report.checks[${index}].status`, ["passed", "failed", "skipped"]);
    string(check.summary, `run report.checks[${index}].summary`);
  }
  if (output.auditorVerdict !== null) {
    enumeration(output.auditorVerdict, "run report.auditorVerdict", ["pass", "veto", "needs_human"]);
  }
  enumeration(output.externalAction, "run report.externalAction", ["none", "local_diff", "draft_pr"]);
  const learnedRules = array(output.learned_rules, "run report.learned_rules");
  for (const [index, rawRule] of learnedRules.entries()) {
    const rule = object(rawRule, `run report.learned_rules[${index}]`);
    exactKeys(rule, `run report.learned_rules[${index}]`, ["rule", "source", "status", "reason"]);
    string(rule.rule, `run report.learned_rules[${index}].rule`);
    string(rule.source, `run report.learned_rules[${index}].source`);
    enumeration(rule.status, `run report.learned_rules[${index}].status`, ["proposed"]);
    string(rule.reason, `run report.learned_rules[${index}].reason`);
  }
  const usage = object(output.usage, "run report.usage");
  exactKeys(usage, "run report.usage", [
    "inputTokens", "outputTokens", "totalTokens", "costUsd", "durationMs",
  ]);
  nullableNonNegativeNumber(usage.inputTokens, "run report.usage.inputTokens", { integer: true });
  nullableNonNegativeNumber(usage.outputTokens, "run report.usage.outputTokens", { integer: true });
  nullableNonNegativeNumber(usage.totalTokens, "run report.usage.totalTokens", { integer: true });
  nullableNonNegativeNumber(usage.costUsd, "run report.usage.costUsd");
  nullableNonNegativeNumber(usage.durationMs, "run report.usage.durationMs", { integer: true });
  if (
    usage.inputTokens !== null
    && usage.outputTokens !== null
    && usage.totalTokens !== null
    && usage.totalTokens !== usage.inputTokens + usage.outputTokens
  ) throw new Error("run report.usage.totalTokens must equal inputTokens plus outputTokens");
  if (output.traceId !== null) string(output.traceId, "run report.traceId");
  string(output.reason, "run report.reason");

  const retainedBlockedDiff = output.status === "blocked" && changedPaths.length > 0;
  const mutationStatuses = new Set(["local_diff", "draft_pr"]);
  if (retainedBlockedDiff) {
    if (output.mode !== "active" || !finding || output.externalAction !== "local_diff"
      || output.policyBlockers.length === 0 || output.auditorVerdict === "pass") {
      throw new Error("blocked retained diff requires active mode, finding, local_diff, blockers and no pass verdict");
    }
    mutationStatuses.add("blocked");
  }
  if (output.mode !== "active" && mutationStatuses.has(output.status)) {
    throw new Error("only active mode can report a repository mutation");
  }
  if (mutationStatuses.has(output.status) && changedPaths.length === 0) {
    throw new Error(`${output.status} requires changedPaths`);
  }
  if (!mutationStatuses.has(output.status) && changedPaths.length !== 0) {
    throw new Error(`${output.status} cannot report changedPaths`);
  }
  if (new Set(["shadow_finding", "local_diff", "draft_pr"]).has(output.status) && !finding) {
    throw new Error(`${output.status} requires selectedFinding`);
  }
  if (output.status === "no_op" && finding) {
    throw new Error("no_op requires selectedFinding null");
  }
  const lineageFields = [
    output.candidateId,
    output.parentRunId,
    output.phase,
    output.finalCommit,
    output.pullRequest,
    output.reviewDecision,
  ];
  if (!finding && lineageFields.some((item) => item !== null)) {
    throw new Error("reports without selectedFinding require candidate lineage fields null");
  }
  if (finding && (output.candidateId === null || output.phase === null)) {
    throw new Error("reports with selectedFinding require candidateId and phase");
  }
  if (
    output.reviewDecision !== null
    && !new Set(["review", "delivery", "closure"]).has(output.phase)
  ) {
    throw new Error("reviewDecision requires review, delivery or closure phase");
  }
  if (output.status === "draft_pr" && output.externalAction !== "draft_pr") {
    throw new Error("draft_pr status requires draft_pr externalAction");
  }
  if (output.status === "draft_pr" && output.pullRequest === null) {
    throw new Error("draft_pr status requires pullRequest");
  }
  if (output.status === "local_diff" && output.externalAction !== "local_diff") {
    throw new Error("local_diff status requires local_diff externalAction");
  }
  if (!mutationStatuses.has(output.status) && output.externalAction !== "none") {
    throw new Error(`${output.status} requires externalAction none`);
  }
  if (output.mode === "shadow" && output.auditorVerdict !== null) {
    throw new Error("shadow reports cannot claim an auditor verdict");
  }
  if (
    output.runOrigin === "control_plane_maintenance"
    && output.attentionClass !== "agent_maintenance"
  ) {
    throw new Error("control_plane_maintenance requires agent_maintenance attention");
  }
  return output;
}

export function parseRoleOutput(role, text) {
  let parsed;
  try {
    parsed = JSON.parse(String(text).trim());
  } catch {
    throw new Error(`${role} returned non-JSON output`);
  }
  if (role === "scout") return validateScoutOutput(parsed);
  if (role === "builder") return validateBuilderOutput(parsed);
  if (role === "auditor") return validateAuditorOutput(parsed);
  throw new Error(`unknown role ${role}`);
}

function main() {
  const roleIndex = process.argv.indexOf("--role");
  const role = roleIndex === -1 ? null : process.argv[roleIndex + 1];
  if (!role) throw new Error("usage: contracts.mjs --role scout|builder|auditor [file]");
  const file = process.argv[roleIndex + 2];
  const text = file ? readFileSync(file, "utf8") : readFileSync(0, "utf8");
  process.stdout.write(`${JSON.stringify(parseRoleOutput(role, text), null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
