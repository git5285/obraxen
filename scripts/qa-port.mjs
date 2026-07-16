import { createServer } from "node:net";

export function parseQaPort(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const raw = String(value).trim();
  if (!/^\d+$/.test(raw)) throw new Error("QA_PORT must be an integer between 1 and 65535");
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("QA_PORT must be an integer between 1 and 65535");
  }
  return port;
}

export function reserveQaPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("could not reserve an isolated QA port"));
        return;
      }
      const { port } = address;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

export async function resolveQaPort(value = process.env.QA_PORT) {
  return parseQaPort(value) ?? reserveQaPort();
}
