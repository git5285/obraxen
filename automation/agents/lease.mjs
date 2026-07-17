import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STATE_NAMESPACE = ["obraxen", "agent-coordination-v1"];
const DEFAULT_REMOTE_PORTS = new Map([
  ["http:", "80"],
  ["https:", "443"],
  ["ssh:", "22"],
  ["git:", "9418"],
]);
const CASE_INSENSITIVE_REPOSITORY_HOSTS = new Set(["github.com"]);
export const COORDINATION_PROTOCOL_VERSION = 2;

function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function readCoordinationProtocolVersion(repo) {
  const source = resolve(repo, "automation/agents/lease.mjs");
  if (!existsSync(source)) return null;
  const match = readFileSync(source, "utf8").match(
    /export const COORDINATION_PROTOCOL_VERSION = (\d+);/,
  );
  return match ? Number(match[1]) : null;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stripRepositorySuffix(value) {
  const stripped = value.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "");
  if (!stripped) throw new Error("origin remote does not identify a repository");
  return stripped;
}

function stripFileRepositorySuffix(value) {
  const stripped = value.replace(/\/+$/g, "").replace(/\.git$/i, "");
  if (!stripped || !isAbsolute(stripped)) {
    throw new Error("local origin remote does not identify an absolute repository path");
  }
  return stripped;
}

function normalizeRemoteHost(hostname) {
  return hostname.replace(/\.$/, "").toLowerCase();
}

function normalizeRemoteRepositoryPath(hostname, path) {
  let decoded;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    throw new Error("origin remote contains invalid path encoding");
  }
  const stripped = stripRepositorySuffix(decoded);
  return CASE_INSENSITIVE_REPOSITORY_HOSTS.has(hostname)
    ? stripped.toLowerCase()
    : stripped;
}

export function normalizeRepositoryIdentity(remote, repo = process.cwd()) {
  const value = String(remote ?? "").trim();
  if (!value) throw new Error("origin remote is required for shared coordination state");

  const scpStyle = value.match(/^(?:[^@/]+@)?([^:/]+):(.+)$/);
  if (scpStyle && !value.includes("://")) {
    const hostname = normalizeRemoteHost(scpStyle[1]);
    return `${hostname}/${normalizeRemoteRepositoryPath(hostname, scpStyle[2])}`;
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    const parsed = new URL(value);
    if (parsed.protocol === "file:") {
      return `file:${stripFileRepositorySuffix(resolve(fileURLToPath(parsed)))}`;
    }
    const port = parsed.port && parsed.port !== DEFAULT_REMOTE_PORTS.get(parsed.protocol)
      ? `:${parsed.port}`
      : "";
    const hostname = normalizeRemoteHost(parsed.hostname);
    const host = `${hostname}${port}`;
    if (!host) throw new Error("origin remote does not include a host");
    return `${host}/${normalizeRemoteRepositoryPath(hostname, parsed.pathname)}`;
  }

  return `file:${stripFileRepositorySuffix(resolve(repo, value))}`;
}

export function getRepositoryIdentity(repo) {
  let remote;
  try {
    remote = git(repo, ["remote", "get-url", "origin"]);
  } catch {
    throw new Error("origin remote is required for shared coordination state");
  }
  return normalizeRepositoryIdentity(remote, repo);
}

function getStateHome(stateHome) {
  const selected = stateHome ?? join(homedir(), ".local", "state");
  if (!isAbsolute(selected)) throw new Error("coordination state home must be absolute");
  return resolve(selected);
}

function getCommonDirectory(repo) {
  const commonDirRaw = git(repo, ["rev-parse", "--git-common-dir"]);
  return isAbsolute(commonDirRaw) ? resolve(commonDirRaw) : resolve(repo, commonDirRaw);
}

function listWorktreeRoots(repo) {
  return git(repo, ["worktree", "list", "--porcelain"])
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length));
}

