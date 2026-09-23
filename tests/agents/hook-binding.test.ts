import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isolatedRoleEnvironment, type Role } from "../../automation/agents/isolated-host.mjs";

function invoke(env: NodeJS.ProcessEnv, input: string) {
  const result = spawnSync(process.execPath, [".codex/hooks/pre-tool-policy.mjs"], {
    cwd: process.cwd(), env, input, encoding: "utf8", timeout: 2000,
  });
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout).hookSpecificOutput;
}

describe("isolated diagnostic process-to-hook binding", () => {
  it("dispatches only a repository-bound call to the configured executor", async() => {
    const { evaluateBoundRepositoryTool } = await import("../../.codex/hooks/pre-tool-policy.mjs") as unknown as {
      evaluateBoundRepositoryTool:(input:unknown, environment:NodeJS.ProcessEnv,
        repositoryHook?:(value:unknown, environment:NodeJS.ProcessEnv)=>{hookSpecificOutput:{hookEventName:string;additionalContext:string}})
        =>{hookSpecificOutput:{hookEventName:string;additionalContext:string}}|null;
    };
    const input = { tool_name: "Bash", tool_input: { command: "measured command" } };
    let received: unknown;
    const output = evaluateBoundRepositoryTool(input, { ...process.env, OBRAXEN_ISOLATED_MODE: "repository" }, (value:unknown, environment:NodeJS.ProcessEnv) => {
      received = { value, environment };
      return { hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: "repository-receipt" } };
    });
    expect(output?.hookSpecificOutput.additionalContext).toBe("repository-receipt");
    expect(received).toMatchObject({ value: input, environment: { OBRAXEN_ISOLATED_MODE: "repository" } });
    expect(evaluateBoundRepositoryTool(input, process.env)).toBeNull();
    const definition = JSON.parse(readFileSync(".codex/hooks.json", "utf8"));
    expect(definition.hooks.PreToolUse[0].hooks[0]).toMatchObject({
      type: "command", command: "node .codex/hooks/pre-tool-policy.mjs", timeout: 5,
    });
  });
  it("runs the configured dispatcher and fails closed for an invalid repository binding", () => {
    const result = spawnSync(process.execPath, [".codex/hooks/pre-tool-policy.mjs"], {
      cwd: process.cwd(), encoding: "utf8", input: "private-repository-canary",
      env: { ...process.env, OBRAXEN_ISOLATED_MODE: "repository" },
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision).toBe("deny");
    expect(result.stdout).not.toContain("private-repository-canary");
  });
  it.each(["scout", "builder", "auditor"] as const)("binds %s without agent_type and denies every tool", (role) => {
    const env = isolatedRoleEnvironment(role);
    for (const tool of ["Bash", "apply_patch", "mcp__external__send_message", "unknown"]) {
      const output = invoke(env, JSON.stringify({ hook_event_name: "PreToolUse", tool_name: tool,
        tool_input: { command: "diagnostic text only, never executed" } }));
      expect(output.permissionDecision).toBe("deny");
      expect(output.permissionDecisionReason).toContain(`Obraxen ${role}:`);
    }
  });
  it("ignores attempted role/mode overrides in tool arguments", () => {
    const result = invoke(isolatedRoleEnvironment("scout"), JSON.stringify({ agent_type: "builder",
      tool_input: { OBRAXEN_ISOLATED_ROLE: "builder", OBRAXEN_ISOLATED_MODE: "active" } }));
    expect(result.permissionDecision).toBe("deny");
    expect(result.permissionDecisionReason).toContain("scout");
  });
  it("overwrites inherited bindings without changing the caller environment", () => {
    const original = { ...process.env, OBRAXEN_ISOLATED_ROLE: "builder", OBRAXEN_ISOLATED_MODE: "active" };
    expect(isolatedRoleEnvironment("auditor", original)).toMatchObject({
      OBRAXEN_ISOLATED_ROLE: "auditor", OBRAXEN_ISOLATED_MODE: "diagnostic",
    });
    expect(original.OBRAXEN_ISOLATED_MODE).toBe("active");
  });
  it.each([
    { OBRAXEN_ISOLATED_ROLE: "invalid" },
    { OBRAXEN_ISOLATED_MODE: "diagnostic" },
    { OBRAXEN_ISOLATED_ROLE: "builder", OBRAXEN_ISOLATED_MODE: "active" },
  ])("rejects partial or unknown bindings", (binding) => {
    const output = invoke({ ...process.env, ...binding }, "not-json");
    expect(output.permissionDecision).toBe("deny");
    expect(output.permissionDecisionReason).toContain("inválida");
  });
  it("rejects unknown roles before host launch", () => {
    expect(() => isolatedRoleEnvironment("default" as Role)).toThrow("unknown_role");
  });
});
