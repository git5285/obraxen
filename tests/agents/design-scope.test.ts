import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { designPaths, runDesignHook } from "../../.codex/hooks/design-scope.mjs";
import type { DesignRunner } from "../../.codex/hooks/design-scope.mjs";

const roots: string[] = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "obraxen-design-scope-")));
  roots.push(root);
  const binary = join(root, ".agents/skills/impeccable/scripts/bin", `${process.platform}-${process.arch}`, "impeccable");
  mkdirSync(dirname(binary), { recursive: true });
  writeFileSync(binary, "fixture; execution replaced with spy");
  return root;
}
function cleanup(root: string) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) cleanup(path); else unlinkSync(path);
  }
  rmdirSync(root);
}
afterEach(() => { for (const root of roots.splice(0)) cleanup(root); });
function edit(path: string) { return { hook_event_name: "PostToolUse", tool_name: "Write", tool_input: { file_path: path } }; }

describe("design hook scope", () => {
  it.each(["README.md", "docs/design.md", "automation/agents/policy.mjs", "tests/button.test.tsx", "src/app/api/route.tsx", "../outside.html"])("does not invoke Impeccable for %s", path => {
    const root = fixture();
    const run = vi.fn<DesignRunner>();
    expect(runDesignHook(edit(path), { root, home: root, run })).toBe("");
    expect(run).not.toHaveBeenCalled();
  });
  it("invokes the installed binary once for a UI edit with a bounded timeout", () => {
    const root = fixture();
    const output = JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: "reviewed UI" } });
    const run = vi.fn<DesignRunner>().mockReturnValue({ status: 0, stdout: output, stderr: "", pid: 1, output: [], signal: null });
    const event = edit(join(root, "apps/public-site/public/index.html"));
    expect(runDesignHook(event, { root, home: root, run })).toBe(output);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][1]).toEqual(["hook"]);
    expect(run.mock.calls[0][2]).toMatchObject({ cwd: root });
    const options = run.mock.calls[0][2]!;
    expect(options.timeout).toBeGreaterThan(0);
    expect(options.timeout).toBeLessThanOrEqual(3500);
    expect(JSON.parse(String(options.input)).tool_input.file_path).toBe(event.tool_input.file_path);
  });
  it("sends only UI paths to the binary for mixed patches and combines hook context into one JSON response", () => {
    const root = fixture();
    const run = vi.fn<DesignRunner>().mockReturnValue({ status: 0,
      stdout: JSON.stringify({ hookSpecificOutput: { additionalContext: "UI finding" } }), stderr: "", pid: 1, output: [], signal: null });
    const patch = "*** Update File: apps/public-site/public/index.html\n*** Update File: automation/agents/policy.mjs\n*** Update File: src/components/button.tsx\n";
    const output = runDesignHook({ hook_event_name: "PostToolUse", session_id: "test-session", tool_input: patch }, { root, home: root, run });
    expect(run).toHaveBeenCalledTimes(2);
    const payloads = run.mock.calls.map(call => JSON.parse(String(call[2]!.input)));
    expect(payloads.map(input => input.tool_input.file_path)).toEqual([
      join(root, "apps/public-site/public/index.html"), join(root, "src/components/button.tsx"),
    ]);
    expect(JSON.stringify(payloads)).not.toContain("automation/agents");
    expect(payloads.every(input => input.session_id === "test-session")).toBe(true);
    expect(JSON.parse(output).hookSpecificOutput.additionalContext).toBe("UI finding\nUI finding");
  });
  it("recognizes freeform and wrapped apply_patch paths without selecting deleted files", () => {
    const patch = "*** Begin Patch\n*** Update File: apps/public-site/public/assets/home.js\n*** Add File: src/components/button.tsx\n*** Delete File: src/components/old.tsx\n*** Update File: automation/agents/policy.mjs\n*** End Patch";
    for (const tool_input of [patch, { patch }, { input: patch }]) {
      expect(designPaths({ hook_event_name: "PostToolUse", tool_input }, "/fixture"))
        .toEqual(["apps/public-site/public/assets/home.js", "src/components/button.tsx"]);
    }
  });
  it("skips Stop and recursive Stop payloads even when they mention UI", () => {
    expect(designPaths({ ...edit("src/components/button.tsx"), hook_event_name: "Stop" })).toEqual([]);
    expect(designPaths({ ...edit("src/components/button.tsx"), stop_hook_active: true })).toEqual([]);
  });
  it("does not download or invoke a missing binary", () => {
    const root = fixture();
    const run = vi.fn<DesignRunner>();
    expect(runDesignHook(edit("src/components/button.tsx"), { root, home: join(root, "missing"), run })).toBe("");
    expect(run).not.toHaveBeenCalled();
  });
  it("keeps PreToolUse security binding and has no unconditional Stop design hook", () => {
    const hooks = JSON.parse(readFileSync(".codex/hooks.json", "utf8")).hooks;
    expect(hooks.PreToolUse[0].hooks[0].command).toBe("node .codex/hooks/pre-tool-policy.mjs");
    expect(hooks.PostToolUse[0].hooks[0].command).toBe("node .codex/hooks/design-scope.mjs");
    expect(hooks.Stop).toBeUndefined();
  });
  it("handles irrelevant and malformed payloads at the real CLI boundary without tool output", () => {
    for (const input of [JSON.stringify(edit("README.md")), "not JSON", JSON.stringify({ hook_event_name: "Stop" })]) {
      const result = spawnSync(process.execPath, [".codex/hooks/design-scope.mjs"], { input, encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toBe("");
    }
  });
});
