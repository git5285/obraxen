import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_CHANGED_FILE_BYTES = 5 * 1024 * 1024;

const SECRET_PATTERNS = [
  { label: "private key", regex: /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/ },
  { label: "AWS access key", regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { label: "GitHub token", regex: /\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}\b/ },
  { label: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { label: "OpenAI key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { label: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: "Stripe secret key", regex: /\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b/ },
];

function runGit(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function runGitBuffer(args, input) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    input,
    maxBuffer: 256 * 1024 * 1024,
  });
}

function splitNullSeparated(output) {
  return output.split("\0").filter(Boolean);
}

function trackedFiles() {
  return splitNullSeparated(runGit(["ls-files", "-z"]));
}

function changedFiles() {
  const baseSha = process.env.BASE_SHA?.trim();

  if (/^[0-9a-f]{40}$/i.test(baseSha ?? "")) {
    try {
      return splitNullSeparated(
        runGit(["diff", "--name-only", "--diff-filter=ACMR", "-z", `${baseSha}...HEAD`]),
      );
    } catch {
      // A shallow or provider-specific checkout may not contain the advertised base.
      // The current commit fallback still protects new files in that checkout.
    }
  }

  return splitNullSeparated(
    runGit([
      "diff-tree",
      "--root",
      "--no-commit-id",
      "--name-only",
      "--diff-filter=ACMR",
      "-r",
      "-z",
      "HEAD",
    ]),
  );
}

function ignoredTrackedFiles() {
  return splitNullSeparated(runGit(["ls-files", "-ci", "--exclude-standard", "-z"]));
}

function workflowFiles(files) {
  return files.filter(
    (file) => file.startsWith(".github/workflows/") && /\.ya?ml$/.test(file),
  );
}

function isEnvFile(path) {
  const name = path.split("/").at(-1);
  return name === ".env" || (name?.startsWith(".env.") && name !== ".env.example");
}

function findSecrets(files) {
  const findings = [];

  for (const file of files) {
    let stat;
    try {
      stat = lstatSync(resolve(process.cwd(), file));
    } catch {
      continue;
    }

    if (!stat.isFile()) continue;

    let content;
    try {
      const buffer = readFileSync(resolve(process.cwd(), file));
      if (buffer.includes(0)) continue;
      content = buffer.toString("utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(lines[lineIndex])) {
          findings.push({ file, line: lineIndex + 1, label: pattern.label });
        }
      }
    }
  }

  return findings;
}

function reachableObjects() {
  const objects = new Map();

  for (const line of runGit(["rev-list", "--objects", "--all"]).split(/\r?\n/)) {
    if (!line) continue;
    const [objectId, ...pathParts] = line.split(" ");
    if (!/^[0-9a-f]{40}$/i.test(objectId ?? "")) continue;
    if (!objects.has(objectId)) objects.set(objectId, pathParts.join(" "));
  }

  return objects;
}

function findSecretsInReachableHistory() {
  const objects = reachableObjects();
  const objectIds = [...objects.keys()];
  if (objectIds.length === 0) return { findings: [], blobs: 0 };

  const output = runGitBuffer(["cat-file", "--batch"], `${objectIds.join("\n")}\n`);
  const findings = [];
  let offset = 0;
  let blobs = 0;

  for (const objectId of objectIds) {
    const headerEnd = output.indexOf(10, offset);
    if (headerEnd === -1) break;

    const header = output.subarray(offset, headerEnd).toString("utf8").split(" ");
    offset = headerEnd + 1;
    if (header[1] === "missing") continue;

    const type = header[1];
    const size = Number(header[2]);
    if (!Number.isSafeInteger(size) || size < 0 || offset + size > output.length) break;

    const content = output.subarray(offset, offset + size);
    offset += size;
    if (output[offset] === 10) offset += 1;
    if (type !== "blob") continue;

    blobs += 1;
    if (content.includes(0)) continue;

    const path = objects.get(objectId) || `(object ${objectId.slice(0, 12)})`;
    const lines = content.toString("utf8").split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(lines[lineIndex])) {
          findings.push({
            file: `${path} (reachable history ${objectId.slice(0, 12)})`,
            line: lineIndex + 1,
            label: pattern.label,
          });
        }
      }
    }
  }

  return { findings, blobs };
}

function findOversizedChangedFiles(files) {
  const findings = [];

  for (const file of files) {
    let stat;
    try {
      stat = lstatSync(resolve(process.cwd(), file));
    } catch {
      continue;
    }

    if (stat.isFile() && stat.size > MAX_CHANGED_FILE_BYTES) {
      findings.push({ file, bytes: stat.size });
    }
  }

  return findings;
}

function findUnpinnedActions(files) {
  const findings = [];

  for (const file of workflowFiles(files)) {
    let content;
    try {
      content = readFileSync(resolve(process.cwd(), file), "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const match = lines[lineIndex].match(/^\s*(?:-\s*)?uses:\s*([^\s#]+)/);
      if (!match || match[1].startsWith("./")) continue;

      const reference = match[1].split("@").at(-1);
      if (!/^[0-9a-f]{40}$/i.test(reference ?? "")) {
        findings.push({ file, line: lineIndex + 1 });
      }
    }
  }

  return findings;
}

const findings = [];
const files = trackedFiles();
const ignored = ignoredTrackedFiles();
const secrets = findSecrets(files);
const historicalSecrets = findSecretsInReachableHistory();
const oversized = findOversizedChangedFiles(changedFiles());
const unpinnedActions = findUnpinnedActions(files);
const envFiles = files.filter(isEnvFile);

for (const file of ignored) {
  findings.push(`tracked file is also ignored: ${file}`);
}

for (const file of envFiles) {
  findings.push(`tracked environment file: ${file}`);
}

for (const secret of secrets) {
  findings.push(`possible ${secret.label} in ${secret.file}:${secret.line}`);
}

for (const secret of historicalSecrets.findings) {
  findings.push(`possible ${secret.label} in ${secret.file}:${secret.line}`);
}

for (const file of oversized) {
  const sizeMiB = (file.bytes / 1024 / 1024).toFixed(2);
  findings.push(`changed file exceeds 5 MiB: ${file.file} (${sizeMiB} MiB)`);
}

for (const action of unpinnedActions) {
  findings.push(`workflow action is not pinned to a commit SHA: ${action.file}:${action.line}`);
}

if (findings.length > 0) {
  console.error("Repository hygiene check failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(
    `Repository hygiene OK: ${files.length} tracked files and ${historicalSecrets.blobs} reachable history blobs scanned; no tracked secrets, ignored tracked files, oversized changed files, or unpinned workflow actions.`,
  );
}
