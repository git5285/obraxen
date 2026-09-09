import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { digest, cleanGitEnvironment, evaluateWorkTool } from "./isolated-work.mjs";
import { buildPreflight } from "./preflight.mjs";
import { inspectRuntime } from "./runtime.mjs";
import { loadPolicy } from "./policy.mjs";
import { validateDiff } from "./diff-policy.mjs";
import { validateActivationReport } from "./activation-policy.mjs";
import { validateScoutOutput } from "./contracts.mjs";

// Deliberate source-level release gate. No environment/CLI/manifest override.
// Enabling requires a separate reviewed owner change, not this implementation.
export const REPOSITORY_EXECUTION_ENABLED = false;
export const REPOSITORY_ORIGIN = "https://github.com/git5285/obraxen.git";
const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const roles = new Set(["builder", "auditor"]);
const sha = /^[a-f0-9]{64}$/;
const git = (root, args) => execFileSync("git", ["-c", "core.fsmonitor=false", ...args], {
  cwd: root, env: cleanGitEnvironment(), encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "pipe"],
}).trim();
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const outside = (root, path) => { const p = relative(root, path); return p === ".." || p.startsWith("../"); };

export function repositoryPath(root, path, missing = false) {
  assert(typeof path === "string" && /^[A-Za-z0-9_.-][A-Za-z0-9_.\/[\]-]*$/.test(path)
    && path.split("/").every((p) => p && p !== "." && p !== ".."), "unsafe_repository_path");
  const canonical = realpathSync(root);
  let current = canonical;
  for (const part of path.split("/")) {
    current = resolve(current, part);
    try { assert(!lstatSync(current).isSymbolicLink(), "repository_symlink"); }
    catch (e) { if (!(e.code === "ENOENT" && missing)) throw e; }
  }
  assert(!outside(canonical, current), "repository_path_escape");
  return current;
}

