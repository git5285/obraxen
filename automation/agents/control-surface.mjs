import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { ACTIVE_CLAIM_STATES, canonicalClaimState, readClaims } from "./claims.mjs";
import { readRegisteredClones, verifyRegisteredClone } from "./lease.mjs";
import { readOperationalClaims } from "./operations.mjs";
import { loadPolicy } from "./policy.mjs";
import { applyOperationalClaimStates } from "./preflight.mjs";

const TASK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const CONTROL_PREFIXES = [
  ".agents/",
  ".codex/",
  ".coordination/",
  ".github/",
  "automation/agents/",
  "tests/agents/",
];

function git(repo, args, encoding = "utf8") {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function parsePorcelainStatus(output) {
  const fields = Buffer.isBuffer(output) ? output.toString("utf8").split("\0") : String(output).split("\0");
  const rows = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (!field) continue;
    const status = field.slice(0, 2);
    const path = field.slice(3);
    let originalPath = null;
    if (/[RC]/.test(status)) originalPath = fields[index += 1] || null;
    rows.push({ status, path, originalPath });
  }
  return rows;
}

export function parseWorktreeList(output) {
  return String(output).trim().split(/\n\s*\n/).filter(Boolean).map((block) => {
    const row = {};
    for (const line of block.split("\n")) {
      const separator = line.indexOf(" ");
      if (separator === -1) row[line] = true;
      else row[line.slice(0, separator)] = line.slice(separator + 1);
    }
    return {
      path: row.worktree,
      head: row.HEAD ?? null,
      branch: typeof row.branch === "string" ? row.branch.replace("refs/heads/", "") : null,
      detached: row.detached === true,
    };
  }).filter((row) => typeof row.path === "string");
}

export function extractRootRedirect(configText) {
  const sourceFile = ts.createSourceFile("next.config.ts", configText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations = new Map();
  const literal = (candidate) => (
    candidate && ts.isPropertyAssignment(candidate) && ts.isStringLiteralLike(candidate.initializer)
      ? candidate.initializer.text
      : null
  );
  const unwrap = (expression) => {
    let current = expression;
    while (
      ts.isParenthesizedExpression(current)
      || ts.isAsExpression(current)
      || ts.isSatisfiesExpression(current)
      || ts.isTypeAssertionExpression(current)
    ) current = current.expression;
    if (ts.isIdentifier(current)) return declarations.get(current.text) ?? null;
    return current;
  };
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        declarations.set(declaration.name.text, unwrap(declaration.initializer));
      }
    }
  }
  const exported = sourceFile.statements.find((statement) => ts.isExportAssignment(statement) && !statement.isExportEquals);
  if (!exported || !ts.isExportAssignment(exported)) return null;
  const config = unwrap(exported.expression);
  if (!config || !ts.isObjectLiteralExpression(config)) return null;
  if (config.properties.some((candidate) => (
    ts.isSpreadAssignment(candidate) || (candidate.name && ts.isComputedPropertyName(candidate.name))
  ))) return null;
  const redirectMembers = config.properties.filter((candidate) => {
    const name = candidate.name;
    return name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === "redirects";
  });
  if (redirectMembers.length !== 1) return null;
  const redirects = redirectMembers[0];
  let body = null;
  if (redirects && ts.isMethodDeclaration(redirects)) body = redirects.body ?? null;
  if (redirects && ts.isPropertyAssignment(redirects)) {
    const initializer = unwrap(redirects.initializer);
    if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) {
      body = ts.isBlock(initializer.body) ? initializer.body : null;
    }
  }
  if (!body) return null;
  const returns = body.statements.filter(ts.isReturnStatement);
  if (returns.length !== 1 || !returns[0].expression) return null;
  const returned = unwrap(returns[0].expression);
  if (!returned || !ts.isArrayLiteralExpression(returned)) return null;
  const roots = [];
  for (const element of returned.elements) {
    if (
      !ts.isObjectLiteralExpression(element)
      || element.properties.some((candidate) => (
        ts.isSpreadAssignment(candidate) || (candidate.name && ts.isComputedPropertyName(candidate.name))
      ))
    ) return null;
    const named = (expected) => element.properties.filter((candidate) => {
      const name = candidate.name;
      return name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === expected;
    });
    const sources = named("source");
    const destinations = named("destination");
    if (sources.length !== 1 || destinations.length !== 1) return null;
    const source = literal(sources[0]);
    const destination = literal(destinations[0]);
    if (!source || !destination) return null;
    if (source === "/" && (destination === "/" || !/^\/(?!\/)[^\s\\]*$/.test(destination))) return null;
    if (source === "/") roots.push(destination);
  }
  return roots.length === 1 && roots[0] ? roots[0] : null;
}

