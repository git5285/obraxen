import type { Locale } from "./i18n";

export function naturalList(items: readonly string[], locale: Locale): string {
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
}
