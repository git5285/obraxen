import { describe, expect, it } from "vitest";
import { parseClaim, parseWorktrees } from "../../automation/agents/preflight.mjs";

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
