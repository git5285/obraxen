import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkoutContext } from "./checkout-context.mjs";
import { claimContentDigest, isClaimPath, parseClaim } from "../automation/agents/claims.mjs";
import { globMatches } from "../automation/agents/diff-policy.mjs";
import { buildPreflight } from "../automation/agents/preflight.mjs";
import { loadPolicy } from "../automation/agents/policy.mjs";
import { readOperationalClaims, registerOperationalClaim, transitionOperationalClaim } from "../automation/agents/operations.mjs";

function line(value, name) {
  assert(typeof value === "string" && value.trim() && !/[\r\n]/.test(value), `${name} must be a nonempty single line`);
  return value;
}

function id(value) {
  assert(typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{2,99}$/.test(value), "Invalid threadId (3-100 safe characters, starting with a letter or digit)");
  return value;
}

function exactPaths(files) {
  assert(Array.isArray(files) && files.length > 0, "Exact files are required");
  assert(files.every(path => typeof path === "string" && isClaimPath(path) && !/[*?\[\]{}!]/.test(path)), "Invalid exact path");
  assert(new Set(files).size === files.length, "Duplicate paths");
  return [...files].sort();
}

function context(repo, options) {
  const policy = loadPolicy();
  const stateHome = options.stateHome ?? policy.coordination.stateHome;
  return { policy, stateHome, checkout: checkoutContext(repo, { stateHome }) };
}

function assertSafeSnapshot(snapshot, files, threadId) {
  for (const key of ["claimFailures", "coordinationFailures", "cloneFailures", "legacyLeases", "unreadableWorktrees", "unknownStateClaims", "unscopedActiveClaims"]) {
    assert(snapshot[key].length === 0, `Coordination incomplete: ${key}`);
  }
  assert(snapshot.runtime.ok && !snapshot.lease, "Runtime mismatch or autonomous writer lease exists");
  const conflicts = snapshot.activeClaims.filter(claim => claim.threadId !== threadId
    && claim.files.some(pattern => files.some(path => globMatches(pattern, path) || pattern === path)));
  assert(conflicts.length === 0, `Files owned by: ${conflicts.map(claim => claim.threadId).join(", ")}`);
}

function preflight(repo, policy, stateHome, files, threadId) {
  assertSafeSnapshot(buildPreflight(repo, policy, { stateHome }), files, threadId);
}

function append(repo, stateHome, threadId, state, reason, evidence = []) {
  return transitionOperationalClaim({ repo, stateHome, threadId, state, reason, evidence,
    eventId: `local-${randomUUID()}`, occurredAt: new Date().toISOString() });
}

// Only the interactive controller calls this helper. No autonomous role,
// ownership transfer, Git delivery, policy flag, or lease is introduced here.
export function startLocalTask(spec, { repo = process.cwd(), ...options } = {}) {
  const threadId = id(spec.threadId);
  const files = exactPaths(spec.files);
  for (const field of ["objective", "nextStep"]) line(spec[field], field);
  const { policy, stateHome, checkout } = context(repo, options);
  const control = checkout.controlRoot;
  const claimPath = `.coordination/claims/${threadId}.md`;
  const absolute = join(control, claimPath);
  assert(!existsSync(absolute), "Claim already exists; inspect its live state instead of overwriting or restarting");
  assert(!readOperationalClaims(repo, stateHome).some(claim => claim.threadId === threadId), "Thread already registered");
  preflight(repo, policy, stateHome, files, threadId);
  // Guard parent directories against symlinked coordination paths.
  mkdirSync(dirname(absolute), { recursive: true });
  assert(realpathSync(dirname(absolute)) === dirname(absolute), "Symlinked claim directory");
  const marker = `# Tarea local: ${spec.objective}\n- thread_id: ${threadId}\n- creado: ${new Date().toISOString()}\n- estado: reservado\n- objetivo: ${spec.objective}\n- origen: human_directed_local\n- checkout: ${checkout.root}\n- head: ${checkout.head}\n- rama: ${checkout.branch ?? "detached"}\n- archivos:\n${files.map(path => `  - ${path}\n`).join("")}- cambios_ajenos_detectados: ${checkout.dirty ? "si; preservar el estado previo" : "no"}\n- consumidores: tarea interactiva local\n- siguiente_paso: ${spec.nextStep}\n`;
  const parsed = parseClaim(marker, claimPath, control);
  assert(parsed.metadataErrors.length === 0 && parsed.invalidFileEntries.length === 0);
  assert.deepEqual(parsed.files, files);
  writeFileSync(absolute, marker, { flag: "wx" });
  registerOperationalClaim({ repo: control, stateHome, claimPath, eventId: `local-${randomUUID()}`,
    occurredAt: new Date().toISOString() });
  // Recheck after registration: a concurrent reservation never permits editing.
  preflight(repo, policy, stateHome, files, threadId);
  append(control, stateHome, threadId, "en_curso", "work_started");
  return checkoutContext(repo, { compact: true, task: threadId, stateHome });
}

