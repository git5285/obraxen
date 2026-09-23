import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildControlSurface,
  classifyControlChange,
  classifyCandidateOwnership,
  deriveAutomationOwnership,
  deriveControllerOwner,
  deriveReviewTarget,
  deriveReviewRoute,
  deriveServerStatus,
  extractRootRedirect,
  parsePorcelainStatus,
} from "../../automation/agents/control-surface.mjs";
import { registerClone } from "../../automation/agents/lease.mjs";

const owner = "01a0875a-f16f-7d83-8e7d-dfd30c177a8d";
const claim = (suffix: string, files: string[]) => ({
  threadId: `${owner}-${suffix}`,
  state: "esperando_revision" as const,
  claim: { source: `.coordination/claims/${suffix}.md`, contentDigest: "a".repeat(64), files },
  latestEventId: "event",
  latestOccurredAt: "2026-09-10T12:00:00Z",
  eventCount: 2,
  latestEvidence: [],
});
const worktree = (path: string, changedPaths: string[], rootRedirect: string | null) => ({
  path,
  head: "b".repeat(40),
  branch: `codex/${path.split("/").at(-1)}`,
  detached: false,
  changes: changedPaths.map((file) => ({ status: " M", path: file, originalPath: null })),
  changedPaths,
  rootRedirect,
});

function treeSnapshot(root: string) {
  const rows: string[] = [];
  const visit = (path: string, relative: string) => {
    const metadata = lstatSync(path);
    if (metadata.isDirectory()) {
      for (const name of readdirSync(path).sort()) visit(join(path, name), join(relative, name));
      return;
    }
    const content = metadata.isSymbolicLink() ? Buffer.from(readlinkSync(path)) : readFileSync(path);
    rows.push(`${relative}\0${metadata.mode}\0${metadata.mtimeMs}\0${createHash("sha256").update(content).digest("hex")}`);
  };
  visit(root, ".");
  return rows;
}

