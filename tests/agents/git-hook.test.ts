import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const hookDirectory = dirname(fileURLToPath(new URL("../../.githooks/pre-push", import.meta.url)));
const repositoryRoot = dirname(hookDirectory);
const helperPath = join(hookDirectory, "git-env.sh");
const prePushPath = join(hookDirectory, "pre-push");
const temporaryRoots: string[] = [];

function localGitVariables(): string[] {
  return execFileSync("git", ["rev-parse", "--local-env-vars"], {
    encoding: "utf8",
  }).trim().split(/\s+/).filter(Boolean);
}

function cleanGitEnvironment(): NodeJS.ProcessEnv {
  const environment = { ...process.env };

  for (const variable of localGitVariables()) {
    delete environment[variable];
  }

  return environment;
}

function git(args: string[], workingDirectory: string, environment = cleanGitEnvironment()): string {
  return execFileSync("git", args, {
    cwd: workingDirectory,
    encoding: "utf8",
    env: environment,
  }).trim();
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("pre-push Git environment isolation", () => {
  it("initializes a temporary repository without mutating the hook repository", () => {
    const root = mkdtempSync(join(tmpdir(), "obraxen-git-hook-"));
    temporaryRoots.push(root);
    const source = join(root, "source");
    const target = join(root, "target");
    mkdirSync(source);

    git(["init", "-q"], source);
    git(["config", "user.name", "Hook regression test"], source);
    git(["config", "user.email", "hook-test@example.invalid"], source);
    writeFileSync(join(source, "fixture.txt"), "original\n");
    git(["add", "fixture.txt"], source);
    git(["commit", "-q", "-m", "test: create sacrificial source"], source);

    const sourceHead = git(["rev-parse", "HEAD"], source);
    const pollutedEnvironment = {
      ...cleanGitEnvironment(),
      GIT_DIR: join(source, ".git"),
      GIT_WORK_TREE: source,
    };

    execFileSync(
      "/bin/sh",
      ["-c", '. "$1"; run_without_local_git_env git init -q "$2"', "sh", helperPath, target],
      { cwd: root, env: pollutedEnvironment },
    );

    expect(existsSync(join(target, ".git"))).toBe(true);
    expect(git(["rev-parse", "HEAD"], source)).toBe(sourceHead);
    expect(git(["rev-parse", "--is-bare-repository"], source)).toBe("false");
    expect(git(["rev-parse", "--is-bare-repository"], target)).toBe("false");
  });

  it("routes every npm gate through the isolated helper", () => {
    const hook = readFileSync(prePushPath, "utf8");

    expect(hook).toContain('. "$repository_root/.githooks/git-env.sh"');
    expect(hook).toContain("run_without_local_git_env npm run check:diff");
    expect(hook).toContain("run_without_local_git_env npm run check:quality");
    expect(hook).not.toMatch(/^\s*npm run check:/mu);
  });

  it("limits hook bypasses to the disposable fixtures that require them", () => {
    const bypass = ["core", "hooksPath=/dev/null"].join(".");
    const matches = execFileSync("git", ["ls-files", "-z"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: cleanGitEnvironment(),
    }).split("\0").filter(Boolean).filter((path) => (
      readFileSync(join(repositoryRoot, path), "utf8").includes(bypass)
    )).sort();

    expect(matches).toEqual([
      "automation/agents/isolated-cycle.mjs",
      "automation/agents/isolated-work.mjs",
      "tests/agents/repository-work.test.ts",
    ]);
  });
});
