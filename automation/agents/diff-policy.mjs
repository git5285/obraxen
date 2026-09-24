import { fileURLToPath } from "node:url";
import { posix } from "node:path";
import { loadPolicy } from "./policy.mjs";

export function globMatches(pattern, path) {
  if (pattern.endsWith("/**")) return path === pattern.slice(0, -3) || path.startsWith(pattern.slice(0, -2));
  if (pattern.endsWith("*")) return path.startsWith(pattern.slice(0, -1));
  return path === pattern;
}

export function isDependencyManifest(path) {
  return new Set([
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "yarn.lock",
  ]).has(typeof path === "string" ? posix.basename(path) : path);
}

export function validateDiff({ changedPaths, allowedPaths, addedLines, deletedLines }, policy = loadPolicy()) {
  if (!Array.isArray(changedPaths) || !Array.isArray(allowedPaths)) {
    throw new Error("changedPaths and allowedPaths must be arrays");
  }
  const uniqueChangedPaths = [...new Set(changedPaths)];
  const violations = [];

  if (
    uniqueChangedPaths.length > 0
    && (policy.mode !== "active" || !policy.authority.allowLocalDiff)
  ) {
    violations.push("policy does not authorize local diffs");
  }

  for (const [label, paths] of [["changedPaths", uniqueChangedPaths], ["allowedPaths", allowedPaths]]) {
    for (const path of paths) {
      if (
        typeof path !== "string"
        || !path
        || path.startsWith("/")
        || path.includes("\\")
        || path !== posix.normalize(path)
        || path === "."
        || path.startsWith("../")
      ) {
        violations.push(`${label} contains a non-canonical repository path`);
      }
    }
  }

  if (!Number.isInteger(addedLines) || addedLines < 0) {
    violations.push("addedLines must be a non-negative integer");
  }
  if (!Number.isInteger(deletedLines) || deletedLines < 0) {
    violations.push("deletedLines must be a non-negative integer");
  }

  if (uniqueChangedPaths.length > policy.limits.maxChangedFiles) {
    violations.push(`changed file count exceeds ${policy.limits.maxChangedFiles}`);
  }
  if (Number.isInteger(addedLines) && Number.isInteger(deletedLines)
    && addedLines + deletedLines > policy.limits.maxDiffLines) {
    violations.push(`diff lines exceed ${policy.limits.maxDiffLines}`);
  }
  for (const path of uniqueChangedPaths) {
    if (!allowedPaths.includes(path)) violations.push(`${path} is outside the exact run manifest`);
    if (!policy.authority.allowDependencyChanges && isDependencyManifest(path)) {
      violations.push(`${path} changes dependencies without authority`);
    }
    if (policy.protectedPaths.some((pattern) => globMatches(pattern, path))) {
      violations.push(`${path} is protected`);
    }
  }
  return { ok: violations.length === 0, violations, changedPaths: uniqueChangedPaths };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const payload = JSON.parse(process.argv[2] ?? "null");
  const result = validateDiff(payload);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 2;
}