describe("canonical review target", () => {
  it("selects the one fully owned candidate instead of the dirty control checkout", () => {
    const target = deriveReviewTarget({
      controlPath: "/repo",
      activeClaims: [claim("layout", ["src/page.tsx"]), claim("styles", ["css/site.css"])],
      worktrees: [
        worktree("/repo", ["next.config.ts"], "/en/"),
        worktree("/repo/candidate", ["src/page.tsx", "css/site.css"], "/es/"),
        worktree("/repo/stale", ["next-env.d.ts"], "/es/"),
      ],
      port: 3012,
    });
    expect(target).toMatchObject({
      state: "ready",
      ownerThreadId: owner,
      worktree: "/repo/candidate",
      route: "/es/",
      url: "http://127.0.0.1:3012/es/",
    });
  });

  it("fails closed when more than one worktree fully matches live ownership", () => {
    const activeClaims = [claim("layout", ["src/page.tsx"])];
    const target = deriveReviewTarget({
      controlPath: "/repo",
      activeClaims,
      worktrees: [
        worktree("/repo/a", ["src/page.tsx"], "/es/"),
        worktree("/repo/b", ["src/page.tsx"], "/es/"),
      ],
    });
    expect(target).toMatchObject({ state: "ambiguous", ownerThreadId: null, worktree: null });
  });

  it("fails closed when any registered clone could not be scanned", () => {
    const target = deriveReviewTarget({
      controlPath: "/repo",
      activeClaims: [claim("layout", ["src/page.tsx"])],
      worktrees: [worktree("/repo/candidate", ["src/page.tsx"], "/es/")],
      scanFailures: [{ path: "/repo/runner", reason: "unreadable" }],
    });
    expect(target).toMatchObject({ state: "unresolved", reason: "registered_clone_scan_incomplete" });
  });

  it("does not select a candidate with an unowned extra change", () => {
    const target = deriveReviewTarget({
      controlPath: "/repo",
      activeClaims: [claim("layout", ["src/page.tsx"])],
      worktrees: [worktree("/repo/candidate", ["src/page.tsx", "src/extra.ts"], "/es/")],
    });
    expect(target).toMatchObject({ state: "unresolved", worktree: null });
    expect(classifyCandidateOwnership({
      controlPath: "/repo",
      activeClaims: [claim("layout", ["src/page.tsx"])],
      worktrees: [worktree("/repo/candidate", ["src/page.tsx", "src/extra.ts"], "/es/")],
    })[0]).toMatchObject({
      fullyCovered: false,
      ownerThreadIds: [owner],
      uncoveredPaths: ["src/extra.ts"],
    });
  });

  it("keeps exact-path ownership and rejects descendants of a directory-like path", () => {
    const activeClaims = [claim("critique", [".impeccable/critique"])];
    const target = deriveReviewTarget({
      controlPath: "/repo",
      activeClaims,
      worktrees: [worktree("/repo/candidate", [".impeccable/critique/result.md"], "/es/")],
    });
    expect(target).toMatchObject({ state: "unresolved", worktree: null });
  });

  it("requires ownership of both sides of a rename", () => {
    const base = worktree("/repo/candidate", ["src/new.ts"], "/es/");
    const renamed = {
      ...base,
      changes: [{ status: "R ", path: "src/new.ts", originalPath: "src/old.ts" }],
    };
    const target = deriveReviewTarget({
      controlPath: "/repo",
      activeClaims: [claim("rename", ["src/new.ts"])],
      worktrees: [renamed],
    });
    expect(target).toMatchObject({ state: "unresolved", worktree: null });
  });

  it("rejects mixed candidate owners", () => {
    const otherClaim = { ...claim("styles", ["css/site.css"]), threadId: "01a09999-f16f-7d83-8e7d-dfd30c177a8d-styles" };
    const target = deriveReviewTarget({
      controlPath: "/repo",
      activeClaims: [claim("layout", ["src/page.tsx"]), otherClaim],
      worktrees: [worktree("/repo/candidate", ["src/page.tsx", "css/site.css"], "/es/")],
    });
    expect(target).toMatchObject({ state: "unresolved", reason: "candidate_owner_is_not_unique" });
  });

  it("requires a verified root redirect", () => {
    const target = deriveReviewTarget({
      controlPath: "/repo",
      activeClaims: [claim("layout", ["src/page.tsx"])],
      worktrees: [worktree("/repo/candidate", ["src/page.tsx"], null)],
    });
    expect(target).toMatchObject({ state: "unresolved", reason: "candidate_root_redirect_is_unverified" });
  });

  it("keeps scheduler activation false and binds ownership to the ready target", () => {
    const ownership = deriveAutomationOwnership({
      state: "ready", reason: "fixture", candidates: [], ownerThreadId: owner,
      worktree: "/repo/candidate", branch: "codex/candidate", head: "b".repeat(40),
      route: "/es/", url: null,
    });
    expect(ownership).toMatchObject({
      ownerThreadId: owner,
      ownerSource: "active_candidate_claims",
      schedulerState: "external_uninspected",
      activationAuthorized: false,
    });
    expect(ownership.stopConditions).toContain("owner_task_unavailable");
  });

  it("keeps one controller owner even while its review target is unresolved", () => {
    const activeClaims = [claim("layout", ["src/page.tsx"])];
    const worktrees = [worktree("/repo/candidate", ["src/page.tsx", "src/unowned.ts"], "/es/")];
    const controller = deriveControllerOwner({ controlPath: "/repo", worktrees, activeClaims });
    const ownership = deriveAutomationOwnership({
      state: "unresolved", reason: "fixture", candidates: [], ownerThreadId: null,
      worktree: null, branch: null, head: null, route: null, url: null,
    }, controller);
    expect(ownership).toMatchObject({ ownerThreadId: owner, activationAuthorized: false });
  });
});