export function finishLocalTask(report, { repo = process.cwd(), ...options } = {}) {
  const threadId = id(report.threadId);
  line(report.result, "result");
  assert(Array.isArray(report.pending) && report.pending.length === 0, "Pending work cannot be released");
  assert(Array.isArray(report.decisions) && report.decisions.every(item => line(item, "decision")), "Decisions required");
  assert(Array.isArray(report.checks) && report.checks.length > 0, "Verification evidence required");
  for (const check of report.checks) {
    line(check.command, "check command");
    line(check.evidence, "check evidence");
    assert(check.status === "passed", "Failed or unrun checks cannot be released");
  }
  const changedPaths = exactPaths(report.changedPaths);
  const { policy, stateHome, checkout } = context(repo, options);
  const control = checkout.controlRoot;
  const claim = readOperationalClaims(repo, stateHome).find(item => item.threadId === threadId);
  assert(claim && ["en_curso", "esperando_revision"].includes(claim.state), "Task is not ready for local completion");
  const marker = readFileSync(join(control, claim.claim.source), "utf8");
  assert(claimContentDigest(marker) === claim.claim.contentDigest, "Claim marker changed");
  assert(marker.includes("\n- origen: human_directed_local\n"), "Only helper-created human local tasks can close here");
  assert(marker.includes(`\n- checkout: ${checkout.root}\n`), "Wrong checkout for this task");
  assert(changedPaths.every(path => claim.claim.files.includes(path)), "Changed path outside claim");
  preflight(repo, policy, stateHome, claim.claim.files, threadId);
  // Evidence is controller-supplied and preserved verbatim, never executed or
  // promoted to an independent test result by this lifecycle helper.
  const handoffPath = `.coordination/handoffs/${threadId}.md`;
  const absolute = join(control, handoffPath);
  assert(!existsSync(absolute), "Handoff already exists; inspect and complete with operations.mjs, never overwrite");
  const handoff = `# Handoff local\n- thread_id: ${threadId}\n- terminado: ${new Date().toISOString()}\n- resultado: ${report.result}\n- checkout: ${checkout.root}\n- head: ${checkout.head}\n- archivos_cambiados: ${changedPaths.join(", ")}\n- verificaciones:\n${report.checks.map(check => `  - ${check.command}: passed; ${check.evidence}\n`).join("")}- decisiones: ${report.decisions.join("; ") || "ninguna"}\n- pendiente: ninguno\n- mensaje_enviado_a: ninguno; entrega local\n\nLa evidencia de checks la aporta el controlador; este ayudante no ejecuta checks ni autoriza entrega remota.\n`;
  mkdirSync(dirname(absolute), { recursive: true });
  assert(realpathSync(dirname(absolute)) === dirname(absolute), "Symlinked handoff directory");
  writeFileSync(absolute, handoff, { flag: "wx" });
  const evidence = [{ kind: "handoff", path: handoffPath, contentDigest: claimContentDigest(readFileSync(absolute, "utf8")) }];
  if (claim.state === "en_curso") append(control, stateHome, threadId, "esperando_revision", "candidate_ready");
  append(control, stateHome, threadId, "liberado", "local_work_complete", evidence);
  return checkoutContext(repo, { compact: true, task: threadId, stateHome });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, file, ...extra] = process.argv.slice(2);
  assert(["start", "finish"].includes(action) && file && !file.startsWith("--") && extra.length === 0,
    "Usage: local-task.mjs start <task.json> | finish <result.json>; no per-run state overrides");
  const input = JSON.parse(readFileSync(resolve(file), "utf8"));
  console.log(JSON.stringify(action === "start" ? startLocalTask(input) : finishLocalTask(input), null, 2));
}
