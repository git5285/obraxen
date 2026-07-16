import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkBranchDiff } from "../../scripts/check-branch-diff.mjs";

const temporaryDirectories: string[] = [];

function git(repo: string, ...args: string[]) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}

function repository() {
  const repo = mkdtempSync(join(tmpdir(), "remainon-diff-check-"));
  temporaryDirectories.push(repo);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "RemainOn test");
  git(repo, "config", "user.email", "test@example.invalid");
  writeFileSync(join(repo, "example.txt"), "base\n");
  git(repo, "add", "example.txt");
  git(repo, "commit", "-qm", "base");
  return repo;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("committed diff check", () => {
  it("checks the full range from the exact reviewed base", () => {
    const repo = repository();
    const baseSha = git(repo, "rev-parse", "HEAD");
    writeFileSync(join(repo, "example.txt"), "base\nvalid change\n");
    git(repo, "add", "example.txt");
    git(repo, "commit", "-qm", "valid");
    expect(checkBranchDiff({ repo, baseSha })).toMatchObject({ baseSha });

    writeFileSync(join(repo, "example.txt"), "base\nvalid change\n\n");
    git(repo, "add", "example.txt");
    git(repo, "commit", "-qm", "invalid whitespace");
    expect(() => checkBranchDiff({ repo, baseSha })).toThrow("new blank line at EOF");
  });

  it("derives the review range from a base ref", () => {
    const repo = repository();
    const baseSha = git(repo, "rev-parse", "main");
    git(repo, "switch", "-qc", "feature");
    writeFileSync(join(repo, "example.txt"), "base\nfeature\n");
    git(repo, "add", "example.txt");
    git(repo, "commit", "-qm", "feature");
    expect(checkBranchDiff({ repo, baseRef: "main" }).baseSha).toBe(baseSha);
  });

  it("checks the candidate worktree including untracked files", () => {
    const repo = repository();
    const baseSha = git(repo, "rev-parse", "HEAD");
    writeFileSync(join(repo, "example.txt"), "base\nworking change\n");
    expect(checkBranchDiff({ repo, baseSha, includeWorktree: true }).range)
      .toBe(`${baseSha}..WORKTREE`);
    writeFileSync(join(repo, "untracked.txt"), "new file\n\n");
    expect(() => checkBranchDiff({ repo, baseSha, includeWorktree: true }))
      .toThrow("untracked.txt:2: new blank line at EOF");
  });
});
