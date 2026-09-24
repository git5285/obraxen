import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectRuntime } from "../automation/agents/runtime.mjs";

// Security advisories and browser/runtime behavior require fresh evidence.
export const LOCAL_CHECKS = ["lint", "typecheck", "test:coverage", "build"];
export const FRESH_CHECKS = ["test:published", "test:e2e:contact", "test:e2e", "lighthouse:legacy"];
const MAX_AGE_MS = 60 * 60 * 1000;
const hash = (value) => createHash("sha256").update(value).digest("hex");

function git(repo, args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

export function treeDigest(root, excluded = []) {
  const digest = createHash("sha256");
  function visit(path, relative) {
    if (excluded.includes(relative)) return;
    const stat = lstatSync(path);
    digest.update(JSON.stringify([relative, stat.mode]));
    if (stat.isSymbolicLink()) {
      digest.update(JSON.stringify(readlinkSync(path)));
      const target = realpathSync(path);
      // Linked directories can hide inputs outside the selected tree.
      if (!lstatSync(target).isFile()) throw new Error("linked directory is not cacheable");
      digest.update(hash(readFileSync(target)));
    } else if (stat.isDirectory()) {
      for (const child of readdirSync(path).sort()) visit(join(path, child), `${relative}/${child}`);
    } else if (stat.isFile()) digest.update(hash(readFileSync(path)));
    else throw new Error("unsupported cache input");
  }
  visit(root, ".");
  return digest.digest("hex");
}

export function environmentDigest(environment) {
  // npm and Git add invocation bookkeeping that is unrelated to check inputs.
  const ignored = /^(?:npm_lifecycle_event|npm_lifecycle_script|npm_command|npm_config_argv|INIT_CWD|PWD|OLDPWD|SHLVL|_|GIT_PREFIX|GIT_DIR|GIT_WORK_TREE|GIT_INDEX_FILE)$/;
  return hash(JSON.stringify(Object.entries(environment).filter(([key]) => !ignored.test(key))
    .map(([key, value]) => [key, key === "PATH" ? [...new Set(value.split(":"))].join(":") : value])
    .sort(([a], [b]) => a.localeCompare(b))));
}

export function candidateDigest(repo) {
  const paths = new Set(git(repo, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]).split("\0").filter(Boolean));
  const ignored = git(repo, ["ls-files", "-z", "--others", "--ignored", "--exclude-standard"]).split("\0").filter(Boolean);
  // Tool outputs are accounted for separately where they become compiler inputs.
  const output = /^(?:node_modules|\.next|coverage|playwright-report|test-results|\.lighthouseci|\.vercel|\.impeccable)(?:\/|$)|(?:^|\/)tsconfig\.tsbuildinfo$|^apps\/public-site\/(?:\.next\/|app\/generated-home-html\.js$)/;
  for (const path of ignored) if (!output.test(path)) paths.add(path);
  // Gitignored environment files are still build inputs.
  for (const path of readdirSync(repo)) if (path === ".npmrc" || path.startsWith(".env")) paths.add(path);
  return hash(JSON.stringify([...paths].sort().map((path) => {
    const full = join(repo, path);
    return [path, existsSync(full) ? treeDigest(full) : null];
  })));
}

export function qualityFingerprint(repo) {
  const runtime = inspectRuntime(repo);
  if (!runtime.ok) throw new Error("runtime cannot supply reusable evidence");
  return hash(JSON.stringify({
    version: 1, checks: LOCAL_CHECKS, repo: realpathSync(repo),
    candidate: candidateDigest(repo), runtime: runtime.fingerprint,
    gitHead: git(repo, ["rev-parse", "HEAD"]).trim(),
    gitRef: git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]).trim(),
    gitConfig: hash(git(repo, ["config", "--list"])),
    node: hash(readFileSync(process.execPath)),
    dependencies: treeDigest(join(repo, "node_modules"), ["./.vite"]),
    npmConfig: hash(execFileSync("npm", ["config", "list", "--json"], { cwd: repo, encoding: "utf8" })),
    environment: environmentDigest(process.env),
  }));
}

export function generatedInputsDigest(repo) {
  return hash(JSON.stringify([".next/types", ".next/dev/types", "tsconfig.tsbuildinfo"].map((path) => {
    const full = join(repo, path);
    return [path, existsSync(full) ? treeDigest(full) : null];
  })));
}

