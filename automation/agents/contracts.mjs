import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadPolicy } from "./policy.mjs";

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function string(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

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

function baseSha(value, label) {
  if (!/^[0-9a-f]{40}$/.test(value ?? "")) throw new Error(`${label} must be a 40 character git SHA`);
  return value;
}

function common(value, label) {
  const output = object(value, label);
  if (output.schemaVersion !== 1) throw new Error(`${label}.schemaVersion must be 1`);
  return output;
}

export function validateScoutOutput(value, policy = loadPolicy()) {
  const output = common(value, "scout output");
  enumeration(output.status, "scout output.status", ["no_op", "proposal", "blocked"]);
  baseSha(output.baseSha, "scout output.baseSha");
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
      const evidence = object(rawEvidence, `scout output.findings[${index}].evidence[${evidenceIndex}]`);
      string(evidence.source, `scout output.findings[${index}].evidence[${evidenceIndex}].source`);
      string(evidence.fact, `scout output.findings[${index}].evidence[${evidenceIndex}].fact`);
    }
    stringArray(finding.candidatePaths, `scout output.findings[${index}].candidatePaths`, { nonEmpty: true });
    stringArray(finding.verification, `scout output.findings[${index}].verification`, { nonEmpty: true });
    stringArray(finding.conflicts, `scout output.findings[${index}].conflicts`);
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
  const output = common(value, "builder output");
  enumeration(output.status, "builder output.status", ["implemented", "no_op", "blocked"]);
  string(output.runId, "builder output.runId");
  baseSha(output.baseSha, "builder output.baseSha");
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
  if (output.status !== "implemented" && changedPaths.length !== 0) {
    throw new Error("non-implemented builder output cannot claim changedPaths");
  }
  return output;
}

export function validateAuditorOutput(value) {
  const output = common(value, "auditor output");
  enumeration(output.verdict, "auditor output.verdict", ["pass", "veto", "needs_human"]);
  string(output.runId, "auditor output.runId");
  baseSha(output.baseSha, "auditor output.baseSha");
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
