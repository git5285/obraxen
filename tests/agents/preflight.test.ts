import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deriveGating, parseClaim, parseWorktrees } from "../../automation/agents/preflight.mjs";

describe("cross-worktree preflight parsers", () => {
  it("parses branches, detached worktrees and HEADs", () => {
    expect(parseWorktrees(`worktree /repo/main
HEAD ${"a".repeat(40)}
branch refs/heads/main

worktree /repo/agent
HEAD ${"b".repeat(40)}
detached
`)).toEqual([
      { worktree: "/repo/main", HEAD: "a".repeat(40), branch: "refs/heads/main" },
      { worktree: "/repo/agent", HEAD: "b".repeat(40), detached: true },
    ]);
  });

  it("extracts active claim state and exact reserved paths", () => {
    const claim = parseClaim(`# Work
- thread_id: abc
- estado: en_curso
- archivos:
  - src/a.ts
  - tests/a.test.ts
- siguiente_paso: continue
`, ".coordination/claims/abc.md", "/repo/agent");
    expect(claim).toMatchObject({
      threadId: "abc",
      state: "en_curso",
      files: ["src/a.ts", "tests/a.test.ts"],
      worktree: "/repo/agent",
    });
  });
});

describe("fail-closed gating (DISCOVERED-20260716-01)", () => {
  const shadowPolicy = { mode: "shadow", authority: { allowScout: true, allowLocalDiff: false } };
  const activePolicy = { mode: "active", authority: { allowScout: true, allowLocalDiff: true } };
  const readable = [
    { path: "/repo/main", status: [] },
    { path: "/repo/agent", status: ["?? notes.md"] },
  ];

  it("keeps scout eligible when every registered worktree is readable", () => {
    const gating = deriveGating({ policy: shadowPolicy, lease: null, worktrees: readable });
    expect(gating).toMatchObject({
      unreadableWorktrees: [],
      eligibility: { scout: true, writer: false },
      blockers: ["policy_mode_shadow"],
    });
  });

  it("fails closed on the reproduced eval-10 fixture: unreadable worktree disables scout", () => {
    const fixture = JSON.parse(readFileSync(fileURLToPath(new URL(
      "../../.agents/skills/remainon-continuous-improvement/evals/intake-20260716/fixtures/preflight-unreadable.json",
      import.meta.url,
    )), "utf8"));
    const gating = deriveGating({
      policy: shadowPolicy,
      lease: fixture.lease,
      worktrees: fixture.worktrees,
    });
    expect(gating.unreadableWorktrees).toEqual(["/repo/main"]);
    expect(gating.eligibility).toEqual({ scout: false, writer: false });
    expect(gating.blockers).toContain("unreadable_worktrees");
  });

  it("fails closed when a worktree's claims cannot be read even if git status succeeded", () => {
    const gating = deriveGating({
      policy: shadowPolicy,
      lease: null,
      worktrees: readable,
      claimFailures: [{ path: "/repo/main", reason: "EACCES: permission denied" }],
    });
    expect(gating.unreadableWorktrees).toEqual(["/repo/main"]);
    expect(gating.eligibility.scout).toBe(false);
    expect(gating.blockers).toContain("unreadable_worktrees");
  });

  it("denies the writer in active mode while any worktree is unreadable", () => {
    const gating = deriveGating({
      policy: activePolicy,
      lease: null,
      worktrees: [
        { path: "/repo/main", status: ["unreadable: fatal: this operation must be run in a work tree"] },
        { path: "/repo/agent", status: [] },
      ],
    });
    expect(gating.eligibility).toEqual({ scout: false, writer: false });
    expect(gating.blockers).toEqual(["unreadable_worktrees"]);
  });
});