export function reusableReceipt(receipt, fingerprintValue, now = Date.now()) {
  return receipt?.schemaVersion === 1 && receipt.fingerprint === fingerprintValue
    && receipt.result === "passed" && JSON.stringify(receipt.checks) === JSON.stringify(LOCAL_CHECKS)
    && Number.isFinite(receipt.checkedAt) && receipt.checkedAt <= now
    && now - receipt.checkedAt <= MAX_AGE_MS;
}

export function runQuality({ repo, reuse = false, head = null, receiptPath,
  snapshot = () => qualityFingerprint(repo), contentSnapshot = () => candidateDigest(repo),
  generatedSnapshot = () => generatedInputsDigest(repo), run = (script) => {
    const result = spawnSync("npm", ["run", script], { cwd: repo, stdio: "inherit" });
    if (result.error || result.status !== 0) throw new Error(`${script} failed (${result.status ?? result.error?.message})`);
  }, now = () => Date.now() }) {
  function assertHead() {
    if (head === null) return;
    if (!/^[a-f0-9]{40}$/.test(head) || git(repo, ["rev-parse", "HEAD"]).trim() !== head) {
      throw new Error("quality must validate the checked-out commit being pushed");
    }
    git(repo, ["diff", "--exit-code", head, "--"]);
    if (git(repo, ["ls-files", "--others", "--exclude-standard"]).trim()) {
      throw new Error("untracked inputs prevent quality evidence for the pushed commit");
    }
  }
  function saveReceipt(value) {
    mkdirSync(dirname(receiptPath), { recursive: true, mode: 0o700 });
    const temporary = `${receiptPath}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(value), { mode: 0o600 });
    renameSync(temporary, receiptPath);
  }
  function invalidateReceipt() {
    if (existsSync(receiptPath)) saveReceipt({ schemaVersion: 1, result: "invalid" });
  }
  assertHead();
  const originalContent = contentSnapshot();
  const generatedBefore = generatedSnapshot();
  let before = null;
  try { before = snapshot(); } catch { /* Missing cache prerequisites require a full run. */ }
  let receipt = null;
  try { receipt = JSON.parse(readFileSync(receiptPath, "utf8")); } catch { /* No usable receipt. */ }
  const reused = reuse && before !== null && reusableReceipt(receipt, before, now())
    && receipt.generatedFingerprint === generatedBefore;
  const checkedAt = now();
  try {
    if (!reused) {
      invalidateReceipt();
      for (const check of LOCAL_CHECKS) run(check);
    }
    let verifiedGenerated = reused ? generatedBefore : generatedSnapshot();
    for (const check of FRESH_CHECKS) run(check);
    // Browser runners rebuild. Verify their resulting compiler inputs if changed.
    if (generatedSnapshot() !== verifiedGenerated) {
      run("typecheck");
      verifiedGenerated = generatedSnapshot();
    }
    // This receipt proves local checks only. The npm entrypoint runs security fresh.
    let after = null;
    try { after = snapshot(); } catch { /* Do not cache an unverifiable candidate. */ }
    assertHead();
    if (contentSnapshot() !== originalContent || (before !== null && after !== before)
      || generatedSnapshot() !== verifiedGenerated) {
      throw new Error("quality inputs changed during verification; rerun affected checks");
    }
    if (!reused && before !== null && after === before) {
      saveReceipt({ schemaVersion: 1, fingerprint: before,
        generatedFingerprint: verifiedGenerated, checks: LOCAL_CHECKS,
        result: "passed", checkedAt });
    }
    return { reused, localChecks: LOCAL_CHECKS, freshChecks: FRESH_CHECKS };
  } catch (error) {
    invalidateReceipt();
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg, i) => !["--reuse", "--head"].includes(arg) && args[i - 1] !== "--head")) throw new Error("unknown quality option");
    const repo = process.cwd();
    const head = args.includes("--head") ? args[args.indexOf("--head") + 1] : null;
    if (args.includes("--head") && !head) throw new Error("--head requires a SHA");
    const receiptPath = join(homedir(), ".local/state/obraxen/quality-receipts", `${hash(realpathSync(repo))}.json`);
    console.log(JSON.stringify(runQuality({ repo, reuse: args.includes("--reuse"), head, receiptPath })));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