export function validateRepositoryManifest(m, policy = loadPolicy()) {
  assert(m?.schemaVersion === 1 && m.scope === "repository", "repository_manifest_required");
  assert(["implementation", "review"].includes(m.phase), "invalid_repository_phase");
  assert(["product", "reliability"].includes(m.attentionClass), "protected_maintenance_not_eligible");
  for (const key of ["runId", "candidateId", "threadId"])
    assert(typeof m[key] === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{2,180}$/.test(m[key]), "invalid_repository_identity");
  assert(/^[a-f0-9]{40}$/.test(m.baseSha), "invalid_repository_base");
  assert(m.trigger === "human_request" && m.parentRunId === null, "manual_candidate_only");
  for (const key of ["runtimeFingerprint", "controllerRuntimeFingerprint", "claimDigest", "hookDigest"])
    assert(sha.test(m[key]), "invalid_repository_digest");
  for (const key of ["controlRoot", "worktree", "stateHome", "evidenceRoot"])
    assert(isAbsolute(m[key]) && realpathSync(m[key]) === m[key], "noncanonical_repository_root");
  assert(m.controlRoot !== m.worktree && outside(m.worktree, m.evidenceRoot)
    && outside(m.worktree, m.stateHome), "writable_repository_control_data");
  const expectedState = resolve(policy.coordination.stateHome.replace(/^~(?=\/|$)/, homedir()));
  assert(m.stateHome === realpathSync(expectedState), "repository_shared_state_mismatch");
  assert(m.hookPath === fileURLToPath(import.meta.url) && outside(m.worktree, m.hookPath), "repository_hook_source");
  assert(git(m.controlRoot, ["remote", "get-url", "origin"]) === REPOSITORY_ORIGIN
    && git(m.worktree, ["remote", "get-url", "origin"]) === REPOSITORY_ORIGIN, "repository_origin_mismatch");
  assert(git(m.worktree, ["rev-parse", "--path-format=absolute", "--git-common-dir"])
    === resolve(m.controlRoot, ".git"), "repository_worktree_relationship");
  for (const key of ["allowedPaths", "readPaths"]) {
    assert(Array.isArray(m[key]) && m[key].length > 0 && new Set(m[key]).size === m[key].length, "invalid_repository_paths");
    for (const path of m[key]) repositoryPath(m.worktree, path, key === "allowedPaths");
  }
  assert(m.allowedPaths.length <= policy.limits.maxChangedFiles
    && m.allowedPaths.every((p) => m.readPaths.includes(p)), "repository_scope_limit");
  assert(m.readPaths.every((p) => !/(^|\/)(\.env[^/]*|\.git|\.codex|credentials|secrets)(\/|$)/i.test(p)), "repository_sensitive_read");
  assert(validateDiff({ changedPaths: m.allowedPaths, allowedPaths: m.allowedPaths, addedLines: 0, deletedLines: 0 }, policy).ok,
    "repository_protected_or_disabled_paths");
  assert(m.claimPath === `.coordination/claims/${m.threadId}.md`, "repository_claim_path");
  assert(typeof m.leaseToken === "string" && m.leaseToken.length >= 16, "repository_lease_token_missing");
  assert(Number.isFinite(Date.parse(m.expiresAt)) && Number.isFinite(Date.parse(m.createdAt))
    && Date.parse(m.expiresAt) > Date.parse(m.createdAt)
    && Date.parse(m.expiresAt) - Date.parse(m.createdAt) <= policy.limits.maxRunSeconds * 1000, "repository_deadline");
  validateActivationReport(m.activationBaseline, policy);
  assert(m.selectedFinding && same(m.selectedFinding.candidatePaths, m.allowedPaths)
    && m.selectedFinding.confidence === "high" && m.selectedFinding.risk === "low", "repository_finding_scope");
  const scout = validateScoutOutput(m.scoutEvidence,policy);
  assert(scout.status === "proposal" && scout.baseSha === m.baseSha && scout.runtimeFingerprint === m.runtimeFingerprint
    && scout.attentionClass === m.attentionClass && scout.recommendedId === m.selectedFinding.id
    && JSON.stringify(scout.findings.find(f=>f.id===scout.recommendedId)) === JSON.stringify(m.selectedFinding)
    && m.selectedFinding.conflicts.length === 0, "repository_scout_evidence_mismatch");
  const mandatory = ["package.json", "package-lock.json", ".nvmrc", ".npmrc", "AGENTS.md", "COORDINATION.md"];
  assert(m.candidateIntegrity && mandatory.every((p) => sha.test(m.candidateIntegrity[p])), "repository_candidate_integrity_missing");
  for (const [path, expected] of Object.entries(m.candidateIntegrity)) {
    assert(sha.test(expected) && !m.allowedPaths.includes(path), "repository_integrity_overlap");
    assert(digest(readFileSync(repositoryPath(m.worktree, path))) === expected, "repository_candidate_integrity_changed");
  }
  assert(m.controllerIntegrity && ["repository-work.mjs", "repository-cycle.mjs", "isolated-transport.mjs", "isolated-work.mjs", "policy.json"]
    .every((name) => sha.test(m.controllerIntegrity[name])), "repository_controller_integrity_missing");
  for (const [name, expected] of Object.entries(m.controllerIntegrity)) {
    assert(/^[A-Za-z0-9.-]+\.(mjs|json)$/.test(name) && sha.test(expected), "repository_controller_integrity_path");
    assert(digest(readFileSync(resolve(sourceRoot, "automation/agents", name))) === expected, "repository_controller_integrity_changed");
  }
  assert(digest(readFileSync(m.hookPath)) === m.hookDigest, "repository_hook_changed");
  assert(Array.isArray(m.commands) && m.commands.length > 0, "repository_commands_missing");
  for (const c of m.commands) {
    assert(roles.has(c.role) && ["read", "check"].includes(c.kind), "repository_command_role");
    assert(c.executable === process.execPath && isAbsolute(c.script) && outside(m.worktree, c.script)
      && realpathSync(c.script) === c.script && sha.test(c.digest), "repository_check_location");
    assert(/^'[A-Za-z0-9_./ -]+' '[A-Za-z0-9_./ -]+'$/.test(c.command)
      && c.command === `'${c.executable}' '${c.script}'`, "repository_command_shape");
    assert(digest(readFileSync(c.script)) === c.digest, "repository_check_changed");
  }
  for (const role of roles) assert(m.commands.some((c) => c.role === role && c.kind === "read"), "repository_read_check_missing");
  for (const role of ["builder", "auditor"]) assert(m.commands.some((c) => c.role === role && c.kind === "check"), "repository_local_check_missing");
  assert(Array.isArray(m.acceptanceChecks) && m.acceptanceChecks.length > 0
    && new Set(m.acceptanceChecks).size === m.acceptanceChecks.length, "repository_acceptance_checks_missing");
  for (const role of ["builder","auditor"]) assert(same(m.acceptanceChecks,m.commands.filter(c=>c.role===role&&c.kind==="check").map(c=>c.command)),
    "repository_acceptance_checks_mismatch");
  return m;
}

// Pure observation gate, shared by deterministic tests and the real observer.
export function assertRepositorySnapshot(m, snapshot, now = Date.now()) {
  assert(Date.parse(m.expiresAt) > now, "repository_manifest_expired");
  assert(snapshot.baseSha === m.baseSha && snapshot.runtime?.ok
    && snapshot.runtime.fingerprint === m.runtimeFingerprint, "repository_runtime_or_base_changed");
  assert(["implementation", "review"].includes(m.phase), "invalid_repository_phase");
  const allowed = ["writer_lease_exists", "active_writer_claim_limit"];
  assert(snapshot.blockers.every((b) => allowed.includes(b)), "repository_preflight_blocked");
  assert(snapshot.activeClaims.length === 1, "repository_other_claims");
  const own = snapshot.operationalClaims.find((c) => c.threadId === m.threadId);
  assert(own?.state === "en_curso" && own.claim.source === m.claimPath && own.claim.contentDigest === m.claimDigest
    && same(own.claim.files, m.allowedPaths), "repository_claim_mismatch");
  assert(snapshot.activeClaims[0].threadId === m.threadId && same(snapshot.activeClaims[0].files, m.allowedPaths), "repository_observed_claim_mismatch");
  const lease = snapshot.lease;
  assert(lease && lease.token === m.leaseToken && lease.runId === m.runId && lease.baseSha === m.baseSha
    && lease.worktree === m.worktree && lease.claimPath === m.claimPath && same(lease.paths, m.allowedPaths), "repository_lease_mismatch");
  return true;
}