export function getCoordinationPaths(repo, stateHome = null) {
  const repositoryIdentity = getRepositoryIdentity(repo);
  const repositoryKey = hash(repositoryIdentity);
  const namespaceRoot = join(getStateHome(stateHome), ...STATE_NAMESPACE);
  const root = join(namespaceRoot, repositoryKey);
  return {
    repositoryIdentity,
    repositoryKey,
    namespaceRoot,
    cloneIndex: join(namespaceRoot, "clone-index"),
    root,
    clones: join(root, "clones"),
    leaseDirectory: join(root, "writer-lease"),
    leaseOperations: join(root, "lease-operations"),
    leaseTokens: join(root, "lease-tokens"),
  };
}

export function getLeasePaths(repo, stateHome = null) {
  const coordination = getCoordinationPaths(repo, stateHome);
  const directory = coordination.leaseDirectory;
  return { directory, owner: join(directory, "owner.json") };
}

function ensurePrivateDirectory(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
}

function writeJsonAtomically(path, value) {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      flag: "wx",
      mode: 0o600,
    });
    renameSync(temporary, path);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

function validateCloneRecord(record, repositoryIdentity) {
  if (record?.schemaVersion !== 1) throw new Error("clone registry entry has an unsupported schema");
  if (record.repositoryIdentity !== repositoryIdentity) {
    throw new Error("clone registry entry belongs to a different repository");
  }
  for (const key of ["root", "commonDir", "registeredAt", "lastSeenAt"]) {
    if (!record[key]) throw new Error(`clone registry entry is missing ${key}`);
  }
  if (!isAbsolute(record.root) || !isAbsolute(record.commonDir)) {
    throw new Error("clone registry paths must be absolute");
  }
}

function validateCloneBinding(binding, repositoryIdentity, commonDir) {
  if (binding?.schemaVersion !== 1) throw new Error("clone binding has an unsupported schema");
  if (typeof binding.repositoryIdentity !== "string" || !binding.repositoryIdentity) {
    throw new Error("clone binding is missing repositoryIdentity");
  }
  if (typeof binding.commonDir !== "string" || !isAbsolute(binding.commonDir)) {
    throw new Error("clone binding commonDir must be absolute");
  }
  if (!binding.registeredAt) throw new Error("clone binding is missing registeredAt");
  if (binding.repositoryIdentity !== repositoryIdentity) {
    throw new Error("registered clone origin has changed");
  }
  if (binding.commonDir !== commonDir) {
    throw new Error("clone binding key does not match its Git common directory");
  }
}

function getCloneBindingPath(paths, commonDir) {
  return join(paths.cloneIndex, `${hash(commonDir)}.json`);
}

function readCloneBinding(paths, commonDir) {
  const bindingPath = getCloneBindingPath(paths, commonDir);
  if (!existsSync(bindingPath)) return null;
  const binding = JSON.parse(readFileSync(bindingPath, "utf8"));
  validateCloneBinding(binding, paths.repositoryIdentity, commonDir);
  return binding;
}

function ensureCloneBinding(paths, commonDir, now) {
  ensurePrivateDirectory(paths.namespaceRoot);
  ensurePrivateDirectory(paths.cloneIndex);
  const bindingPath = getCloneBindingPath(paths, commonDir);
  const binding = {
    schemaVersion: 1,
    repositoryIdentity: paths.repositoryIdentity,
    commonDir,
    registeredAt: now.toISOString(),
  };
  try {
    writeFileSync(bindingPath, `${JSON.stringify(binding, null, 2)}\n`, {
      flag: "wx",
      mode: 0o600,
    });
    return binding;
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }

  const existing = readCloneBinding(paths, commonDir);
  if (!existing) throw new Error("clone binding disappeared during registration");
  return existing;
}

