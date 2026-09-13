import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveQaPort } from "./qa-port.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const playwrightCli = path.join(root, "node_modules", "@playwright", "test", "cli.js");
const contactEnabled = process.argv.includes("--contact-enabled");
const passthrough = process.argv.slice(2).filter((argument) => argument !== "--contact-enabled");
const port = await resolveQaPort();
const environment = { ...process.env, QA_PORT: String(port) };

if (contactEnabled) {
  environment.CONTACT_E2E_ENABLED = "true";
  environment.QA_CONTACT_HARNESS_TOKEN = randomUUID();
} else {
  delete environment.CONTACT_E2E_ENABLED;
  delete environment.QA_CONTACT_HARNESS;
  delete environment.QA_CONTACT_HARNESS_TOKEN;
}

process.stdout.write(
  `Playwright ${contactEnabled ? "contact-enabled" : "standard"} on isolated port ${port}\n`,
);
execFileSync(process.execPath, [playwrightCli, "test", ...passthrough], {
  cwd: root,
  env: environment,
  stdio: "inherit",
});
