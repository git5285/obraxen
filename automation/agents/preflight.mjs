import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readLease } from "./lease.mjs";
import { loadPolicy } from "./policy.mjs";

function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}

export function parseWorktrees(output) {
  return output
    .split(/\n\s*\n/)
    .map((block) => Object.fromEntries(block.split("\n").filter(Boolean).map((line) => {
      const separator = line.indexOf(" ");
      return separator === -1 ? [line, true] : [line.slice(0, separator), line.slice(separator + 1)];
    })))
    .filter((entry) => typeof entry.worktree === "string");
}

export function parseClaim(text, source, worktree) {
  const state = text.match(/^- estado:\s*([^\n]+)$/m)?.[1]?.trim() ?? "unknown";
  const threadId = text.match(/^- thread_id:\s*([^\n]+)$/m)?.[1]?.trim() ?? "unknown";
  const filesBlock = text.match(/^- archivos:\s*\n((?:\s{2,}- .*(?:\n|$))*)/m)?.[1] ?? "";
  const files = [...filesBlock.matchAll(/^\s{2,}-\s+(.+)$/gm)].map((match) => match[1].trim());
  return { source, worktree, threadId, state, files };
}

export function readClaims(worktree) {
  const directory = resolve(worktree, ".coordination/claims");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => parseClaim(
      readFileSync(resolve(directory, name), "utf8"),
      `.coordination/claims/${name}`,
      worktree,
    ));
}

export function deriveGating({ policy, lease, worktrees, activeClaims = [], claimFailures = [] }) {
  const unreadableWorktrees = [...new Set([
    ...worktrees
      .filter((entry) => (entry.status ?? []).some((line) => String(line).startsWith("unreadable: ")))
      .map((entry) => entry.path),
    ...claimFailures.map((failure) => failure.path),
  ])];
  const scanComplete = unreadableWorktrees.length === 0;
  const pendingLocalDiffs = activeClaims.filter((claim) => new Set([
    "esperando_revision",
    "awaiting_review",
  ]).has(claim.state));
  const pendingLimit = policy.limits?.maxPendingLocalDiffs ?? 1;
  const pendingLimitReached = pendingLocalDiffs.length >= pendingLimit;

  return {
    unreadableWorktrees,
    pendingLocalDiffs,
    eligibility: {
      scout: policy.mode !== "disabled" && policy.authority.allowScout && scanComplete,
      writer: policy.mode === "active"
        && policy.authority.allowLocalDiff
        && !lease
        && !pendingLimitReached
        && scanComplete,
    },
    blockers: [
      ...(scanComplete ? [] : ["unreadable_worktrees"]),
      ...(policy.mode === "shadow" ? ["policy_mode_shadow"] : []),
      ...(lease ? ["writer_lease_exists"] : []),
      ...(pendingLimitReached ? ["pending_local_diff_limit"] : []),
    ],
  };
}

export function buildPreflight(repo = process.cwd(), policy = loadPolicy()) {
  const root = git(repo, ["rev-parse", "--show-toplevel"]);
  const worktrees = parseWorktrees(git(root, ["worktree", "list", "--porcelain"]));
  const detailedWorktrees = worktrees.map((entry) => {
    const path = entry.worktree;
    let status = [];
    try {
      status = git(path, ["status", "--short"]).split("\n").filter(Boolean);
    } catch (error) {
      status = [`unreadable: ${error.message}`];
    }
    return {
      path,
      head: entry.HEAD ?? null,
      branch: typeof entry.branch === "string" ? entry.branch.replace("refs/heads/", "") : null,
      detached: entry.detached === true,
      status,
    };
  });
  const claimFailures = [];
  const claims = detailedWorktrees.flatMap((worktree) => {
    try {
      return readClaims(worktree.path);
    } catch (error) {
      claimFailures.push({ path: worktree.path, reason: error.message });
      return [];
    }
  });
  const activeClaims = claims.filter((claim) => !new Set(["liberado", "released"]).has(claim.state));
  const lease = readLease(root);
  const gating = deriveGating({
    policy,
    lease,
    worktrees: detailedWorktrees,
    activeClaims,
    claimFailures,
  });

  return {
    schemaVersion: 1,
    project: policy.project,
    mode: policy.mode,
    repoRoot: root,
    baseSha: git(root, ["rev-parse", "HEAD"]),
    branch: git(root, ["branch", "--show-current"]) || null,
    worktrees: detailedWorktrees,
    activeClaims,
    claimFailures,
    unreadableWorktrees: gating.unreadableWorktrees,
    pendingLocalDiffs: gating.pendingLocalDiffs,
    lease,
    eligibility: gating.eligibility,
    blockers: gating.blockers,
  };
}

function main() {
  const repoIndex = process.argv.indexOf("--repo");
  const repo = repoIndex === -1 ? process.cwd() : process.argv[repoIndex + 1];
  process.stdout.write(`${JSON.stringify(buildPreflight(repo), null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
