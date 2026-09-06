export function checkClaim(text: string, source: string, expected: unknown): {
  valid: true;
  threadId: string;
  files: string[];
  contentDigest: string;
  scope: string;
};