export function assertRepositoryOwnership(m) {
  const policy = loadPolicy();
  validateRepositoryManifest(m, policy);
  const runtime = inspectRuntime(m.worktree);
  const controllerRuntime = inspectRuntime(sourceRoot);
  assert(controllerRuntime.ok && controllerRuntime.fingerprint === m.controllerRuntimeFingerprint, "repository_controller_runtime_changed");
  assert(git(m.worktree, ["rev-parse", "HEAD"]) === m.baseSha, "repository_candidate_base_changed");
  const snapshot = buildPreflight(m.controlRoot, policy, { stateHome: m.stateHome, runtime });
  assertRepositorySnapshot(m, snapshot);
  if (m.phase !== "discovery") assert(digest(readFileSync(resolve(m.controlRoot, m.claimPath))) === m.claimDigest, "repository_claim_changed");
  return snapshot;
}

export function inspectRepositoryPatch(patch, m) {
  assert(typeof patch === "string" && Buffer.byteLength(patch) <= 64000, "repository_patch_size");
  const lines = patch.replace(/\r\n/g, "\n").trimEnd().split("\n");
  assert(lines[0] === "*** Begin Patch" && lines.at(-1) === "*** End Patch", "repository_patch_envelope");
  const paths = [];
  for (const line of lines) {
    assert(!/^\*\*\* Add File:/.test(line), "repository_add_not_supported");
    assert(!/^\*\*\* (Delete File|Move to):/.test(line), "repository_delete_or_move_denied");
    const match = /^\*\*\* (?:Update|Add) File: (.+)$/.exec(line);
    if (match) {
      assert(m.allowedPaths.includes(match[1]), "repository_patch_outside_scope");
      repositoryPath(m.worktree, match[1], true); paths.push(match[1]);
    }
  }
  assert(paths.length > 0 && new Set(paths).size === paths.length && lines.filter((l) => /^[+-]/.test(l)).length <= 400, "repository_patch_limit");
  return paths;
}

export function evaluateRepositoryTool(input, role, m, verify = assertRepositoryOwnership) {
  assert(roles.has(role) && ({builder:"implementation",auditor:"review"})[role] === m.phase, "repository_role_phase");
  verify(m);
  if (input?.tool_name !== "apply_patch") return evaluateWorkTool(input, role, m, () => true);
  assert(role === "builder", "repository_read_only_role");
  const body = input.tool_input;
  assert(typeof body === "string" || (body && Object.keys(body).length === 1 && typeof body.command === "string"), "repository_patch_input");
  inspectRepositoryPatch(typeof body === "string" ? body : body.command, m);
  return true;
}

// Not installed in .codex/hooks.json. Even direct invocation is deny-only until
// a separately reviewed release changes the source-level gate above.
function main() {
  let receipt;
  try {
    assert(REPOSITORY_EXECUTION_ENABLED, "repository_execution_disabled");
    assert(process.env.OBRAXEN_ISOLATED_MODE === "repository", "repository_mode_required");
    const path = process.env.OBRAXEN_WORK_MANIFEST;
    assert(isAbsolute(path), "repository_binding_required");
    const raw = readFileSync(path);
    assert(digest(raw) === process.env.OBRAXEN_WORK_MANIFEST_DIGEST, "repository_binding_changed");
    const m = JSON.parse(raw);
    assert(outside(m.worktree, path), "writable_repository_manifest");
    const input = JSON.parse(readFileSync(0, "utf8"));
    assert(typeof input.tool_use_id === "string" && typeof input.turn_id === "string", "repository_call_identity");
    const role = process.env.OBRAXEN_ISOLATED_ROLE;
    evaluateRepositoryTool(input, role, m);
    receipt = {callId:input.tool_use_id,turnId:input.turn_id,role,tool:input.tool_name,inputDigest:digest(JSON.stringify(input.tool_input)),
      ...(input.tool_name === "apply_patch" ? {paths:inspectRepositoryPatch(typeof input.tool_input === "string" ? input.tool_input : input.tool_input.command,m)}
        : {command:input.tool_input.command ?? input.tool_input.cmd})};
  } catch { /* No private state, payload or credentials in diagnostics. */ }
  process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",
    ...(receipt ? {additionalContext:`OBRAXEN_RECEIPT:${JSON.stringify(receipt)}`} : {permissionDecision:"deny",permissionDecisionReason:"Obraxen repository executor is disabled or its evidence is invalid."})}})+"\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
