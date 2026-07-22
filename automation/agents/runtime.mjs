import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SHA256 = /^[0-9a-f]{64}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function packageManagerVersion(value) {
  const match = /^npm@(\d+\.\d+\.\d+)$/.exec(value ?? "");
  if (!match) throw new Error("package.json packageManager must pin an exact npm version");
  return match[1];
}

export function readRuntimeContract(repo = process.cwd()) {
  const root = resolve(repo);
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const nodeVersion = readFileSync(join(root, ".nvmrc"), "utf8").trim();
  if (!/^\d+\.\d+\.\d+$/.test(nodeVersion)) {
    throw new Error(".nvmrc must pin an exact Node.js version");
  }
  if (packageJson.engines?.node !== nodeVersion) {
    throw new Error("package.json engines.node must exactly match .nvmrc");
  }
  const npmVersion = packageManagerVersion(packageJson.packageManager);
  const lockfilePath = join(root, "package-lock.json");
  const lockfileSha256 = sha256(readFileSync(lockfilePath));
  return {
    schemaVersion: 1,
    nodeVersion,
    npmVersion,
    packageManager: packageJson.packageManager,
    lockfileSha256,
  };
}

export function canonicalDependencyTree(value) {
  const visit = (node) => ({
    version: typeof node?.version === "string" ? node.version : null,
    dependencies: Object.fromEntries(Object.entries(node?.dependencies ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, dependency]) => [name, visit(dependency)])),
  });
  return visit(value);
}

export function createRuntimeFingerprint(value) {
  const payload = {
    schemaVersion: 1,
    nodeVersion: value.nodeVersion,
    npmVersion: value.npmVersion,
    platform: value.platform,
    arch: value.arch,
    lockfileSha256: value.lockfileSha256,
    dependencyTreeSha256: value.dependencyTreeSha256,
  };
  for (const [key, item] of Object.entries(payload)) {
    if (key !== "schemaVersion" && (typeof item !== "string" || !item)) {
      throw new Error(`runtime fingerprint ${key} must be a non-empty string`);
    }
  }
  for (const key of ["lockfileSha256", "dependencyTreeSha256"]) {
    if (!SHA256.test(payload[key])) throw new Error(`runtime fingerprint ${key} must be SHA-256`);
  }
  return sha256(JSON.stringify(stable(payload)));
}

function runtimePath(nodeBinary = process.execPath) {
  return `${dirname(nodeBinary)}:${process.env.PATH ?? ""}`;
}

function npmBinary(nodeBinary = process.execPath) {
  const candidate = join(dirname(nodeBinary), "npm");
  return existsSync(candidate) ? candidate : "npm";
}

function run(binary, args, options = {}) {
  return spawnSync(binary, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: { ...process.env, PATH: runtimePath(options.nodeBinary) },
    maxBuffer: 16 * 1024 * 1024,
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });
}

function dependencyInspection(repo, nodeBinary) {
  const result = run(npmBinary(nodeBinary), ["ls", "--all", "--json"], {
    cwd: repo,
    nodeBinary,
  });
  let tree = null;
  try {
    tree = JSON.parse(result.stdout || "null");
  } catch {
    // The exit status and parse blocker below retain the failure without trusting prose.
  }
  const problems = Array.isArray(tree?.problems) ? tree.problems : [];
  const valid = result.status === 0 && tree && problems.length === 0;
  return {
    valid,
    problems,
    digest: tree ? sha256(JSON.stringify(canonicalDependencyTree(tree))) : null,
    error: valid ? null : (result.stderr || "npm dependency tree is invalid").trim(),
  };
}

function nativeInspection(repo, nodeBinary) {
  const result = run(nodeBinary, [
    "--input-type=module",
    "--eval",
    "await import('rolldown')",
  ], { cwd: repo, nodeBinary });
  return {
    valid: result.status === 0,
    error: result.status === 0 ? null : (result.stderr || "rolldown native binding failed").trim(),
  };
}

