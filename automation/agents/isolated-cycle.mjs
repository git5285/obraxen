import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runBoundRole } from "./isolated-transport.mjs";
import { assertWorkOwnership, cleanGitEnvironment, digest, validateWorkManifest } from "./isolated-work.mjs";
import { acquireLease, releaseLease } from "./lease.mjs";
import { readOperationalClaims, registerOperationalClaim, transitionOperationalClaim } from "./operations.mjs";
import { buildPreflight } from "./preflight.mjs";
import { inspectRuntime } from "./runtime.mjs";
import { validateDiff } from "./diff-policy.mjs";
import { loadPolicy } from "./policy.mjs";
import { recordRun } from "./memory.mjs";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const git = (root, args) => execFileSync("git", ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=/dev/null", ...args], {
  cwd: root, env: cleanGitEnvironment(), encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024,
  stdio: ["ignore", "pipe", "pipe"],
}).trim();
const save = (path, content) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content, { mode: 0o600 }); };

// Local, disposable repository only. No user checkout, production state, remote
// access, dependency installation, scheduling or trust mutation.
export function prepareFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "obraxen-isolated-cycle-")));
  const controlRoot = join(root, "control");
  const worktree = join(root, "candidate");
  const stateHome = join(root, "state");
  mkdirSync(stateHome);
  save(join(controlRoot, "fixture.txt"), "Status: pending\n");
  save(join(controlRoot, "activation.json"), JSON.stringify({ publicationAuthorized: false, publishSwitch: false }));
  save(join(controlRoot, "automation/agents/lease.mjs"), "export const COORDINATION_PROTOCOL_VERSION = 3;\n");
  git(controlRoot, ["init", "-q"]);
  git(controlRoot, ["remote", "add", "origin", `https://example.invalid/isolated-cycle/${randomUUID()}.git`]);
  git(controlRoot, ["add", "--", "fixture.txt", "activation.json", "automation/agents/lease.mjs"]);
  git(controlRoot, ["-c", "user.name=Obraxen fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Disposable fixture baseline"]);
  const baseSha = git(controlRoot, ["rev-parse", "HEAD"]);
  git(controlRoot, ["worktree", "add", "--detach", worktree, baseSha]);
  const hookPath = join(sourceRoot, "automation/agents/isolated-work.mjs");
  const hookCommand = `'${process.execPath}' '${hookPath}'`;
  save(join(worktree, ".codex/config.toml"), "# Fixture project configuration anchor; hook definition lives in control.\n");
  save(join(controlRoot, ".codex/config.toml"), "[features]\nhooks = true\n");
  // Codex discovers worktree hooks from the common checkout, not candidate/.codex.
  // Keep the definition outside the builder's writable root as well as its handler.
  save(join(controlRoot, ".codex/hooks.json"), JSON.stringify({ hooks: { PreToolUse: [{ matcher: ".*", hooks: [{
    type: "command", command: hookCommand, timeout: 5,
  }] }] } }, null, 2));
  // Ignore only the fixture's generated, protected host configuration.
  save(join(controlRoot, ".git/info/exclude"), ".codex/\n.coordination/\n");
  const runtime = inspectRuntime(sourceRoot);
  assert(runtime.ok && runtime.fingerprint, "verified_controller_runtime_required");
  const readScript = join(root, "read.mjs");
  save(readScript, `import {readFileSync} from 'node:fs';\nimport {execFileSync} from 'node:child_process';\nimport {inspectRuntime} from ${JSON.stringify(join(sourceRoot, "automation/agents/runtime.mjs"))};\nconst runtime=inspectRuntime(${JSON.stringify(sourceRoot)});\nif(!runtime.ok) throw new Error('runtime_invalid');\nconsole.log(JSON.stringify({scope:'Disposable fixture using measured controller runtime, not installed website dependencies',runtime,baseSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),content:readFileSync('fixture.txt','utf8'),activation:JSON.parse(readFileSync('activation.json','utf8')),diff:execFileSync('git',['diff','--no-ext-diff','--no-textconv','HEAD','--','fixture.txt'],{encoding:'utf8'})}));\n`);
  const checkScript = join(root, "check.mjs");
  save(checkScript, `import assert from 'node:assert/strict';\nimport {readFileSync} from 'node:fs';\nimport {execFileSync} from 'node:child_process';\nassert.equal(readFileSync('fixture.txt','utf8'),'Status: verified\\n');\nassert.deepEqual(JSON.parse(readFileSync('activation.json','utf8')),{publicationAuthorized:false,publishSwitch:false});\nexecFileSync('git',['diff','--no-ext-diff','--check']);\nconsole.log('fixture behavior and diff check passed; not website Quality gate');\n`);
  const command = (role, script, kind) => ({ role, kind, executable: process.execPath, script,
    command: `'${process.execPath}' '${script}'`, digest: digest(readFileSync(script)) });
  const threadId = `fixture-${randomUUID()}`;
  const claimPath = `.coordination/claims/${threadId}.md`;
  const claimText = `# Isolated fixture\n- thread_id: ${threadId}\n- creado: ${new Date().toISOString()}\n- estado: reservado\n- objetivo: verify fixture status\n- archivos:\n  - fixture.txt\n- cambios_ajenos_detectados: no\n- consumidores: fixture only\n- siguiente_paso: isolated implementation\n`;
  const manifest = { schemaVersion: 1, scope: "fixture", phase: "discovery", runId: `run-${randomUUID()}`,
    candidateId: `candidate-${randomUUID()}`, threadId, baseSha, attentionClass: "reliability",
    controlRoot, worktree, stateHome, hookPath, hookDigest: digest(readFileSync(hookPath)),
    runtimeFingerprint: runtime.fingerprint, claimPath, claimDigest: digest(claimText), leaseToken: randomUUID(),
    runtimeRoot: sourceRoot,
    integrity: Object.fromEntries([...readdirSync(join(sourceRoot, "automation/agents")).filter((name) => name.endsWith(".mjs")), "policy.json"]
      .map((name) => [`automation/agents/${name}`, digest(readFileSync(join(sourceRoot, "automation/agents", name)))])),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), allowedPaths: ["fixture.txt"],
    readPaths: ["fixture.txt", "activation.json"], activationDigest: digest(readFileSync(join(worktree, "activation.json"))),
    commands: [command("scout", readScript, "read"), command("builder", readScript, "read"), command("builder", checkScript, "check"),
      command("auditor", readScript, "read"), command("auditor", checkScript, "check")] };
  validateWorkManifest(manifest);
  const prepared = { root, manifest, claimText, hookCommand, runtime,
    runtimeScope: "Measured source runtime; fixture has no installed website dependency tree" };
  save(join(root, "fixture.json"), JSON.stringify(prepared, null, 2));
  return prepared;
}

