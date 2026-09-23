import { expect, it } from "vitest";
import { readBoundedBody } from "@/lib/contact-body";

it("accepts exactly the byte limit and rejects multibyte overflow", async () => {
  const request = () => new Request("https://example.invalid", { method: "POST", body: "é" });
  expect(await readBoundedBody(request(), 2)).toBe("é");
  expect(await readBoundedBody(request(), 1)).toBeNull();
  expect(await readBoundedBody(new Request("https://example.invalid"), 2)).toBe("");
});

it("cancels an oversized stream and releases its reader", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(3)); },
    cancel() { cancelled = true; },
  });
  const request = new Request("https://example.invalid", { method: "POST", body: stream, duplex: "half" } as RequestInit);
  expect(await readBoundedBody(request, 2)).toBeNull();
  expect(cancelled).toBe(true);
  expect(stream.locked).toBe(false);
});
