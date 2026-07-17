import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readLease } from "./lease.mjs";
import { loadPolicy } from "./policy.mjs";

const RELEASED_CLAIM_STATES = new Set(["liberado", "released"]);
const WRITER_CLAIM_STATES = new Set(["reservado", "reserved", "en_curso", "in_progress"]);
const KNOWN_ACTIVE_CLAIM_STATES = new Set([
  ...WRITER_CLAIM_STATES,
  "bloqueado",
  "blocked",
  "esperando_revision",
  "awaiting_review",
]);

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

function normalizeClaimValue(value) {
  const trimmed = value.trim();
  const inlineCode = trimmed.match(/^(`+)([\s\S]*?)\1$/);
  return (inlineCode?.[2] ?? trimmed).trim();
}

function isClaimPath(value) {
  if (!value || /\s/.test(value) || value.startsWith("/") || value.startsWith("~")) return false;
  if (value.includes("\\") || !/^[A-Za-z0-9._@+*?\[\]{}!\/-]+$/.test(value)) return false;
  if (value.split("/").some((segment) => !segment || segment === "." || segment === "..")) return false;
  return value.includes("/") || value.includes(".") || /[*?\[\]{]/.test(value);
}

function readClaimFileList(lines, startIndex, requireIndent) {
  const files = [];
  const invalidFileEntries = [];
  const itemPattern = requireIndent
    ? /^[\t ]{2,}-\s+(.+?)\s*$/
    : /^\s*-\s+(.+?)\s*$/;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^#{1,6}\s/.test(line) || /^-\s+[a-z_]+:/i.test(line)) break;
    const item = line.match(itemPattern);
    if (!item) break;
    const file = normalizeClaimValue(item[1]);
    if (isClaimPath(file)) files.push(file);
    else if (file) invalidFileEntries.push(file);
  }
  return { files, invalidFileEntries };
}

function parseClaimFiles(text) {
  const lines = text.split(/\r?\n/);
  const fieldIndex = lines.findIndex((line) => /^-\s+archivos:\s*$/i.test(line));
  if (fieldIndex !== -1) return readClaimFileList(lines, fieldIndex + 1, true);

  const headingIndex = lines.findIndex((line) => /^#{1,6}\s+(?:archivos(?:\s+reservados)?|rutas(?:\s+reservadas)?|reserved\s+files|files|paths)\s*$/i.test(line));
  return headingIndex === -1
    ? { files: [], invalidFileEntries: [] }
    : readClaimFileList(lines, headingIndex + 1, false);
}

export function parseClaim(text, source, worktree) {
  const rawState = text.match(/^-\s+estado:\s*([^\n]+)$/m)?.[1] ?? "unknown";
  const rawThreadId = text.match(/^-\s+thread_id:\s*([^\n]+)$/m)?.[1] ?? "unknown";
  const state = normalizeClaimValue(rawState).toLowerCase();
  const threadId = normalizeClaimValue(rawThreadId);
  const { files, invalidFileEntries } = parseClaimFiles(text);
  return { source, worktree, threadId, state, files, invalidFileEntries };
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
  const activeWriterClaims = activeClaims.filter((claim) => WRITER_CLAIM_STATES.has(claim.state));
  const unknownStateClaims = activeClaims.filter((claim) => !KNOWN_ACTIVE_CLAIM_STATES.has(claim.state));
  const unscopedActiveClaims = activeClaims.filter((claim) => (
    claim.files.length === 0 || (claim.invalidFileEntries ?? []).length > 0
  ));
  const writerLimit = policy.limits?.maxConcurrentWriters ?? 1;
  const writerLimitReached = activeWriterClaims.length >= writerLimit;
  const pendingLimit = policy.limits?.maxPendingLocalDiffs ?? 1;
  const pendingLimitReached = pendingLocalDiffs.length >= pendingLimit;

  return {
    unreadableWorktrees,
    pendingLocalDiffs,
    activeWriterClaims,
    unknownStateClaims,
    unscopedActiveClaims,
    eligibility: {
      scout: policy.mode !== "disabled" && policy.authority.allowScout && scanComplete,
      writer: policy.mode === "active"
        && policy.authority.allowLocalDiff
        && !lease
        && !writerLimitReached
        && unknownStateClaims.length === 0
        && unscopedActiveClaims.length === 0
        && !pendingLimitReached
        && scanComplete,
    },
    blockers: [
      ...(scanComplete ? [] : ["unreadable_worktrees"]),
      ...(policy.mode === "shadow" ? ["policy_mode_shadow"] : []),
      ...(lease ? ["writer_lease_exists"] : []),
      ...(writerLimitReached ? ["active_writer_claim_limit"] : []),
      ...(unknownStateClaims.length > 0 ? ["active_claim_state_unknown"] : []),
      ...(unscopedActiveClaims.length > 0 ? ["active_claim_paths_unknown"] : []),
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
  const activeClaims = claims.filter((claim) => !RELEASED_CLAIM_STATES.has(claim.state));
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
    activeWriterClaims: gating.activeWriterClaims,
    unknownStateClaims: gating.unknownStateClaims,
    unscopedActiveClaims: gating.unscopedActiveClaims,
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
