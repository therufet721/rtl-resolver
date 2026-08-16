export type Direction = "ltr" | "rtl";
export type DirectionPreference = Direction | "auto";

/** Languages whose customary writing direction is right-to-left. */
export const RTL_LANGUAGES = new Set([
  "ar", "arc", "ckb", "dv", "fa", "he", "khw", "ks", "ku", "nqo",
  "ps", "sd", "syr", "ug", "ur", "yi"
]);

const RTL_CHAR = /[\u0590-\u05FF\u0600-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/u;
const LTR_CHAR = /[A-Za-z\u00C0-\u02AF\u0370-\u058F\u0900-\u1FFF\u2C00-\uD7FF\uF900-\uFB1C]/u;
const STRONG_CHAR = new RegExp(`(?:${RTL_CHAR.source})|(?:${LTR_CHAR.source})`, "u");

/** Return the normalized primary language subtag, or an empty string. */
export function languageOf(locale: string): string {
  const value = locale.trim().replace(/_/g, "-");
  if (!value) return "";
  try {
    return new Intl.Locale(value).language.toLowerCase();
  } catch {
    return value.split("-")[0]?.toLowerCase() ?? "";
  }
}

/** Resolve the customary direction for a BCP 47 locale. */
export function directionFromLocale(locale: string, fallback: Direction = "ltr"): Direction {
  const language = languageOf(locale);
  return language ? (RTL_LANGUAGES.has(language) ? "rtl" : "ltr") : fallback;
}

/** Detect direction from the first strong directional character in a string. */
export function directionFromText(text: string, fallback: Direction = "ltr"): Direction {
  const char = text.match(STRONG_CHAR)?.[0];
  if (!char) return fallback;
  return RTL_CHAR.test(char) ? "rtl" : "ltr";
}

export interface ResolveDirectionOptions {
  direction?: DirectionPreference;
  locale?: string;
  text?: string;
  fallback?: Direction;
}

/** Resolve direction using explicit direction, text, locale, then fallback. */
export function resolveDirection(options: ResolveDirectionOptions = {}): Direction {
  const { direction = "auto", text, locale, fallback = "ltr" } = options;
  if (direction !== "auto") return direction;
  if (text) {
    const match = text.match(STRONG_CHAR);
    if (match) return RTL_CHAR.test(match[0]) ? "rtl" : "ltr";
  }
  if (locale) return directionFromLocale(locale, fallback);
  return fallback;
}

/** Select a value based on the resolved direction. */
export function directional<T>(direction: Direction, values: { ltr: T; rtl: T }): T {
  return values[direction];
}

/** Map logical inline sides to physical CSS sides. */
export function inlineSides(direction: Direction): { start: "left" | "right"; end: "left" | "right" } {
  return direction === "rtl"
    ? { start: "right", end: "left" }
    : { start: "left", end: "right" };
}

/** Wrap potentially mixed-direction text with Unicode isolate controls. */
export function isolate(text: string, direction: DirectionPreference = "auto"): string {
  const opener = direction === "rtl" ? "\u2067" : direction === "ltr" ? "\u2066" : "\u2068";
  return `${opener}${text}\u2069`;
}
