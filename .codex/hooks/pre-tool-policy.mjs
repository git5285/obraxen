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
const mutatingToolNames = new Set([
  "apply_patch",
  "copy_file",
  "create_file",
  "delete_file",
  "edit_file",
  "mkdir",
  "move_file",
  "remove_file",
  "rename_file",
  "savefile",
  "save_file",
  "upload_asset",
  "write",
  "write_file",
]);
const builderWriteToolPattern = /(?:apply_patch|\bedit\b|\bwrite\b|write_file|create|save|upload|delete|remove|copy|move|rename|mkdir)/i;
const runtimeSensitiveCommandPattern = /(?:^|[\s;&|"'`/])(?:node|npm|npx|pnpm|yarn|eslint|next|tsc|vitest)\b/i;
const runtimeWrapperPattern = /^\s*node\s+automation\/agents\/runtime\.mjs\s+(?:(?:status|assert)\s*|exec\s+--\s+\S(?:[\s\S]*\S)?\s*)$/i;
const shellCompositionPattern = /[\r\n;&|`<>]|\$\(/;
const builderVerificationScripts = new Set([
  "build",
  "check",
  "check:activation",
  "check:agent-runtime",
  "check:diff",
  "check:quality",
  "lighthouse:ci",
  "lint",
  "test",
  "test:e2e",
  "test:e2e:contact",
  "typecheck",
]);

const dangerousCommandPatterns = [
  /(?:^|[\s;&|"'`/])node\b[^\n;&|]*\bautomation\/agents\/authorizations\.mjs\b[^\n;&|]*\b(?:register|reserve|complete|revoke)\b/i,
  /(?:^|[\s;&|"'`/])git\b[^\n;&|]*\b(?:add|am|apply|bisect|branch|checkout|cherry-pick|clean|clone|commit|commit-tree|config|fast-import|fetch|filter-branch|gc|hash-object|init|maintenance|merge|mv|notes|pull|push|read-tree|rebase|remote|replace|reset|restore|revert|rm|stash|submodule|switch|tag|update-index|update-ref|worktree|write-tree)\b/i,
  /(?:^|[\s;&|"'`/])gh\b/i,
  /(?:^|[\s;&|"'`/])(?:vercel|netlify|firebase)\b/i,
  /(?:^|[\s;&|"'`/])(?:npm|pnpm|yarn)\b[^\n;&|]*\b(?:add|ci|dedupe|dlx|exec|init|install|link|pack|prune|publish|rebuild|remove|uninstall|unlink|update|upgrade|version|x)\b/i,
  /(?:^|[\s;&|"'`/])npx\b/i,
  /(?:^|[\s;&|"'`/])(?:curl|wget|scp|ssh|rsync)\b/i,
  /(?:^|[\s;&|"'`/])(?:rm|rmdir|mv|chmod|chown)\b/i,
  /(?:^|[\s;&|"'`/])(?:tee|touch|truncate|cp|install|mkdir|mkfifo|mknod|mktemp|ln|unlink|split|csplit)\b/i,
  /(?:^|[\s;&|"'`/])find\b[^\n;&|]*\s-(?:delete|exec|execdir|ok|okdir)\b/i,
  /(?:^|[\s;&|"'`/])sort\b[^\n;&|]*\s-o(?:\s|$)/i,
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

function isMutatingTool(toolName) {
  return typeof toolName === "string" && mutatingToolNames.has(toolName.toLowerCase());
}

function isApplyPatchTool(toolName) {
  return typeof toolName === "string" && toolName.toLowerCase() === "apply_patch";
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
  return [...patch.matchAll(/^\*\*\* (?:(?:Add|Update|Delete) File|Move to):\s*(.+)$/gm)]
    .map((match) => match[1].trim());
}

function patternStem(pattern) {
  if (pattern.endsWith("/**")) return pattern.slice(0, -3);
  if (pattern.endsWith("*")) return pattern.slice(0, -1);
  return pattern;
}

function commandMentionsProtectedPath(command, policy, usesRuntimeWrapper = false) {
  const inspected = usesRuntimeWrapper
    ? command
        .replaceAll("automation/agents/runtime.mjs", "")
        .replaceAll("automation/agents/preflight.mjs", "")
    : command;
  return policy.protectedPaths.some((pattern) => inspected.includes(patternStem(pattern)));
}

function usesExclusiveRuntimeWrapper(command) {
  return runtimeWrapperPattern.test(command) && !shellCompositionPattern.test(command);
}

function builderUsesApprovedRuntimeCommand(command) {
  if (/^\s*node\s+automation\/agents\/runtime\.mjs\s+(?:status|assert)\s*$/i.test(command)) {
    return true;
  }
  if (
    /^\s*node\s+automation\/agents\/runtime\.mjs\s+exec\s+--\s+node\s+automation\/agents\/preflight\.mjs(?:\s+--json)?\s*$/i
      .test(command)
  ) {
    return true;
  }
  const npmRun = command.match(
    /^\s*node\s+automation\/agents\/runtime\.mjs\s+exec\s+--\s+npm\s+run\s+([A-Za-z0-9:_-]+)\b/i,
  );
  return npmRun ? builderVerificationScripts.has(npmRun[1]) : false;
}

function readOnlyUsesApprovedRuntimeCommand(command) {
  if (/^\s*node\s+automation\/agents\/runtime\.mjs\s+(?:status|assert)\s*$/i.test(command)) {
    return true;
  }
  if (
    /^\s*node\s+automation\/agents\/runtime\.mjs\s+exec\s+--\s+node\s+automation\/agents\/(?:policy|preflight)\.mjs(?:\s+--json)?\s*$/i
      .test(command)
  ) {
    return true;
  }
  if (
    /^\s*node\s+automation\/agents\/runtime\.mjs\s+exec\s+--\s+node\s+automation\/agents\/operations\.mjs\s+status\s*$/i
      .test(command)
  ) {
    return true;
  }
  if (
    /^\s*node\s+automation\/agents\/runtime\.mjs\s+exec\s+--\s+node\s+automation\/agents\/lease\.mjs\s+status\s*$/i
      .test(command)
  ) {
    return true;
  }
  if (
    /^\s*node\s+automation\/agents\/runtime\.mjs\s+exec\s+--\s+node\s+automation\/agents\/(?:memory|authorizations|reconcile)\.mjs\s+(?:status|context|inspect|list)\b/i
      .test(command)
  ) {
    return true;
  }
  const npmRun = command.match(
    /^\s*node\s+automation\/agents\/runtime\.mjs\s+exec\s+--\s+npm\s+run\s+([A-Za-z0-9:_-]+)\b/i,
  );
  return npmRun ? builderVerificationScripts.has(npmRun[1]) : false;
}

export function evaluateToolUse(input, policy = loadPolicy()) {
  const role = typeof input?.agent_type === "string" ? input.agent_type : "";
  if (!autonomousRoles.has(role)) return null;

  const toolName = typeof input?.tool_name === "string" ? input.tool_name : "";
  const command = commandFromInput(input?.tool_input);
  const usesRuntimeWrapper = usesExclusiveRuntimeWrapper(command);

  if (command && runtimeSensitiveCommandPattern.test(command) && !usesRuntimeWrapper) {
    return deny(`${role} debe ejecutar Node y las dependencias mediante automation/agents/runtime.mjs.`);
  }

  if (readOnlyRoles.has(role)) {
    if (command && usesRuntimeWrapper && !readOnlyUsesApprovedRuntimeCommand(command)) {
      return deny(`${role} solo puede usar el runtime fijado para lecturas y verificaciones versionadas.`);
    }
    if (isMutatingTool(toolName)) {
      return deny(`${role} es de solo lectura y no puede usar ${toolName}.`);
    }
    if (command && dangerousCommandPatterns.some((pattern) => pattern.test(command))) {
      return deny(`${role} es de solo lectura y el comando intenta mutar estado.`);
    }
    if (command && !usesRuntimeWrapper && builderInterpreterPatterns.some((pattern) => pattern.test(command))) {
      return deny(`${role} no puede ejecutar interpretes o scripts arbitrarios.`);
    }
  }

  if (role === "builder") {
    if (policy.mode !== "active" || !policy.authority.allowLocalDiff) {
      return deny("El implementador no puede ejecutarse mientras la política no autorice diffs locales en modo activo.");
    }
    if (command && usesRuntimeWrapper && !builderUsesApprovedRuntimeCommand(command)) {
      return deny("El implementador solo puede usar el entorno fijado para preflight y scripts de verificación versionados.");
    }
    if (command && dangerousCommandPatterns.some((pattern) => pattern.test(command))) {
      return deny("El implementador no puede alterar Git, dependencias, red, publicación o archivos mediante comandos destructivos.");
    }
    if (command && !usesRuntimeWrapper && builderInterpreterPatterns.some((pattern) => pattern.test(command))) {
      return deny("El implementador debe usar apply_patch para escribir y scripts npm versionados para verificar.");
    }
    if (command && commandMentionsProtectedPath(command, policy, usesRuntimeWrapper)) {
      return deny("El implementador intentó tocar una superficie protegida por la política de Obraxen.");
    }
    if (builderWriteToolPattern.test(toolName)) {
      if (!isApplyPatchTool(toolName)) {
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
  // Bound by the controller's process environment, not model/tool arguments.
  // This is the diagnostic hook: every isolated tool remains blocked. Fail
  // closed on partial/unknown bindings instead of falling back to root policy.
  const boundRole = process.env.OBRAXEN_ISOLATED_ROLE;
  const boundMode = process.env.OBRAXEN_ISOLATED_MODE;
  if (boundRole !== undefined || boundMode !== undefined) {
    const reason = autonomousRoles.has(boundRole) && boundMode === "diagnostic"
      ? `Obraxen ${boundRole}: diagnóstico aislado; ninguna herramienta autorizada.`
      : "Obraxen: vinculación aislada ausente o inválida; herramientas bloqueadas.";
    process.stdout.write(`${JSON.stringify(deny(reason))}\n`);
    return;
  }
  const raw = readFileSync(0, "utf8");
  const result = evaluateToolUse(JSON.parse(raw));
  if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
