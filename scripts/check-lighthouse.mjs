import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const outputDirectory = path.join(root, ".lighthouseci");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const baseUrl = "http://127.0.0.1:3000";
const routes = [
  { name: "home", path: "/" },
  { name: "projects", path: "/proyectos/" },
  { name: "case-blitz", path: "/proyectos/blitz-bremen/" },
];

const budgets = {
  performance: 0.95,
  accessibility: 1,
  "best-practices": 1,
  seo: 0.65,
  // El objetivo de campo sigue siendo 2,5 s. El margen de laboratorio evita
  // falsos negativos por la variación del arranque local dentro del runner CI.
  lcp: 3_000,
  tbt: 200,
  cls: 0.1,
};

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // El proceso puede seguir arrancando.
    }
    await wait(500);
  }
  throw new Error("Next.js no estuvo disponible en 60 segundos");
}

function score(report, category) {
  return report.categories[category]?.score ?? 0;
}

function auditValue(report, audit) {
  return report.audits[audit]?.numericValue ?? Number.POSITIVE_INFINITY;
}

async function auditRoute(route) {
  const reportPath = path.join(outputDirectory, `${route.name}.json`);
  const projectLighthouse = path.join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "lighthouse.cmd" : "lighthouse",
  );
  const lighthouseCandidates = [process.env.LIGHTHOUSE_BIN, projectLighthouse].filter(Boolean);
  let command;
  let commandArguments = [`${baseUrl}${route.path}`];

  for (const candidate of lighthouseCandidates) {
    try {
      await fs.access(candidate);
      command = candidate;
      break;
    } catch {
      // Prueba el siguiente binario configurado.
    }
  }

  if (!command) {
    command = process.platform === "win32" ? "npx.cmd" : "npx";
    commandArguments = ["--yes", "lighthouse@13.4.0", `${baseUrl}${route.path}`];
  }

  await execFileAsync(
    command,
    [
      ...commandArguments,
      "--quiet",
      "--chrome-flags=--headless --no-sandbox",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${reportPath}`,
    ],
    {
      cwd: root,
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      maxBuffer: 20 * 1024 * 1024,
      timeout: 120_000,
    },
  );

  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  const result = {
    performance: score(report, "performance"),
    accessibility: score(report, "accessibility"),
    bestPractices: score(report, "best-practices"),
    seo: score(report, "seo"),
    lcp: auditValue(report, "largest-contentful-paint"),
    tbt: auditValue(report, "total-blocking-time"),
    cls: auditValue(report, "cumulative-layout-shift"),
    consoleErrors: report.audits["errors-in-console"]?.score ?? 1,
  };

  const failures = [
    result.performance < budgets.performance ? `rendimiento ${result.performance}` : null,
    result.accessibility < budgets.accessibility ? `accesibilidad ${result.accessibility}` : null,
    result.bestPractices < budgets["best-practices"] ? `buenas prácticas ${result.bestPractices}` : null,
    result.seo < budgets.seo ? `SEO ${result.seo}` : null,
    result.lcp > budgets.lcp ? `LCP ${Math.round(result.lcp)} ms` : null,
    result.tbt > budgets.tbt ? `TBT ${Math.round(result.tbt)} ms` : null,
    result.cls > budgets.cls ? `CLS ${result.cls}` : null,
    result.consoleErrors < 1 ? "errores de consola" : null,
  ].filter(Boolean);

  console.log(
    `${route.path} → perf ${Math.round(result.performance * 100)}, a11y ${Math.round(result.accessibility * 100)}, ` +
      `BP ${Math.round(result.bestPractices * 100)}, SEO ${Math.round(result.seo * 100)}, ` +
      `LCP ${Math.round(result.lcp)} ms, TBT ${Math.round(result.tbt)} ms, CLS ${result.cls}`,
  );

  if (failures.length) {
    throw new Error(`${route.path} incumple presupuestos: ${failures.join(", ")}`);
  }
}

await fs.rm(outputDirectory, { recursive: true, force: true });
await fs.mkdir(outputDirectory, { recursive: true });

const server = spawn(
  process.execPath,
  [nextCli, "start", "--hostname", "127.0.0.1", "--port", "3000"],
  { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] },
);
const serverExit = new Promise((resolve) => server.once("exit", resolve));

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });

try {
  await waitForServer();
  for (const route of routes) await auditRoute(route);
  console.log("Lighthouse OK → 3 rutas dentro de presupuesto");
} catch (error) {
  if (serverOutput) console.error(serverOutput.trim());
  throw error;
} finally {
  server.kill("SIGTERM");
  await Promise.race([serverExit, wait(5_000)]);
  if (server.exitCode === null && server.signalCode === null) server.kill("SIGKILL");
  server.stdout.destroy();
  server.stderr.destroy();
}
