import { describe, expect, it, vi } from "vitest";
import { wrapTabFocus } from "@/lib/focus-navigation";

describe("focus boundary behavior", () => {
  const element = () => ({ focus: vi.fn() }) as unknown as HTMLElement;

  it.each([false, true])("wraps only the boundary for shift=%s", (shiftKey) => {
    const first = element();
    const middle = element();
    const last = element();
    const event = { shiftKey, preventDefault: vi.fn() };
    const list = [first, middle, last];
    for (const active of [middle, null, element(), shiftKey ? last : first]) {
      wrapTabFocus(event, list, active);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    wrapTabFocus(event, list, shiftKey ? first : last);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect((shiftKey ? last : first).focus).toHaveBeenCalledOnce();
    expect(middle.focus).not.toHaveBeenCalled();
  });

  it.each([false, true])("handles empty and single-item lists for shift=%s", (shiftKey) => {
    const event = { shiftKey, preventDefault: vi.fn() };
    wrapTabFocus(event, [], null);
    expect(event.preventDefault).not.toHaveBeenCalled();
    const only = element();
    wrapTabFocus(event, [only], only);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(only.focus).toHaveBeenCalledOnce();
  });
});
