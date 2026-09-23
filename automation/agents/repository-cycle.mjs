import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { digest, cleanGitEnvironment } from "./isolated-work.mjs";
import { runBoundRole } from "./isolated-transport.mjs";
import { REPOSITORY_EXECUTION_ENABLED, assertRepositoryOwnership, validateRepositoryManifest, repositoryPath } from "./repository-work.mjs";
import { inspectRuntime } from "./runtime.mjs";
import { loadPolicy } from "./policy.mjs";
import { validateDiff } from "./diff-policy.mjs";
import { assertActivationUnchanged, parseActivationCommand } from "./activation-policy.mjs";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const REPOSITORY_PATCH_INSTRUCTIONS = "For apply_patch, every *** Update File: header must use the exact repository-relative spelling from manifest.allowedPaths, never an absolute path. Add File, Delete File and Move to are unsupported. A rejected patch is a blocker, not permission to use another write tool.";
const git = (root, args) => execFileSync("git", ["-c", "core.fsmonitor=false", ...args], {
  cwd: root,
  env: cleanGitEnvironment(),
  encoding: "utf8",
  timeout: 10000,
  stdio: ["ignore", "pipe", "pipe"],
}).trim();
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2), { mode: 0o600 });

export function repositoryAdapterStatus() {
  return {
    schemaVersion: 1,
    enabled: REPOSITORY_EXECUTION_ENABLED,
    mode: "manual_prepared_candidate",
    installsHook: false,
    changesTrust: false,
    createsWorktree: false,
    acquiresLease: false,
    schedulesWork: false,
    externalActions: false,
    productionValidated: false,
  };
}

export function repositoryDeadline(now, seconds) {
  assert(Number.isFinite(now) && Number.isFinite(seconds) && seconds > 0, "repository_deadline_input");
  return { createdAt: new Date(now).toISOString(), expiresAt: new Date(now + seconds * 1000).toISOString() };
}

// Planning only: no trust, worktree, claim, lease, execution or state writes.
// The controller must supply reviewed immutable scripts and existing directories.
export function prepareRepositoryCandidate(input) {
  const runtime = inspectRuntime(input.worktree), controller = inspectRuntime(sourceRoot);
  assert(runtime.ok && controller.ok, "repository_runtime_not_prepared");
  const { createdAt, expiresAt } = repositoryDeadline(Date.now(), loadPolicy().limits.maxRunSeconds);
  const m = {
    ...input,
    schemaVersion: 1,
    scope: "repository",
    phase: "implementation",
    trigger: "human_request",
    parentRunId: null,
    createdAt,
    expiresAt,
    runtimeFingerprint: runtime.fingerprint,
    controllerRuntimeFingerprint: controller.fingerprint,
    hookPath: join(sourceRoot, "automation/agents/repository-work.mjs"),
  };
  for (const key of ["controlRoot", "worktree", "stateHome", "evidenceRoot"])
    m[key] = realpathSync(m[key]);
  m.hookDigest = digest(readFileSync(m.hookPath));
  m.hookDispatcherPath = join(sourceRoot, ".codex/hooks/pre-tool-policy.mjs");
  m.hookDispatcherDigest = digest(readFileSync(m.hookDispatcherPath));
  m.hookConfigPath = join(sourceRoot, ".codex/hooks.json");
  m.hookConfigDigest = digest(readFileSync(m.hookConfigPath));
  m.hookCommand = "node .codex/hooks/pre-tool-policy.mjs";
  m.controllerIntegrity = Object.fromEntries(readdirSync(join(sourceRoot, "automation/agents"))
    .filter(name => name.endsWith(".mjs") || name === "policy.json")
    .map(name => [name, digest(readFileSync(join(sourceRoot, "automation/agents", name)))]));
  m.candidateIntegrity = Object.fromEntries(input.integrityPaths.map(path => [path, digest(readFileSync(repositoryPath(m.worktree, path)))]));
  delete m.integrityPaths;
  m.commands = input.commands.map(command => ({
    ...command,
    executable: process.execPath,
    script: realpathSync(command.script),
    command: `'${process.execPath}' '${realpathSync(command.script)}'`,
    digest: digest(readFileSync(command.script)),
  }));
  validateRepositoryManifest(m);
  return {
    root: m.evidenceRoot,
    manifest: m,
    hookCommand: m.hookCommand,
    requiredHookSource: join(m.controlRoot, ".codex/hooks.json"),
    readyForExecution: false,
  };
}

function roleContext(m, snapshot) {
  const { leaseToken: _private, ...publicManifest } = m;
  void _private;
  return JSON.stringify({
    manifest: { ...publicManifest, leaseToken: "withheld-controller-only" },
    preflight: {
      observedAt: new Date().toISOString(),
      baseSha: snapshot.baseSha,
      runtimeFingerprint: snapshot.runtime.fingerprint,
      activeClaims: snapshot.activeClaims.map(({ threadId, worktree, files }) => ({
        threadId,
        worktree,
        files,
      })),
      blockers: snapshot.blockers,
    },
    controllerAttestation: {
      claimAndLeaseVerified: m.phase !== "discovery",
      phase: m.phase,
      diffDigest: digest(git(m.worktree, ["diff", "--no-ext-diff", "--no-textconv", "HEAD"])),
    },
  });
}

