import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { readLease } from "./lease.mjs";
import { readOperationalClaims } from "./operations.mjs";
import { loadPolicy } from "./policy.mjs";
import { globMatches, validateDiff } from "./diff-policy.mjs";
import { inspectRuntime } from "./runtime.mjs";

const roles = new Set(["scout", "builder", "auditor"]);
export const digest = (value) => createHash("sha256").update(value).digest("hex");

// Do not inherit Git redirection/configuration into controller observations.
export function cleanGitEnvironment(environment = process.env) {
  return Object.fromEntries(Object.entries(environment).filter(([key]) => !key.startsWith("GIT_")));
}

function git(root, args) {
  return execFileSync("git", ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=/dev/null", ...args], {
    cwd: root, encoding: "utf8", env: cleanGitEnvironment(), timeout: 5000,
    maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "pipe"],
  });
}

function exactPaths(paths) {
  assert(Array.isArray(paths) && paths.length > 0 && paths.length <= 8, "invalid_paths");
  assert(new Set(paths).size === paths.length, "duplicate_paths");
  for (const path of paths) assert(typeof path === "string"
    && /^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(path)
    && path.split("/").every((part) => part && part !== "." && part !== "..")
    && !isAbsolute(path), "unsafe_path");
}

export function safeFile(root, path, { missing = false } = {}) {
  exactPaths([path]);
  const canonical = realpathSync(root);
  let current = canonical;
  for (const part of path.split("/")) {
    current = resolve(current, part);
    if (!existsSync(current)) {
      // lstat detects dangling symlinks, which existsSync intentionally ignores.
      try { assert(!lstatSync(current).isSymbolicLink(), "symlink_path"); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
      assert(missing, "missing_path");
      continue;
    }
    assert(!lstatSync(current).isSymbolicLink(), "symlink_path");
  }
  assert(relative(canonical, current) === path.split("/").join(sep), "path_escape");
  return current;
}

function same(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

export function validateWorkManifest(manifest, policy = loadPolicy()) {
  assert(manifest?.schemaVersion === 1 && manifest.scope === "fixture", "fixture_only");
  for (const name of ["runId", "candidateId", "threadId"])
    assert(/^[A-Za-z0-9][A-Za-z0-9._-]{2,180}$/.test(manifest[name]), "invalid_identity");
  assert(/^[a-f0-9]{40}$/.test(manifest.baseSha), "invalid_base");
  for (const field of ["runtimeFingerprint", "claimDigest", "hookDigest", "activationDigest"])
    assert(/^[a-f0-9]{64}$/.test(manifest[field]), "invalid_digest");
  assert(manifest.attentionClass === "reliability", "fixture_attention");
  assert(["discovery", "implementation", "review"].includes(manifest.phase), "invalid_phase");
  for (const field of ["controlRoot", "worktree", "stateHome", "hookPath"])
    assert(isAbsolute(manifest[field]) && realpathSync(manifest[field]) === manifest[field], "noncanonical_root");
  assert(manifest.controlRoot !== manifest.worktree, "control_is_candidate");
  const fixtureRoot = dirname(manifest.worktree);
  assert(/^obraxen-isolated-cycle-[A-Za-z0-9]+$/.test(basename(fixtureRoot))
    && manifest.controlRoot === resolve(fixtureRoot, "control")
    && manifest.worktree === resolve(fixtureRoot, "candidate")
    && manifest.stateHome === resolve(fixtureRoot, "state"), "not_disposable_fixture_layout");
  assert(manifest.hookPath === fileURLToPath(import.meta.url), "unexpected_hook_source");
  assert(manifest.runtimeRoot === resolve(dirname(fileURLToPath(import.meta.url)), "../.."), "unexpected_runtime_root");
  assert(manifest.integrity && Object.keys(manifest.integrity).length > 5, "missing_code_integrity");
  assert(/^https:\/\/example\.invalid\/isolated-cycle\/[a-f0-9-]+\.git$/.test(
    git(manifest.controlRoot, ["remote", "get-url", "origin"]).trim()), "not_fixture_repository");
  assert(!manifest.hookPath.startsWith(`${manifest.worktree}/`), "writable_hook");
  assert(!manifest.stateHome.startsWith(`${manifest.worktree}/`), "writable_state");
  assert(typeof manifest.leaseToken === "string" && manifest.leaseToken.length >= 16, "missing_lease_token");
  assert(typeof manifest.expiresAt === "string" && Number.isFinite(Date.parse(manifest.expiresAt)), "invalid_expiry");
  exactPaths(manifest.allowedPaths);
  exactPaths(manifest.readPaths);
  assert(manifest.allowedPaths.every((path) => manifest.readPaths.includes(path)), "missing_read_path");
  const checked = validateDiff({ changedPaths: manifest.allowedPaths, allowedPaths: manifest.allowedPaths,
    addedLines: 0, deletedLines: 0 }, policy);
  assert(checked.ok, "protected_or_disabled_write");
  assert(manifest.readPaths.every((path) => !/(^|\/)(\.env[^/]*|\.git|\.codex)(\/|$)/.test(path)), "sensitive_read");
  assert(Array.isArray(manifest.commands) && manifest.commands.length > 0, "missing_checks");
  for (const command of manifest.commands) {
    assert(command && roles.has(command.role) && typeof command.command === "string", "invalid_command");
    // Only controller-authored, immutable fixture scripts with no arguments.
    assert(command.kind === "read" || command.kind === "check", "invalid_command_kind");
    assert(/^'[A-Za-z0-9_./ -]+' '[A-Za-z0-9_./ -]+'$/.test(command.command), "unsafe_command");
    assert(isAbsolute(command.executable) && isAbsolute(command.script), "relative_command");
    assert(command.command === `'${command.executable}' '${command.script}'`, "command_mismatch");
    assert(!command.script.startsWith(`${manifest.worktree}/`), "writable_check");
    assert(/^[a-f0-9]{64}$/.test(command.digest), "missing_check_digest");
  }
  return manifest;
}

export function inspectWorkOwnership(manifest, { now = Date.now(), policy = loadPolicy() } = {}) {
  validateWorkManifest(manifest, policy);
  assert(Date.parse(manifest.expiresAt) > now, "expired_manifest");
  assert(digest(readFileSync(manifest.hookPath)) === manifest.hookDigest, "hook_changed");
  for (const [path, expected] of Object.entries(manifest.integrity)) {
    assert(/^automation\/agents\/[A-Za-z0-9.-]+\.(mjs|json)$/.test(path), "invalid_integrity_path");
    assert(digest(readFileSync(resolve(manifest.runtimeRoot, path))) === expected, "code_integrity_changed");
  }
  const runtime = inspectRuntime(manifest.runtimeRoot);
  assert(runtime.ok && runtime.fingerprint === manifest.runtimeFingerprint, "runtime_changed");
  assert(git(manifest.worktree, ["rev-parse", "HEAD"]).trim() === manifest.baseSha, "base_changed");
  assert(git(manifest.controlRoot, ["rev-parse", "HEAD"]).trim() === manifest.baseSha, "control_base_changed");
  const claims = readOperationalClaims(manifest.controlRoot, manifest.stateHome);
  if (manifest.phase === "discovery") {
    assert(claims.every((claim) => claim.state === "liberado"), "discovery_claim_conflict");
    assert(readLease(manifest.controlRoot, manifest.stateHome) === null, "discovery_lease_conflict");
    for (const command of manifest.commands)
      assert(digest(readFileSync(command.script)) === command.digest, "check_changed");
    return runtime;
  }
  const own = claims.find((claim) => claim.threadId === manifest.threadId);
  assert(own && own.state === "en_curso" && own.claim.source === manifest.claimPath
    && own.claim.contentDigest === manifest.claimDigest && same(own.claim.files, manifest.allowedPaths), "claim_mismatch");
  assert(digest(readFileSync(resolve(manifest.controlRoot, manifest.claimPath))) === manifest.claimDigest, "claim_changed");
  for (const other of claims.filter((claim) => claim.threadId !== manifest.threadId && claim.state !== "liberado"))
    assert(!other.claim.files.some((path) => manifest.allowedPaths.some((allowed) => globMatches(path, allowed))), "claim_conflict");
  const lease = readLease(manifest.controlRoot, manifest.stateHome);
  assert(lease && lease.token === manifest.leaseToken && lease.runId === manifest.runId
    && lease.worktree === manifest.worktree && lease.baseSha === manifest.baseSha
    && lease.claimPath === manifest.claimPath && same(lease.paths, manifest.allowedPaths), "lease_mismatch");
  for (const path of manifest.readPaths) safeFile(manifest.worktree, path);
  for (const command of manifest.commands)
    assert(digest(readFileSync(command.script)) === command.digest, "check_changed");
  return runtime;
}

export function assertWorkOwnership(manifest, options) {
  inspectWorkOwnership(manifest, options);
  return true;
}

export function inspectPatch(patch, manifest) {
  assert(typeof patch === "string" && Buffer.byteLength(patch) <= 64000, "invalid_patch");
  const lines = patch.replace(/\r\n/g, "\n").trimEnd().split("\n");
  assert(lines[0] === "*** Begin Patch" && lines.at(-1) === "*** End Patch", "patch_envelope");
  const paths = [];
  for (const line of lines) {
    assert(!/^\*\*\* (Delete File|Move to):/.test(line), "deletion_or_move_denied");
    const match = /^\*\*\* (?:Update|Add) File: (.+)$/.exec(line);
    if (match) {
      const path = match[1];
      assert(manifest.allowedPaths.includes(path), "out_of_scope_patch");
      safeFile(manifest.worktree, path, { missing: true });
      paths.push(path);
    }
  }
  assert(paths.length > 0 && new Set(paths).size === paths.length, "invalid_patch_paths");
  assert(lines.filter((line) => /^[+-]/.test(line)).length <= 400, "patch_limit");
  return paths;
}

// Host events render the default macOS shell envelope, not just tool_input.command.
// Match a known exact envelope only; never execute/parse shell or trust action hints.
export function matchesObservedCommand(call, command, cwd) {
  if (call?.cwd !== cwd || typeof command !== "string") return false;
  if (call.command === command) return true;
  if (!/^'[^'"$`\\\r\n]+' '[^'"$`\\\r\n]+'$/.test(command)) return false;
  return ["/bin/zsh", "/bin/bash"].some((shell) =>
    ["-lc", "-c"].some((flag) => call.command === `${shell} ${flag} "${command}"`));
}

export function evaluateWorkTool(input, role, manifest, verify = assertWorkOwnership) {
  assert(roles.has(role), "unknown_role");
  assert(({ scout: "discovery", builder: "implementation", auditor: "review" })[role] === manifest.phase, "role_phase_mismatch");
  verify(manifest);
  assert(input && typeof input === "object", "invalid_tool_input");
  if (input.tool_name === "apply_patch") {
    assert(role === "builder", "read_only_role");
    const body = input.tool_input;
    assert(typeof body === "string" || (body && Object.keys(body).length === 1 && typeof body.command === "string"), "ambiguous_patch_input");
    inspectPatch(typeof body === "string" ? body : body.command, manifest);
    return true;
  }
  assert(["Bash", "exec_command"].includes(input.tool_name), "tool_not_allowed");
  const body = input.tool_input;
  assert(body && typeof body === "object", "invalid_shell_input");
  const commandKey = input.tool_name === "Bash" ? "command" : "cmd";
  const otherKey = commandKey === "command" ? "cmd" : "command";
  assert(!Object.hasOwn(body, otherKey) && typeof body[commandKey] === "string", "ambiguous_command_input");
  const command = body[commandKey];
  assert(!body.workdir || body.workdir === manifest.worktree, "cwd_override");
  assert(!body.cwd || body.cwd === manifest.worktree, "cwd_override");
  assert(!body.sandbox_permissions || body.sandbox_permissions === "use_default", "escalation_denied");
  assert(!body.shell && !body.tty && body.login !== true, "shell_override");
  assert(Object.keys(body).every((key) => ["command", "cmd", "cwd", "workdir", "sandbox_permissions", "login", "tty", "timeout_ms", "yield_time_ms", "max_output_tokens", "description"].includes(key)), "unknown_shell_option");
  assert(manifest.commands.some((entry) => entry.role === role && entry.command === command), "command_not_allowed");
  return true;
}

// Separate fixture hook. Its absolute command and source must be reviewed in
// the host; it does not replace or weaken the existing diagnostic hook.
function main() {
  let allowed = false;
  let receipt;
  try {
    assert(process.env.OBRAXEN_ISOLATED_MODE === "fixture", "invalid_mode");
    const path = process.env.OBRAXEN_WORK_MANIFEST;
    assert(isAbsolute(path), "missing_manifest");
    const raw = readFileSync(path);
    assert(digest(raw) === process.env.OBRAXEN_WORK_MANIFEST_DIGEST, "manifest_changed");
    const manifest = JSON.parse(raw);
    assert(!resolve(path).startsWith(`${manifest.worktree}/`), "writable_manifest");
    const input = JSON.parse(readFileSync(0, "utf8"));
    assert(typeof input.tool_use_id === "string" && typeof input.turn_id === "string", "missing_host_call_identity");
    allowed = evaluateWorkTool(input, process.env.OBRAXEN_ISOLATED_ROLE, manifest);
    receipt = { callId: input.tool_use_id, turnId: input.turn_id, role: process.env.OBRAXEN_ISOLATED_ROLE,
      tool: input.tool_name, inputDigest: digest(JSON.stringify(input.tool_input)),
      ...(input.tool_name === "apply_patch" ? { paths: inspectPatch(typeof input.tool_input === "string"
        ? input.tool_input : input.tool_input.command, manifest) }
        : { command: input.tool_input.command ?? input.tool_input.cmd }) };
  } catch { /* Never expose manifest, lease token, input, or credentials. */ }
  process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse",
    ...(allowed ? { additionalContext: `OBRAXEN_RECEIPT:${JSON.stringify(receipt)}` }
      : { permissionDecision: "deny", permissionDecisionReason: "Obraxen: operación fuera del contrato fixture o evidencia inválida." }) } })}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
