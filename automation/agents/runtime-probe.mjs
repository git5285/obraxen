import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PROBE_BUFFER_BYTES = 16 * 1024 * 1024;
// Three probes, two streams each. Base64 has a fixed expansion bound; retain
// the old 16 MiB per-stream budget, plus bounded envelope overhead in transport.
export const PROBE_TRANSPORT_BYTES = 6 * 4 * Math.ceil(PROBE_BUFFER_BYTES / 3) + 4096;

function probeEntries(results) {
  if (!results || Array.isArray(results) || typeof results !== "object"
    || Object.keys(results).some((key) => !["npm", "dependencies", "native"].includes(key)))
    throw new Error("invalid_runtime_probe_response");
  return Object.entries(results);
}

export function encodeRuntimeProbes(results) {
  const encoded = Object.fromEntries(probeEntries(results).map(([key, value]) => {
    const stream = (input) => {
      const bytes = Buffer.from(input);
      if (bytes.length > PROBE_BUFFER_BYTES) throw new Error("runtime_probe_stream_too_large");
      return bytes.toString("base64");
    };
    return [key, { status: value.status, stdout: stream(value.stdout), stderr: stream(value.stderr) }];
  }));
  return JSON.stringify({ encoding: "base64-v1", results: encoded });
}

export function decodeRuntimeProbes(wire) {
  const parsed = JSON.parse(wire);
  if (parsed?.encoding !== "base64-v1") throw new Error("invalid_runtime_probe_encoding");
  return Object.fromEntries(probeEntries(parsed.results).map(([key, value]) => {
    if (!value || !(value.status === null || Number.isInteger(value.status)))
      throw new Error("invalid_runtime_probe_status");
    const stream = (input) => {
      if (typeof input !== "string" || input.length > 4 * Math.ceil(PROBE_BUFFER_BYTES / 3))
        throw new Error("invalid_runtime_probe_stream");
      const bytes = Buffer.from(input, "base64");
      if (bytes.length > PROBE_BUFFER_BYTES || bytes.toString("base64") !== input)
        throw new Error("invalid_runtime_probe_stream");
      return bytes.toString("utf8");
    };
    return [key, { status: value.status, stdout: stream(value.stdout), stderr: stream(value.stderr) }];
  }));
}

function execute(file, args) {
  return new Promise((done) => {
    execFile(file, args, { encoding: "buffer", maxBuffer: PROBE_BUFFER_BYTES }, (error, stdout, stderr) => {
      done({ status: error ? (typeof error.code === "number" ? error.code : null) : 0,
        stdout: stdout ?? Buffer.alloc(0), stderr: stderr?.length ? stderr : Buffer.from(error?.message ?? "") });
    });
  });
}

// Fresh processes on every call; no dependency, native-module or version cache.
// The runner parameter is a deterministic test seam, never supplied by the CLI.
export async function collectRuntimeProbes(request, run = execute) {
  if (!request || Array.isArray(request) || typeof request !== "object"
    || Object.entries(request).some(([key, value]) => !["npm", "dependencies", "native"].includes(key)
      || typeof value !== "boolean")) throw new Error("invalid_runtime_probe_request");
  const candidate = join(dirname(process.execPath), "npm");
  const npm = existsSync(candidate) ? candidate : "npm";
  const commands = {
    npm: [npm, ["--version"]],
    dependencies: [npm, ["ls", "--all", "--json"]],
    native: [process.execPath, ["--input-type=module", "--eval", "await import('rolldown')"]],
  };
  return Object.fromEntries(await Promise.all(Object.entries(commands)
    .filter(([key]) => request[key])
    .map(async ([key, [file, args]]) => [key, await run(file, args)])));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error("invalid_runtime_probe_arguments");
    console.log(encodeRuntimeProbes(await collectRuntimeProbes(JSON.parse(process.argv[2]))));
  } catch {
    console.error("runtime_probe_failed");
    process.exitCode = 1;
  }
}
