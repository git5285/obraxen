type TabEvent = { shiftKey: boolean; preventDefault(): void };

/** Wrap only at the list boundaries; callers own selectors and keyboard policy. */
export function wrapTabFocus(
  event: TabEvent,
  focusable: readonly HTMLElement[],
  activeElement: Element | null,
) {
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
