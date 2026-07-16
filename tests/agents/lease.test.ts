import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  acquireLease,
  getLeasePaths,
  heartbeatLease,
  readLease,
  releaseLease,
} from "../../automation/agents/lease.mjs";

const temporaryDirectories: string[] = [];

function repository() {
  const directory = mkdtempSync(join(tmpdir(), "remainon-agent-lease-"));
  temporaryDirectories.push(directory);
  execFileSync("git", ["init", "-q", directory]);
  return directory;
}

function owner(token: string) {
  return {
    runId: "run-1",
    token,
    host: "test-host",
    pid: 123,
    worktree: "/tmp/worktree",
    baseSha: "a".repeat(40),
    claimPath: ".coordination/claims/run-1.md",
    paths: ["src/example.ts"],
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("shared autonomous writer lease", () => {
  it("allows one writer and never auto-reclaims an existing lease", () => {
    const repo = repository();
    expect(acquireLease(repo, owner("token-1")).acquired).toBe(true);
    const second = acquireLease(repo, { ...owner("token-2"), runId: "run-2" });
    expect(second).toMatchObject({ acquired: false, reason: "lease_exists" });
    expect(readLease(repo)?.token).toBe("token-1");
  });

  it("requires the exact token for heartbeat and release", () => {
    const repo = repository();
    acquireLease(repo, owner("token-1"), new Date("2026-07-16T00:00:00Z"));
    expect(() => heartbeatLease(repo, "wrong-token")).toThrow("token mismatch");
    const heartbeat = heartbeatLease(repo, "token-1", new Date("2026-07-16T00:01:00Z"));
    expect(heartbeat.heartbeatAt).toBe("2026-07-16T00:01:00.000Z");
    expect(() => releaseLease(repo, "wrong-token")).toThrow("token mismatch");
    expect(releaseLease(repo, "token-1")).toEqual({ released: true, runId: "run-1" });
    expect(readLease(repo)).toBeNull();
  });

  it("cleans up an incomplete acquisition before allowing the next writer", () => {
    const repo = repository();
    const unserializable = { ...owner("broken"), unsupported: 1n } as unknown as ReturnType<typeof owner>;
    expect(() => acquireLease(repo, unserializable))
      .toThrow("BigInt");
    expect(existsSync(getLeasePaths(repo).directory)).toBe(false);
    expect(acquireLease(repo, owner("token-1")).acquired).toBe(true);
  });

  it("removes abandoned heartbeat files when the owner releases the lease", () => {
    const repo = repository();
    acquireLease(repo, owner("token-1"));
    const paths = getLeasePaths(repo);
    writeFileSync(`${paths.owner}.abandoned.tmp`, "partial");
    expect(releaseLease(repo, "token-1")).toEqual({ released: true, runId: "run-1" });
    expect(existsSync(paths.directory)).toBe(false);
  });
});
