import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repository security policy", () => {
  it("ignores environment secrets at every depth but keeps the example available", () => {
    const secrets = [
      ".env", ".env.local", ".env.production", ".env.preview", ".env.staging",
      ".env.production.local", "nested/.env", "nested/.env.preview",
    ];
    const examples = [".env.example", "nested/.env.example"];
    const result = spawnSync("git", ["check-ignore", "--no-index", "-z", "--stdin"], {
      cwd: process.cwd(),
      input: [...secrets, ...examples].join("\0") + "\0",
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout.split("\0").filter(Boolean).sort()).toEqual([...secrets].sort());
  });

  it("checks the full lockfile for moderate or higher advisories in local and remote gates", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8"));
    expect(manifest.scripts["check:security"]).toBe(
      "npm audit --audit-level=moderate --package-lock-only --ignore-scripts --include=dev --include=optional --include=peer",
    );
    expect(manifest.scripts["check:quality"].split(" && ")).toContain(
      "node automation/agents/runtime.mjs exec -- npm run check:security",
    );
    const workflow = readFileSync(".github/workflows/quality.yml", "utf8");
    expect(workflow).toMatch(/name: Audit production and development dependencies\s+run: npm run check:security/);
  });

  it("does not omit dependency types when npm is configured for production", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8"));
    const auditFlags = manifest.scripts["check:security"].split(" ").slice(2);
    const result = spawnSync("npm", ["config", "list", "--json", ...auditFlags], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "production", npm_config_omit: "dev" },
    });
    expect(result.status, result.stderr).toBe(0);
    const config = JSON.parse(result.stdout);
    expect(config.omit).toEqual([]);
    expect(config.include).toEqual(expect.arrayContaining(["dev", "optional", "peer"]));
  });
});
