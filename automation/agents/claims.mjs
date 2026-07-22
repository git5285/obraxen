import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const CLAIM_STATE_ALIASES = new Map([
  ["reservado", "reservado"],
  ["reserved", "reservado"],
  ["en_curso", "en_curso"],
  ["in_progress", "en_curso"],
  ["bloqueado", "bloqueado"],
  ["blocked", "bloqueado"],
  ["esperando_revision", "esperando_revision"],
  ["awaiting_review", "esperando_revision"],
  ["liberado", "liberado"],
  ["released", "liberado"],
]);

export const ACTIVE_CLAIM_STATES = new Set([
  "reservado",
  "en_curso",
  "bloqueado",
  "esperando_revision",
]);

export function canonicalClaimState(value) {
  return CLAIM_STATE_ALIASES.get(String(value ?? "").toLowerCase()) ?? null;
}

export function claimContentDigest(text) {
  return createHash("sha256").update(text).digest("hex");
}

function normalizeClaimValue(value) {
  const trimmed = value.trim();
  const inlineCode = trimmed.match(/^(`+)([\s\S]*?)\1$/);
  return (inlineCode?.[2] ?? trimmed).trim();
}

export function isClaimPath(value) {
  if (!value || /\s/.test(value) || value.startsWith("/") || value.startsWith("~")) return false;
  if (value.includes("\\") || !/^[A-Za-z0-9._@+*?\[\]{}!\/-]+$/.test(value)) return false;
  if (value.split("/").some((segment) => !segment || segment === "." || segment === "..")) return false;
  return value.includes("/") || value.includes(".") || /[*?\[\]{]/.test(value);
}

function readClaimFileList(lines, startIndex, requireIndent) {
  const files = [];
  const invalidFileEntries = [];
  const itemPattern = requireIndent
    ? /^[\t ]{2,}-\s+(.+?)\s*$/
    : /^\s*-\s+(.+?)\s*$/;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^#{1,6}\s/.test(line) || /^-\s+[a-z_]+:/i.test(line)) break;
    const item = line.match(itemPattern);
    if (!item) break;
    const file = normalizeClaimValue(item[1]);
    if (isClaimPath(file)) files.push(file);
    else if (file) invalidFileEntries.push(file);
  }
  return { files, invalidFileEntries };
}

function parseClaimFiles(text) {
  const lines = text.split(/\r?\n/);
  const fieldIndex = lines.findIndex((line) => /^-\s+archivos:\s*$/i.test(line));
  if (fieldIndex !== -1) return readClaimFileList(lines, fieldIndex + 1, true);

  const headingIndex = lines.findIndex((line) => /^#{1,6}\s+(?:archivos(?:\s+reservados)?|rutas(?:\s+reservadas)?|reserved\s+files|files|paths)\s*$/i.test(line));
  return headingIndex === -1
    ? { files: [], invalidFileEntries: [] }
    : readClaimFileList(lines, headingIndex + 1, false);
}

export function parseClaim(text, source, worktree) {
  const states = [...text.matchAll(/^[\t ]*-[\t ]+estado:[\t ]*([^\n]*)$/gim)]
    .map((match) => normalizeClaimValue(match[1]));
  const threadIds = [...text.matchAll(/^[\t ]*-[\t ]+thread_id:[\t ]*([^\n]*)$/gim)]
    .map((match) => normalizeClaimValue(match[1]));
  const metadataErrors = [];
  if (states.length !== 1 || !states[0]) metadataErrors.push("estado must appear exactly once");
  if (threadIds.length !== 1 || !threadIds[0]) {
    metadataErrors.push("thread_id must appear exactly once");
  }
  const state = metadataErrors.length === 0 ? states[0].toLowerCase() : "unknown";
  const threadId = metadataErrors.length === 0 ? threadIds[0] : "unknown";
  const { files, invalidFileEntries } = parseClaimFiles(text);
  return {
    source,
    worktree,
    threadId,
    state,
    files,
    invalidFileEntries,
    metadataErrors,
    contentDigest: claimContentDigest(text),
  };
}

export function readClaims(worktree) {
  const directory = resolve(worktree, ".coordination/claims");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => parseClaim(
      readFileSync(resolve(directory, name), "utf8"),
      `.coordination/claims/${name}`,
      worktree,
    ));
}
