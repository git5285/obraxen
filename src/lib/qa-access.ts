export const QA_ACCESS_HEADER = "x-obraxen-qa-token";

const loopbackHostnames = new Set(["127.0.0.1", "localhost", "::1"]);

type QaEnvironment = Readonly<Record<string, string | undefined>>;

type QaRequest = {
  readonly host: string | null;
  readonly token: string | null;
};

function getHostname(host: string | null): string | null {
  if (!host) return null;

  try {
    return new URL(`http://${host}`).hostname
      .toLowerCase()
      .replace(/^\[|\]$/g, "");
  } catch {
    return null;
  }
}

export function isLocalQaRequest(
  environment: QaEnvironment,
  request: QaRequest,
): boolean {
  const expectedToken = environment.QA_CONTACT_HARNESS_TOKEN?.trim();
  const hostname = getHostname(request.host);

  return environment.QA_CONTACT_HARNESS === "local-playwright"
    && !environment.VERCEL
    && Boolean(expectedToken)
    && loopbackHostnames.has(hostname ?? "")
    && request.token === expectedToken;
}