export function inspectRuntime(repo = process.cwd(), options = {}) {
  const root = resolve(repo);
  const blockers = [];
  let contract;
  try {
    contract = options.contract ?? readRuntimeContract(root);
  } catch (error) {
    return {
      schemaVersion: 1,
      ok: false,
      fingerprint: null,
      blockers: ["runtime_contract_invalid"],
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const nodeBinary = options.nodeBinary ?? process.execPath;
  const nodeVersion = options.nodeVersion ?? process.version.replace(/^v/, "");
  const npmResult = options.npmVersion
    ? { status: 0, stdout: `${options.npmVersion}\n`, stderr: "" }
    : run(npmBinary(nodeBinary), ["--version"], { cwd: root, nodeBinary });
  const npmVersion = String(npmResult.stdout ?? "").trim() || null;
  if (nodeVersion !== contract.nodeVersion) blockers.push("node_version_mismatch");
  if (npmResult.status !== 0 || npmVersion !== contract.npmVersion) blockers.push("npm_version_mismatch");

  const dependencies = options.dependencies ?? dependencyInspection(root, nodeBinary);
  if (!dependencies.valid || !SHA256.test(dependencies.digest ?? "")) {
    blockers.push("dependency_tree_invalid");
  }
  const native = options.native ?? nativeInspection(root, nodeBinary);
  if (!native.valid) blockers.push("native_binding_invalid");

  let fingerprint = null;
  if (blockers.length === 0) {
    fingerprint = createRuntimeFingerprint({
      nodeVersion,
      npmVersion,
      platform: options.platform ?? process.platform,
      arch: options.arch ?? process.arch,
      lockfileSha256: contract.lockfileSha256,
      dependencyTreeSha256: dependencies.digest,
    });
  }

  return {
    schemaVersion: 1,
    ok: blockers.length === 0,
    fingerprint,
    expected: contract,
    actual: {
      nodeVersion,
      npmVersion,
      platform: options.platform ?? process.platform,
      arch: options.arch ?? process.arch,
      nodeBinary,
      dependencyTreeSha256: dependencies.digest,
    },
    checks: {
      dependencyTree: { valid: dependencies.valid, problems: dependencies.problems ?? [] },
      nativeBinding: { valid: native.valid },
    },
    blockers,
    errors: [dependencies.error, native.error].filter(Boolean),
  };
}

function candidateBinaries(expectedVersion) {
  const runnerArchitecture = process.arch === "x64" ? "x64" : process.arch;
  const toolCache = process.env.RUNNER_TOOL_CACHE ?? process.env.AGENT_TOOLSDIRECTORY;
  const candidates = [
    process.execPath,
    "/opt/homebrew/opt/node@24/bin/node",
    "/usr/local/opt/node@24/bin/node",
    join(homedir(), ".nvm", "versions", "node", `v${expectedVersion}`, "bin", "node"),
    toolCache ? join(toolCache, "node", expectedVersion, runnerArchitecture, "bin", "node") : null,
  ];
  const which = run("which", ["-a", "node"]);
  if (which.status === 0) candidates.push(...which.stdout.split("\n"));
  return [...new Set(candidates.filter(Boolean).map((candidate) => {
    try {
      return realpathSync(candidate);
    } catch {
      return null;
    }
  }).filter(Boolean))];
}

export function findRuntimeBinary(repo = process.cwd()) {
  const contract = readRuntimeContract(repo);
  for (const candidate of candidateBinaries(contract.nodeVersion)) {
    const version = run(candidate, ["--version"], { nodeBinary: candidate });
    if (version.status === 0 && version.stdout.trim() === `v${contract.nodeVersion}`) return candidate;
  }
  throw new Error(`Node.js ${contract.nodeVersion} is required but no matching binary was found`);
}

function separatorArguments() {
  const separator = process.argv.indexOf("--");
  return separator === -1 ? [] : process.argv.slice(separator + 1);
}

function executeWithCurrentRuntime(repo, command) {
  const inspection = inspectRuntime(repo);
  if (!inspection.ok) {
    process.stderr.write(`${JSON.stringify(inspection, null, 2)}\n`);
    return 1;
  }
  if (command.length === 0) throw new Error("runtime exec requires a command after --");
  const result = run(command[0], command.slice(1), {
    cwd: repo,
    nodeBinary: process.execPath,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function installWithCurrentRuntime(repo) {
  const contract = readRuntimeContract(repo);
  const nodeVersion = process.version.replace(/^v/, "");
  const npm = npmBinary(process.execPath);
  const npmVersion = run(npm, ["--version"], {
    cwd: repo,
    nodeBinary: process.execPath,
  });
  if (
    nodeVersion !== contract.nodeVersion
    || npmVersion.status !== 0
    || npmVersion.stdout.trim() !== contract.npmVersion
  ) {
    throw new Error("dependency installation requires the exact pinned Node.js and npm versions");
  }
  const installed = run(npm, [
    "ci", "--ignore-scripts", "--audit=false", "--fund=false",
  ], { cwd: repo, nodeBinary: process.execPath, stdio: "inherit" });
  if (installed.error) throw installed.error;
  if (installed.status !== 0) return installed.status ?? 1;
  const inspection = inspectRuntime(repo);
  process.stdout.write(`${JSON.stringify(inspection, null, 2)}\n`);
  return inspection.ok ? 0 : 1;
}

function main() {
  const operation = process.argv[2] ?? "status";
  const repo = process.cwd();
  if (operation === "status" || operation === "assert") {
    const inspection = inspectRuntime(repo);
    process.stdout.write(`${JSON.stringify(inspection, null, 2)}\n`);
    if (operation === "assert" && !inspection.ok) process.exitCode = 1;
    return;
  }
  if (operation === "exec") {
    const binary = findRuntimeBinary(repo);
    const result = run(binary, [fileURLToPath(import.meta.url), "_exec", "--", ...separatorArguments()], {
      cwd: repo,
      nodeBinary: binary,
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
    return;
  }
  if (operation === "install") {
    const binary = findRuntimeBinary(repo);
    const result = run(binary, [fileURLToPath(import.meta.url), "_install"], {
      cwd: repo,
      nodeBinary: binary,
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
    return;
  }
  if (operation === "_exec") {
    process.exitCode = executeWithCurrentRuntime(repo, separatorArguments());
    return;
  }
  if (operation === "_install") {
    process.exitCode = installWithCurrentRuntime(repo);
    return;
  }
  throw new Error("usage: runtime.mjs status|assert|install|exec -- <command> [args]");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
