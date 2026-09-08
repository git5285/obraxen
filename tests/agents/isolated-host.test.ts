import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assessHost, inspectRoleHost, inspectSession, readRoleProfile, type Role } from "../../automation/agents/isolated-host.mjs";

const cwd = "/tmp/obraxen-fixture";
const temporaryRoots: string[] = [];
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});
function fakeHost(body: string) {
  const root = mkdtempSync(join(tmpdir(), "obraxen-host-test-"));
  temporaryRoots.push(root);
  const path = join(root, "codex");
  writeFileSync(path, `#!/usr/bin/env node\n${body}\n`, { mode: 0o700 });
  return path;
}
function fixture(role: Role = "scout") {
  const profile = { path: "role.toml", digest: "digest", model: "configured-model", effort: "high",
    instructions: "fixture instructions", sandbox: role === "builder" ? "workspace-write" : "read-only" };
  const sandbox = role === "builder"
    ? { type: "workspaceWrite", networkAccess: false, writableRoots: [] as string[], excludeSlashTmp: true, excludeTmpdirEnvVar: true }
    : { type: "readOnly", networkAccess: false };
  const started = { cwd, thread: { id: "real-host-id" }, approvalPolicy: "never",
    model: profile.model, sandbox, runtimeWorkspaceRoots: [cwd] };
  const hooks = { data: [{ cwd, errors: [], hooks: [{ sourcePath: `${cwd}/.codex/hooks.json`,
    eventName: "preToolUse", handlerType: "command", command: "node .codex/hooks/pre-tool-policy.mjs",
    matcher: ".*", enabled: true, async: false, trustStatus: "trusted", currentHash: "host-hash" }] }] };
  return { cwd, role, profile, started, hooks };
}