// Fixture authority remains pinned; callers cannot substitute a repository binding.
export async function runFixtureRole(prepared, role, prompt, options = {}) {
  assert(prepared.manifest.scope === "fixture", "fixture_only");
  return runBoundRole(prepared, role, prompt, { mode: "fixture",
    instructions: "Fixture adapter, only for this explicit disposable test: production document reads and production-policy prerequisites are replaced by the fixture authority evidence supplied below. Do not look for production AGENTS.md or policy files in this minimal fixture. The controller owns coordination and has run preflight; the guard independently verifies the exact active claim, lease, base, expiry, runtime and paths on every tool call. The actual lease token stays private; its withheld representation is intentional, not a missing prerequisite. Use only the exact read/check script commands below; they replace project runtime commands and independently inspect the measured controller runtime. Do not run preflight yourself. Preserve all path, tool, network, deletion and publication restrictions. Return the original role JSON contract without Markdown." }, options);
}

export async function runFixture(prepared, roleRunner = runFixtureRole) {
  const { manifest: m, root, claimText, runtime } = prepared;
  validateWorkManifest(m);
  assert(root === dirname(m.worktree) && m.phase === "discovery", "fresh_fixture_required");
  assert(!existsSync(join(root, "memory")), "fresh_fixture_memory_required");
  const measuredRuntime = inspectRuntime(sourceRoot);
  assert(measuredRuntime.ok && measuredRuntime.fingerprint === runtime.fingerprint
    && runtime.fingerprint === m.runtimeFingerprint, "runtime_changed");
  const policy = loadPolicy();
  prepared.hostTerminationConfirmed = true;
  const initial = buildPreflight(m.controlRoot, policy, { stateHome: m.stateHome, runtime });
  assert(initial.eligibility.writer, "fixture_initial_preflight_blocked");
  let acquired = false, registered = false;
  const transition = (state, evidence = []) => transitionOperationalClaim({ repo: m.controlRoot, stateHome: m.stateHome,
    threadId: m.threadId, eventId: `${m.threadId}-${state}`, occurredAt: new Date().toISOString(), state,
    reason: "explicit_disposable_fixture_cycle", evidence });
  const publicManifest = () => ({ ...m, leaseToken: "withheld-controller-only",
    parentRunId: null, trigger: "human_request", selectedFinding,
    acceptanceChecks: m.commands.filter((entry) => entry.kind === "check"),
    activationBaseline: { publicationAuthorized: false, publishSwitch: false } });
  const context = () => {
    assertWorkOwnership(m);
    const snapshot = buildPreflight(m.controlRoot, policy, { stateHome: m.stateHome, runtime: inspectRuntime(sourceRoot) });
    assert(snapshot.baseSha === m.baseSha && snapshot.runtime.fingerprint === m.runtimeFingerprint, "fixture_snapshot_changed");
    const expectedBlockers = registered && acquired ? ["writer_lease_exists", "active_writer_claim_limit"] : [];
    assert(snapshot.runtime.ok && snapshot.blockers.every((blocker) => expectedBlockers.includes(blocker))
      && snapshot.activeClaims.length === (registered ? 1 : 0)
      && snapshot.activeClaims.every((claim) => claim.threadId === m.threadId
        && JSON.stringify([...claim.files].sort()) === JSON.stringify([...m.allowedPaths].sort())),
    "fixture_snapshot_coordination_blocked");
    return JSON.stringify({ manifest: publicManifest(), preflight: {
    observedAt: new Date().toISOString(), phase: m.phase,
    candidateDiffDigest: digest(git(m.worktree, ["diff", "--no-ext-diff", "--no-textconv", "HEAD"])),
    baseSha: snapshot.baseSha, runtimeFingerprint: m.runtimeFingerprint,
    activeClaims: snapshot.activeClaims.map(({ threadId, worktree, files }) => ({ threadId, worktree, files })),
  }, fixtureAuthority: { origin: "explicit_human_test", scope: "disposable_fixture_only",
    mode: "active", allowLocalDiff: true, registeredClaim: registered ? m.claimPath : null,
    leaseAcquired: acquired, allowedPaths: m.allowedPaths, externalActionsAllowed: false,
    sourceProductionPolicyUnchanged: true }, commands: m.commands, runtimeScope: prepared.runtimeScope });
  };
  let outcome, selectedFinding = null;
  try {
    const scout = await roleRunner(prepared, "scout", `Read the fixture with your exact read script. Propose only changing fixture.txt from Status: pending to Status: verified. This is an explicitly requested test, with reliability attention. ${context()}`);
    assert(scout.result.status === "proposal" && scout.result.baseSha === m.baseSha
      && scout.result.runtimeFingerprint === m.runtimeFingerprint && scout.result.attentionClass === m.attentionClass, "scout_identity_or_proposal");
    const finding = scout.result.findings.find((item) => item.id === scout.result.recommendedId);
    selectedFinding = finding;
    assert(JSON.stringify(finding.candidatePaths) === JSON.stringify(m.allowedPaths), "scout_scope");
    save(join(m.controlRoot, m.claimPath), claimText);
    registerOperationalClaim({ repo: m.controlRoot, stateHome: m.stateHome, claimPath: m.claimPath,
      eventId: `${m.threadId}-register`, occurredAt: new Date().toISOString() });
    registered = true; transition("en_curso");
    assert(acquireLease(m.controlRoot, { runId: m.runId, token: m.leaseToken, host: hostname(), pid: process.pid,
      worktree: m.worktree, baseSha: m.baseSha, claimPath: m.claimPath, paths: m.allowedPaths }, new Date(), m.stateHome).acquired, "lease_busy");
    acquired = true; m.phase = "implementation";
    const builder = await roleRunner(prepared, "builder", `Implement the selected finding using apply_patch only, then execute your exact check script. ${context()} Scout: ${JSON.stringify(scout.result)}`);
    const measured = git(m.worktree, ["diff", "--no-ext-diff", "--numstat", "HEAD"]).split("\n").filter(Boolean).map((line) => line.split("\t"));
    const changedPaths = measured.map((row) => row[2]);
    const unexpected = git(m.worktree, ["ls-files", "--others", "--exclude-standard"]);
    assert(!unexpected, "unexpected_untracked_files");
    const result = builder.result;
    for (const key of ["runId", "candidateId", "baseSha", "runtimeFingerprint", "attentionClass"]) assert(result[key] === m[key], "builder_identity");
    assert(JSON.stringify([...result.changedPaths].sort()) === JSON.stringify([...changedPaths].sort()), "builder_diff_mismatch");
    assert(validateDiff({ changedPaths, allowedPaths: m.allowedPaths,
      addedLines: measured.reduce((sum, row) => sum + Number(row[0]), 0),
      deletedLines: measured.reduce((sum, row) => sum + Number(row[1]), 0) }, policy).ok, "diff_policy_failed");
    assert(result.status === "implemented", "builder_blocked");
    assertWorkOwnership(m);
    const check = m.commands.find((entry) => entry.kind === "check");
    execFileSync(check.executable, [check.script], { cwd: m.worktree, env: cleanGitEnvironment(), timeout: 30000, stdio: "pipe" });
    assert(digest(readFileSync(join(m.worktree, "activation.json"))) === m.activationDigest, "activation_changed");
    const reviewedDigest = digest(git(m.worktree, ["diff", "--no-ext-diff", "--no-textconv", "HEAD"]));
    m.phase = "review";
    const auditor = await roleRunner(prepared, "auditor", `Independently read the fixture and diff, and run your exact check script. Review this same candidate. ${context()} Scout: ${JSON.stringify(scout.result)} Builder: ${JSON.stringify(result)}`);
    for (const key of ["runId", "candidateId", "baseSha", "runtimeFingerprint", "attentionClass"]) assert(auditor.result[key] === m[key], "auditor_identity");
    assert(auditor.result.verdict === "pass", "auditor_veto_or_needs_human");
    assert(digest(git(m.worktree, ["diff", "--no-ext-diff", "--no-textconv", "HEAD"])) === reviewedDigest, "diff_changed_during_review");
    transition("esperando_revision");
    outcome = { status: "fixture_passed", changedPaths, reviewedDigest, modelRoles: [scout.threadId, builder.threadId, auditor.threadId],
      activationUnchanged: true, autonomyActivated: false, websiteQualityGate: "not_run" };
    return outcome;
  } catch (error) {
    outcome = { status: "blocked", reason: error.code === "ERR_ASSERTION" ? error.message : "fixture_execution_failed",
      phase: m.phase, autonomyActivated: false };
    throw error;
  } finally {
    // Every role host is already stopped by roleRunner before lease release.
    outcome ??= { status: "blocked", reason: "missing_outcome", autonomyActivated: false };
    const closureErrors = [];
    try {
      outcome.retainedPaths = [...new Set([...git(m.worktree, ["diff", "--name-only", "HEAD"]).split("\n"),
        ...git(m.worktree, ["ls-files", "--others", "--exclude-standard"]).split("\n")].filter(Boolean))];
      outcome.retainedDiff = outcome.retainedPaths.length > 0;
      outcome.diffDigest = digest(git(m.worktree, ["diff", "--no-ext-diff", "--no-textconv", "HEAD"]));
    } catch { closureErrors.push("diff_measurement_failed"); }
    const safeSave = (path, content, failureCode) => {
      try { save(path, content); } catch { closureErrors.push(failureCode); }
    };
    safeSave(join(root, "outcome.json"), JSON.stringify({ ...outcome, status: "blocked",
      reason: "fixture_closure_pending" }, null, 2), "outcome_write_failed");
    if (acquired && prepared.hostTerminationConfirmed) {
      try { releaseLease(m.controlRoot, m.leaseToken, m.stateHome); }
      catch { closureErrors.push("lease_release_failed"); }
    }
    if (!prepared.hostTerminationConfirmed) closureErrors.push("host_termination_unconfirmed");
    const path = `.coordination/handoffs/${m.threadId}.md`;
    const handoff = `# Disposable fixture closure\n${JSON.stringify({ ...outcome,
      executionStatus: outcome.status, status: "closure_pending", closureErrors })}\nCandidate retained at ${m.worktree}. Final closure requires the published memory report and operational claim state. No production action or autonomous activation.\n`;
    if (registered) safeSave(join(m.controlRoot, path), handoff, "handoff_write_failed");

    // recordRun is immutable and can fail after a partial write. Prepare a
    // fresh private store; never expose a success report before claim closure.
    // Partial stores remain diagnostic artifacts, not published run memory.
    const stageReport = (successful) => {
      const staging = mkdtempSync(join(root, "memory-pending-"));
      recordRun({ schemaVersion: 6, status: successful ? "local_diff" : "blocked",
        mode: "active", runOrigin: "human_directed", attentionClass: "reliability", runId: m.runId,
        baseSha: m.baseSha, runtimeFingerprint: m.runtimeFingerprint,
        candidateId: selectedFinding ? m.candidateId : null, parentRunId: null, trigger: "human_request",
        phase: selectedFinding ? "closure" : null, finalCommit: null, pullRequest: null, reviewDecision: null,
        selectedFinding, activeConflicts: [], policyBlockers: successful ? [] : [outcome.reason ?? "fixture_closure_incomplete", ...closureErrors],
        changedPaths: outcome.retainedPaths ?? [], checks: successful
          ? [{ command: "controller fixture check", status: "passed", summary: "Executed, not website Quality gate" }] : [],
        auditorVerdict: successful ? "pass" : null,
        externalAction: outcome.retainedDiff ? "local_diff" : "none", learned_rules: [],
        usage: { inputTokens: null, outputTokens: null, totalTokens: null, costUsd: null, durationMs: null },
        traceId: null, reason: "Disposable fixture only; role evidence is stored separately. Not production or autonomous effectiveness.",
      }, { root: staging, policy });
      return staging;
    };
    let staging;
    const stagedSuccess = outcome.status === "fixture_passed" && closureErrors.length === 0;
    try { staging = stageReport(stagedSuccess); }
    catch { closureErrors.push("fixture_report_failed"); }
    if (registered) {
      try {
        // Keep the existing valid state and ownership if any closure step failed.
        if (closureErrors.length === 0) transition("liberado", [{ kind: "handoff", path, contentDigest: digest(handoff) }]);
      } catch { closureErrors.push("claim_closure_failed"); }
      // An append may persist before its lock cleanup fails. Do not infer
      // retained ownership from an exception or manufacture a reopening.
      try {
        outcome.claimState = readOperationalClaims(m.controlRoot, m.stateHome)
          .find((claim) => claim.threadId === m.threadId)?.state ?? "unknown";
        if (closureErrors.length === 0 && outcome.claimState !== "liberado") closureErrors.push("claim_closure_unconfirmed");
      } catch { outcome.claimState = "unknown"; closureErrors.push("claim_state_unreadable"); }
    }
    if (closureErrors.length && stagedSuccess && staging) {
      // Discard the unpublished success logically, never rewrite its runId.
      staging = undefined;
      try { staging = stageReport(false); }
      catch { closureErrors.push("blocked_report_failed"); }
    }
    const finalOutcome = { ...outcome, ...(closureErrors.length ? { status: "blocked", closureErrors } : {}),
      memoryPath: join(root, "memory"), completionRequiresPublishedMemory: true };
    safeSave(join(root, "outcome.json"), JSON.stringify(finalOutcome, null, 2), "final_outcome_write_failed");
    // Same-filesystem publication, only into this fresh fixture's absent store.
    // Publication can fail after claim release: report that partial state; no
    // automatic ownership recovery and no success in published memory.
    if (staging && !closureErrors.includes("final_outcome_write_failed")) {
      try {
        assert(!existsSync(join(root, "memory")), "fixture_memory_already_exists");
        renameSync(staging, join(root, "memory"));
      } catch { closureErrors.push("fixture_report_publication_failed"); }
    }
    if (closureErrors.length) {
      safeSave(join(root, "outcome.json"), JSON.stringify({ ...outcome, status: "blocked", closureErrors }, null, 2), "final_outcome_write_failed");
      throw new Error("fixture_closure_incomplete");
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, path, ...extra] = process.argv.slice(2);
  assert(extra.length === 0, "unexpected_arguments");
  if (command === "prepare" && !path) {
    const prepared = prepareFixture();
    console.log(JSON.stringify({ fixtureFile: join(prepared.root, "fixture.json"), candidate: prepared.manifest.worktree,
      hookCommand: prepared.hookCommand, next: "Run only after human review of this exact fixture hook", autonomyActivated: false }));
  } else if (command === "inspect" && path) {
    const prepared = JSON.parse(readFileSync(path, "utf8"));
    Promise.all(["scout", "builder", "auditor"].map((role) => runFixtureRole({ ...prepared }, role, "", { inspectOnly: true, timeoutMs: 30000 })))
      .then((result) => console.log(JSON.stringify(result))).catch(() => {
      console.error("fixture_host_inspection_failed; no model turn started"); process.exitCode = 2;
    });
  } else if (command === "run" && path) {
    runFixture(JSON.parse(readFileSync(path, "utf8"))).then((result) => console.log(JSON.stringify(result))).catch((error) => {
      console.error(error.code === "ERR_ASSERTION" ? error.message : "fixture_execution_failed"); process.exitCode = 2;
    });
  } else throw new Error("usage: isolated-cycle.mjs prepare | inspect <fixture.json> | run <fixture.json>");
}
