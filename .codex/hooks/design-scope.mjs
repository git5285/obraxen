import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Inspect the current edit, never the checkout's unrelated dirty files.
export function designPaths(input, root = process.cwd()) {
  if (input?.hook_event_name !== "PostToolUse" || input.stop_hook_active) return [];
  const tool = input.tool_input;
  const paths = [];
  if (tool && typeof tool === "object") {
    for (const key of ["file_path", "path"]) if (typeof tool[key] === "string") paths.push(tool[key]);
  }
  const patch = typeof tool === "string" ? tool : tool?.patch ?? tool?.input;
  if (typeof patch === "string") {
    for (const match of patch.matchAll(/^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm)) paths.push(match[1]);
  }
  return [...new Set(paths.map(path => relative(resolve(root), isAbsolute(path) ? path : resolve(root, path))
    .split(sep).join("/")))].filter(path => (
    !path.startsWith("../") && !isAbsolute(path)
    && (/^apps\/public-site\/public\/.+\.(?:html|css|js|svg)$/.test(path)
      || /^src\/(?:app|components)\/.+\.(?:tsx|jsx|css|scss|svg)$/.test(path))
    && !path.startsWith("src/app/api/")
  ));
}

export function runDesignHook(input, { root = process.cwd(), home = homedir(), run = spawnSync } = {}) {
  const paths = designPaths(input, root);
  if (paths.length === 0) return "";
  const skill = join(home, ".agents/skills/impeccable");
  const binary = join(skill, "scripts/bin", `${process.platform}-${process.arch}`, "impeccable");
  // Never run the downloading launcher. A missing optional tool is a quiet no-op.
  if (!existsSync(binary)) return "";
  const contexts = [];
  const deadline = Date.now() + 3500;
  for (const path of paths) {
    const timeout = deadline - Date.now();
    if (timeout <= 0) {
      process.stderr.write("Obraxen: tiempo del hook de diseño agotado; quedan archivos sin revisar.\n");
      break;
    }
    // A mixed patch must not leak its non-UI files to the detector. Post-edit
    // inspection reads each saved file, so no patch contents need forwarding.
    const event = { hook_event_name: "PostToolUse", tool_name: "Write", cwd: root,
      ...(typeof input.session_id === "string" ? { session_id: input.session_id } : {}),
      tool_input: { file_path: resolve(root, path) } };
    const result = run(binary, ["hook"], { cwd: root, input: JSON.stringify(event), encoding: "utf8",
      timeout, maxBuffer: 64 * 1024, env: { ...process.env, IMPECCABLE_SKILL_DIR: skill } });
    if (result.error || result.status !== 0) {
      process.stderr.write("Obraxen: no se pudo completar el hook opcional de diseño.\n");
      continue;
    }
    if (result.stdout?.trim()) {
      try {
        const context = JSON.parse(result.stdout).hookSpecificOutput?.additionalContext;
        if (typeof context === "string" && context) contexts.push(context);
      } catch {
        process.stderr.write("Obraxen: respuesta de diseño no reconocida.\n");
      }
    }
  }
  return contexts.length ? JSON.stringify({ hookSpecificOutput: {
    hookEventName: "PostToolUse", additionalContext: contexts.join("\n"),
  } }) : "";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(runDesignHook(JSON.parse(readFileSync(0, "utf8"))));
  } catch {
    process.stderr.write("Obraxen: evento de diseño no reconocido.\n");
  }
}
