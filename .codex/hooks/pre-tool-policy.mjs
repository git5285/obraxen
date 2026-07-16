import { readFileSync } from "node:fs";
import { posix } from "node:path";
import { fileURLToPath } from "node:url";
import { globMatches, isDependencyManifest } from "../../automation/agents/diff-policy.mjs";
import { loadPolicy } from "../../automation/agents/policy.mjs";

const autonomousRoles = new Set([
  "scout",
  "builder",
  "auditor",
]);

const readOnlyRoles = new Set(["scout", "auditor"]);
const writeToolPattern = /(?:apply_patch|\bedit\b|\bwrite\b|delete|move|rename)/i;
const applyPatchToolPattern = /apply_patch/i;

const dangerousCommandPatterns = [
  /(?:^|[\s;&|"'`/])git\b[^\n;&|]*\b(?:add|am|apply|bisect|branch|checkout|cherry-pick|clean|clone|commit|commit-tree|config|fast-import|fetch|filter-branch|gc|hash-object|init|maintenance|merge|mv|notes|pull|push|read-tree|rebase|remote|replace|reset|restore|revert|rm|stash|submodule|switch|tag|update-index|update-ref|worktree|write-tree)\b/i,
  /(?:^|[\s;&|"'`/])gh\b/i,
  /(?:^|[\s;&|"'`/])(?:vercel|netlify|firebase)\b/i,
  /(?:^|[\s;&|"'`/])(?:npm|pnpm|yarn)\b[^\n;&|]*\b(?:add|ci|dedupe|dlx|exec|init|install|link|pack|prune|publish|rebuild|remove|uninstall|unlink|update|upgrade|version|x)\b/i,
  /(?:^|[\s;&|"'`/])npx\b/i,
  /(?:^|[\s;&|"'`/])(?:curl|wget|scp|ssh|rsync)\b/i,
  /(?:^|[\s;&|"'`/])(?:rm|rmdir|mv|chmod|chown)\b/i,
  /(?:^|[\s;&|"'`/])(?:tee|touch|truncate|cp|install)\b/i,
  /(?:^|[\s;&|"'`/])(?:sed|perl)\b[^\n;&|]*\s-i\b/i,
  /(?:^|[\s;&|"'`/])(?:node|python3?|ruby|perl)\b[^\n;&|]*\s-[ce]\b/i,
  /(^|[^<])>{1,2}\s*[^&]/,
];

const builderInterpreterPatterns = [
  /(?:^|[\s;&|"'`/])(?:bash|dash|fish|sh|zsh)\b/i,
  /(?:^|[\s;&|"'`/])(?:node|perl|python3?|ruby)\b/i,
  /(?:^|[\s;&|"'`/])(?:dd|ed|emacs|ex|make|patch|tar|unzip|vi|vim)\b/i,
];

function deny(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  };
}

function commandFromInput(toolInput) {
  if (!toolInput || typeof toolInput !== "object") return "";
  for (const key of ["cmd", "command", "chars"]) {
    if (typeof toolInput[key] === "string") return toolInput[key];
  }
  return "";
}

function canonicalRepositoryPath(path) {
  return typeof path === "string"
    && path.length > 0
    && !path.startsWith("/")
    && !path.includes("\\")
    && path !== "."
    && !path.startsWith("../")
    && path === posix.normalize(path);
}

function patchPaths(toolInput) {
  const patch = typeof toolInput?.patch === "string"
    ? toolInput.patch
    : typeof toolInput === "string" ? toolInput : "";
  return [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+)$/gm)]
    .map((match) => match[1].trim());
}

function patternStem(pattern) {
  if (pattern.endsWith("/**")) return pattern.slice(0, -3);
  if (pattern.endsWith("*")) return pattern.slice(0, -1);
  return pattern;
}

function commandMentionsProtectedPath(command, policy) {
  return policy.protectedPaths.some((pattern) => command.includes(patternStem(pattern)));
}

export function evaluateToolUse(input, policy = loadPolicy()) {
  const role = typeof input?.agent_type === "string" ? input.agent_type : "";
  if (!autonomousRoles.has(role)) return null;

  const toolName = typeof input?.tool_name === "string" ? input.tool_name : "";
  const command = commandFromInput(input?.tool_input);

  if (readOnlyRoles.has(role)) {
    if (writeToolPattern.test(toolName)) {
      return deny(`${role} es de solo lectura y no puede usar ${toolName}.`);
    }
    if (command && dangerousCommandPatterns.some((pattern) => pattern.test(command))) {
      return deny(`${role} es de solo lectura y el comando intenta mutar estado.`);
    }
  }

  if (role === "builder") {
    if (policy.mode !== "active" || !policy.authority.allowLocalDiff) {
      return deny("El implementador no puede ejecutarse mientras la política no autorice diffs locales en modo activo.");
    }
    if (command && dangerousCommandPatterns.some((pattern) => pattern.test(command))) {
      return deny("El implementador no puede alterar Git, dependencias, red, publicación o archivos mediante comandos destructivos.");
    }
    if (command && builderInterpreterPatterns.some((pattern) => pattern.test(command))) {
      return deny("El implementador debe usar apply_patch para escribir y scripts npm versionados para verificar.");
    }
    if (command && commandMentionsProtectedPath(command, policy)) {
      return deny("El implementador intentó tocar una superficie protegida por la política de Obraxen.");
    }
    if (writeToolPattern.test(toolName)) {
      if (!applyPatchToolPattern.test(toolName)) {
        return deny("El implementador solo puede editar mediante apply_patch.");
      }
      const paths = patchPaths(input?.tool_input);
      if (paths.length === 0 || paths.some((path) => !canonicalRepositoryPath(path))) {
        return deny("El implementador debe declarar rutas canónicas en cada apply_patch.");
      }
      if (
        paths.some((path) => policy.protectedPaths.some((pattern) => globMatches(pattern, path)))
        || (!policy.authority.allowDependencyChanges && paths.some(isDependencyManifest))
      ) {
        return deny("El implementador intentó tocar una superficie protegida por la política de Obraxen.");
      }
    }
  }

  return null;
}

function main() {
  const raw = readFileSync(0, "utf8");
  const result = evaluateToolUse(JSON.parse(raw));
  if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
