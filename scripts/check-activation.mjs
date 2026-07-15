import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getPublicationIssues } from "../src/lib/publication.ts";

const brandUrl = new URL("../data/brand.json", import.meta.url);
const projectsUrl = new URL("../data/proyectos.json", import.meta.url);

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

export function buildActivationReport(brand, projects) {
  const blockers = getPublicationIssues(brand, projects);

  return {
    schemaVersion: 1,
    decision: blockers.length === 0 ? "READY_FOR_PROTECTED_CANDIDATE" : "NO-GO",
    candidateAuditRequired: true,
    publicationAuthorized: false,
    publishSwitch: brand.publicar,
    blockerCount: blockers.length,
    blockers,
  };
}

function formatHumanReport(report) {
  const lines = [
    `Fase 6.7: ${report.decision}`,
    `Bloqueos verificables: ${report.blockerCount}`,
    "Publicación autorizada: no",
    "Auditoría de candidata protegida pendiente: sí",
  ];

  if (report.blockers.length) {
    lines.push("", ...report.blockers.map((issue) => `- ${issue}`));
  } else {
    lines.push(
      "",
      "Las entradas externas están completas. Aún se necesita una preview protegida,",
      "auditar el SHA exacto y registrar una decisión humana GO/NO-GO.",
    );
  }

  return lines.join("\n");
}

function main() {
  const report = buildActivationReport(readJson(brandUrl), readJson(projectsUrl));
  const asJson = process.argv.includes("--json");

  process.stdout.write(`${asJson ? JSON.stringify(report, null, 2) : formatHumanReport(report)}\n`);
  if (report.decision === "NO-GO") process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
