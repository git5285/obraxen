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
import type { ScoutOutput } from "../../automation/agents/contracts.mjs";

const runtimeFingerprint = "f".repeat(64);

function activePolicy() {
  const policy = structuredClone(loadPolicy());
  policy.mode = "active";
  policy.authority.allowLocalDiff = true;
  return policy;
}

function shadowPolicy() {
  const policy = structuredClone(loadPolicy());
  policy.mode = "shadow";
  policy.authority.allowLocalDiff = false;
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
  it("starts in active local-diff mode with one writer and no external authority", () => {
    const policy = loadPolicy();
    expect(policy.mode).toBe("active");
    expect(policy.coordination).toEqual({ stateHome: "~/.local/state" });
    expect(policy.limits.maxConcurrentWriters).toBe(1);
    expect(policy.limits.maxPendingLocalDiffs).toBe(1);
    expect(policy.authority).toMatchObject({
      allowScout: true,
      allowMemoryPersistence: true,
      allowLocalDiff: true,
      allowCommit: false,
      allowPush: false,
      allowDraftPullRequest: false,
      allowMerge: false,
      allowDeploy: false,
      allowPublish: false,
      allowNetwork: false,
    });
    expect(policy.memory).toMatchObject({
      schemaVersion: 1,
      maxEpisodicRuns: 120,
      contextRecentRuns: 8,
      maxContextBytes: 32768,
    });
    expect(policy.reconciliation).toEqual({
      defaultBranch: "main",
      requiredPullRequestChecks: ["Quality gate"],
    });
    expect(policy.groupedAuthorizations).toEqual({
      enabled: true,
      maxChangedFiles: 20,
      maxSteps: 3,
      maxLifetimeSeconds: 86400,
      reservationTtlSeconds: 600,
      allowedActions: [
        "commit_candidate",
        "push_branch",
        "create_draft_pull_request",
      ],
    });
  });

  it("rejects unsafe policy escalation", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.authority.allowPublish = true;
    expect(() => validatePolicy(policy)).toThrow("permanently human-gated");
  });

  it("rejects unbounded or invalid human-delivery file limits", () => {
    for (const limit of [0, -1, 1.5, 21, Infinity, "20", null]) {
      const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
      policy.groupedAuthorizations.maxChangedFiles = limit;
      expect(() => validatePolicy(policy)).toThrow();
    }
    const legacy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    delete legacy.groupedAuthorizations.maxChangedFiles;
    expect(() => validatePolicy(legacy)).not.toThrow();
  });

  it("still rejects a nine-file autonomous diff with human delivery enabled", () => {
    const policy = loadPolicy();
    const paths = Array.from({ length: 9 }, (_, i) => `src/example-${i}.ts`);
    const result = validateDiff({ changedPaths: paths, allowedPaths: paths, addedLines: 9, deletedLines: 0 }, policy);
    expect(result.ok).toBe(false);
    expect(result.violations).toContain("changed file count exceeds 8");
  });

  it("rejects more than one pending autonomous local diff", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.limits.maxPendingLocalDiffs = 2;
    expect(() => validatePolicy(policy)).toThrow("exactly one pending");
  });

  it("rejects incoherent authority escalation", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.mode = "active";
    policy.authority.allowPush = true;
    expect(() => validatePolicy(policy)).toThrow("push authority requires commit authority");
  });

  it("rejects incoherent memory retention and context budgets", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.memory.contextRecentRuns = policy.memory.maxEpisodicRuns + 1;
    expect(() => validatePolicy(policy)).toThrow("exceeds retained episodic runs");
    policy.memory.contextRecentRuns = 1;
    policy.memory.maxContextBytes = 100;
    expect(() => validatePolicy(policy)).toThrow("at least 4096");
  });

  it("requires an exact 70/20/10 attention budget and complete domain coverage", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.attentionBudget.sequence[0] = "agent_maintenance";
    expect(() => validatePolicy(policy)).toThrow("70/20/10 allocation");

    const missingDomain = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    missingDomain.attentionBudget.productDomains.pop();
    expect(() => validatePolicy(missingDomain)).toThrow("every finding domain exactly once");
  });

  it("requires deterministic reconciliation configuration", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.reconciliation.defaultBranch = " main";
    expect(() => validatePolicy(policy)).toThrow("safe branch name");
    policy.reconciliation.defaultBranch = "main";
    policy.reconciliation.requiredPullRequestChecks = ["Quality gate", "Quality gate"];
    expect(() => validatePolicy(policy)).toThrow("must be unique");
    policy.reconciliation.requiredPullRequestChecks = [];
    expect(() => validatePolicy(policy)).toThrow("must contain exact check names");
  });

  it("bounds grouped human authorizations without enabling standing authority", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    policy.groupedAuthorizations.allowedActions.push("merge");
    expect(() => validatePolicy(policy)).toThrow("unsupported or duplicate actions");
    policy.groupedAuthorizations.allowedActions.pop();
    policy.groupedAuthorizations.maxLifetimeSeconds = 86401;
    expect(() => validatePolicy(policy)).toThrow("exceeds 24 hours");
    policy.groupedAuthorizations.maxLifetimeSeconds = 86400;
    policy.groupedAuthorizations.reservationTtlSeconds = 901;
    expect(() => validatePolicy(policy)).toThrow("exceeds 15 minutes");
    policy.groupedAuthorizations.reservationTtlSeconds = 600;
    policy.mode = "shadow";
    expect(() => validatePolicy(policy)).toThrow("require active policy mode");
    expect(policy.authority.allowCommit).toBe(false);
    expect(policy.authority.allowPush).toBe(false);
    expect(policy.authority.allowDraftPullRequest).toBe(false);
  });

  it("requires one governed state home that matches the sandbox namespace", () => {
    const policy = JSON.parse(readFileSync("automation/agents/policy.json", "utf8"));
    const codexConfig = readFileSync(".codex/config.toml", "utf8");
    expect(codexConfig).toContain('writable_roots = ["~/.local/state/obraxen"]');

    policy.coordination.stateHome = "relative/state";
    expect(() => validatePolicy(policy)).toThrow("must be absolute or home-relative");
    policy.coordination.stateHome = "~/.local/state ";
    expect(() => validatePolicy(policy)).toThrow("must not contain surrounding whitespace");
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
    }, shadowPolicy());
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

  it.each([
    ".gitattributes",
    ".gitignore",
    ".npmrc",
    ".nvmrc",
    "AUTONOMOUS_IMPROVEMENT.md",
    "CLAUDE.md",
    "NAMING_CLEARANCE.md",
    "data/ofertas.schema.json",
    "data/proyectos.schema.json",
    "eslint.config.mjs",
    "scripts/lighthouse-budgets.ts",
    "scripts/qa-port.d.mts",
    "tsconfig.json",
    "vitest.config.ts",
  ])("protects operational guardrail %s from autonomous diffs", (path) => {
    const result = validateDiff({
      changedPaths: [path],
      allowedPaths: [path],
      addedLines: 1,
      deletedLines: 1,
    }, activePolicy());
    expect(result.ok).toBe(false);
    expect(result.violations).toContain(`${path} is protected`);
  });

  it("does not retain removed project draft paths in policy", () => {
    expect(activePolicy().protectedPaths).not.toContain("data/proyectos.borrador.json");
  });
});