function taskRoot(threadId) {
  return TASK_ID.exec(threadId)?.[0].toLowerCase() ?? threadId;
}

export function deriveReviewRoute({ devCommand, legacyRedirect, hasPublicHome }) {
  if (devCommand === "node automation/agents/runtime.mjs exec -- node scripts/public-site.mjs dev") {
    return hasPublicHome ? "/" : null;
  }
  if (devCommand === null || devCommand === "node automation/agents/runtime.mjs exec -- next dev") {
    return legacyRedirect;
  }
  return null;
}

export function pathIsCovered(path, reservedPath) {
  return path === reservedPath;
}

function changeIsCovered(change, claimedPaths) {
  return claimedPaths.has(change.path)
    && (change.originalPath === null || claimedPaths.has(change.originalPath));
}

export function classifyControlChange(change, activeClaims) {
  const owners = activeClaims.filter((claim) => changeIsCovered(change, new Set(claim.claim.files)))
    .map((claim) => ({ threadId: claim.threadId, state: claim.state }));
  return {
    ...change,
    coordination: change.path.startsWith(".coordination/"),
    ownership: owners,
    classification: owners.length > 0 ? "active_claim" : "no_active_claim",
  };
}

export function classifyCandidateOwnership({ controlPath, worktrees, activeClaims }) {
  const claimedPaths = new Set(activeClaims.flatMap((claim) => claim.claim.files));
  return worktrees.filter((worktree) => worktree.path !== controlPath && worktree.changes.length > 0)
    .map((worktree) => {
      const uncoveredPaths = [...new Set(worktree.changes.flatMap((change) => (
        [change.path, change.originalPath].filter(Boolean).filter((path) => !claimedPaths.has(path))
      )))];
      const ownerThreadIds = [...new Set(activeClaims.filter((claim) => claim.claim.files.some(
        (reserved) => worktree.changes.some((change) => (
          reserved === change.path || reserved === change.originalPath
        )),
      )).map((claim) => taskRoot(claim.threadId)))];
      return {
        path: worktree.path,
        branch: worktree.branch,
        head: worktree.head,
        changedPathCount: worktree.changes.length,
        uncoveredPaths,
        ownerThreadIds,
        fullyCovered: uncoveredPaths.length === 0,
        singleOwner: ownerThreadIds.length === 1,
      };
    });
}

export function deriveReviewTarget({ controlPath, worktrees, activeClaims, scanFailures = [], port = null }) {
  if (scanFailures.length > 0) {
    return {
      state: "unresolved",
      reason: "registered_clone_scan_incomplete",
      candidates: [],
      ownerThreadId: null,
      worktree: null,
      branch: null,
      head: null,
      route: null,
      url: null,
    };
  }
  const claimedPaths = new Set(activeClaims.flatMap((claim) => claim.claim.files));
  const candidates = worktrees.filter((worktree) => (
    worktree.path !== controlPath
    && worktree.changes.length > 0
    && worktree.changes.every((change) => changeIsCovered(change, claimedPaths))
  ));
  if (candidates.length === 0) {
    return {
      state: "unresolved",
      reason: "no_dirty_worktree_is_fully_owned_by_active_claims",
      candidates: [],
      ownerThreadId: null,
      worktree: null,
      branch: null,
      head: null,
      route: null,
      url: null,
    };
  }
  if (candidates.length > 1) {
    return {
      state: "ambiguous",
      reason: "multiple_fully_owned_dirty_worktrees",
      candidates: candidates.map(({ path, branch, head, changedPaths }) => ({ path, branch, head, changedPaths })),
      ownerThreadId: null,
      worktree: null,
      branch: null,
      head: null,
      route: null,
      url: null,
    };
  }
  const candidate = candidates[0];
  const ownerClaims = activeClaims.filter((claim) => claim.claim.files.some(
    (reserved) => candidate.changes.some((change) => (
      pathIsCovered(change.path, reserved) || pathIsCovered(change.originalPath, reserved)
    )),
  ));
  const ownerIds = [...new Set(ownerClaims.map((claim) => taskRoot(claim.threadId)))];
  if (ownerIds.length !== 1 || !candidate.rootRedirect) {
    return {
      state: "unresolved",
      reason: ownerIds.length !== 1 ? "candidate_owner_is_not_unique" : "candidate_root_redirect_is_unverified",
      candidates: [{ path: candidate.path, branch: candidate.branch, head: candidate.head, changedPaths: candidate.changedPaths }],
      ownerThreadId: null,
      worktree: null,
      branch: null,
      head: null,
      route: null,
      url: null,
    };
  }
  return {
    state: "ready",
    reason: "one_dirty_worktree_exactly_matches_active_claim_ownership",
    candidates: [{ path: candidate.path, branch: candidate.branch, head: candidate.head, changedPaths: candidate.changedPaths }],
    ownerThreadId: ownerIds[0],
    worktree: candidate.path,
    branch: candidate.branch,
    head: candidate.head,
    route: candidate.rootRedirect,
    url: port === null ? null : `http://127.0.0.1:${port}${candidate.rootRedirect}`,
  };
}

