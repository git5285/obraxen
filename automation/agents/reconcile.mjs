import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readMemoryState,
  writeMemoryReconciliation,
} from "./memory.mjs";
import { loadPolicy } from "./policy.mjs";
import {
  exactKeys,
  object,
  safeIdentifier as validateSafeIdentifier,
  timestamp as validateTimestamp,
} from "./validation.mjs";

const OUTCOMES = new Set([
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

function nonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function nullableString(value, label) {
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`${label} must be null or a string`);
  return value;
}

function safeIdentifier(value, label) {
  nonEmptyString(value, label);
  return validateSafeIdentifier(value, label);
}

function sha(value, label) {
  if (!/^[0-9a-f]{40}$/.test(value ?? "")) throw new Error(`${label} must be a 40 character git SHA`);
  return value;
}

function timestamp(value, label) {
  nonEmptyString(value, label);
  return validateTimestamp(value, label);
}

function nullableTimestamp(value, label) {
  if (value === null) return null;
  return timestamp(value, label);
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function git(repo, args, { allowStatus = [] } = {}) {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  if (result.status === 0 || allowStatus.includes(result.status)) return result;
  throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
}

function commitExists(repo, commit) {
  return git(repo, ["cat-file", "-e", `${commit}^{commit}`], { allowStatus: [1, 128] }).status === 0;
}

function isAncestor(repo, ancestor, descendant) {
  const result = git(repo, ["merge-base", "--is-ancestor", ancestor, descendant], { allowStatus: [1] });
  return result.status === 0;
}

function commitEvidence(repo, commit, defaultBranchSha) {
  if (commit === null) {
    return { declaredSha: null, exists: null, isAncestorOfDefaultBranch: null };
  }
  sha(commit, "declared commit");
  const exists = commitExists(repo, commit);
  return {
    declaredSha: commit,
    exists,
    isAncestorOfDefaultBranch: exists ? isAncestor(repo, commit, defaultBranchSha) : false,
  };
}

export function validatePullRequestView(value) {
  const pullRequest = object(value, "pull request view");
  exactKeys(pullRequest, "pull request view", [
    "baseRefName",
    "closedAt",
    "headRefOid",
    "isDraft",
    "mergeCommit",
    "mergedAt",
    "number",
    "reviewDecision",
    "state",
    "url",
  ]);
  nonEmptyString(pullRequest.baseRefName, "pull request view.baseRefName");
  nullableTimestamp(pullRequest.closedAt, "pull request view.closedAt");
  sha(pullRequest.headRefOid, "pull request view.headRefOid");
  if (typeof pullRequest.isDraft !== "boolean") throw new Error("pull request view.isDraft must be boolean");
  if (pullRequest.mergeCommit !== null) {
    const mergeCommit = object(pullRequest.mergeCommit, "pull request view.mergeCommit");
    exactKeys(mergeCommit, "pull request view.mergeCommit", ["oid"]);
    sha(mergeCommit.oid, "pull request view.mergeCommit.oid");
  }
  nullableTimestamp(pullRequest.mergedAt, "pull request view.mergedAt");
  if (!Number.isInteger(pullRequest.number) || pullRequest.number < 1) {
    throw new Error("pull request view.number must be a positive integer");
  }
  nullableString(pullRequest.reviewDecision, "pull request view.reviewDecision");
  if (!["", "APPROVED", "CHANGES_REQUESTED", "REVIEW_REQUIRED", null].includes(pullRequest.reviewDecision)) {
    throw new Error("pull request view.reviewDecision is unsupported");
  }
  if (!["OPEN", "CLOSED", "MERGED"].includes(pullRequest.state)) {
    throw new Error("pull request view.state must be OPEN, CLOSED or MERGED");
  }
  nonEmptyString(pullRequest.url, "pull request view.url");
  const url = new URL(pullRequest.url);
  if (url.protocol !== "https:" || !url.pathname.endsWith(`/pull/${pullRequest.number}`)) {
    throw new Error("pull request view.url must identify its pull request number over https");
  }
  if (pullRequest.state === "MERGED" && (!pullRequest.mergedAt || !pullRequest.mergeCommit)) {
    throw new Error("a merged pull request requires mergedAt and mergeCommit");
  }
  if (pullRequest.state === "OPEN" && (pullRequest.closedAt || pullRequest.mergedAt || pullRequest.mergeCommit)) {
    throw new Error("an open pull request cannot contain closure or merge evidence");
  }
  if (pullRequest.state === "CLOSED" && (pullRequest.mergedAt || pullRequest.mergeCommit)) {
    throw new Error("a closed unmerged pull request cannot contain merge evidence");
  }
  return pullRequest;
}

export function validatePullRequestChecks(value) {
  if (!Array.isArray(value)) throw new Error("pull request checks must be an array");
  return value.map((rawCheck, index) => {
    const check = object(rawCheck, `pull request checks[${index}]`);
    exactKeys(check, `pull request checks[${index}]`, ["bucket", "link", "name", "state", "workflow"]);
    if (!["pass", "fail", "pending", "skipping", "cancel"].includes(check.bucket)) {
      throw new Error(`pull request checks[${index}].bucket is unsupported`);
    }
    nonEmptyString(check.link, `pull request checks[${index}].link`);
    nonEmptyString(check.name, `pull request checks[${index}].name`);
    nonEmptyString(check.state, `pull request checks[${index}].state`);
    nonEmptyString(check.workflow, `pull request checks[${index}].workflow`);
    return check;
  });
}

export function validateRegressionCheck(value) {
  if (value === null) return null;
  const check = object(value, "regression check");
  exactKeys(check, "regression check", ["checkedSha", "command", "status", "summary"]);
  sha(check.checkedSha, "regression check.checkedSha");
  nonEmptyString(check.command, "regression check.command");
  if (!["passed", "failed"].includes(check.status)) {
    throw new Error("regression check.status must be passed or failed");
  }
  nonEmptyString(check.summary, "regression check.summary");
  return check;
}

function summarizeRequiredChecks(checks, requiredNames) {
  const required = requiredNames.map((name) => {
    const matches = checks.filter((check) => check.name === name);
    let status = "missing";
    if (matches.length > 0) {
      if (matches.some((check) => ["fail", "cancel"].includes(check.bucket))) status = "failed";
      else if (matches.some((check) => check.bucket === "pending")) status = "pending";
      else if (matches.every((check) => check.bucket === "pass")) status = "passed";
      else status = "skipped";
    }
    return { name, status, matches };
  });
  return {
    required,
    allPassed: required.every((check) => check.status === "passed"),
    anyFailed: required.some((check) => check.status === "failed"),
    anyPending: required.some((check) => check.status === "pending"),
  };
}

export function collectGitEvidence({ repo = process.cwd(), candidate, pullRequest, defaultBranch }) {
  const defaultBranchRef = `refs/heads/${defaultBranch}`;
  const defaultBranchSha = git(repo, ["rev-parse", "--verify", defaultBranchRef]).stdout.trim();
  const headSha = git(repo, ["rev-parse", "HEAD"]).stdout.trim();
  const branchResult = git(repo, ["symbolic-ref", "--quiet", "--short", "HEAD"], { allowStatus: [1] });
  const mergeCommitSha = pullRequest?.mergeCommit?.oid ?? null;
  return {
    repo: resolve(repo),
    headSha,
    branch: branchResult.status === 0 ? branchResult.stdout.trim() : null,
    defaultBranch,
    defaultBranchSha,
    finalCommit: commitEvidence(repo, candidate.finalCommit, defaultBranchSha),
    mergeCommit: commitEvidence(repo, mergeCommitSha, defaultBranchSha),
  };
}

function identityProblems(candidate, pullRequest, gitEvidence, defaultBranch) {
  const problems = [];
  if (!candidate.pullRequest && pullRequest) problems.push("candidate_has_no_declared_pull_request");
  if (candidate.pullRequest && pullRequest) {
    if (candidate.pullRequest.number !== pullRequest.number) problems.push("pull_request_number_mismatch");
    if (candidate.pullRequest.url !== pullRequest.url) problems.push("pull_request_url_mismatch");
    if (pullRequest.baseRefName !== defaultBranch) problems.push("pull_request_base_branch_mismatch");
    if (!candidate.finalCommit) problems.push("candidate_has_no_declared_final_commit");
    else if (candidate.finalCommit !== pullRequest.headRefOid) problems.push("pull_request_head_sha_mismatch");
  }
  if (candidate.finalCommit && gitEvidence.finalCommit.exists !== true) {
    problems.push("declared_final_commit_missing_locally");
  }
  return problems;
}

function deriveOpenOutcome(pullRequest, checkSummary) {
  if (pullRequest.isDraft) return { outcome: "pr_draft", reasonCodes: ["pull_request_is_draft"] };
  if (checkSummary.anyFailed) return { outcome: "checks_failed", reasonCodes: ["required_checks_failed"] };
  if (checkSummary.anyPending || checkSummary.required.some((check) => check.status === "missing")) {
    return { outcome: "checks_pending", reasonCodes: ["required_checks_incomplete"] };
  }
  if (pullRequest.reviewDecision === "CHANGES_REQUESTED") {
    return { outcome: "changes_requested", reasonCodes: ["github_changes_requested"] };
  }
  if (pullRequest.reviewDecision === "APPROVED" && checkSummary.allPassed) {
    return { outcome: "ready_for_human_merge", reasonCodes: ["approved_and_required_checks_passed"] };
  }
  return { outcome: "review_pending", reasonCodes: ["github_review_not_approved"] };
}

export function buildReconciliation({
  candidate,
  reconciliationId,
  observedAt,
  gitEvidence,
  pullRequest = null,
  checks = [],
  regressionCheck = null,
  policy = loadPolicy(),
}) {
  safeIdentifier(reconciliationId, "reconciliationId");
  safeIdentifier(candidate.candidateId, "candidate.candidateId");
  timestamp(observedAt, "observedAt");
  const validatedPullRequest = pullRequest === null ? null : validatePullRequestView(structuredClone(pullRequest));
  const validatedChecks = validatePullRequestChecks(structuredClone(checks));
  const validatedRegression = validateRegressionCheck(structuredClone(regressionCheck));
  const checkSummary = summarizeRequiredChecks(
    validatedChecks,
    policy.reconciliation.requiredPullRequestChecks,
  );
  const problems = identityProblems(
    candidate,
    validatedPullRequest,
    gitEvidence,
    policy.reconciliation.defaultBranch,
  );
  let outcome;
  let reasonCodes;

  if (candidate.pullRequest && !validatedPullRequest) {
    outcome = "needs_remote";
    reasonCodes = ["declared_pull_request_requires_remote_evidence"];
  } else if (problems.length > 0) {
    outcome = "evidence_mismatch";
    reasonCodes = problems;
  } else if (!candidate.pullRequest) {
    if (validatedRegression) {
      outcome = "evidence_mismatch";
      reasonCodes = ["regression_check_requires_merged_pull_request"];
    } else if (!candidate.finalCommit) {
      const lastStatus = candidate.phases.at(-1)?.status;
      outcome = lastStatus === "local_diff" ? "local_diff" : "unreconciled";
      reasonCodes = [lastStatus === "local_diff" ? "candidate_has_local_diff" : "candidate_has_no_delivery_evidence"];
    } else if (gitEvidence.finalCommit.isAncestorOfDefaultBranch) {
      outcome = "needs_human";
      reasonCodes = ["commit_is_on_default_branch_without_pull_request_evidence"];
    } else {
      outcome = "committed_local";
      reasonCodes = ["declared_commit_exists_outside_default_branch"];
    }
  } else if (validatedPullRequest.state === "OPEN") {
    ({ outcome, reasonCodes } = deriveOpenOutcome(validatedPullRequest, checkSummary));
  } else if (validatedPullRequest.state === "CLOSED") {
    if (candidate.reviewDecision === "rejected") {
      outcome = "rejected";
      reasonCodes = ["closed_unmerged_with_declared_rejection"];
    } else if (candidate.reviewDecision === "superseded") {
      outcome = "superseded";
      reasonCodes = ["closed_unmerged_with_declared_supersession"];
    } else {
      outcome = "needs_human";
      reasonCodes = ["closed_unmerged_without_terminal_decision"];
    }
  } else if (
    gitEvidence.mergeCommit.exists !== true
    || gitEvidence.mergeCommit.isAncestorOfDefaultBranch !== true
  ) {
    outcome = "local_state_stale";
    reasonCodes = ["remote_merge_commit_not_present_on_local_default_branch"];
  } else if (validatedRegression?.status === "failed") {
    const previousOutcome = candidate.reconciliation?.outcome ?? null;
    const regressionProblems = [];
    if (previousOutcome !== "merged" && previousOutcome !== "regressed") {
      regressionProblems.push("regression_requires_previous_merged_reconciliation");
    }
    if (!candidate.verification.includes(validatedRegression.command)) {
      regressionProblems.push("regression_command_not_declared_by_candidate");
    }
    if (validatedRegression.checkedSha !== gitEvidence.defaultBranchSha) {
      regressionProblems.push("regression_check_sha_is_not_current_default_branch");
    }
    if (regressionProblems.length > 0) {
      outcome = "evidence_mismatch";
      reasonCodes = regressionProblems;
    } else {
      outcome = "regressed";
      reasonCodes = ["declared_verification_failed_on_current_default_branch"];
    }
  } else {
    outcome = "merged";
    reasonCodes = ["pull_request_merge_and_local_git_identity_match"];
    if (!checkSummary.allPassed) reasonCodes.push("merged_without_all_required_checks_passing");
    if (validatedRegression?.status === "passed") {
      if (!candidate.verification.includes(validatedRegression.command)) {
        outcome = "evidence_mismatch";
        reasonCodes = ["regression_command_not_declared_by_candidate"];
      } else if (validatedRegression.checkedSha !== gitEvidence.defaultBranchSha) {
        outcome = "evidence_mismatch";
        reasonCodes = ["regression_check_sha_is_not_current_default_branch"];
      } else {
        reasonCodes.push("declared_verification_passed_on_current_default_branch");
      }
    }
  }

  if (!OUTCOMES.has(outcome)) throw new Error(`unsupported reconciliation outcome ${outcome}`);
  const evidence = {
    git: gitEvidence,
    pullRequest: validatedPullRequest,
    checks: validatedChecks,
    requiredChecks: checkSummary.required,
    regressionCheck: validatedRegression,
  };
  return {
    schemaVersion: 1,
    reconciliationId,
    candidateId: candidate.candidateId,
    expectedCandidateLastRunId: candidate.lastRunId,
    observedAt,
    outcome,
    terminal: new Set(["merged", "rejected", "superseded"]).has(outcome),
    reasonCodes,
    evidence,
    evidenceDigest: digest(evidence),
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function readJson(path, label) {
  if (!path) return null;
  try {
    return JSON.parse(readFileSync(resolve(path), "utf8"));
  } catch (error) {
    throw new Error(`${label} could not be read: ${error.message}`);
  }
}

function main() {
  const [operation] = process.argv.slice(2);
  const repo = resolve(argument("--repo") ?? process.cwd());
  const rootArgument = argument("--root");
  const root = rootArgument ? resolve(rootArgument) : null;
  const state = readMemoryState({ repo, root });
  if (operation === "list") {
    process.stdout.write(`${JSON.stringify(state.candidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      lastRunId: candidate.lastRunId,
      finalCommit: candidate.finalCommit,
      pullRequest: candidate.pullRequest,
      outcome: candidate.reconciliation?.outcome ?? "unreconciled",
    })), null, 2)}\n`);
    return;
  }
  if (!new Set(["inspect", "apply"]).has(operation)) {
    throw new Error("usage: reconcile.mjs list|inspect|apply --candidate-id ID [--id ID --observed-at ISO --pr-view FILE --pr-checks FILE --regression FILE]");
  }
  const candidateId = argument("--candidate-id");
  const reconciliationId = argument("--id");
  const observedAt = argument("--observed-at");
  if (!candidateId || !reconciliationId || !observedAt) {
    throw new Error("inspect and apply require --candidate-id, --id and --observed-at");
  }
  const candidate = state.candidates.find((item) => item.candidateId === candidateId);
  if (!candidate) throw new Error(`candidate ${candidateId} was not found in memory`);
  const pullRequest = readJson(argument("--pr-view"), "pull request view");
  const checks = readJson(argument("--pr-checks"), "pull request checks");
  if ((pullRequest === null) !== (checks === null)) {
    throw new Error("--pr-view and --pr-checks must be supplied together");
  }
  const regressionCheck = readJson(argument("--regression"), "regression check");
  const policy = loadPolicy();
  const validatedPullRequest = pullRequest === null ? null : validatePullRequestView(pullRequest);
  const gitEvidence = collectGitEvidence({
    repo,
    candidate,
    pullRequest: validatedPullRequest,
    defaultBranch: policy.reconciliation.defaultBranch,
  });
  const reconciliation = buildReconciliation({
    candidate,
    reconciliationId,
    observedAt,
    gitEvidence,
    pullRequest: validatedPullRequest,
    checks: checks ?? [],
    regressionCheck,
    policy,
  });
  const persisted = operation === "apply"
    ? writeMemoryReconciliation(reconciliation, { repo, root, policy })
    : null;
  process.stdout.write(`${JSON.stringify({ reconciliation, persisted }, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