export function registerClone(repo, options = {}) {
  const now = options.now ?? new Date();
  const root = resolve(git(repo, ["rev-parse", "--show-toplevel"]));
  const commonDir = getCommonDirectory(root);
  const paths = getCoordinationPaths(root, options.stateHome ?? null);
  ensureCloneBinding(paths, commonDir, now);
  ensurePrivateDirectory(paths.root);
  ensurePrivateDirectory(paths.clones);

  const recordPath = join(paths.clones, `${hash(commonDir)}.json`);
  let existing = null;
  if (existsSync(recordPath)) {
    existing = JSON.parse(readFileSync(recordPath, "utf8"));
    validateCloneRecord(existing, paths.repositoryIdentity);
    if (existing.commonDir !== commonDir) {
      throw new Error("clone registry key does not match its Git common directory");
    }
  }

  const record = {
    schemaVersion: 1,
    repositoryIdentity: paths.repositoryIdentity,
    root,
    commonDir,
    registeredAt: existing?.registeredAt ?? now.toISOString(),
    lastSeenAt: now.toISOString(),
  };
  writeJsonAtomically(recordPath, record);
  return record;
}

export function readRegisteredClones(repo, stateHome = null) {
  const paths = getCoordinationPaths(repo, stateHome);
  const records = existsSync(paths.clones) ? readdirSync(paths.clones)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const record = JSON.parse(readFileSync(join(paths.clones, name), "utf8"));
      validateCloneRecord(record, paths.repositoryIdentity);
      if (name !== `${hash(record.commonDir)}.json`) {
        throw new Error(`clone registry key is invalid: ${name}`);
      }
      return record;
    }) : [];
  const recordsByCommonDir = new Map(records.map((record) => [record.commonDir, record]));

  const bindings = existsSync(paths.cloneIndex) ? readdirSync(paths.cloneIndex)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const binding = JSON.parse(readFileSync(join(paths.cloneIndex, name), "utf8"));
      validateCloneBinding(binding, binding?.repositoryIdentity, binding?.commonDir);
      if (name !== `${hash(binding.commonDir)}.json`) {
        throw new Error(`clone binding key is invalid: ${name}`);
      }
      return binding;
    }) : [];

  for (const binding of bindings) {
    if (
      binding.repositoryIdentity === paths.repositoryIdentity
      && !recordsByCommonDir.has(binding.commonDir)
    ) {
      throw new Error(`clone binding has no registry entry: ${binding.commonDir}`);
    }
  }
  for (const record of records) {
    if (!readCloneBinding(paths, record.commonDir)) {
      throw new Error(`clone registry entry has no binding: ${record.commonDir}`);
    }
  }
  return records;
}

export function verifyRegisteredClone(record) {
  validateCloneRecord(record, record?.repositoryIdentity);
  const root = resolve(git(record.root, ["rev-parse", "--show-toplevel"]));
  if (root !== record.root) throw new Error("registered clone root has changed");
  if (getCommonDirectory(root) !== record.commonDir) {
    throw new Error("registered clone Git common directory has changed");
  }
  if (getRepositoryIdentity(root) !== record.repositoryIdentity) {
    throw new Error("registered clone origin has changed");
  }
  return true;
}

export function getLegacyLeasePaths(repo) {
  const directory = join(
    getCommonDirectory(repo),
    "codex-agent-state",
    "obraxen",
    "writer-lease",
  );
  return { directory, owner: join(directory, "owner.json") };
}

export function readLegacyLease(repo) {
  const paths = getLegacyLeasePaths(repo);
  if (!existsSync(paths.owner)) {
    if (existsSync(paths.directory)) {
      throw new Error("legacy lease directory exists without an owner record");
    }
    return null;
  }
  const record = JSON.parse(readFileSync(paths.owner, "utf8"));
  validateOwner(record);
  return record;
}

function assertCoordinationReady(repo, stateHome) {
  const clones = readRegisteredClones(repo, stateHome);
  for (const clone of clones) {
    verifyRegisteredClone(clone);
    if (readLegacyLease(clone.root)) {
      throw new Error(`registered clone has an active legacy lease: ${clone.root}`);
    }
    for (const worktree of listWorktreeRoots(clone.root)) {
      if (readCoordinationProtocolVersion(worktree) !== COORDINATION_PROTOCOL_VERSION) {
        throw new Error(`registered worktree uses an incompatible coordination protocol: ${worktree}`);
      }
    }
  }
}

