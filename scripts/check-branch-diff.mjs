import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}

function argument(name, argv) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

export function checkBranchDiff({
  repo = process.cwd(),
  baseSha = null,
  baseRef = null,
  head = "HEAD",
  includeWorktree = false,
} = {}) {
  if (baseSha && baseRef) throw new Error("use either baseSha or baseRef, not both");
  if (!baseSha && !baseRef) throw new Error("baseSha or baseRef is required");

  const headSha = git(repo, ["rev-parse", "--verify", `${head}^{commit}`]);
  if (includeWorktree && headSha !== git(repo, ["rev-parse", "HEAD"])) {
    throw new Error("worktree checks require head to resolve to the current HEAD");
  }
  let resolvedBase;
  if (baseSha) {
    if (!/^[0-9a-f]{40}$/i.test(baseSha)) throw new Error("baseSha must be a 40 character Git SHA");
    resolvedBase = git(repo, ["rev-parse", "--verify", `${baseSha}^{commit}`]);
    const ancestor = spawnSync(
      "git",
      ["-C", repo, "merge-base", "--is-ancestor", resolvedBase, headSha],
      { encoding: "utf8" },
    );
    if (ancestor.status !== 0) throw new Error("baseSha is not an ancestor of head");
  } else {
    resolvedBase = git(repo, ["merge-base", headSha, baseRef]);
  }

  const range = includeWorktree ? `${resolvedBase}..WORKTREE` : `${resolvedBase}..${headSha}`;
  const diffTarget = includeWorktree ? resolvedBase : `${resolvedBase}..${headSha}`;
  const result = spawnSync("git", ["-C", repo, "diff", "--check", diffTarget], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const diagnostic = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    throw new Error(`git diff --check failed for ${range}${diagnostic ? `\n${diagnostic}` : ""}`);
  }

  if (includeWorktree) {
    const untracked = execFileSync(
      "git",
      ["-C", repo, "ls-files", "--others", "--exclude-standard", "-z"],
    ).toString("utf8").split("\0").filter(Boolean);
    const untrackedFailures = [];
    for (const path of untracked) {
      const check = spawnSync(
        "git",
        ["-C", repo, "diff", "--no-index", "--check", "--", "/dev/null", path],
        { encoding: "utf8" },
      );
      const diagnostic = `${check.stdout ?? ""}${check.stderr ?? ""}`.trim();
      if (diagnostic) untrackedFailures.push(diagnostic);
      else if (![0, 1].includes(check.status ?? 2)) {
        untrackedFailures.push(`${path}: could not check untracked file`);
      }
    }
    if (untrackedFailures.length) {
      throw new Error(`git diff --check failed for untracked files\n${untrackedFailures.join("\n")}`);
    }
  }

  return { baseSha: resolvedBase, headSha, range };
}

function main() {
  const argv = process.argv.slice(2);
  const baseSha = argument("--base-sha", argv);
  const baseRef = argument("--base-ref", argv);
  const explicitHead = argument("--head", argv);
  const result = checkBranchDiff({
    baseSha,
    baseRef: baseSha ? baseRef : baseRef ?? "origin/main",
    head: explicitHead ?? "HEAD",
    includeWorktree: argv.includes("--worktree") || !explicitHead,
  });
  process.stdout.write(`${JSON.stringify({ ok: true, ...result })}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
