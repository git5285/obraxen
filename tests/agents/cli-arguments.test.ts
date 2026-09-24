import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { readArgumentValue } from "../../automation/agents/cli-arguments.mjs";

describe("strict CLI argument contract", () => {
  it.each([
    [[], null],
    [["--repo=inline"], null],
    [["--repo", "first", "--repo", "second"], "first"],
    [["--repo", " with spaces "], " with spaces "],
    [["--repo", "-single-dash"], "-single-dash"],
    [["--repo", "0"], "0"],
  ] as const)("preserves lookup for %j", (argv, expected) => {
    expect(readArgumentValue("--repo", argv)).toBe(expected);
  });

  it.each([["--repo"], ["--repo", ""], ["--repo", "--other"], ["--repo", "--"]])(
    "rejects a missing value in %j", (...argv) => {
      expect(() => readArgumentValue("--repo", argv)).toThrow(new Error("--repo requires a value"));
    },
  );

  it("reads the current argv on every call", () => {
    const original = process.argv;
    try {
      process.argv = ["node", "script", "--repo", "first"];
      expect(readArgumentValue("--repo")).toBe("first");
      process.argv = ["node", "script", "--repo", "second"];
      expect(readArgumentValue("--repo")).toBe("second");
    } finally {
      process.argv = original;
    }
  });

  it.each(["operations", "preflight", "control-surface", "lease", "authorizations"])(
    "%s rejects malformed input before accessing repository state", (entry) => {
      const result = spawnSync(process.execPath, [`automation/agents/${entry}.mjs`, "status", "--repo", "--invalid"], {
        encoding: "utf8",
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Error: --repo requires a value");
    },
  );
});
