import { describe, expect, it } from "vitest";
import { parseQaPort, reserveQaPort, resolveQaPort } from "../scripts/qa-port.mjs";

describe("isolated QA ports", () => {
  it("accepts only explicit integer ports in the TCP range", () => {
    expect(parseQaPort(undefined)).toBeNull();
    expect(parseQaPort("3219")).toBe(3219);
    for (const value of ["0", "65536", "3e3", "3000.5", "not-a-port"]) {
      expect(() => parseQaPort(value)).toThrow("QA_PORT must be an integer");
    }
  });

  it("reserves a free loopback port when none is supplied", async () => {
    const port = await reserveQaPort();
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThanOrEqual(65_535);
    expect(await resolveQaPort(String(port))).toBe(port);
  });
});