describe("control-surface parsers", () => {
  it("selects the recovered public Home instead of the legacy redirect", () => {
    const input = {
      devCommand: "node automation/agents/runtime.mjs exec -- node scripts/public-site.mjs dev",
      legacyRedirect: "/es/", hasPublicHome: true,
    };
    expect(deriveReviewRoute(input)).toBe("/");
    expect(deriveReviewRoute({ ...input, hasPublicHome: false })).toBeNull();
    expect(deriveReviewRoute({ ...input, devCommand: "node unknown-server.mjs" })).toBeNull();
    expect(deriveReviewRoute({ ...input, devCommand: undefined })).toBeNull();
    expect(deriveReviewRoute({ ...input, devCommand: "node automation/agents/runtime.mjs exec -- next dev" })).toBe("/es/");
    expect(deriveReviewRoute({ ...input, devCommand: null })).toBe("/es/");
  });

  it("parses root redirects without treating another locale as canonical", () => {
    const config = (body: string, prefix = "") => `${prefix}\nconst nextConfig = { async redirects() { return ${body}; } };\nexport default nextConfig;`;
    expect(extractRootRedirect(config(`[{ source: "/", destination: "/es/", permanent: true }]`))).toBe("/es/");
    expect(extractRootRedirect(config(`[{ source: "/old", destination: "/en/" }]`))).toBeNull();
    expect(extractRootRedirect(config(`[{ source: "/", destination: "https://example.com/" }]`))).toBeNull();
    expect(extractRootRedirect(config(`[{ source: "/", destination: "//example.com/" }]`))).toBeNull();
    expect(extractRootRedirect(config(`[{ source: "/", destination: "/" }]`))).toBeNull();
    expect(extractRootRedirect(config(`[{ source: "/", permanent: true }, { source: "/old", destination: "/en/" }]`))).toBeNull();
    expect(extractRootRedirect(config(`[]`, `const unrelated = { source: "/", destination: "/en/" };`))).toBeNull();
    expect(extractRootRedirect(`// { source: "/", destination: "/en/" }\nexport default { async redirects() { return []; } };`)).toBeNull();
    expect(extractRootRedirect(config(`[...shared, { source: "/", destination: "/es/" }]`, `const shared = [];`))).toBeNull();
    expect(extractRootRedirect(config(`[{ source: "/old", source: "/", destination: "/es/" }]`))).toBeNull();
    expect(extractRootRedirect(config(`[{ ...shared, source: "/", destination: "/es/" }]`, `const shared = {};`))).toBeNull();
    expect(extractRootRedirect(config(`[{ source: "/", destination: "/es/", [key]: "/old" }]`, `const key = "source";`))).toBeNull();
    expect(extractRootRedirect(config(`[{ source: "/", destination: "/es/", [key]: "/old" }]`, `const key = "destination";`))).toBeNull();
    expect(extractRootRedirect(`const shared = {}; export default { ...shared, async redirects() { return [{ source: "/", destination: "/es/" }]; } };`)).toBeNull();
    expect(extractRootRedirect(`export default { async redirects() { return []; }, async redirects() { return [{ source: "/", destination: "/es/" }]; } };`)).toBeNull();
    expect(extractRootRedirect(`const key = "redirects"; export default { [key]: async () => [{ source: "/", destination: "/es/" }] };`)).toBeNull();
  });

  it("parses zero-delimited status including renames", () => {
    expect(parsePorcelainStatus(" M src/a.ts\0R  src/new.ts\0src/old.ts\0?? notes.txt\0")).toEqual([
      { status: " M", path: "src/a.ts", originalPath: null },
      { status: "R ", path: "src/new.ts", originalPath: "src/old.ts" },
      { status: "??", path: "notes.txt", originalPath: null },
    ]);
  });

  it("classifies a control rename as owned only when one claim owns both endpoints", () => {
    const change = { status: "R ", path: "src/new.ts", originalPath: "src/old.ts" };
    expect(classifyControlChange(change, [claim("new-only", ["src/new.ts"])])).toMatchObject({
      classification: "no_active_claim",
      ownership: [],
    });
    expect(classifyControlChange(change, [claim("both", ["src/new.ts", "src/old.ts"])])).toMatchObject({
      classification: "active_claim",
      ownership: [{ threadId: `${owner}-both` }],
    });
  });

  it("verifies server reuse only when the process cwd matches the target", () => {
    expect(deriveServerStatus(42, "/repo/candidate", "/repo/candidate").state).toBe("verified");
    expect(deriveServerStatus(42, "/repo", "/repo/candidate").state).toBe("mismatch");
    expect(deriveServerStatus(null, null, "/repo/candidate").state).toBe("not_checked");
  });
});

describe("control-surface inspection", () => {
  it("does not mutate the registered-clone coordination tree", () => {
    const root = mkdtempSync(join(tmpdir(), "obraxen-control-surface-"));
    const repo = join(root, "repo");
    const stateHome = join(root, "state");
    mkdirSync(repo);
    const git = (args: string[]) => execFileSync("git", args, { cwd: repo, stdio: "pipe" });
    try {
      git(["init", "-q"]);
      git(["config", "user.email", "fixture@example.invalid"]);
      git(["config", "user.name", "Fixture"]);
      writeFileSync(join(repo, "next.config.ts"), `export default { async redirects() { return [{ source: "/", destination: "/es/", permanent: true }]; } };\n`);
      git(["add", "next.config.ts"]);
      git(["commit", "-qm", "fixture"]);
      git(["remote", "add", "origin", "https://example.invalid/obraxen.git"]);
      registerClone(repo, { stateHome, now: new Date("2026-09-10T12:00:00Z") });
      const before = treeSnapshot(stateHome);
      const report = buildControlSurface(repo, { stateHome, now: new Date("2026-09-10T12:01:00Z") }) as {
        registeredCloneCount: number;
        scanFailures: unknown[];
      };
      expect(report).toMatchObject({ registeredCloneCount: 1, scanFailures: [] });
      expect(treeSnapshot(stateHome)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