export function deriveControllerOwner({ controlPath, worktrees, activeClaims }) {
  const changedPaths = new Set(worktrees.filter((worktree) => worktree.path !== controlPath)
    .flatMap((worktree) => worktree.changes.flatMap((change) => [change.path, change.originalPath].filter(Boolean)))
    .filter((path) => !CONTROL_PREFIXES.some((prefix) => path.startsWith(prefix))));
  const owners = [...new Set(activeClaims.filter((claim) => (
    claim.claim.files.some((path) => (
      !CONTROL_PREFIXES.some((prefix) => path.startsWith(prefix)) && changedPaths.has(path)
    ))
  )).map((claim) => taskRoot(claim.threadId)))];
  return owners.length === 1 ? owners[0] : null;
}

export function deriveAutomationOwnership(reviewTarget, controllerOwner = reviewTarget.ownerThreadId) {
  return {
    ownerThreadId: controllerOwner,
    ownerSource: controllerOwner ? "active_candidate_claims" : "unassigned",
    schedulerState: "external_uninspected",
    activationAuthorized: false,
    triggerRequirements: [
      "explicit_schedule_or_human_request",
      "ready_review_target",
      "current_runtime_and_claim_evidence",
    ],
    stopConditions: [
      "target_claims_released_or_changed",
      "target_worktree_or_head_changed",
      "owner_task_unavailable",
      "human_decision_required",
      "completion_or_failure",
    ],
  };
}

export function deriveServerStatus(pid, cwd, targetPath) {
  if (pid === null) return { state: "not_checked", pid: null, cwd: null, requiredCwd: targetPath };
  return {
    state: Boolean(cwd && targetPath && cwd === targetPath) ? "verified" : "mismatch",
    pid,
    cwd,
    requiredCwd: targetPath,
  };
}

