import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateToolUse } from "../../.codex/hooks/pre-tool-policy.mjs";

const wrapped = "node automation/agents/runtime.mjs exec -- npm run ";
function evaluate(command: string, role = "builder") {
  return evaluateToolUse({ agent_type: role, tool_name: "exec_command", tool_input: { cmd: command } });
}
describe("bounded Home checks for the builder", () => {
  it.each(["lint:home", "test:home"])("allows the existing %s script only with the pinned runtime and no extra arguments", script => {
    const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts;
    expect(scripts[script]).toBeTruthy();
    expect(evaluate(wrapped + script)).toBeNull();
    expect(evaluate("npm run " + script)).not.toBeNull();
    for (const args of [" -- --config outside.js", " -- --prefix /tmp", " -- --update", " && git push"]) {
      expect(evaluate(wrapped + script + args)).not.toBeNull();
    }
    for (const role of ["scout", "auditor"]) expect(evaluate(wrapped + script, role)).not.toBeNull();
  });
  it.each(["check:security", "check:quality", "dev", "install"])("does not add authority for %s", script => {
    expect(evaluate(wrapped + script)).not.toBeNull();
  });
});
