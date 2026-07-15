import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const autonomousRoles = new Set([
  "scout",
  "builder",
  "auditor",
]);

const readOnlyRoles = new Set(["scout", "auditor"]);
const writeToolPattern = /(?:apply_patch|\bedit\b|\bwrite\b|delete|move|rename)/i;

const dangerousCommandPatterns = [
  /(?:^|[\s;&|"'`/])git\b[^\n;&|]*\b(?:add|commit|push|merge|rebase|reset|clean|checkout|restore|switch|tag|worktree)\b/i,
  /(?:^|[\s;&|"'`/])gh\b[^\n;&|]*\b(?:pr|repo|release|workflow|secret|variable)\b/i,
  /(?:^|[\s;&|"'`/])(?:vercel|netlify|firebase)\b/i,
  /(?:^|[\s;&|"'`/])(?:npm|pnpm|yarn)\b[^\n;&|]*\b(?:install|add|remove|publish|update|upgrade)\b/i,
  /(?:^|[\s;&|"'`/])npx\b/i,
  /(?:^|[\s;&|"'`/])(?:curl|wget|scp|ssh|rsync)\b/i,
  /(?:^|[\s;&|"'`/])(?:rm|rmdir|mv|chmod|chown)\b/i,
];

const protectedPathPatterns = [
  /(?:^|[\s"'/:])\.codex(?:\/|\\)/i,
  /(?:^|[\s"'/:])\.agents(?:\/|\\)/i,
  /(?:^|[\s"'/:])automation(?:\/|\\)agents(?:\/|\\)/i,
  /(?:^|[\s"'/:])\.github(?:\/|\\)/i,
  /(?:^|[\s"'/:])\.githooks(?:\/|\\)/i,
  /(?:^|[\s"'/:])\.env(?:\.|[\s"'])/i,
  /(?:^|[\s"'/:])AGENTS\.md\b/i,
  /(?:^|[\s"'/:])vercel\.json\b/i,
  /(?:^|[\s"'/:])ACTIVATION_GATE\.md\b/i,
  /(?:^|[\s"'/:])data(?:\/|\\)(?:brand|proyectos)(?:\.|\/)/i,
  /(?:^|[\s"'/:])src(?:\/|\\)lib(?:\/|\\)(?:publication|schemas)\.[a-z]+\b/i,
  /(?:^|[\s"'/:])src(?:\/|\\)components(?:\/|\\)legal-page\.[a-z]+\b/i,
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

export function evaluateToolUse(input) {
  const role = typeof input?.agent_type === "string" ? input.agent_type : "";
  if (!autonomousRoles.has(role)) return null;

  const toolName = typeof input?.tool_name === "string" ? input.tool_name : "";
  const serializedInput = JSON.stringify(input?.tool_input ?? {});
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
    if (command && dangerousCommandPatterns.some((pattern) => pattern.test(command))) {
      return deny("El implementador no puede alterar Git, dependencias, red, publicación o archivos mediante comandos destructivos.");
    }
    if (protectedPathPatterns.some((pattern) => pattern.test(serializedInput))) {
      return deny("El implementador intentó tocar una superficie protegida por la política de RemainOn.");
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
