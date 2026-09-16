import { content } from "./content";
import type { Locale } from "./types";

export function authText(key: string) {
  const stored = typeof window === "undefined" ? null : localStorage.getItem("olp-locale");
  const locale: Locale = stored === "id" ? "id" : "en";
  return content.ui[key]?.[locale] ?? key;
}