describe("isolated host attestation (no model work)", () => {
  it.each(["scout", "builder", "auditor"] as const)("checks %s but never grants work authority", (role) => {
    const evidence = assessHost(fixture(role));
    expect(evidence.permissionsMatch).toBe(true);
    expect(evidence.hookTrusted).toBe(true);
    expect(evidence.readyForWork).toBe(false);
    expect(evidence.blockers).toContain("isolated_role_tool_binding_not_verified");
  });
  it.each(["on-request", "untrusted"])("rejects inherited approval %s", (approvalPolicy) => {
    const input = fixture(); input.started.approvalPolicy = approvalPolicy;
    expect(assessHost(input).permissionsMatch).toBe(false);
  });
  it.each(["workspaceWrite", "dangerFullAccess", "externalSandbox"])("rejects scout sandbox %s", (type) => {
    const input = fixture(); input.started.sandbox.type = type;
    expect(assessHost(input).permissionsMatch).toBe(false);
  });
  it("rejects network, wider roots, missing identity and model substitution", () => {
    const input = fixture(); input.started.sandbox.networkAccess = true;
    expect(assessHost(input).permissionsMatch).toBe(false);
    input.started.sandbox.networkAccess = false;
    input.started.runtimeWorkspaceRoots.push("/another/worktree");
    expect(assessHost(input).permissionsMatch).toBe(false);
    input.started.runtimeWorkspaceRoots = [cwd]; input.started.thread.id = "";
    expect(assessHost(input).permissionsMatch).toBe(false);
    input.started.thread.id = "id"; input.started.model = "fallback";
    expect(assessHost(input).permissionsMatch).toBe(false);
  });
  it("rejects builder temp writes and extra writable roots", () => {
    const input = fixture("builder"); input.started.sandbox.excludeSlashTmp = false;
    expect(assessHost(input).permissionsMatch).toBe(false);
    input.started.sandbox.excludeSlashTmp = true;
    input.started.sandbox.writableRoots = ["/unrelated"];
    expect(assessHost(input).permissionsMatch).toBe(false);
  });
  it.each(["untrusted", "modified"])("blocks hook trust %s", (trustStatus) => {
    const input = fixture(); input.hooks.data[0].hooks[0].trustStatus = trustStatus;
    expect(assessHost(input).hookTrusted).toBe(false);
  });
  it("fails closed for absent or disabled hooks and unknown evidence", () => {
    const input = fixture(); input.hooks.data[0].hooks[0].enabled = false;
    expect(assessHost(input).hookTrusted).toBe(false);
    expect(assessHost({ ...input, hooks: {} }).hookTrusted).toBe(false);
    expect(assessHost({ ...input, started: {} }).permissionsMatch).toBe(false);
  });
  it("only starts an ephemeral thread and reads hooks; never sends a prompt or trust update", async () => {
    const input = fixture(); const calls: { method: string; params: unknown }[] = [];
    const result = await inspectSession(async (method, params) => {
      calls.push({ method, params }); return method === "thread/start" ? input.started : input.hooks;
    }, input);
    expect(calls.map((call) => call.method)).toEqual(["thread/start", "hooks/list"]);
    expect(calls[0].params).toMatchObject({ ephemeral: true, approvalPolicy: "never", sandbox: "read-only",
      runtimeWorkspaceRoots: [cwd], allowProviderModelFallback: false });
    expect(result.modelTurnsStarted).toBe(0);
    expect(result.toolCallsRequested).toBe(0);
  });
  it("propagates RPC failure instead of reporting eligibility", async () => {
    await expect(inspectSession(async () => { throw new Error("fixture failure"); }, fixture())).rejects.toThrow("fixture failure");
  });
  it.each(["scout", "builder", "auditor"] as const)("reads the real %s profile without changing its model", (role) => {
    const profile = readRoleProfile(process.cwd(), role);
    expect(profile.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(profile.model).not.toBe("");
    expect(profile.sandbox).toBe(role === "builder" ? "workspace-write" : "read-only");
  });
  it("rejects a missing binary without leaving the inspection pending", async () => {
    await expect(inspectRoleHost({ cwd: process.cwd(), role: "scout", codex: "/nonexistent/obraxen-codex", timeoutMs: 500 }))
      .rejects.toThrow("host_start_failed");
  });
  it("bounds a silent subprocess", async () => {
    const codex = fakeHost("setInterval(() => {}, 1000);");
    await expect(inspectRoleHost({ cwd: process.cwd(), role: "scout", codex, timeoutMs: 100 }))
      .rejects.toThrow("host_timeout");
  });
  it.each(["not-json", "null", "[]", '{"id":99,"method":"item/tool/requestApproval"}'])("rejects unsafe protocol input %s", async (line) => {
    const codex = fakeHost(`process.stdout.write(${JSON.stringify(line + "\n")}); setInterval(() => {}, 1000);`);
    await expect(inspectRoleHost({ cwd: process.cwd(), role: "scout", codex, timeoutMs: 1000 })).rejects.toThrow();
  });
  it("limits total output and terminates its host", async () => {
    const codex = fakeHost('process.stdout.write("x".repeat(3 * 1024 * 1024)); setInterval(() => {}, 1000);');
    await expect(inspectRoleHost({ cwd: process.cwd(), role: "scout", codex, timeoutMs: 1000 }))
      .rejects.toThrow("host_output_limit");
  });
  it("bounds cleanup when the host ignores SIGTERM", async () => {
    const codex = fakeHost('process.on("SIGTERM", () => {}); setInterval(() => {}, 1000);');
    const start = performance.now();
    await expect(inspectRoleHost({ cwd: process.cwd(), role: "scout", codex, timeoutMs: 400 }))
      .rejects.toThrow("host_timeout");
    expect(performance.now() - start).toBeLessThan(3500);
  });
  it.each(["not-json", '{"id":99,"method":"item/tool/requestApproval"}'])("rejects %s after the final RPC response in the same chunk", async (tail) => {
    const input = fixture();
    const codex = fakeHost(`
      const readline = require("node:readline");
      const responses = ${JSON.stringify({ 1: {}, 2: input.started, 3: input.hooks })};
      readline.createInterface({ input: process.stdin }).on("line", (line) => {
        const request = JSON.parse(line);
        if (request.id === undefined) return;
        const response = JSON.stringify({ id: request.id, result: responses[request.id] }) + "\\n";
        process.stdout.write(response + (request.id === 3 ? ${JSON.stringify(tail + "\n")} : ""));
      });
    `);
    await expect(inspectRoleHost({ cwd: process.cwd(), role: "scout", codex, timeoutMs: 1000 }))
      .rejects.toThrow(tail === "not-json" ? "invalid_host_json" : "unexpected_host_request");
  });
});
