import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertWorkOwnership, cleanGitEnvironment, digest, matchesObservedCommand } from "./isolated-work.mjs";
import { readRoleProfile } from "./isolated-host.mjs";
import { heartbeatLease } from "./lease.mjs";
import { parseRoleOutput } from "./contracts.mjs";
import { REPOSITORY_EXECUTION_ENABLED, assertRepositoryOwnership } from "./repository-work.mjs";
const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const git = (root, args) => execFileSync("git", ["-c", "core.fsmonitor=false", ...args], {cwd:root,env:cleanGitEnvironment(),encoding:"utf8",timeout:10000}).trim();
const save = (path, content) => { mkdirSync(dirname(path), { recursive:true }); writeFileSync(path,content,{mode:0o600}); };
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isId = (value) => typeof value === "string" && value.length > 0;

function validateHostEvent(message) {
  const { method, params } = message;
  if (!["hook/completed", "item/started", "item/completed", "turn/completed"].includes(method)) return;
  assert(isRecord(params), "invalid_host_event");
  if (method === "hook/completed") {
    assert(isRecord(params.run) && Array.isArray(params.run.entries)
      && params.run.entries.every((entry) => isRecord(entry)
        && (entry.kind !== "context" || typeof entry.text === "string")), "invalid_host_event");
    return;
  }
  assert(isId(params.threadId), "invalid_host_event");
  if (method === "turn/completed") {
    assert(isRecord(params.turn) && isId(params.turn.id) && isId(params.turn.status), "invalid_host_event");
    return;
  }
  assert(isId(params.turnId) && isRecord(params.item) && isId(params.item.id)
    && isId(params.item.type), "invalid_host_event");
  if (method === "item/completed" && params.item.type === "agentMessage")
    assert(typeof params.item.text === "string", "invalid_host_event");
}

