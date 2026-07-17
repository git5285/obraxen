import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  acquireLease,
  getCoordinationPaths,
  getLegacyLeasePaths,
  getLeasePaths,
  heartbeatLease,
  normalizeRepositoryIdentity,
  readLease,
  registerClone,
  releaseLease,
} from "../../automation/agents/lease.mjs";

const temporaryDirectories: string[] = [];
const origin = "https://github.com/git5285/obraxen.git";

function repository() {
  const directory = mkdtempSync(join(tmpdir(), "obraxen-agent-lease-"));
  temporaryDirectories.push(directory);
  execFileSync("git", ["init", "-q", directory]);
  execFileSync("git", ["-C", directory, "remote", "add", "origin", origin]);
  mkdirSync(join(directory, "automation", "agents"), { recursive: true });
  writeFileSync(
    join(directory, "automation", "agents", "lease.mjs"),
    "export const COORDINATION_PROTOCOL_VERSION = 2;\n",
  );
  return directory;
}

function stateHome() {
  const directory = mkdtempSync(join(tmpdir(), "obraxen-agent-state-"));
  temporaryDirectories.push(directory);
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
  it("normalizes HTTPS and SSH origins without retaining credentials", () => {
    const https = normalizeRepositoryIdentity("https://secret@github.com/git5285/obraxen.git");
    const ssh = normalizeRepositoryIdentity("git@github.com:git5285/obraxen.git");
    expect(https).toBe(ssh);
    expect(normalizeRepositoryIdentity("ssh://git@github.com:22/git5285/obraxen.git"))
      .toBe(ssh);
    expect(normalizeRepositoryIdentity("https://github.com./git5285/obraxen.git"))
      .toBe(ssh);
    expect(https).not.toContain("secret");
    expect(normalizeRepositoryIdentity("../obraxen.git", "/tmp/clone"))
      .toBe("file:/tmp/obraxen");
  });

  it("allows one writer and never auto-reclaims an existing lease", () => {
    const repo = repository();
    const state = stateHome();
    expect(acquireLease(repo, owner("token-1"), new Date(), state).acquired).toBe(true);
    const second = acquireLease(repo, { ...owner("token-2"), runId: "run-2" }, new Date(), state);
    expect(second).toMatchObject({ acquired: false, reason: "lease_exists" });
    expect(readLease(repo, state)?.token).toBe("token-1");
  });

  it("shares one lease across independent clones of the same origin", () => {
    const first = repository();
    const second = repository();
    const state = stateHome();

    expect(getLeasePaths(first, state).directory).toBe(getLeasePaths(second, state).directory);
    expect(acquireLease(first, owner("token-1"), new Date(), state).acquired).toBe(true);
    expect(acquireLease(second, { ...owner("token-2"), runId: "run-2" }, new Date(), state))
      .toMatchObject({ acquired: false, reason: "lease_exists" });
    expect(readLease(second, state)?.token).toBe("token-1");
  });

  it("denies direct acquisition after a registered clone changes origin", () => {
    const repo = repository();
    const state = stateHome();
    expect(acquireLease(repo, owner("token-1"), new Date(), state).acquired).toBe(true);
    releaseLease(repo, "token-1", state);
    execFileSync("git", [
      "-C",
      repo,
      "remote",
      "set-url",
      "origin",
      "https://github.com/git5285/different-repository.git",
    ]);

    expect(() => acquireLease(repo, owner("token-2"), new Date(), state))
      .toThrow("registered clone origin has changed");
  });

  it("denies acquisition while a registered clone uses the legacy protocol", () => {
    const current = repository();
    const legacy = repository();
    const state = stateHome();
    registerClone(legacy, { stateHome: state });
    writeFileSync(
      join(legacy, "automation", "agents", "lease.mjs"),
      "export const COORDINATION_PROTOCOL_VERSION = 1;\n",
    );

    expect(() => acquireLease(current, owner("token-1"), new Date(), state))
      .toThrow("incompatible coordination protocol");
  });

  it("denies acquisition while a registered clone retains a legacy lease", () => {
    const repo = repository();
    const state = stateHome();
    const legacy = getLegacyLeasePaths(repo);
    mkdirSync(legacy.directory, { recursive: true });
    writeFileSync(legacy.owner, `${JSON.stringify(owner("legacy-token"))}\n`);

    expect(() => acquireLease(repo, owner("token-1"), new Date(), state))
      .toThrow("active legacy lease");
  });

  it("requires the exact token for heartbeat and release", () => {
    const repo = repository();
    const state = stateHome();
    acquireLease(repo, owner("token-1"), new Date("2026-07-16T00:00:00Z"), state);
    expect(() => heartbeatLease(repo, "wrong-token", new Date(), state)).toThrow("token mismatch");
    const heartbeat = heartbeatLease(repo, "token-1", new Date("2026-07-16T00:01:00Z"), state);
    expect(heartbeat.heartbeatAt).toBe("2026-07-16T00:01:00.000Z");
    expect(() => releaseLease(repo, "wrong-token", state)).toThrow("token mismatch");
    expect(releaseLease(repo, "token-1", state)).toEqual({ released: true, runId: "run-1" });
    expect(readLease(repo, state)).toBeNull();
    expect(() => acquireLease(repo, owner("token-1"), new Date(), state))
      .toThrow("token has already been used");
  });

  it("serializes heartbeat and release operations for one acquisition", () => {
    const repo = repository();
    const state = stateHome();
    acquireLease(repo, owner("token-1"), new Date(), state);
    const coordination = getCoordinationPaths(repo, state);
    const operationLock = join(
      coordination.leaseOperations,
      createHash("sha256").update("token-1").digest("hex"),
    );
    mkdirSync(operationLock, { recursive: true });

    expect(() => heartbeatLease(repo, "token-1", new Date(), state))
      .toThrow("operation already in progress");
    expect(() => releaseLease(repo, "token-1", state))
      .toThrow("operation already in progress");
    rmSync(operationLock, { recursive: true, force: true });
    expect(releaseLease(repo, "token-1", state)).toEqual({ released: true, runId: "run-1" });
  });

  it("cleans up an incomplete acquisition before allowing the next writer", () => {
    const repo = repository();
    const state = stateHome();
    const unserializable = { ...owner("broken"), unsupported: 1n } as unknown as ReturnType<typeof owner>;
    expect(() => acquireLease(repo, unserializable, new Date(), state))
      .toThrow("BigInt");
    expect(existsSync(getLeasePaths(repo, state).directory)).toBe(false);
    expect(acquireLease(repo, owner("token-1"), new Date(), state).acquired).toBe(true);
  });

  it("fails closed when a lease directory has no owner record", () => {
    const repo = repository();
    const state = stateHome();
    const paths = getLeasePaths(repo, state);
    mkdirSync(paths.directory, { recursive: true });

    expect(() => readLease(repo, state)).toThrow("without an owner record");
    expect(() => acquireLease(repo, owner("token-1"), new Date(), state))
      .toThrow("without an owner record");
  });

  it("removes abandoned heartbeat files when the owner releases the lease", () => {
    const repo = repository();
    const state = stateHome();
    acquireLease(repo, owner("token-1"), new Date(), state);
    const paths = getLeasePaths(repo, state);
    writeFileSync(`${paths.owner}.abandoned.tmp`, "partial");
    expect(releaseLease(repo, "token-1", state)).toEqual({ released: true, runId: "run-1" });
    expect(existsSync(paths.directory)).toBe(false);
  });
});