function inspectServer(pid, targetPath) {
  if (pid === null) return deriveServerStatus(null, null, targetPath);
  try {
    const output = execFileSync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const cwd = output.split("\n").find((line) => line.startsWith("n"))?.slice(1) ?? null;
    const canonicalCwd = cwd ? realpathSync(cwd) : null;
    const canonicalTarget = targetPath ? realpathSync(targetPath) : null;
    return deriveServerStatus(pid, canonicalCwd, canonicalTarget);
  } catch (error) {
    return {
      state: "unverified",
      pid,
      cwd: null,
      requiredCwd: targetPath,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function worktreeStatus(worktree) {
  const changes = parsePorcelainStatus(git(worktree.path, ["status", "--porcelain=v1", "-z", "--untracked-files=all"], null));
  let rootRedirect = null;
  try {
    const packagePath = resolve(worktree.path, "package.json");
    const devCommand = existsSync(packagePath)
      ? JSON.parse(readFileSync(packagePath, "utf8"))?.scripts?.dev
      : null;
    const configPath = resolve(worktree.path, "next.config.ts");
    const legacyRedirect = existsSync(configPath)
      ? extractRootRedirect(readFileSync(configPath, "utf8"))
      : null;
    rootRedirect = deriveReviewRoute({ devCommand, legacyRedirect,
      hasPublicHome: ["scripts/public-site.mjs", "apps/public-site/app/route.js", "apps/public-site/public/index.html"]
        .every((path) => existsSync(resolve(worktree.path, path))),
    });
  } catch {
    rootRedirect = null;
  }
  return { ...worktree, changes, changedPaths: changes.map((row) => row.path), rootRedirect };
}

export function buildControlSurface(repo = process.cwd(), options = {}) {
  const repoRoot = realpathSync(String(git(repo, ["rev-parse", "--show-toplevel"])).trim());
  const stateHome = options.stateHome ?? loadPolicy().coordination?.stateHome ?? null;
  const registeredClones = readRegisteredClones(repoRoot, stateHome);
  const worktreeByPath = new Map();
  const scanFailures = [];
  const cloneRoots = new Set([repoRoot]);
  for (const clone of registeredClones) {
    try {
      verifyRegisteredClone(clone);
      cloneRoots.add(clone.root);
    } catch (error) {
      scanFailures.push({
        path: clone.root,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  for (const cloneRoot of cloneRoots) {
    try {
      for (const worktree of parseWorktreeList(git(cloneRoot, ["worktree", "list", "--porcelain"]))) {
        worktreeByPath.set(worktree.path, worktree);
      }
    } catch (error) {
      scanFailures.push({
        path: cloneRoot,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const worktrees = [...worktreeByPath.values()].map(worktreeStatus);
  const markers = [];
  for (const worktree of worktrees) {
    try {
      markers.push(...readClaims(worktree.path));
    } catch (error) {
      scanFailures.push({
        path: worktree.path,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const operationalClaims = readOperationalClaims(repoRoot, stateHome);
  const effectiveClaims = applyOperationalClaimStates(markers, operationalClaims);
  scanFailures.push(...effectiveClaims.failures);
  const activeClaims = effectiveClaims.claims
    .filter((claim) => ACTIVE_CLAIM_STATES.has(canonicalClaimState(claim.state)))
    .map((claim) => ({
      threadId: claim.threadId,
      state: canonicalClaimState(claim.state),
      claim: { source: claim.source, contentDigest: claim.contentDigest, files: claim.files },
      worktree: claim.worktree,
      operationalEventId: claim.operationalEventId ?? null,
    }));
  const target = deriveReviewTarget({
    controlPath: repoRoot,
    worktrees,
    activeClaims,
    scanFailures,
    port: options.port ?? null,
  });
  const controllerOwner = deriveControllerOwner({ controlPath: repoRoot, worktrees, activeClaims });
  const candidateOwnership = classifyCandidateOwnership({ controlPath: repoRoot, worktrees, activeClaims });
  const control = worktrees.find((worktree) => worktree.path === repoRoot);
  const controlChanges = (control?.changes ?? []).map((change) => classifyControlChange(change, activeClaims));
  return {
    schemaVersion: 1,
    observedAt: (options.now ?? new Date()).toISOString(),
    repoRoot,
    controlCheckout: {
      branch: control?.branch ?? null,
      head: control?.head ?? null,
      changedPathCount: controlChanges.length,
      coordinationPathCount: controlChanges.filter((row) => row.coordination).length,
      nonCoordinationPathCount: controlChanges.filter((row) => !row.coordination).length,
      noActiveClaimPathCount: controlChanges.filter((row) => row.classification === "no_active_claim").length,
      changes: controlChanges,
    },
    registeredCloneCount: registeredClones.length,
    registeredClones,
    scanFailures,
    worktreeCount: worktrees.length,
    worktrees,
    activeClaims,
    candidateOwnership,
    reviewTarget: target,
    server: inspectServer(options.pid ?? null, target.worktree),
    automationOwnership: deriveAutomationOwnership(target, controllerOwner),
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function integerArgument(name, maximum) {
  const raw = argument(name);
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > maximum) throw new Error(`${name} is invalid`);
  return value;
}

function main() {
  const command = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "status";
  if (command !== "status") throw new Error("only the read-only status command is supported");
  const report = buildControlSurface(argument("--repo") ?? process.cwd(), {
    pid: integerArgument("--pid", Number.MAX_SAFE_INTEGER),
    port: integerArgument("--port", 65535),
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (process.argv.includes("--require-ready") && report.reviewTarget.state !== "ready") process.exitCode = 2;
  if (report.server.state === "mismatch" || report.server.state === "unverified") process.exitCode = 3;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