// Work transport stays separate from the diagnostic API. It cannot register
// hook trust or answer approval requests. A fresh host is closed for each role.
export async function runBoundRole(prepared, role, prompt, binding, { codex = "codex", timeoutMs = 180000, inspectOnly = false } = {}) {
  assert(binding.mode === "fixture" || (binding.mode === "repository" && REPOSITORY_EXECUTION_ENABLED), "repository_execution_disabled");
  const { manifest: m, root, hookCommand } = prepared;
  assert(m.scope === binding.mode, "isolated_scope_mismatch");
  const verify = binding.mode === "fixture" ? assertWorkOwnership : assertRepositoryOwnership;
  verify(m);
  assert(git(m.worktree, ["rev-parse", "--path-format=absolute", "--git-common-dir"])
    === join(m.controlRoot, ".git"), "fixture_hook_root_mismatch");
  const hookSource = join(m.controlRoot, ".codex/hooks.json");
  const profile = readRoleProfile(sourceRoot, role);
  const manifestPath = join(root, `${role}-manifest.json`);
  const raw = JSON.stringify(m);
  save(manifestPath, raw);
  prepared.hostTerminationConfirmed = false;
  const child = spawn(codex, ["app-server", "--stdio"], { cwd: m.worktree, detached: true,
    stdio: ["pipe", "pipe", "ignore"], env: { ...cleanGitEnvironment(), OBRAXEN_ISOLATED_ROLE: role,
      OBRAXEN_ISOLATED_MODE: binding.mode, OBRAXEN_WORK_MANIFEST: manifestPath, OBRAXEN_WORK_MANIFEST_DIGEST: digest(raw) } });
  let next = 0, buffer = "", total = 0, failure = null, completed = false;
  const pending = new Map(), hooks = [], output = [], calls = [];
  const starts = new Map();
  let eventOrder = 0;
  let resolveTurn, rejectTurn;
  const turn = new Promise((yes, no) => { resolveTurn = yes; rejectTurn = no; });
  // The startup phase can fail before the turn promise is awaited.
  turn.catch(() => {});
  const fail = (reason) => {
    failure ??= new Error(reason);
    for (const request of pending.values()) request.reject(failure);
    pending.clear(); rejectTurn(failure);
  };
  child.on("error", () => fail("host_start_failed"));
  child.on("exit", () => { if (!completed) fail("host_closed"); });
  child.stdin.on("error", () => fail("host_input_failed"));
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    // EventEmitter callbacks run outside the awaited RPC stack. Convert all
    // malformed notifications to rejection so the host-cleanup finally runs.
    try {
      if (failure) return;
      total += Buffer.byteLength(chunk);
      if (total > 2 * 1024 * 1024) return fail("host_output_limit");
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
        let message;
        try { message = JSON.parse(line); } catch { fail("invalid_host_json"); return; }
        if (!isRecord(message)) { fail("invalid_host_message"); return; }
        validateHostEvent(message);
        eventOrder++;
        if (message.method && message.id !== undefined) { fail("unexpected_host_request"); return; }
        const request = pending.get(message.id);
        if (request) { pending.delete(message.id); if (message.error) request.reject(new Error("host_rpc_failed")); else request.resolve(message.result); }
        if (message.method === "hook/completed") hooks.push(message.params.run);
        if (message.method === "item/started") {
          const item = message.params.item;
          if (item.type === "commandExecution" || item.type === "fileChange") {
            const key = JSON.stringify([message.params.threadId,message.params.turnId,item.id]);
            if (starts.has(key)) { fail("duplicate_item_start"); return; }
            starts.set(key,eventOrder);
          }
        }
        if (message.method === "item/completed") {
          const item = message.params.item;
          if (item.type === "agentMessage") output.push(item.text);
          if (item.type === "commandExecution" || item.type === "fileChange")
            calls.push({ ...item, observedThreadId: message.params.threadId, observedTurnId: message.params.turnId,
              observedStartOrder: starts.get(JSON.stringify([message.params.threadId,message.params.turnId,item.id])),
              observedEndOrder: eventOrder });
        }
        if (message.method === "turn/completed") {
          if (message.params.turn.status !== "completed") fail("model_turn_failed"); else resolveTurn();
        }
        if (failure) return;
      }
    } catch { fail("invalid_host_event"); }
  });
  const rpc = (method, params) => new Promise((yes, no) => {
    if (failure) return no(failure);
    const id = ++next; pending.set(id, { resolve: yes, reject: no });
    child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
  });
  const timer = setTimeout(() => fail("host_timeout"), timeoutMs);
  let heartbeat;
  try {
    await rpc("initialize", { clientInfo: { name: "obraxen-fixture", version: "1" }, capabilities: { experimentalApi: true } });
    child.stdin.write('{"method":"initialized"}\n');
    const started = await rpc("thread/start", { cwd: m.worktree, ephemeral: true, model: profile.model,
      approvalPolicy: "never", approvalsReviewer: "user", sandbox: profile.sandbox, runtimeWorkspaceRoots: [m.worktree],
      allowProviderModelFallback: false, developerInstructions: `${profile.instructions}\n\n${binding.instructions}`,
      config: { "model_reasoning_effort": profile.effort,
        "features.hooks": true, "features.multi_agent": false, "features.apps": false,
        "features.plugins": false, "features.browser_use": false, "features.computer_use": false,
        "features.in_app_browser": false, "features.image_generation": false, "web_search": "disabled",
        "sandbox_workspace_write.network_access": false, "sandbox_workspace_write.writable_roots": [],
        "sandbox_workspace_write.exclude_slash_tmp": true, "sandbox_workspace_write.exclude_tmpdir_env_var": true } });
    const sandbox = started.sandbox;
    assert(started.approvalPolicy === "never" && started.model === profile.model && started.cwd === m.worktree
      && JSON.stringify(started.runtimeWorkspaceRoots) === JSON.stringify([m.worktree])
      && sandbox?.networkAccess === false && sandbox.type === (role === "builder" ? "workspaceWrite" : "readOnly"), "effective_permissions_mismatch");
    if (role === "builder") assert(sandbox.writableRoots.every((path) => path === m.worktree)
      && sandbox.excludeSlashTmp && sandbox.excludeTmpdirEnvVar, "writable_roots_mismatch");
    const listed = await rpc("hooks/list", { cwds: [m.worktree] });
    if (failure) throw failure;
    const entry = listed.data?.find((item) => item.cwd === m.worktree);
    const hook = entry?.hooks?.find((item) => item.sourcePath === hookSource
      && item.command === hookCommand && item.eventName === "preToolUse" && item.matcher === ".*");
    const attestation = { role, profileDigest: profile.digest, threadId: started.thread.id, model: started.model, sandbox,
      approvalPolicy: started.approvalPolicy, hook: hook ? { sourcePath: hook.sourcePath, command: hook.command,
        enabled: hook.enabled, trustStatus: hook.trustStatus, currentHash: hook.currentHash } : null,
      modelTurnsStarted: 0, readyForAutonomy: false };
    save(join(root, `${role}-host.json`), JSON.stringify(attestation, null, 2));
    if (inspectOnly) return attestation;
    assert(entry && entry.errors.length === 0, "fixture_hook_discovery_failed");
    assert(hook, "fixture_hook_not_discovered");
    assert(hook.enabled && hook.async === false
      && ["trusted", "managed"].includes(hook.trustStatus), "fixture_hook_requires_human_trust");
    if (m.phase !== "discovery") heartbeat = setInterval(() => {
      try { verify(m); heartbeatLease(m.controlRoot, m.leaseToken, new Date(), m.stateHome); }
      catch { fail("lease_or_manifest_changed"); }
    }, 1000);
    verify(m);
    const launched = await rpc("turn/start", { threadId: started.thread.id, input: [{ type: "text", text: prompt, text_elements: [] }] });
    await turn;
    if (failure) throw failure;
    save(join(root, `${role}-observed.json`), JSON.stringify({ ...attestation,
      modelTurnsStarted: 1, hooks, calls, validation: "pending" }, null, 2));
    verify(m);
    const result = parseRoleOutput(role, output.at(-1));
    save(join(root, `${role}-observed.json`), JSON.stringify({ ...attestation,
      modelTurnsStarted: 1, hooks, calls, result, validation: "pending" }, null, 2));
    const receipts = hooks.filter((entry) => entry.sourcePath === hookSource
      && entry.eventName === "preToolUse" && entry.status === "completed" && entry.executionMode === "sync")
      .flatMap((entry) => entry.entries).filter((entry) => entry.kind === "context" && entry.text.startsWith("OBRAXEN_RECEIPT:"))
      .map((entry) => JSON.parse(entry.text.slice("OBRAXEN_RECEIPT:".length)));
    assert(calls.length > 0 && calls.every((call) => {
      const matching = receipts.filter((receipt) => receipt.callId === call.id && receipt.role === role
        && receipt.turnId === launched.turn.id && call.observedTurnId === launched.turn.id
        && call.observedThreadId === started.thread.id);
      if (matching.length !== 1) return false;
      const receipt = matching[0];
      if (call.type === "commandExecution") return ["Bash", "exec_command"].includes(receipt.tool)
        && matchesObservedCommand(call, receipt.command, m.worktree);
      return receipt.tool === "apply_patch" && Array.isArray(call.changes)
        && JSON.stringify(call.changes.map((change) => resolve(m.worktree, change.path)).sort())
          === JSON.stringify(receipt.paths.map((path) => resolve(m.worktree, path)).sort());
    }), "hook_call_correlation_missing");
    const commands = calls.filter((call) => call.type === "commandExecution");
    const claimingSuccess = result.status === "implemented" || result.verdict === "pass";
    for (const command of m.commands.filter((entry) => entry.role === role))
      assert(commands.some((call) => matchesObservedCommand(call, command.command, m.worktree) && typeof call.exitCode === "number"
        && (!(command.kind === "read" || claimingSuccess) || call.exitCode === 0)), "required_role_check_missing");
    assertChecksAfterLastPatch(calls, m, role, claimingSuccess);
    if (role === "builder" && result.status === "implemented")
      assert(calls.some((call) => call.type === "fileChange" && call.status === "completed"), "builder_patch_missing");
    const evidence = { ...attestation, modelTurnsStarted: 1, hooks, calls, result };
    save(join(root, `${role}-result.json`), JSON.stringify(evidence, null, 2));
    return evidence;
  } finally {
    completed = true; clearTimeout(timer); clearInterval(heartbeat);
    child.stdin.destroy(); child.stdout.destroy();
    if (child.pid) {
      const signal = (name) => { try { process.kill(-child.pid, name); } catch (error) { if (error.code !== "ESRCH") throw error; } };
      signal("SIGTERM");
      await new Promise((done) => setTimeout(done, 200));
      signal("SIGKILL");
      for (let attempt = 0; attempt < 40; attempt++) {
        try { process.kill(-child.pid, 0); }
        catch (error) { if (error.code === "ESRCH") { prepared.hostTerminationConfirmed = true; break; } throw error; }
        await new Promise((done) => setTimeout(done, 50));
      }
      assert(prepared.hostTerminationConfirmed, "host_termination_unconfirmed");
    } else {
      prepared.hostTerminationConfirmed = true;
    }
  }
}

export function assertChecksAfterLastPatch(calls, manifest, role, claimingSuccess) {
  if (!claimingSuccess) return;
  assert(calls.every(call=>Number.isInteger(call.observedStartOrder) && Number.isInteger(call.observedEndOrder)
    && call.observedStartOrder < call.observedEndOrder), "item_execution_order_missing");
  const lastPatch = calls.reduce((last, call) => call.type === "fileChange" ? Math.max(last,call.observedEndOrder) : last, -1);
  for (const required of manifest.commands.filter((c) => c.role === role && c.kind === "check"))
    assert(calls.some(call => call.observedStartOrder > lastPatch && call.type === "commandExecution"
      && call.exitCode === 0 && call.status === "completed"
      && matchesObservedCommand(call, required.command, manifest.worktree)), "required_check_stale_after_patch");
}
