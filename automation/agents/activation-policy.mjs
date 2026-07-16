import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadPolicy } from "./policy.mjs";

export function validateActivationReport(report, policy = loadPolicy()) {
  const invariant = policy.activationInvariant;
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    throw new Error("activation report must be an object");
  }
  if (report.schemaVersion !== invariant.schemaVersion) {
    throw new Error("unexpected activation schemaVersion");
  }
  if (!new Set(["NO-GO", "READY_FOR_PROTECTED_CANDIDATE"]).has(report.decision)) {
    throw new Error("unexpected activation decision");
  }
  if (report.candidateAuditRequired !== invariant.candidateAuditRequired) {
    throw new Error("candidateAuditRequired changed");
  }
  if (report.publicationAuthorized !== invariant.publicationAuthorized) {
    throw new Error("publicationAuthorized changed");
  }
  if (report.publishSwitch !== invariant.publishSwitch) {
    throw new Error("publishSwitch changed");
  }
  if (!Array.isArray(report.blockers) || !report.blockers.every((item) => typeof item === "string")) {
    throw new Error("activation blockers must be strings");
  }
  if (report.blockerCount !== report.blockers.length) {
    throw new Error("activation blockerCount does not match blockers");
  }
  return report;
}

export function parseActivationCommand(result, policy = loadPolicy()) {
  if (![0, 1].includes(result.status)) {
    throw new Error(`activation command failed unexpectedly with status ${result.status}`);
  }
  if (String(result.stderr ?? "").trim()) {
    throw new Error("activation command wrote to stderr");
  }
  return validateActivationReport(JSON.parse(result.stdout), policy);
}

export function assertActivationUnchanged(before, after, policy = loadPolicy()) {
  const validBefore = validateActivationReport(before, policy);
  const validAfter = validateActivationReport(after, policy);
  if (
    policy.activationInvariant.requireExactBeforeAfterMatch
    && JSON.stringify(validBefore) !== JSON.stringify(validAfter)
  ) {
    throw new Error("autonomous run changed the activation report");
  }
  return true;
}

function main() {
  const [beforePath, afterPath] = process.argv.slice(2);
  if (!beforePath || !afterPath) {
    throw new Error("usage: node automation/agents/activation-policy.mjs <before.json> <after.json>");
  }
  assertActivationUnchanged(
    JSON.parse(readFileSync(beforePath, "utf8")),
    JSON.parse(readFileSync(afterPath, "utf8")),
  );
  process.stdout.write('{"ok":true}\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
