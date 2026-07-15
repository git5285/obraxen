import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}

export function getLeasePaths(repo) {
  const commonDirRaw = git(repo, ["rev-parse", "--git-common-dir"]);
  const commonDir = isAbsolute(commonDirRaw) ? commonDirRaw : resolve(repo, commonDirRaw);
  const directory = join(commonDir, "codex-agent-state", "remainon", "writer-lease");
  return { directory, owner: join(directory, "owner.json") };
}

export function readLease(repo) {
  const paths = getLeasePaths(repo);
  if (!existsSync(paths.owner)) return null;
  return JSON.parse(readFileSync(paths.owner, "utf8"));
}

function validateOwner(owner) {
  for (const key of ["runId", "token", "host", "pid", "worktree", "baseSha", "claimPath"]) {
    if (!owner?.[key]) throw new Error(`lease owner is missing ${key}`);
  }
  if (!Array.isArray(owner.paths) || owner.paths.length === 0) {
    throw new Error("lease owner requires exact paths");
  }
}

export function acquireLease(repo, owner, now = new Date()) {
  validateOwner(owner);
  const paths = getLeasePaths(repo);
  mkdirSync(dirname(paths.directory), { recursive: true });
  try {
    mkdirSync(paths.directory);
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    return { acquired: false, reason: "lease_exists", owner: readLease(repo) };
  }

  const record = {
    schemaVersion: 1,
    ...owner,
    acquiredAt: now.toISOString(),
    heartbeatAt: now.toISOString(),
  };
  writeFileSync(paths.owner, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  return { acquired: true, owner: record };
}

function assertToken(record, token) {
  if (!record) throw new Error("lease does not exist");
  if (record.token !== token) throw new Error("lease token mismatch");
}

export function heartbeatLease(repo, token, now = new Date()) {
  const paths = getLeasePaths(repo);
  const record = readLease(repo);
  assertToken(record, token);
  const updated = { ...record, heartbeatAt: now.toISOString() };
  const temporary = `${paths.owner}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(updated, null, 2)}\n`, { flag: "wx" });
  renameSync(temporary, paths.owner);
  return updated;
}

export function releaseLease(repo, token) {
  const paths = getLeasePaths(repo);
  const record = readLease(repo);
  assertToken(record, token);
  rmSync(paths.owner);
  rmdirSync(paths.directory);
  return { released: true, runId: record.runId };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function main() {
  const [operation] = process.argv.slice(2);
  const repo = resolve(argument("--repo") ?? process.cwd());
  let result;
  if (operation === "status") {
    result = { owner: readLease(repo) };
  } else if (operation === "acquire") {
    result = acquireLease(repo, JSON.parse(argument("--owner-json") ?? "null"));
    if (!result.acquired) process.exitCode = 2;
  } else if (operation === "heartbeat") {
    result = heartbeatLease(repo, argument("--token"));
  } else if (operation === "release") {
    result = releaseLease(repo, argument("--token"));
  } else {
    throw new Error("usage: lease.mjs status|acquire|heartbeat|release [options]");
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