describe("custom-agent pre-tool hook", () => {
  it("blocks the builder deterministically while policy remains in shadow mode", () => {
    const result = evaluateToolUse({
      agent_type: "builder",
      tool_name: "apply_patch",
      tool_input: { patch: "*** Update File: src/components/project-card.tsx" },
    }, shadowPolicy());
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
    "*** Delete File: src/components/project-card.tsx",
    "*** Update File: src/components/project-card.tsx\n*** Move to: src/components/renamed-card.tsx",
  ])("rejects builder deletion or movement even between ordinary paths: %s", (patch) => {
    for (const tool_input of [patch, { patch }]) {
      expect(evaluateToolUse({ agent_type: "builder", tool_name: "apply_patch", tool_input }, activePolicy())
        ?.hookSpecificOutput.permissionDecision).toBe("deny");
    }
  });

  it("rejects the network-dependent aggregate gate but preserves local builder checks", () => {
    const input = (script: string) => ({agent_type: "builder", tool_name: "exec_command",
      tool_input: {cmd: `node automation/agents/runtime.mjs exec -- npm run ${script}`}});
    expect(evaluateToolUse(input("check:quality"), activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(evaluateToolUse(input("check:security"), activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
    for (const script of ["check", "lint", "typecheck", "test -- tests/card.test.ts", "build"])
      expect(evaluateToolUse(input(script), activePolicy())).toBeNull();
    expect(evaluateToolUse({agent_type: "builder", tool_name: "apply_patch", tool_input: {
      patch: "*** Begin Patch\n*** Update File: src/components/project-card.tsx\n@@\n-old\n+new\n*** End Patch",
    }}, activePolicy())).toBeNull();
  });

  it.each([
    'node automation/agents/runtime.mjs exec -- npm run check"":quality',
    'r""m src/components/project-card.tsx',
    'm""v src/components/project-card.tsx src/components/renamed-card.tsx',
    '"rm" src/components/project-card.tsx',
    "env 'mv' src/a.ts src/b.ts",
    "r\\m src/a.ts",
    "$'\\162\\155' src/a.ts",
    "/bin/r[m] -- src/components/project-card.tsx",
    "/bin/m[v] -- src/components/project-card.tsx src/components/renamed-card.tsx",
    "node automation/agents/runtime.mjs exec -- npm run check --prefix /tmp/other-project",
    "node automation/agents/runtime.mjs exec -- npm run check --prefix=/tmp/other-project",
    "node automation/agents/runtime.mjs exec -- npm run test --workspace foreign",
    "node automation/agents/runtime.mjs exec -- npm run test -- --config /tmp/foreign.ts",
    'node automation/agents/runtime.mjs exec -- npm run test -- "--config" /tmp/foreign.ts',
    'node automation/agents/runtime.mjs exec -- npm run test -- "--config=/tmp/foreign.ts"',
    "node automation/agents/runtime.mjs exec -- npm run test -- '--config' /tmp/foreign.ts",
    "node automation/agents/runtime.mjs exec -- npm run test -- '--config=/tmp/foreign.ts'",
    'node automation/agents/runtime.mjs exec -- npm run test -- "--workspace" foreign',
    'node automation/agents/runtime.mjs exec -- npm run test -- --root /tmp/foreign-project',
    'node automation/agents/runtime.mjs exec -- npm run test -- "--root=/tmp/foreign-project"',
    'node automation/agents/runtime.mjs exec -- npm run test -- -r /tmp/foreign-project',
    'node automation/agents/runtime.mjs exec -- npm run test -- --runner /tmp/foreign.mjs',
    'node automation/agents/runtime.mjs exec -- npm run test -- --reporter /tmp/foreign.mjs',
    'node automation/agents/runtime.mjs exec -- npm run test -- /tmp/foreign.test.ts',
    'node automation/agents/runtime.mjs exec -- npm run test -- --testTimeout 999999',
    'node automation/agents/runtime.mjs exec -- npm run build -- /tmp/foreign-project',
  ])("rejects shell spellings that conceal forbidden builder commands: %s", (cmd) => {
    expect(evaluateToolUse({agent_type: "builder", tool_name: "exec_command", tool_input: {cmd}}, activePolicy())
      ?.hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("preserves whole quoted arguments for ordinary local inspection", () => {
    expect(evaluateToolUse({agent_type: "builder", tool_name: "exec_command",
      tool_input: {cmd: 'rg "project card" src/components'}}, activePolicy())).toBeNull();
    expect(evaluateToolUse({agent_type: "builder", tool_name: "exec_command",
      tool_input: {cmd: "sed -n '1,30p' 'src/app/[lang]/page.tsx'"}}, activePolicy())).toBeNull();
  });

  it("preserves bounded test selection and documented check arguments", () => {
    for (const cmd of [
      'node automation/agents/runtime.mjs exec -- npm run test -- tests/card.test.ts -t "renders card"',
      'node automation/agents/runtime.mjs exec -- npm run test -- tests/agents --no-file-parallelism',
      'node automation/agents/runtime.mjs exec -- npm run check:diff -- --base-sha abc123 --head HEAD',
      'node automation/agents/runtime.mjs exec -- npm run check:diff -- --base-sha abc123 --worktree',
      'node automation/agents/runtime.mjs exec -- npm run check:activation -- --json',
    ]) expect(evaluateToolUse({agent_type: "builder", tool_name: "exec_command", tool_input: {cmd}}, activePolicy())).toBeNull();
  });

  it("validates move destinations before allowing a builder patch", () => {
    for (const destination of [
      "automation/agents/escaped.mjs",
      "../outside-repository.txt",
    ]) {
      const result = evaluateToolUse({
        agent_type: "builder",
        tool_name: "apply_patch",
        tool_input: {
          patch: [
            "*** Update File: src/components/project-card.tsx",
            `*** Move to: ${destination}`,
          ].join("\n"),
        },
      }, activePolicy());
      expect(result?.hookSpecificOutput.permissionDecision).toBe("deny");
    }
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
      tool_input: { command: "node automation/agents/runtime.mjs exec -- npm run test -- tests/card.test.ts" },
    }, activePolicy())).toBeNull();
    expect(evaluateToolUse({
      agent_type: "default",
      tool_name: "Shell",
      tool_input: { command: "git push origin reviewed-branch" },
    })).toBeNull();
  });

  it("blocks specialist runtime commands that bypass the pinned launcher", () => {
    for (const role of ["scout", "auditor", "builder"]) {
      expect(evaluateToolUse({
        agent_type: role,
        tool_name: "Shell",
        tool_input: { command: "npm run test" },
      }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
    }
  });

  it("blocks runtime wrapper composition that escapes the pinned launcher", () => {
    for (const role of ["scout", "auditor", "builder"]) {
      for (const command of [
        "node automation/agents/runtime.mjs status && npm run test",
        "node automation/agents/runtime.mjs assert; node scripts/read-project.mjs",
        "node automation/agents/runtime.mjs exec -- npm run test | tee result.txt",
        "node automation/agents/runtime.mjs exec -- npm run $(echo test)",
      ]) {
        expect(evaluateToolUse({
          agent_type: role,
          tool_name: "Shell",
          tool_input: { command },
        }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
      }
    }
  });

  it("limits the builder runtime wrapper to preflight and versioned verification scripts", () => {
    for (const command of [
      "node automation/agents/runtime.mjs exec -- node scripts/mutate-worktree.mjs",
      "node automation/agents/runtime.mjs exec -- python3 scripts/mutate-worktree.py",
      "node automation/agents/runtime.mjs exec -- npm run dev",
    ]) {
      expect(evaluateToolUse({
        agent_type: "builder",
        tool_name: "Shell",
        tool_input: { command },
      }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
    }
    expect(evaluateToolUse({
      agent_type: "builder",
      tool_name: "Shell",
      tool_input: {
        command: "node automation/agents/runtime.mjs exec -- node automation/agents/preflight.mjs --json",
      },
    }, activePolicy())).toBeNull();
  });

  it("limits read-only specialists to read operations and versioned verification scripts", () => {
    const denied = [
      "node automation/agents/runtime.mjs exec -- node automation/agents/operations.mjs transition --thread-id task --state liberado",
      "node automation/agents/runtime.mjs exec -- node automation/agents/memory.mjs record --file report.json",
      "node automation/agents/runtime.mjs exec -- node automation/agents/reconcile.mjs apply --candidate-id candidate",
      "node automation/agents/runtime.mjs exec -- node automation/agents/lease.mjs acquire --owner-json {}",
      "node automation/agents/runtime.mjs exec -- node scripts/mutate-worktree.mjs",
      "python3 scripts/mutate-worktree.py",
    ];
    const allowed = [
      "node automation/agents/runtime.mjs exec -- node automation/agents/preflight.mjs --json",
      "node automation/agents/runtime.mjs exec -- node automation/agents/operations.mjs status",
      "node automation/agents/runtime.mjs exec -- node automation/agents/memory.mjs context --base-sha abc",
      "node automation/agents/runtime.mjs exec -- node automation/agents/reconcile.mjs list",
      "node automation/agents/runtime.mjs exec -- npm run test -- tests/card.test.ts",
    ];

    for (const role of ["scout", "auditor"]) {
      for (const command of denied) {
        expect(evaluateToolUse({
          agent_type: role,
          tool_name: "Shell",
          tool_input: { command },
        }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
      }
      for (const command of allowed) {
        expect(evaluateToolUse({
          agent_type: role,
          tool_name: "Shell",
          tool_input: { command },
        }, activePolicy())).toBeNull();
      }
    }
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
      "mkdir src/generated-output",
      "ln -s source.txt src/generated-link.txt",
      "find src -delete",
      "sort input.txt -o src/sorted.txt",
    ]) {
      expect(evaluateToolUse({
        agent_type: "builder",
        tool_name: "Shell",
        tool_input: { command },
      }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
    }
  });

  it("treats create and save tools as writes for every specialist", () => {
    for (const role of ["scout", "auditor", "builder"]) {
      for (const tool_name of ["create_file", "SaveFile", "upload_asset", "write_file", "delete_file"]) {
        expect(evaluateToolUse({
          agent_type: role,
          tool_name,
          tool_input: { path: "src/generated-output.txt" },
        }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
      }
    }
  });

  it("does not classify read-only tool names by incidental verbs", () => {
    for (const tool_name of ["create_report", "save_query", "copy_search_results", "move_cursor"]) {
      expect(evaluateToolUse({
        agent_type: "scout",
        tool_name,
        tool_input: { path: "src/example.ts" },
      }, activePolicy())).toBeNull();
    }
  });

  it("prevents every specialist from creating or consuming human authorization", () => {
    for (const role of ["scout", "auditor", "builder"]) {
      for (const operation of ["register", "reserve", "complete", "revoke"]) {
        expect(evaluateToolUse({
          agent_type: role,
          tool_name: "Shell",
          tool_input: {
            command: `node automation/agents/authorizations.mjs ${operation} --file evidence.json`,
          },
        }, activePolicy())?.hookSpecificOutput.permissionDecision).toBe("deny");
      }
    }
    expect(evaluateToolUse({
      agent_type: "scout",
      tool_name: "Shell",
      tool_input: { command: "node automation/agents/runtime.mjs exec -- node automation/agents/authorizations.mjs status" },
    }, activePolicy())).toBeNull();
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
      schemaVersion: 4,
      status: "implemented",
      attentionClass: "product",
      runId: "run-1",
      candidateId: "candidate-run-1",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
      changedPaths: [],
      checksRun: [],
      residualRisks: [],
      reason: "claimed success",
    })).toThrow("requires changedPaths");
  });

  it("accepts explicit blocked and veto outputs", () => {
    expect(validateBuilderOutput({
      schemaVersion: 4,
      status: "blocked",
      attentionClass: "product",
      runId: "run-1",
      candidateId: "candidate-run-1",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
      changedPaths: [],
      checksRun: [],
      residualRisks: ["missing manifest"],
      reason: "manifest missing",
    }).status).toBe("blocked");
    expect(validateAuditorOutput({
      schemaVersion: 4,
      verdict: "veto",
      attentionClass: "product",
      runId: "run-1",
      candidateId: "candidate-run-1",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
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
      schemaVersion: 4,
      status: "proposal",
      attentionClass: "reliability",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
      activeClaims: [],
      findings: [finding, finding, finding, finding],
      recommendedId: "one",
      reason: "too many",
    })).toThrow("too many findings");
  });

  it("rejects scout findings outside the assigned attention class", () => {
    expect(() => validateScoutOutput({
      schemaVersion: 4,
      status: "proposal",
      attentionClass: "product",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
      activeClaims: [],
      findings: [{
        id: "reliability-in-product-slot",
        domain: "testing",
        summary: "Strengthen a reliability test",
        evidence: [{
          kind: "repository_fact",
          source: "tests/example.test.ts:1",
          fact: "The test lacks the expected assertion",
        }],
        impact: "medium",
        confidence: "high",
        risk: "low",
        candidatePaths: ["tests/example.test.ts"],
        verification: ["npm test"],
        conflicts: [],
      }],
      recommendedId: "reliability-in-product-slot",
      reason: "attempted focus drift",
    })).toThrow("belongs to reliability, not product");
  });

  it("requires evidence, passed builder checks and an evidenced audit pass", () => {
    expect(() => validateScoutOutput({
      schemaVersion: 4,
      status: "proposal",
      attentionClass: "reliability",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
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
      schemaVersion: 4,
      status: "implemented",
      attentionClass: "product",
      runId: "run-1",
      candidateId: "candidate-run-1",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
      changedPaths: ["src/example.ts"],
      checksRun: [{ command: "npm test", status: "failed", summary: "failed" }],
      residualRisks: [],
      reason: "claimed success",
    })).toThrow("cannot contain failed checks");

    expect(() => validateAuditorOutput({
      schemaVersion: 4,
      verdict: "pass",
      attentionClass: "product",
      runId: "run-1",
      candidateId: "candidate-run-1",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
      findings: [],
      verifiedChecks: [],
      reason: "claimed pass",
    })).toThrow("requires verifiedChecks");
  });

  it("preserves human declarations as declarations instead of documentary evidence", () => {
    const scoutOutput = {
      schemaVersion: 4,
      status: "proposal",
      attentionClass: "product",
      baseSha: "a".repeat(40),
      runtimeFingerprint,
      activeClaims: [],
      findings: [{
        id: "typed-evidence",
        domain: "evidence",
        summary: "Keep the source evidence level explicit",
        evidence: [{
          kind: "human_declaration",
          source: "conversation:turn-019f-example",
          statement: "The responsible person states that authorization exists",
        }],
        impact: "high",
        confidence: "high",
        risk: "low",
        candidatePaths: ["data/proyectos.json"],
        verification: ["npm run test -- tests/data.test.ts"],
        conflicts: [],
      }],
      recommendedId: "typed-evidence",
      reason: "The declaration is useful but is not a document or professional review",
    } satisfies ScoutOutput;

    expect(validateScoutOutput(scoutOutput).status).toBe("proposal");
    expect(() => validateScoutOutput({
      ...scoutOutput,
      findings: [{
        ...scoutOutput.findings[0],
        evidence: [{
          kind: "document_reference",
          source: "conversation:turn-019f-example",
          statement: "The responsible person states that authorization exists",
        }],
      }],
    })).toThrow("unexpected keys");
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
