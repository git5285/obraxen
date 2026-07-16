import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateToolUse } from "../../.codex/hooks/pre-tool-policy.mjs";
import {
  assertActivationUnchanged,
  parseActivationCommand,
  validateActivationReport,
} from "../../automation/agents/activation-policy.mjs";
import { validateDiff } from "../../automation/agents/diff-policy.mjs";
import { loadPolicy, validatePolicy } from "../../automation/agents/policy.mjs";
import {
  parseRoleOutput,
  validateAuditorOutput,
  validateBuilderOutput,
  validateScoutOutput,
} from "../../automation/agents/contracts.mjs";

function activePolicy() {
  const policy = structuredClone(loadPolicy());
  policy.mode = "active";
  policy.authority.allowLocalDiff = true;
  return policy;
}

function activationReport() {
  return {
    schemaVersion: 1 as const,
    decision: "NO-GO" as const,
    candidateAuditRequired: true,
    publicationAuthorized: false,
    publishSwitch: false,
    blockerCount: 1,
    blockers: ["evidence missing"],
  };
}

describe("autonomous-agent policy", () => {
  it("starts in shadow mode with one writer and no external authority", () => {
    const policy = loadPolicy();
    expect(policy.mode).toBe("shadow");
    expect(policy.limits.maxConcurrentWriters).toBe(1);
    expect(policy.authority).toMatchObject({
      allowScout: true,
      allowLocalDiff: false,
      allowCommit: false,
      allowPush: false,
      allowDraftPullRequest: false,
      allowMerge: false,
      allowDeploy: false,
      allowPublish: false,
      allowNetwork: false,
    });
  });

  it("rejects unsafe policy escalation", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.authority.allowPublish = true;
    expect(() => validatePolicy(policy)).toThrow("permanently human-gated");
  });

  it("rejects incoherent authority escalation", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.mode = "active";
    policy.authority.allowPush = true;
    expect(() => validatePolicy(policy)).toThrow("push authority requires commit authority");
  });

  it("treats a valid activation NO-GO exit 1 as expected", () => {
    const report = activationReport();
    expect(parseActivationCommand({
      status: 1,
      stdout: JSON.stringify(report),
      stderr: "",
    })).toEqual(report);
    expect(() => parseActivationCommand({
      status: 2,
      stdout: JSON.stringify(report),
      stderr: "",
    })).toThrow("failed unexpectedly");
  });

  it("requires activation output to remain exactly unchanged", () => {
    const before = activationReport();
    expect(assertActivationUnchanged(before, structuredClone(before))).toBe(true);
    expect(() => assertActivationUnchanged(before, {
      ...before,
      blockerCount: 0,
      blockers: [],
      decision: "READY_FOR_PROTECTED_CANDIDATE",
    })).toThrow("changed the activation report");
    expect(() => validateActivationReport({ ...before, publishSwitch: true })).toThrow("publishSwitch changed");
  });

  it("enforces exact paths, protected paths and diff budgets", () => {
    const policy = activePolicy();
    expect(validateDiff({
      changedPaths: ["src/components/card.tsx"],
      allowedPaths: ["src/components/card.tsx"],
      addedLines: 20,
      deletedLines: 2,
    }, policy).ok).toBe(true);
    const result = validateDiff({
      changedPaths: ["data/brand.json"],
      allowedPaths: ["data/brand.json"],
      addedLines: 1,
      deletedLines: 1,
    }, policy);
    expect(result.ok).toBe(false);
    expect(result.violations).toContain("data/brand.json is protected");
  });

  it("rejects every local diff while policy remains in shadow mode", () => {
    const result = validateDiff({
      changedPaths: ["src/components/project-card.tsx"],
      allowedPaths: ["src/components/project-card.tsx"],
      addedLines: 1,
      deletedLines: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toContain("policy does not authorize local diffs");
  });

  it("enforces dependency authority independently from the protected path list", () => {
    const policy = activePolicy();
    policy.protectedPaths = policy.protectedPaths.filter((path) => !path.startsWith("package"));
    const result = validateDiff({
      changedPaths: ["package.json"],
      allowedPaths: ["package.json"],
      addedLines: 1,
      deletedLines: 1,
    }, policy);
    expect(result.violations).toContain("package.json changes dependencies without authority");
  });
});

