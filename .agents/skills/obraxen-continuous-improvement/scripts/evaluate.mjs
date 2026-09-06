import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { assertActivationUnchanged } from "../../../../automation/agents/activation-policy.mjs";
import { classifyFindingAttention, expectedScheduledAttentionClass } from "../../../../automation/agents/attention.mjs";
import { validateAuditorOutput, validateBuilderOutput, validateRunReport, validateScoutOutput } from "../../../../automation/agents/contracts.mjs";
import { validateDiff } from "../../../../automation/agents/diff-policy.mjs";
import { acquireLease, readLease, releaseLease } from "../../../../automation/agents/lease.mjs";
import { buildContextPack, readMemoryState, recordRun } from "../../../../automation/agents/memory.mjs";
import { readOperationalClaims, registerOperationalClaim, transitionOperationalClaim } from "../../../../automation/agents/operations.mjs";
import { loadPolicy } from "../../../../automation/agents/policy.mjs";
import { buildPreflight } from "../../../../automation/agents/preflight.mjs";
import { inspectRuntime } from "../../../../automation/agents/runtime.mjs";

const sourceRepo = fileURLToPath(new URL("../../../../", import.meta.url));
const digest = (value) => createHash("sha256").update(value).digest("hex");
const elapsed = (start) => Math.round((performance.now() - start) * 1000) / 1000;
const git = (repo, args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: "pipe" }).trim();

export function summarizeObservations(observations) {
  const ids = new Set();
  let repeatedPassedChecks = 0;
  for (const row of observations) {
    assert(!ids.has(row.id), "Duplicate observation id");
    ids.add(row.id);
    assert(Number.isFinite(row.durationMs) && row.durationMs >= 0, "Invalid duration");
    assert(["passed", "failed"].includes(row.status), "Invalid status");
    assert(["local_fixture_change", "expected_block", "no_op", "failure", "avoidable_block"].includes(row.outcome), "Invalid outcome");
    assert([true, false, null].includes(row.usefulChangeVerified), "Invalid useful-change evidence");
    const failureOutcome = ["failure", "avoidable_block"].includes(row.outcome);
    assert.equal(row.status === "failed", failureOutcome, "Observation status requires a consistent outcome");
    const latestChecks = new Map();
    for (const check of row.checks) {
      assert(check.id && /^[a-f0-9]{64}$/.test(check.inputDigest), "Check needs identity and input digest");
      assert(["passed", "failed"].includes(check.status), "Invalid check status");
      const key = `${check.id}:${check.inputDigest}`;
      if (check.status === "passed" && latestChecks.get(key) === "passed") repeatedPassedChecks += 1;
      latestChecks.set(key, check.status);
    }
    const checksPassed = [...latestChecks.values()].every((status) => status === "passed");
    assert(row.status !== "passed" || checksPassed, "Passed observation requires no unresolved failed checks");
    if (row.usefulChangeVerified === true) {
      assert(row.status === "passed" && row.outcome === "local_fixture_change"
        && latestChecks.size > 0 && checksPassed,
      "Verified useful change requires a passed change outcome and successful checks");
    }
  }
  return {
    cases: observations.length,
    passed: observations.filter((row) => row.status === "passed").length,
    failed: observations.filter((row) => row.status === "failed").length,
    verifiedUsefulChanges: observations.filter((row) => row.status === "passed" && row.usefulChangeVerified === true).length,
    expectedBlocks: observations.filter((row) => row.status === "passed" && row.outcome === "expected_block").length,
    avoidableBlocks: observations.filter((row) => row.outcome === "avoidable_block").length,
    unclassifiedFailures: observations.filter((row) => row.status === "failed" && row.outcome !== "avoidable_block").length,
    repeatedPassedChecks,
    totalCaseDurationMs: Math.round(observations.reduce((sum, row) => sum + row.durationMs, 0) * 1000) / 1000,
    inputTokens: null, outputTokens: null, costUsd: null,
  };
}

