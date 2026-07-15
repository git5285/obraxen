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
  { name: "home-en", path: "/en/" },
  { name: "projects-de", path: "/de/projekte/" },
  { name: "case-blitz-fr", path: "/fr/projets/blitz-bremen/" },
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

async function resolveChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    chromium.executablePath(),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Prueba el siguiente Chrome disponible.
    }
  }
  throw new Error("No se encontró un ejecutable de Chrome para Lighthouse");
}

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

  const lighthouseArguments = [
    ...commandArguments,
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows",
    "--only-categories=performance,accessibility,best-practices,seo",
    "--output=json",
    `--output-path=${reportPath}`,
  ];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await execFileAsync(command, lighthouseArguments, {
        cwd: root,
        env: { ...process.env, CHROME_PATH: await resolveChromePath() },
        maxBuffer: 20 * 1024 * 1024,
        timeout: 120_000,
      });
      break;
    } catch (error) {
      const diagnostic = `${error?.message ?? ""}\n${error?.stderr ?? ""}`;
      const transient = /NO_FCP|PROTOCOL_TIMEOUT|Target closed|timed out/i.test(diagnostic);
      if (!transient || attempt === 3) throw error;
      console.warn(`${route.path} → Lighthouse no pintó en el intento ${attempt}; reintento controlado`);
      await wait(1_000 * attempt);
    }
  }

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
  console.log("Lighthouse OK → 3 rutas localizadas dentro de presupuesto");
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