function reserveLeaseToken(coordination, owner, now) {
  ensurePrivateDirectory(coordination.leaseTokens);
  const reservation = join(coordination.leaseTokens, `${hash(owner.token)}.json`);
  try {
    writeFileSync(reservation, `${JSON.stringify({
      schemaVersion: 1,
      runId: owner.runId,
      tokenHash: hash(owner.token),
      firstUsedAt: now.toISOString(),
    }, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error("lease token has already been used");
    throw error;
  }
}

export function readLease(repo, stateHome = null) {
  const coordination = getCoordinationPaths(repo, stateHome);
  readCloneBinding(coordination, getCommonDirectory(repo));
  const directory = coordination.leaseDirectory;
  const paths = { directory, owner: join(directory, "owner.json") };
  if (!existsSync(paths.owner)) {
    if (existsSync(paths.directory)) {
      throw new Error("lease directory exists without an owner record");
    }
    return null;
  }
  const record = JSON.parse(readFileSync(paths.owner, "utf8"));
  validateOwner(record);
  const repositoryIdentity = getRepositoryIdentity(repo);
  if (record.repositoryIdentity !== repositoryIdentity) {
    throw new Error("lease owner belongs to a different repository");
  }
  return record;
}

function validateOwner(owner) {
  for (const key of ["runId", "token", "host", "pid", "worktree", "baseSha", "claimPath"]) {
    if (!owner?.[key]) throw new Error(`lease owner is missing ${key}`);
  }
  if (!Array.isArray(owner.paths) || owner.paths.length === 0) {
    throw new Error("lease owner requires exact paths");
  }
}

export function acquireLease(repo, owner, now = new Date(), stateHome = null) {
  validateOwner(owner);
  registerClone(repo, { now, stateHome });
  assertCoordinationReady(repo, stateHome);
  const coordination = getCoordinationPaths(repo, stateHome);
  reserveLeaseToken(coordination, owner, now);
  const paths = getLeasePaths(repo, stateHome);
  ensurePrivateDirectory(dirname(paths.directory));
  try {
    mkdirSync(paths.directory, { mode: 0o700 });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    return { acquired: false, reason: "lease_exists", owner: readLease(repo, stateHome) };
  }

  const record = {
    ...owner,
    schemaVersion: 1,
    repositoryIdentity: coordination.repositoryIdentity,
    acquiredAt: now.toISOString(),
    heartbeatAt: now.toISOString(),
  };
  try {
    writeFileSync(paths.owner, `${JSON.stringify(record, null, 2)}\n`, {
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    rmSync(paths.directory, { recursive: true, force: true });
    throw error;
  }
  return { acquired: true, owner: record };
}

function assertToken(record, token) {
  if (!record) throw new Error("lease does not exist");
  if (record.token !== token) throw new Error("lease token mismatch");
}

function withLeaseOperationLock(coordination, token, operation) {
  if (!token) throw new Error("lease operation requires a token");
  ensurePrivateDirectory(coordination.leaseOperations);
  const lock = join(coordination.leaseOperations, hash(token));
  try {
    mkdirSync(lock, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error("lease operation already in progress");
    throw error;
  }
  try {
    return operation();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

export function heartbeatLease(repo, token, now = new Date(), stateHome = null) {
  const coordination = getCoordinationPaths(repo, stateHome);
  return withLeaseOperationLock(coordination, token, () => {
    const paths = getLeasePaths(repo, stateHome);
    const record = readLease(repo, stateHome);
    assertToken(record, token);
    const updated = { ...record, heartbeatAt: now.toISOString() };
    writeJsonAtomically(paths.owner, updated);
    return updated;
  });
}

export function releaseLease(repo, token, stateHome = null) {
  const coordination = getCoordinationPaths(repo, stateHome);
  return withLeaseOperationLock(coordination, token, () => {
    const paths = getLeasePaths(repo, stateHome);
    const record = readLease(repo, stateHome);
    assertToken(record, token);
    rmSync(paths.directory, { recursive: true, force: true });
    return { released: true, runId: record.runId };
  });
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
    const coordination = getCoordinationPaths(repo);
    result = {
      repositoryIdentity: coordination.repositoryIdentity,
      stateRoot: coordination.root,
      registeredClones: readRegisteredClones(repo),
      owner: readLease(repo),
    };
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