export async function runRepositoryRole(prepared, role, task, options = {}) {
  assert(REPOSITORY_EXECUTION_ENABLED, "repository_execution_disabled");
  assert(prepared.manifest.scope === "repository", "repository_manifest_required");
  const m = prepared.manifest;
  assert(["builder", "auditor"].includes(role) && ({ builder: "implementation", auditor: "review" })[role] === m.phase, "repository_role_phase");
  assert(prepared.root === m.evidenceRoot && prepared.hookCommand === m.hookCommand, "repository_prepared_binding");
  const snapshot = assertRepositoryOwnership(m);
  return runBoundRole(prepared, role, `${task}\n${roleContext(m, snapshot)}`, {
    mode: "repository",
    instructions: `Repository adapter for one human-directed candidate. The controller supplies the current preflight and owns all coordination writes. Do not run preflight yourself. The actual lease token is intentionally withheld; the bound guard validates it independently. Use only the supplied immutable read/check commands; they replace direct shell exploration and runtime commands, but must provide the real repository instructions and measured candidate runtime. Missing documents or evidence still require blocked. Preserve every production policy, protected path, acceptance check, visual requirement and publication boundary. ${REPOSITORY_PATCH_INSTRUCTIONS} Return only the original role JSON contract.`,
  }, options);
}

export function measureRepositoryCandidate(m) {
  const rows = git(m.worktree, ["diff", "--no-ext-diff", "--no-textconv", "--numstat", "HEAD"]).split("\n").filter(Boolean).map(line => line.split("\t"));
  assert(!git(m.worktree, ["ls-files", "--others", "--exclude-standard"]), "repository_untracked_candidate_requires_review");
  assert(rows.every(row => row.length === 3 && /^\d+$/.test(row[0]) && /^\d+$/.test(row[1])), "repository_binary_or_ambiguous_diff");
  const changedPaths = rows.map(row => row[2]);
  assert(validateDiff({
    changedPaths,
    allowedPaths: m.allowedPaths,
    addedLines: rows.reduce((n, r) => n + Number(r[0]), 0),
    deletedLines: rows.reduce((n, r) => n + Number(r[1]), 0),
  }, loadPolicy()).ok, "repository_diff_rejected");
  const deletions = git(m.worktree, ["diff", "--name-only", "--diff-filter=D", "HEAD"]);
  assert(!deletions, "repository_deletion_rejected");
  return { changedPaths, digest: digest(git(m.worktree, ["diff", "--no-ext-diff", "--no-textconv", "HEAD"])) };
}

export function readRepositoryActivation(m) {
  // Fixed local read-only check; also callable without enabling model execution.
  const result = spawnSync(process.execPath, ["automation/agents/runtime.mjs", "exec", "--", process.execPath,
    "--experimental-strip-types", "scripts/check-activation.mjs", "--json"], {
    cwd: m.worktree,
    env: cleanGitEnvironment(),
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 1024 * 1024,
  });
  return parseActivationCommand(result);
}

// Consumes a candidate whose exact claim and exclusive lease are ALREADY held by
// the controller. It never creates/reclaims/releases ownership, commits or deploys.
// The controller must persist the result and close ownership after process termination.
export async function runRepositoryCandidate(prepared) {
  assert(REPOSITORY_EXECUTION_ENABLED, "repository_execution_disabled");
  const m = prepared.manifest;
  assert(m.phase === "implementation", "repository_prepared_writer_required");
  assertRepositoryOwnership(m);
  const before = readRepositoryActivation(m);
  assertActivationUnchanged(m.activationBaseline, before);
  const baseline = measureRepositoryCandidate(m);
  assert(baseline.changedPaths.length === 0, "repository_dirty_candidate");
  let outcome;
  try {
    const builder = await runRepositoryRole(prepared, "builder", "Implement only the selected finding, read required evidence, and execute the assigned local checks.");
    const measured = measureRepositoryCandidate(m);
    for (const key of ["runId", "candidateId", "baseSha", "runtimeFingerprint", "attentionClass"])
      assert(builder.result[key] === m[key], "repository_builder_identity");
    assert(JSON.stringify([...builder.result.changedPaths].sort()) === JSON.stringify([...measured.changedPaths].sort()), "repository_builder_diff_mismatch");
    assert(builder.result.status === "implemented", "repository_builder_blocked");
    assertRepositoryOwnership(m);
    assertActivationUnchanged(before, readRepositoryActivation(m));
    m.phase = "review";
    const auditor = await runRepositoryRole(prepared, "auditor", `Independently inspect the same candidate and its assigned local checks. Builder evidence: ${JSON.stringify(builder.result)}`);
    for (const key of ["runId", "candidateId", "baseSha", "runtimeFingerprint", "attentionClass"])
      assert(auditor.result[key] === m[key], "repository_auditor_identity");
    assert(auditor.result.verdict === "pass", "repository_auditor_veto_or_needs_human");
    assert(measureRepositoryCandidate(m).digest === measured.digest, "repository_diff_changed_after_review");
    assertActivationUnchanged(before, readRepositoryActivation(m));
    outcome = {
      status: "local_candidate_reviewed",
      runId: m.runId,
      ...measured,
      roles: [builder.threadId, auditor.threadId],
      fullQualityGate: "pending_controller_evidence",
      remoteQualityGate: "not_run",
      autonomyActivated: false,
      externalAction: "none",
    };
    return outcome;
  } catch (error) {
    outcome = {
      status: "blocked",
      runId: m.runId,
      reason: error.code === "ERR_ASSERTION" ? error.message : "repository_candidate_failed",
      autonomyActivated: false,
    };
    throw error;
  } finally {
    // Evidence is not a RunReport and must not be passed off as a complete cycle.
    save(join(m.evidenceRoot, "repository-outcome.json"), {
      ...outcome,
      hostTerminationConfirmed: prepared.hostTerminationConfirmed === true,
      ownershipDisposition: "retained_for_controller_closure",
    });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...extra] = process.argv.slice(2);
  if (command === "status" && extra.length === 0)
    console.log(JSON.stringify(repositoryAdapterStatus()));
  else {
    console.error("repository_cli_status_only; use the controller API with a verified manifest. No production cycle, trust or settings changed.");
    process.exitCode = 2;
  }
}
