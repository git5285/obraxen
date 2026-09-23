import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const profiles = Object.freeze({
  scout: "obraxen-scout.toml",
  builder: "obraxen-implementer.toml",
  auditor: "obraxen-auditor.toml",
});
const TOML_PARSER_CANDIDATES = Object.freeze([
  "python3",
  "python3.14",
  "python3.13",
  "python3.12",
  "python3.11",
  "/opt/homebrew/bin/python3",
  "/usr/local/bin/python3",
]);
const MAX_HOST_OUTPUT_BYTES = 2 * 1024 * 1024;

function expectedSandbox(role) {
  if (!Object.hasOwn(profiles, role)) throw new Error("unknown_role");
  return role === "builder" ? "workspace-write" : "read-only";
}

export function isolatedRoleEnvironment(role, inherited = process.env) {
  expectedSandbox(role);
  return { ...inherited, OBRAXEN_ISOLATED_ROLE: role, OBRAXEN_ISOLATED_MODE: "diagnostic" };
}

export function readRoleProfile(cwd, role) {
  const sandbox = expectedSandbox(role);
  const path = resolve(cwd, ".codex/agents", profiles[role]);
  const source = readFileSync(path, "utf8");
  // Parse only this known project profile, never global config or credentials.
  // Python >=3.11 supplies TOML parsing without installing a dependency. Some
  // macOS images expose a legacy /usr/bin/python3 first, so only fall through
  // when the selected interpreter lacks tomllib; malformed TOML still fails
  // closed immediately.
  const parserSource = "import sys,json,tomllib; print(json.dumps(tomllib.loads(sys.stdin.read())))";
  let parsed = null;
  for (const interpreter of TOML_PARSER_CANDIDATES) {
    const result = spawnSync(interpreter, ["-c", parserSource], {
      input: source, encoding: "utf8", timeout: 5000, maxBuffer: 256 * 1024,
    });
    const missingInterpreter = result.error?.code === "ENOENT";
    const missingTomllib = /No module named [\"']tomllib[\"']/.test(result.stderr ?? "");
    if (result.status === 0 || (!missingInterpreter && !missingTomllib)) {
      parsed = result;
      break;
    }
  }
  if (!parsed || parsed.status !== 0) throw new Error("role_toml_parser_unavailable_or_invalid");
  const profile = JSON.parse(parsed.stdout);
  if (profile.name !== role || profile.approval_policy !== "never"
    || profile.sandbox_mode !== sandbox || typeof profile.model !== "string"
    || !profile.model || typeof profile.developer_instructions !== "string"
    || typeof profile.model_reasoning_effort !== "string"
    || (role === "builder" && profile.sandbox_workspace_write?.network_access !== false)) {
    throw new Error("role_profile_mismatch");
  }
  return { path, digest: createHash("sha256").update(source).digest("hex"),
    model: profile.model, effort: profile.model_reasoning_effort,
    instructions: profile.developer_instructions, sandbox };
}

// Deliberately no turn/start, resume, tool execution or trust mutation API.
// This is an attestation stage, not an autonomous-work executor.
export async function inspectSession(rpc, { cwd, role, profile }) {
  expectedSandbox(role);
  const started = await rpc("thread/start", {
    cwd, ephemeral: true, model: profile.model, approvalPolicy: "never",
    approvalsReviewer: "user", sandbox: profile.sandbox,
    runtimeWorkspaceRoots: [cwd], allowProviderModelFallback: false,
    developerInstructions: profile.instructions,
    config: {
      "model_reasoning_effort": profile.effort,
      "features.multi_agent": false,
      "features.hooks": true,
      "web_search": "disabled",
      "sandbox_workspace_write.network_access": false,
      "sandbox_workspace_write.writable_roots": [],
      "sandbox_workspace_write.exclude_slash_tmp": true,
      "sandbox_workspace_write.exclude_tmpdir_env_var": true,
    },
  });
  const hooks = await rpc("hooks/list", { cwds: [cwd] });
  return assessHost({ cwd, role, profile, started, hooks });
}

export function assessHost({ cwd, role, profile, started, hooks }) {
  const expected = expectedSandbox(role) === "read-only" ? "readOnly" : "workspaceWrite";
  const sandbox = started?.sandbox;
  const roots = started?.runtimeWorkspaceRoots;
  const permissionsMatch = started?.approvalPolicy === "never"
    && sandbox?.type === expected && sandbox.networkAccess === false
    && started?.cwd === cwd && started?.model === profile.model
    && typeof started?.thread?.id === "string" && started.thread.id.length > 0
    && Array.isArray(roots) && roots.length === 1 && roots[0] === cwd
    && (role !== "builder" || (Array.isArray(sandbox.writableRoots)
      && sandbox.writableRoots.every((root) => root === cwd)
      && sandbox.excludeSlashTmp === true && sandbox.excludeTmpdirEnvVar === true));
  const entry = hooks?.data?.find((item) => item.cwd === cwd);
  const hook = entry?.hooks?.find((item) => item.sourcePath === resolve(cwd, ".codex/hooks.json")
    && item.eventName === "preToolUse" && item.handlerType === "command"
    && item.command === "node .codex/hooks/pre-tool-policy.mjs" && item.matcher === ".*");
  const hookTrusted = Array.isArray(entry?.errors) && entry.errors.length === 0
    && hook?.enabled === true && hook.async === false
    && ["trusted", "managed"].includes(hook.trustStatus);
  const blockers = [];
  if (!permissionsMatch) blockers.push("effective_permissions_mismatch_or_missing");
  if (!hookTrusted) blockers.push("project_hook_untrusted_or_missing");
  // A root session is not agent_type=scout/builder/auditor. Existing hook role
  // routing and fine-grained path restrictions need separate verified binding.
  // Do not imply that a successful sandbox comparison authorizes model work.
  blockers.push("isolated_role_tool_binding_not_verified", "isolated_work_executor_not_enabled");
  return {
    schemaVersion: 1, role, profilePath: profile.path, profileDigest: profile.digest,
    threadId: started?.thread?.id ?? null, model: started?.model ?? null,
    approvalPolicy: started?.approvalPolicy ?? null,
    sandbox: sandbox ? {
      type: sandbox.type, networkAccess: sandbox.networkAccess,
      writableRoots: sandbox.writableRoots,
      excludeSlashTmp: sandbox.excludeSlashTmp, excludeTmpdirEnvVar: sandbox.excludeTmpdirEnvVar,
    } : null,
    runtimeWorkspaceRoots: roots ?? null,
    hook: hook ? { enabled: hook.enabled, trustStatus: hook.trustStatus,
      currentHash: hook.currentHash } : null,
    permissionsMatch, hookTrusted, readyForWork: false, blockers,
    modelTurnsStarted: 0, toolCallsRequested: 0,
    scope: "Independent host startup only; no model availability, hook enforcement or workflow proof",
  };
}

export async function inspectRoleHost({ cwd, role, codex = "codex", timeoutMs = 30000 }) {
  cwd = realpathSync(cwd);
  const profile = readRoleProfile(cwd, role);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new Error("invalid_timeout");
  }
  const child = spawn(codex, ["app-server", "--stdio"], {
    cwd, stdio: ["pipe", "pipe", "ignore"], shell: false,
    env: isolatedRoleEnvironment(role),
    detached: process.platform !== "win32",
  });
  let nextId = 0;
  let buffer = "";
  let bufferParts = [];
  let receivedBytes = 0;
  let failed = null;
  const pending = new Map();
  const fail = (code) => {
    failed ??= new Error(code);
    buffer = "";
    bufferParts = [];
    child.stdout.pause();
    for (const request of pending.values()) request.reject(failed);
    pending.clear();
  };
  child.on("error", () => fail("host_start_failed"));
  child.on("exit", () => fail("host_closed"));
  child.stdin.on("error", () => fail("host_input_closed"));
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    if (failed) return;
    receivedBytes += Buffer.byteLength(chunk);
    if (receivedBytes > MAX_HOST_OUTPUT_BYTES) return fail("host_output_limit");
    // Do not repeatedly concatenate an unterminated hostile response: that
    // quadratic work could let the timeout win before the output cap fires.
    bufferParts.push(chunk);
    if (!chunk.includes("\n")) return;
    buffer += bufferParts.join("");
    bufferParts = [];
    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      let message;
      try { message = JSON.parse(line); } catch { fail("invalid_host_json"); return; }
      if (!message || typeof message !== "object" || Array.isArray(message)) {
        fail("invalid_host_message"); return;
      }
      // Reject unsolicited approval/tool requests rather than answering them.
      if (message.method && message.id !== undefined) { fail("unexpected_host_request"); return; }
      const request = pending.get(message.id);
      if (!request) continue;
      pending.delete(message.id);
      if (message.error) request.reject(new Error("host_rpc_failed"));
      else request.resolve(message.result);
    }
  });
  const timer = setTimeout(() => fail("host_timeout"), timeoutMs);
  const rpc = (method, params) => new Promise((resolveRequest, reject) => {
    if (failed) { reject(failed); return; }
    const id = ++nextId;
    pending.set(id, { resolve: resolveRequest, reject });
    child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
  });
  try {
    await rpc("initialize", { clientInfo: { name: "obraxen-isolated-host", version: "1" },
      capabilities: { experimentalApi: true } });
    child.stdin.write(`${JSON.stringify({ method: "initialized" })}\n`);
    const evidence = await inspectSession(rpc, { cwd, role, profile });
    // The final response and a protocol violation can arrive in one chunk.
    // A resolved RPC promise alone does not prove the transport stayed valid.
    if (failed) throw failed;
    return evidence;
  } finally {
    clearTimeout(timer);
    // Close our pipe endpoints even if a descendant inherited the other end.
    child.stdin.destroy();
    child.stdout.destroy();
    const signal = (name) => {
      if (!child.pid) return;
      try {
        if (process.platform !== "win32") process.kill(-child.pid, name);
        else child.kill(name);
      } catch (error) {
        if (error.code !== "ESRCH") throw new Error("host_cleanup_failed");
      }
    };
    signal("SIGTERM");
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      await new Promise((done) => {
        const onExit = () => { clearTimeout(killTimer); done(); };
        const killTimer = setTimeout(() => {
          child.removeListener("exit", onExit);
          done();
        }, 2000);
        child.once("exit", onExit);
      });
    }
    // Also stop descendants from this dedicated process group, with no wait on
    // their inherited pipes. Never signal the caller's process group.
    signal("SIGKILL");
  }
}

async function main() {
  const [command, role, ...extra] = process.argv.slice(2);
  if (command !== "inspect" || extra.length) throw new Error("usage: isolated-host.mjs inspect scout|builder|auditor");
  const evidence = await inspectRoleHost({ cwd: process.cwd(), role });
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  // Successful inspection is not a successful eligibility gate.
  process.exitCode = evidence.readyForWork ? 0 : 2;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(() => {
    // Host/config errors may contain sensitive payloads: never dump them.
    process.stderr.write("isolated_host_inspection_failed; no model turn was started\n");
    process.exitCode = 1;
  });
}