describe("custom-agent pre-tool hook", () => {
  it("blocks the builder deterministically while policy remains in shadow mode", () => {
    const result = evaluateToolUse({
      agent_type: "builder",
      tool_name: "apply_patch",
      tool_input: { patch: "*** Update File: src/components/project-card.tsx" },
    });
    expect(result?.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(result?.hookSpecificOutput.permissionDecisionReason).toContain("modo activo");
  });

  it("blocks Git mutation by the builder", () => {
    const result = evaluateToolUse({
      agent_type: "builder",
      tool_name: "Shell",
      tool_input: { command: "git push origin feature" },
    }, activePolicy());
    expect(result?.hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("blocks a protected edit by the builder", () => {
    const result = evaluateToolUse({
      agent_type: "builder",
      tool_name: "apply_patch",
      tool_input: { patch: "*** Update File: data/brand.json" },
    }, activePolicy());
    expect(result?.hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it.each([
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "src/app/api/contact/route.ts",
    "src/app/api/analytics-config/route.ts",
    "src/components/consent-manager.tsx",
  ])("blocks safety-critical path %s", (path) => {
    const result = evaluateToolUse({
      agent_type: "builder",
      tool_name: "apply_patch",
      tool_input: { patch: `*** Update File: ${path}` },
    }, activePolicy());
    expect(result?.hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("allows a read-only test command and leaves normal interactive agents untouched", () => {
    expect(evaluateToolUse({
      agent_type: "builder",
      tool_name: "Shell",
      tool_input: { command: "npm run test -- tests/card.test.ts" },
    }, activePolicy())).toBeNull();
    expect(evaluateToolUse({
      agent_type: "default",
      tool_name: "Shell",
      tool_input: { command: "git push origin reviewed-branch" },
    })).toBeNull();
  });

  it("blocks wrapped Git and network mutation commands", () => {
    for (const command of [
      "env git commit -m unsafe",
      "sh -c 'git reset --hard'",
      "command curl https://example.invalid",
      "/usr/bin/git -C /tmp/repo push origin unsafe",
      "/usr/bin/curl https://example.invalid",
      "git apply proposed.patch",
      "npm exec -- mutate-worktree",
      "dd if=payload.txt of=src/components/project-card.tsx",
      "node scripts/mutate-worktree.mjs",
      "bash scripts/mutate-worktree.sh",
    ]) {
      expect(evaluateToolUse({
        agent_type: "builder",
        tool_name: "Shell",
        tool_input: { command },
      }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
    }
  });

  it("allows only apply_patch for an active builder write", () => {
    expect(evaluateToolUse({
      agent_type: "builder",
      tool_name: "apply_patch",
      tool_input: { patch: "*** Update File: src/components/project-card.tsx" },
    }, activePolicy())).toBeNull();
    expect(evaluateToolUse({
      agent_type: "builder",
      tool_name: "Write",
      tool_input: { path: "src/components/project-card.tsx" },
    }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
  });
});

describe("specialist output contracts", () => {
  it("rejects simulated delegation and token-only builder output", () => {
    expect(() => parseRoleOutput("builder", "BUILDER_OK")).toThrow("non-JSON output");
    expect(() => validateBuilderOutput({
      schemaVersion: 1,
      status: "implemented",
      runId: "run-1",
      baseSha: "a".repeat(40),
      changedPaths: [],
      checksRun: [],
      residualRisks: [],
      reason: "claimed success",
    })).toThrow("requires changedPaths");
  });

  it("accepts explicit blocked and veto outputs", () => {
    expect(validateBuilderOutput({
      schemaVersion: 1,
      status: "blocked",
      runId: "run-1",
      baseSha: "a".repeat(40),
      changedPaths: [],
      checksRun: [],
      residualRisks: ["missing manifest"],
      reason: "manifest missing",
    }).status).toBe("blocked");
    expect(validateAuditorOutput({
      schemaVersion: 1,
      verdict: "veto",
      runId: "run-1",
      baseSha: "a".repeat(40),
      findings: [{ severity: "blocker", source: "manifest", finding: "missing" }],
      verifiedChecks: [],
      reason: "manifest missing",
    }).verdict).toBe("veto");
  });

  it("enforces the scout finding budget", () => {
    const finding = {
      id: "one",
      domain: "testing",
      summary: "summary",
      evidence: [],
      impact: "low",
      confidence: "high",
      risk: "low",
      candidatePaths: [],
      verification: [],
      conflicts: [],
    };
    expect(() => validateScoutOutput({
      schemaVersion: 1,
      status: "proposal",
      baseSha: "a".repeat(40),
      activeClaims: [],
      findings: [finding, finding, finding, finding],
      recommendedId: "one",
      reason: "too many",
    })).toThrow("too many findings");
  });

  it("requires evidence, passed builder checks and an evidenced audit pass", () => {
    expect(() => validateScoutOutput({
      schemaVersion: 1,
      status: "proposal",
      baseSha: "a".repeat(40),
      activeClaims: [],
      findings: [{
        id: "one",
        domain: "testing",
        summary: "summary",
        evidence: [],
        impact: "low",
        confidence: "high",
        risk: "low",
        candidatePaths: ["src/example.ts"],
        verification: ["npm test"],
        conflicts: [],
      }],
      recommendedId: "one",
      reason: "candidate",
    })).toThrow("evidence must not be empty");

    expect(() => validateBuilderOutput({
      schemaVersion: 1,
      status: "implemented",
      runId: "run-1",
      baseSha: "a".repeat(40),
      changedPaths: ["src/example.ts"],
      checksRun: [{ command: "npm test", status: "failed", summary: "failed" }],
      residualRisks: [],
      reason: "claimed success",
    })).toThrow("cannot contain failed checks");

    expect(() => validateAuditorOutput({
      schemaVersion: 1,
      verdict: "pass",
      runId: "run-1",
      baseSha: "a".repeat(40),
      findings: [],
      verifiedChecks: [],
      reason: "claimed pass",
    })).toThrow("requires verifiedChecks");
  });

  it("rejects non-canonical paths and invalid diff counts", () => {
    const result = validateDiff({
      changedPaths: ["../data/brand.json"],
      allowedPaths: ["../data/brand.json"],
      addedLines: -1,
      deletedLines: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toContain("changedPaths contains a non-canonical repository path");
    expect(result.violations).toContain("addedLines must be a non-negative integer");
  });
});