function fixture(root, id) {
  const repo = join(root, id, "repository");
  const stateHome = join(root, id, "state");
  const memoryRoot = join(root, id, "memory");
  mkdirSync(join(repo, "automation/agents"), { recursive: true });
  mkdirSync(join(repo, ".coordination/claims"), { recursive: true });
  writeFileSync(join(repo, "automation/agents/lease.mjs"), "export const COORDINATION_PROTOCOL_VERSION = 3;\n");
  writeFileSync(join(repo, "fixture.txt"), "Status: pending\n");
  git(repo, ["init", "-q"]);
  git(repo, ["remote", "add", "origin", `https://example.invalid/skill-evaluation/${id}.git`]);
  git(repo, ["add", "--", "fixture.txt", "automation/agents/lease.mjs"]);
  git(repo, ["-c", "user.name=Skill evaluation", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Isolated fixture"]);
  return { repo, stateHome, memoryRoot, baseSha: git(repo, ["rev-parse", "HEAD"]) };
}

function runIntegrationAtRoot(root) {
  const started = performance.now();
  const policy = loadPolicy();
  const runtime = inspectRuntime(sourceRepo);
  assert(runtime.ok && runtime.fingerprint, "Source runtime must be verified before fixture execution");
  const observations = [];
  const runCase = (id, exercise) => {
    const start = performance.now();
    const checks = [];
    const check = (name, input, action) => {
      const item = { id: name, inputDigest: digest(input), status: "failed" };
      checks.push(item);
      const result = action();
      item.status = "passed";
      return result;
    };
    try {
      const result = exercise(fixture(root, id), check);
      observations.push({ id, status: "passed", durationMs: elapsed(start), checks, ...result });
    } catch (error) {
      observations.push({ id, status: "failed", outcome: "failure", usefulChangeVerified: null,
        durationMs: elapsed(start), checks, error: error instanceof Error ? error.message : String(error) });
    }
  };
  const preflight = (f) => buildPreflight(f.repo, policy, { stateHome: f.stateHome, runtime });
  const register = (f, id, paths) => {
    const claimPath = `.coordination/claims/${id}.md`;
    writeFileSync(join(f.repo, claimPath), `# Test fixture\n- thread_id: ${id}\n- estado: reservado\n- archivos:\n${paths.map((path) => `  - ${path}`).join("\n")}\n`);
    registerOperationalClaim({ repo: f.repo, stateHome: f.stateHome, claimPath,
      eventId: `${id}-register`, occurredAt: new Date().toISOString() });
    return claimPath;
  };
  const transition = (f, id, state, evidence = []) => transitionOperationalClaim({
    repo: f.repo, stateHome: f.stateHome, threadId: id, eventId: `${id}-${state}`,
    occurredAt: new Date().toISOString(), state, reason: "isolated_fixture_evaluation", evidence,
  });
  const report = (f, overrides = {}) => ({
    schemaVersion: 6, status: "no_op", mode: policy.mode, runOrigin: "human_directed",
    attentionClass: "reliability", runId: "fixture-no-op", baseSha: f.baseSha,
    runtimeFingerprint: runtime.fingerprint, candidateId: null, parentRunId: null,
    trigger: "human_request", phase: null, finalCommit: null, pullRequest: null,
    reviewDecision: null, selectedFinding: null, activeConflicts: [], policyBlockers: [],
    changedPaths: [], checks: [], auditorVerdict: null, externalAction: "none", learned_rules: [],
    usage: { inputTokens: null, outputTokens: null, totalTokens: null, costUsd: null, durationMs: null },
    traceId: null, reason: "Isolated deterministic fixture, not a production or model run", ...overrides,
  });

  runCase("complete-local-lifecycle", (f, check) => {
    check("initial-preflight", f.baseSha, () => assert.equal(preflight(f).eligibility.writer, true));
    const candidate = join(root, "complete-local-lifecycle", "candidate");
    git(f.repo, ["worktree", "add", "--detach", candidate, f.baseSha]);
    const finding = { id: "fixture-status", domain: "maintainability", summary: "Resolve fixture status",
      evidence: [{ kind: "repository_fact", source: "fixture.txt:1", fact: "Status is pending" }],
      impact: "low", confidence: "high", risk: "low", candidatePaths: ["fixture.txt"],
      verification: ["Read fixture status and git diff --check"], conflicts: [] };
    check("scout-contract", JSON.stringify(finding), () => validateScoutOutput({
      schemaVersion: 4, status: "proposal", attentionClass: "reliability", baseSha: f.baseSha,
      runtimeFingerprint: runtime.fingerprint, activeClaims: [], findings: [finding],
      recommendedId: finding.id, reason: "Explicit fixture task" }, policy));
    const discovery = report(f, { runId: "fixture-discovery", status: "shadow_finding",
      candidateId: "fixture-candidate", phase: "discovery", selectedFinding: finding });
    recordRun(discovery, { root: f.memoryRoot, policy });
    const claimPath = register(f, "fixture-cycle", ["fixture.txt"]);
    transition(f, "fixture-cycle", "en_curso");
    const token = randomUUID();
    assert(acquireLease(f.repo, { runId: "fixture-implementation", token, host: hostname(),
      pid: process.pid, worktree: candidate, baseSha: f.baseSha, claimPath, paths: ["fixture.txt"] },
    new Date(), f.stateHome).acquired);
    writeFileSync(join(candidate, "fixture.txt"), "Status: verified\n");
    const content = readFileSync(join(candidate, "fixture.txt"), "utf8");
    const changedPaths = git(candidate, ["diff", "--name-only"]).split("\n");
    check("diff-policy", content, () => assert(validateDiff({ changedPaths,
      allowedPaths: ["fixture.txt"], addedLines: 1, deletedLines: 1 }, policy).ok));
    check("fixture-behavior", content, () => assert.equal(content, "Status: verified\n"));
    check("git-diff-check", content, () => git(candidate, ["diff", "--check"]));
    const activation = { schemaVersion: 1, decision: "NO-GO", candidateAuditRequired: true,
      publicationAuthorized: false, publishSwitch: false, blockerCount: 1, blockers: ["fixture-only"] };
    check("activation-invariant", JSON.stringify(activation), () => assertActivationUnchanged(activation, { ...activation }, policy));
    const checksRun = [{ command: "fixture behavior and git diff --check", status: "passed", summary: "Executed on isolated candidate" }];
    validateBuilderOutput({ schemaVersion: 4, status: "implemented", attentionClass: "reliability",
      runId: "fixture-implementation", candidateId: "fixture-candidate", baseSha: f.baseSha,
      runtimeFingerprint: runtime.fingerprint, changedPaths, checksRun,
      residualRisks: ["Scripted role fixture; not an LLM builder or website quality gate"], reason: "Fixture only" });
    const implementation = { ...discovery, runId: "fixture-implementation", parentRunId: discovery.runId,
      trigger: "candidate_follow_up", phase: "implementation", status: "local_diff", changedPaths,
      checks: checksRun, externalAction: "local_diff" };
    recordRun(implementation, { root: f.memoryRoot, policy });
    validateAuditorOutput({ schemaVersion: 4, verdict: "pass", attentionClass: "reliability",
      runId: "fixture-review", candidateId: "fixture-candidate", baseSha: f.baseSha,
      runtimeFingerprint: runtime.fingerprint, findings: [], verifiedChecks: checksRun.map((item) => item.command),
      reason: "Deterministic audit fixture, not an independent model review" });
    const review = { ...implementation, runId: "fixture-review", parentRunId: implementation.runId,
      phase: "review", auditorVerdict: "pass", reviewDecision: "approved" };
    recordRun(review, { root: f.memoryRoot, policy });
    transition(f, "fixture-cycle", "esperando_revision");
    check("pending-candidate-block", content, () => {
      assert(preflight(f).blockers.includes("pending_local_diff_limit"));
      assert.equal(preflight(f).eligibility.writer, false);
    });
    const closure = { ...review, runId: "fixture-closure", parentRunId: review.runId, phase: "closure" };
    recordRun(closure, { root: f.memoryRoot, policy });
    transition(f, "fixture-cycle", "liberado", [{ kind: "human_decision", decisionId: "isolated-fixture-owner-acceptance" }]);
    releaseLease(f.repo, token, f.stateHome);
    check("closure-state", JSON.stringify(closure), () => {
      assert.equal(readLease(f.repo, f.stateHome), null);
      assert.equal(readOperationalClaims(f.repo, f.stateHome)[0].state, "liberado");
      assert.deepEqual(readMemoryState({ root: f.memoryRoot }).candidates[0].phases.map((item) => item.phase),
        ["discovery", "implementation", "review", "closure"]);
      assert.equal(buildContextPack({ root: f.memoryRoot, repo: f.repo, baseSha: f.baseSha, policy }).metrics.activityByOrigin.scheduled_autonomous.lifetimeRuns, 0);
      assert.equal(readFileSync(join(f.repo, "fixture.txt"), "utf8"), "Status: pending\n");
    });
    return { outcome: "local_fixture_change", usefulChangeVerified: true };
  });

  runCase("protected-maintenance-block", (f, check) => {
    const path = ".agents/skills/example/SKILL.md";
    check("protected-path-denial", path, () => assert.equal(validateDiff({ changedPaths: [path],
      allowedPaths: [path], addedLines: 1, deletedLines: 0 }, policy).ok, false));
    check("no-writer-created", f.baseSha, () => assert.equal(readLease(f.repo, f.stateHome), null));
    return { outcome: "expected_block", usefulChangeVerified: false };
  });
  for (const mode of ["shadow", "active"]) {
    runCase(`scheduled-maintenance-${mode}`, (f, check) => {
      const path = ".agents/skills/example/SKILL.md";
      const finding = { id: "protected-maintenance", domain: "maintainability",
        summary: "Clarify a protected skill instruction",
        evidence: [{ kind: "repository_fact", source: path, fact: "Isolated protected-path fixture" }],
        impact: "low", confidence: "high", risk: "low", candidatePaths: [path],
        verification: ["Owner-maintenance evaluation before any edit"], conflicts: [] };
      const attentionClass = classifyFindingAttention(finding, policy);
      const slot = policy.attentionBudget.sequence.indexOf(attentionClass);
      assert(slot >= 0, "Maintenance must have a scheduled slot");
      for (let index = 0; index < slot; index += 1) {
        recordRun(report(f, { mode, runId: `slot-${index}`, runOrigin: "scheduled_autonomous",
          trigger: "scheduled_cycle", attentionClass: expectedScheduledAttentionClass(index, policy) }),
        { root: f.memoryRoot, policy });
      }
      const value = report(f, { mode, runId: `maintenance-${mode}`, runOrigin: "scheduled_autonomous",
        trigger: "scheduled_cycle", attentionClass, status: mode === "shadow" ? "shadow_finding" : "blocked",
        selectedFinding: finding, candidateId: "protected-proposal", phase: "discovery",
        policyBlockers: mode === "active" ? [`Protected path: ${path}; autonomous implementation denied`] : [],
        reason: `Owner must explicitly request bounded maintenance of ${path}; no autonomous writer` });
      check("protected-finding-and-report", JSON.stringify(value), () => {
        assert.equal(attentionClass, "agent_maintenance");
        validateScoutOutput({ schemaVersion: 4, status: "proposal", attentionClass,
          baseSha: f.baseSha, runtimeFingerprint: runtime.fingerprint, activeClaims: [],
          findings: [finding], recommendedId: finding.id, reason: "Protected finding for owner triage" }, policy);
        validateRunReport(value, policy);
        assert.throws(() => validateRunReport({ ...value, attentionClass: "product" }, policy), /belongs to/);
        assert.equal(validateDiff({ changedPaths: [path], allowedPaths: [path], addedLines: 1, deletedLines: 0 }, policy).ok, false);
      });
      check("scheduled-slot-persistence", JSON.stringify(value), () => {
        assert.equal(recordRun(value, { root: f.memoryRoot, policy }).duplicate, false);
        assert.equal(recordRun(value, { root: f.memoryRoot, policy }).duplicate, true);
        const state = readMemoryState({ root: f.memoryRoot });
        assert.equal(state.attention.scheduledCycles, slot + 1);
        assert.equal(state.attention.scheduledByClass.agent_maintenance, 1);
        assert.equal(state.runOrigins.scheduled_autonomous.lifetimeRuns, slot + 1);
        assert.deepEqual(state.candidates[0].phases.map((item) => item.phase), ["discovery"]);
        assert.throws(() => recordRun({ ...value, runId: "wrong-next-slot", candidateId: "wrong-slot-proposal" }, { root: f.memoryRoot, policy }), /scheduled attention slot/);
        assert.equal(readMemoryState({ root: f.memoryRoot }).runs.lifetimeCount, slot + 1);
      });
      check("no-implementation-artifacts", f.baseSha, () => {
        assert.equal(readLease(f.repo, f.stateHome), null);
        assert.deepEqual(readOperationalClaims(f.repo, f.stateHome), []);
        assert.equal(git(f.repo, ["status", "--porcelain"]), "");
        assert.equal(git(f.repo, ["worktree", "list", "--porcelain"]).split("\n").filter((line) => line.startsWith("worktree ")).length, 1);
      });
      return { outcome: "expected_block", usefulChangeVerified: false };
    });
  }
  runCase("immutable-claim-block", (f, check) => {
    const path = register(f, "fixture-drift", ["fixture.txt"]);
    writeFileSync(join(f.repo, path), `${readFileSync(join(f.repo, path), "utf8")}changed\n`);
    check("marker-drift-denial", f.baseSha, () => assert.throws(() => transition(f, "fixture-drift", "en_curso"), /drift|changed/));
    return { outcome: "expected_block", usefulChangeVerified: false };
  });
  runCase("no-op-persistence", (f, check) => {
    const value = report(f);
    check("idempotent-report", JSON.stringify(value), () => {
      assert.equal(recordRun(value, { root: f.memoryRoot, policy }).duplicate, false);
      assert.equal(recordRun(value, { root: f.memoryRoot, policy }).duplicate, true);
      assert.equal(readMemoryState({ root: f.memoryRoot }).runs.lifetimeCount, 1);
      assert.equal(git(f.repo, ["status", "--porcelain"]), "");
    });
    return { outcome: "no_op", usefulChangeVerified: false };
  });
  runCase("conflicting-report-block", (f, check) => {
    const value = report(f);
    recordRun(value, { root: f.memoryRoot, policy });
    check("report-overwrite-denial", JSON.stringify(value), () => {
      assert.throws(() => recordRun({ ...value, reason: "Conflicting content" }, { root: f.memoryRoot, policy }), /already|conflict|different/);
      assert.equal(readMemoryState({ root: f.memoryRoot }).runs.lifetimeCount, 1);
    });
    return { outcome: "expected_block", usefulChangeVerified: false };
  });

  const result = { schemaVersion: 1, kind: "deterministic_integration", root,
    sourceRuntimeFingerprint: runtime.fingerprint,
    limitations: ["Role outputs and activation are scripted fixtures", "Runtime is measured on source modules, injected through test API", "No production cycle, network, website build or model token measurement"],
    observations, summary: summarizeObservations(observations), durationMs: elapsed(started) };
  writeFileSync(join(root, "report.json"), `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  return result;
}

export function runIntegrationSuite() {
  const root = mkdtempSync(join(tmpdir(), "obraxen-skill-evaluation-"));
  try {
    return runIntegrationAtRoot(root);
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runIntegrationSuite();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.summary.failed === 0 ? 0 : 1;
}
